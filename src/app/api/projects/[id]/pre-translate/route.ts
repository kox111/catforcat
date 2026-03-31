import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { fuzzyMatch } from "@/lib/fuzzy-match";

/**
 * POST /api/projects/[id]/pre-translate
 *
 * Two-pass pre-translation:
 * 1) TM pass (free): fill segments with TM matches >= 75%
 * 2) API pass (uses AI quota): translate remaining empty segments
 *
 * Accepts: { mode: "tm-only" | "full" }
 * - tm-only: only TM pre-translation (free, no API calls)
 * - full: TM first, then API for remaining empty segments
 *
 * Returns streaming NDJSON with progress updates:
 * { type: "progress", done: N, total: N, segmentId: "...", source: "tm"|"api" }
 * { type: "result", segmentId: "...", targetText: "...", status: "...", source: "tm"|"api" }
 * { type: "done", tmFilled: N, apiFilled: N, errors: N }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { user: authUser, error } = await getAuthenticatedUser();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      plan: true,
      aiRequestsUsed: true,
      aiRequestsResetAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: { segments: { orderBy: { position: "asc" } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const mode = body.mode || "full";

  // Get empty segments (no target text or status is "empty")
  const emptySegments = project.segments.filter(
    (s: { targetText: string; status: string }) => s.targetText.trim() === "" || s.status === "empty",
  );

  if (emptySegments.length === 0) {
    return NextResponse.json({
      type: "done",
      tmFilled: 0,
      apiFilled: 0,
      errors: 0,
      message: "No empty segments to pre-translate",
    });
  }

  // Get TM entries for this language pair
  const tmEntries = await prisma.translationMemory.findMany({
    where: {
      userId: user.id,
      srcLang: project.srcLang,
      tgtLang: project.tgtLang,
    },
  });

  // ── PASS 1: TM Pre-translation (free) ──
  const tmResults: Array<{
    segmentId: string;
    targetText: string;
    status: string;
    matchPct: number;
  }> = [];

  const remainingForApi: typeof emptySegments = [];

  for (const seg of emptySegments) {
    if (tmEntries.length === 0) {
      remainingForApi.push(seg);
      continue;
    }

    const matches = fuzzyMatch(seg.sourceText, tmEntries, 75, 1);
    if (matches.length > 0) {
      const bestMatch = matches[0];
      const status = bestMatch.score >= 100 ? "tm-100" : "tm-fuzzy";
      tmResults.push({
        segmentId: seg.id,
        targetText: bestMatch.targetText,
        status,
        matchPct: bestMatch.score,
      });
    } else {
      remainingForApi.push(seg);
    }
  }

  // Apply TM results to DB in batch
  if (tmResults.length > 0) {
    await prisma.$transaction(
      tmResults.map((r) =>
        prisma.segment.update({
          where: { id: r.segmentId },
          data: { targetText: r.targetText, status: "draft" },
        }),
      ),
    );
  }

  // If tm-only mode, return results immediately
  if (mode === "tm-only") {
    return NextResponse.json({
      type: "done",
      tmFilled: tmResults.length,
      apiFilled: 0,
      errors: 0,
      results: tmResults.map((r) => ({
        segmentId: r.segmentId,
        targetText: r.targetText,
        status: r.status,
        source: "tm",
      })),
      remaining: remainingForApi.length,
    });
  }

  // ── PASS 2: API Translation (uses AI quota) ──
  // Check if any translation API is configured
  const deeplAvailable = !!process.env.DEEPL_API_KEY;
  const googleAvailable = !!process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!deeplAvailable && !googleAvailable) {
    return NextResponse.json({
      type: "done",
      tmFilled: tmResults.length,
      apiFilled: 0,
      errors: 0,
      results: tmResults.map((r) => ({
        segmentId: r.segmentId,
        targetText: r.targetText,
        status: r.status,
        source: "tm" as const,
      })),
      remaining: remainingForApi.length,
      message:
        remainingForApi.length > 0
          ? `Translation API not configured. ${tmResults.length} segments filled from TM. ${remainingForApi.length} segments need a DeepL or Google Translate API key.`
          : undefined,
    });
  }

  // Check monthly limits
  const AI_LIMITS: Record<string, number> = { free: 5000, pro: 999999999 };
  const monthlyLimit = AI_LIMITS[user.plan] || AI_LIMITS.free;
  const now = new Date();

  let currentUsed = user.aiRequestsUsed;
  if (
    user.aiRequestsResetAt.getMonth() !== now.getMonth() ||
    user.aiRequestsResetAt.getFullYear() !== now.getFullYear()
  ) {
    currentUsed = 0;
    await prisma.user.update({
      where: { id: user.id },
      data: { aiRequestsUsed: 0, aiRequestsResetAt: now },
    });
  }

  const availableQuota = monthlyLimit - currentUsed;
  const segmentsToTranslate = remainingForApi.slice(0, availableQuota);

  // Pro → DeepL if configured, otherwise Google as fallback
  const provider = user.plan === "pro" && deeplAvailable ? "deepl" : "google";
  const apiResults: Array<{
    segmentId: string;
    targetText: string;
    status: string;
  }> = [];
  let apiErrors = 0;

  // Translate segments one by one (respecting rate limits)
  for (let i = 0; i < segmentsToTranslate.length; i++) {
    const seg = segmentsToTranslate[i];
    try {
      const translation = await translateSegment(
        seg.sourceText,
        project.srcLang,
        project.tgtLang,
        provider,
        project.segments,
        seg.position,
      );

      // Save to DB
      await prisma.segment.update({
        where: { id: seg.id },
        data: { targetText: translation, status: "draft" },
      });

      // Increment AI counter
      await prisma.user.update({
        where: { id: user.id },
        data: { aiRequestsUsed: { increment: 1 } },
      });

      apiResults.push({
        segmentId: seg.id,
        targetText: translation,
        status: "draft",
      });
    } catch (error) {
      console.error(`Pre-translate error for segment ${seg.id}:`, error);
      apiErrors++;
    }
  }

  // Build combined results
  const allResults = [
    ...tmResults.map((r) => ({
      segmentId: r.segmentId,
      targetText: r.targetText,
      status: r.status,
      source: "tm" as const,
    })),
    ...apiResults.map((r) => ({
      segmentId: r.segmentId,
      targetText: r.targetText,
      status: "draft" as const,
      source: "api" as const,
    })),
  ];

  return NextResponse.json({
    type: "done",
    tmFilled: tmResults.length,
    apiFilled: apiResults.length,
    errors: apiErrors,
    quotaUsed: apiResults.length,
    quotaRemaining: availableQuota - apiResults.length,
    skippedDueToQuota: remainingForApi.length - segmentsToTranslate.length,
    results: allResults,
  });
}

// ─────────────────────────────────────────────
// Translation helpers (duplicated from /api/translate for isolation)
// ─────────────────────────────────────────────

const DEEPL_LANG_MAP: Record<string, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  pt: "PT-BR",
  it: "IT",
  zh: "ZH",
  ja: "JA",
  ko: "KO",
};

async function translateSegment(
  text: string,
  srcLang: string,
  tgtLang: string,
  provider: "google" | "deepl",
  allSegments: Array<{ position: number; sourceText: string }>,
  position: number,
): Promise<string> {
  // Build context from adjacent segments
  const prevSeg = allSegments.find((s) => s.position === position - 1);
  const context = prevSeg ? prevSeg.sourceText : undefined;

  if (provider === "deepl") {
    return translateWithDeepL(text, srcLang, tgtLang);
  }
  return translateWithGoogle(text, srcLang, tgtLang, context);
}

async function translateWithGoogle(
  text: string,
  srcLang: string,
  tgtLang: string,
  contextPrev?: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error("Google Translate API key not configured");

  let fullText = text;
  if (contextPrev) {
    fullText = contextPrev + " ||| " + text;
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: fullText,
      source: srcLang,
      target: tgtLang,
      format: "text",
    }),
  });

  if (!response.ok) throw new Error(`Google API error: ${response.status}`);

  const data = await response.json();
  let translation = data.data?.translations?.[0]?.translatedText || "";

  if (contextPrev) {
    const idx = translation.indexOf("|||");
    if (idx !== -1) translation = translation.substring(idx + 3).trim();
  }

  return decodeHtmlEntities(translation);
}

async function translateWithDeepL(
  text: string,
  srcLang: string,
  tgtLang: string,
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error("DeepL API key not configured");

  const deeplSrc = DEEPL_LANG_MAP[srcLang] || srcLang.toUpperCase();
  const deeplTgt = DEEPL_LANG_MAP[tgtLang] || tgtLang.toUpperCase();

  const isFreeKey = apiKey.endsWith(":fx");
  const baseUrl = isFreeKey
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const params = new URLSearchParams({
    text,
    source_lang: deeplSrc,
    target_lang: deeplTgt,
  });

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) throw new Error(`DeepL API error: ${response.status}`);

  const data = await response.json();
  return data.translations?.[0]?.text || "";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
