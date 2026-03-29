import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPrivacyConfig, type PrivacyLevel } from "@/lib/privacy";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/translate
 *
 * Plan-based translation system:
 * - Free plan: Google Cloud Translation API (server-side key)
 * - Pro plan ($10/month): DeepL API Pro (server-side key)
 *
 * The user does not configure anything — provider is determined by plan.
 * Both API keys are in .env server-side only.
 *
 * Rate limited to 30 requests/minute per user.
 * Monthly AI request limits: Free = 500/month, Pro = unlimited.
 */

// ─────────────────────────────────────────────
// Plan limits for AI requests per month
// ─────────────────────────────────────────────
const AI_LIMITS: Record<string, number> = { free: 5000, pro: 999999999 };

// ─────────────────────────────────────────────
// DeepL uses slightly different language codes
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

// ─────────────────────────────────────────────
// Request types
// ─────────────────────────────────────────────
interface GlossaryTerm {
  source: string;
  target: string;
}

interface TranslateRequestBody {
  segment: string;
  srcLang: string;
  tgtLang: string;
  glossaryTerms?: GlossaryTerm[];
  projectId?: string; // If provided, auto-fetch glossary terms from DB
  context?: {
    previousSegment?: string;
    nextSegment?: string;
  };
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user: authUser, error } = await getAuthenticatedUser();
  if (error) return error;

  const userData = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      plan: true,
      aiRequestsUsed: true,
      aiRequestsResetAt: true,
    },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Rate limit check (per-minute, DB-backed)
  const rateKey = `translate:${userData.id}`;
  const rateLimit = await checkRateLimit(rateKey, 30, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000) },
      { status: 429 },
    );
  }

  // Monthly AI request limit check
  const plan = userData.plan;
  const monthlyLimit = AI_LIMITS[plan] || AI_LIMITS.free;
  const now = new Date();

  // Reset counter if new month
  let currentUsed = userData.aiRequestsUsed;
  if (
    userData.aiRequestsResetAt.getMonth() !== now.getMonth() ||
    userData.aiRequestsResetAt.getFullYear() !== now.getFullYear()
  ) {
    currentUsed = 0;
    await prisma.user.update({
      where: { id: userData.id },
      data: { aiRequestsUsed: 0, aiRequestsResetAt: now },
    });
  }

  if (currentUsed >= monthlyLimit) {
    return NextResponse.json(
      {
        error: `Monthly AI limit reached (${monthlyLimit} requests). ${
          plan === "free"
            ? "Upgrade to Pro for 1,000/month."
            : "Limit resets next month."
        }`,
      },
      { status: 429 },
    );
  }

  const body: TranslateRequestBody = await req.json();
  const { segment, srcLang, tgtLang, context, projectId } = body;
  let { glossaryTerms } = body;

  if (!segment || !srcLang || !tgtLang) {
    return NextResponse.json(
      { error: "segment, srcLang, and tgtLang are required" },
      { status: 400 },
    );
  }

  // Privacy enforcement — check project privacy level
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: userData.id },
      select: { privacyLevel: true },
    });
    if (project) {
      const privacy = getPrivacyConfig(project.privacyLevel as PrivacyLevel);
      if (!privacy.aiEnabled) {
        return NextResponse.json(
          { error: "AI translation disabled for this privacy level" },
          { status: 403 },
        );
      }
    }
  }

  // B.3 — Auto-fetch glossary terms from DB when projectId provided
  let terminologyUsed = false;
  let matchedTermsCount = 0;

  if (projectId && (!glossaryTerms || glossaryTerms.length === 0)) {
    const dbTerms = await prisma.glossaryTerm.findMany({
      where: {
        userId: userData.id,
        srcLang,
        tgtLang,
      },
      select: { sourceTerm: true, targetTerm: true },
    });

    if (dbTerms.length > 0) {
      // Filter to only terms that actually appear in the segment text
      const segmentLower = segment.toLowerCase();
      const matching = dbTerms.filter((t) =>
        segmentLower.includes(t.sourceTerm.toLowerCase()),
      );

      if (matching.length > 0) {
        glossaryTerms = matching.map((t) => ({
          source: t.sourceTerm,
          target: t.targetTerm,
        }));
        terminologyUsed = true;
        matchedTermsCount = matching.length;
      }
    }
  } else if (glossaryTerms && glossaryTerms.length > 0) {
    terminologyUsed = true;
    matchedTermsCount = glossaryTerms.length;
  }

  // Provider determined by plan: pro → DeepL (if configured), otherwise Google
  const deeplAvailable = !!process.env.DEEPL_API_KEY;
  const provider = plan === "pro" && deeplAvailable ? "deepl" : "google";

  try {
    let translation: string;

    if (provider === "deepl") {
      translation = await translateWithDeepL(
        segment,
        srcLang,
        tgtLang,
        glossaryTerms,
      );
    } else {
      translation = await translateWithGoogle(
        segment,
        srcLang,
        tgtLang,
        glossaryTerms,
        context,
      );
    }

    // Increment monthly counter
    await prisma.user.update({
      where: { id: userData.id },
      data: { aiRequestsUsed: { increment: 1 } },
    });

    return NextResponse.json({
      translation,
      provider,
      terminologyUsed,
      matchedTerms: matchedTermsCount,
      usage: { used: currentUsed + 1, limit: monthlyLimit },
    });
  } catch (err) {
    console.error("Translation error:", err);
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ─────────────────────────────────────────────
// Google Cloud Translation API v2
// Server-side key, cost absorbed by platform (Free plan)
// ─────────────────────────────────────────────
async function translateWithGoogle(
  text: string,
  srcLang: string,
  tgtLang: string,
  glossaryTerms?: GlossaryTerm[],
  context?: { previousSegment?: string; nextSegment?: string },
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error("Translation service is not configured. Contact support.");
  }

  let processedText = text;
  const termMap = new Map<string, string>();

  if (glossaryTerms && glossaryTerms.length > 0) {
    glossaryTerms.forEach((term, idx) => {
      const placeholder = `__GLOSS${idx}__`;
      const regex = new RegExp(escapeRegex(term.source), "gi");
      processedText = processedText.replace(regex, placeholder);
      termMap.set(placeholder, term.target);
    });
  }

  let contextPrefix = "";
  if (context?.previousSegment) {
    contextPrefix = context.previousSegment + " ||| ";
  }

  const fullText = contextPrefix + processedText;

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

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Translate API error:", response.status, errorText);
    if (response.status === 403) {
      throw new Error("Translation service temporarily unavailable.");
    }
    throw new Error("Translation service unavailable");
  }

  const data = await response.json();
  let translation = data.data?.translations?.[0]?.translatedText || "";

  if (contextPrefix) {
    const separatorIdx = translation.indexOf("|||");
    if (separatorIdx !== -1) {
      translation = translation.substring(separatorIdx + 3).trim();
    }
  }

  for (const [placeholder, target] of termMap) {
    translation = translation.replace(
      new RegExp(escapeRegex(placeholder), "gi"),
      target,
    );
  }

  translation = decodeHtmlEntities(translation);
  return translation;
}

// ─────────────────────────────────────────────
// DeepL API Pro
// Server-side key, cost absorbed by platform (Pro plan)
// ─────────────────────────────────────────────
async function translateWithDeepL(
  text: string,
  srcLang: string,
  tgtLang: string,
  glossaryTerms?: GlossaryTerm[],
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error("DeepL translation is not configured. Contact support.");
  }

  const deeplSrc = DEEPL_LANG_MAP[srcLang] || srcLang.toUpperCase();
  const deeplTgt = DEEPL_LANG_MAP[tgtLang] || tgtLang.toUpperCase();

  const isFreeKey = apiKey.endsWith(":fx");
  const baseUrl = isFreeKey
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  let processedText = text;
  const termMap = new Map<string, string>();

  if (glossaryTerms && glossaryTerms.length > 0) {
    glossaryTerms.forEach((term, idx) => {
      const placeholder = `<m id="${idx}">${term.target}</m>`;
      const regex = new RegExp(escapeRegex(term.source), "gi");
      processedText = processedText.replace(regex, placeholder);
      termMap.set(`<m id="${idx}">`, "");
    });
  }

  const params = new URLSearchParams({
    text: processedText,
    source_lang: deeplSrc,
    target_lang: deeplTgt,
  });

  if (termMap.size > 0) {
    params.set("tag_handling", "xml");
    params.set("ignore_tags", "m");
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepL API error:", response.status, errorText);
    if (response.status === 403) {
      throw new Error("Translation service temporarily unavailable.");
    }
    if (response.status === 456) {
      throw new Error("Translation quota exceeded. Contact support.");
    }
    throw new Error("DeepL translation service unavailable");
  }

  const data = await response.json();
  let translation = data.translations?.[0]?.text || "";
  translation = translation.replace(/<\/?m[^>]*>/g, "");
  return translation;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
