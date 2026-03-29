import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/translate/multi
 *
 * Multi-engine preview: returns translations from all available providers
 * in parallel. Pro plan only.
 *
 * Returns: { results: Array<{ provider, translation, error? }> }
 */
export async function POST(req: NextRequest) {
  const { user: authUser, error } = await getAuthenticatedUser();
  if (error) return error;

  const userData = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, plan: true, aiRequestsUsed: true, aiRequestsResetAt: true },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (userData.plan !== "pro") {
    return NextResponse.json(
      { error: "Multi-engine preview requires Pro plan." },
      { status: 403 },
    );
  }

  const rateKey = `translate-multi:${userData.id}`;
  const rateLimit = await checkRateLimit(rateKey, 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000) },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { segment, srcLang, tgtLang, glossaryTerms, context } = body;

  if (!segment || !srcLang || !tgtLang) {
    return NextResponse.json(
      { error: "segment, srcLang, and tgtLang are required" },
      { status: 400 },
    );
  }

  const sanitize = (s: string) =>
    s.replace(/["""]/g, "'").replace(/\n/g, " ").slice(0, 2000);

  // Run all available providers in parallel
  const providers: { name: string; fn: () => Promise<string> }[] = [];

  // Google — always available
  const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (googleKey) {
    providers.push({
      name: "Google Translate",
      fn: async () => {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${googleKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: segment, source: srcLang, target: tgtLang, format: "text" }),
        });
        if (!res.ok) throw new Error("Google API error");
        const data = await res.json();
        let text = data.data?.translations?.[0]?.translatedText || "";
        text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        return text;
      },
    });
  }

  // DeepL
  const deeplKey = process.env.DEEPL_API_KEY;
  if (deeplKey) {
    const DEEPL_MAP: Record<string, string> = { en: "EN", es: "ES", fr: "FR", de: "DE", pt: "PT-BR", it: "IT", zh: "ZH", ja: "JA", ko: "KO" };
    providers.push({
      name: "DeepL",
      fn: async () => {
        const isFree = deeplKey.endsWith(":fx");
        const baseUrl = isFree ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
        const params = new URLSearchParams({
          text: segment,
          source_lang: DEEPL_MAP[srcLang] || srcLang.toUpperCase(),
          target_lang: DEEPL_MAP[tgtLang] || tgtLang.toUpperCase(),
        });
        const res = await fetch(baseUrl, {
          method: "POST",
          headers: { Authorization: `DeepL-Auth-Key ${deeplKey}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        if (!res.ok) throw new Error("DeepL API error");
        const data = await res.json();
        return data.translations?.[0]?.text || "";
      },
    });
  }

  // Claude
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (claudeKey) {
    providers.push({
      name: "Claude AI",
      fn: async () => {
        let glossaryInstr = "";
        if (glossaryTerms?.length) {
          glossaryInstr = `\nMandatory terminology: ${glossaryTerms.map((t: { source: string; target: string }) => `"${sanitize(t.source)}" → "${sanitize(t.target)}"`).join(", ")}.`;
        }
        let contextInstr = "";
        if (context?.previousSegment) contextInstr += `\nPrevious: "${sanitize(context.previousSegment)}"`;
        if (context?.nextSegment) contextInstr += `\nNext: "${sanitize(context.nextSegment)}"`;

        const prompt = `Translate from ${srcLang} to ${tgtLang}. Return ONLY the translation.${glossaryInstr}${contextInstr}\n\nText: "${sanitize(segment)}"`;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!res.ok) throw new Error("Claude API error");
        const data = await res.json();
        let text = data.content?.[0]?.text?.trim() || "";
        if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
          text = text.slice(1, -1);
        }
        return text;
      },
    });
  }

  // Run all in parallel
  const results = await Promise.allSettled(
    providers.map(async (p) => {
      try {
        const translation = await p.fn();
        return { provider: p.name, translation };
      } catch (err) {
        return { provider: p.name, translation: "", error: err instanceof Error ? err.message : "Failed" };
      }
    }),
  );

  const formatted = results.map((r) =>
    r.status === "fulfilled" ? r.value : { provider: "Unknown", translation: "", error: "Failed" },
  );

  // Count as 1 AI request (not per provider)
  await prisma.user.update({
    where: { id: userData.id },
    data: { aiRequestsUsed: { increment: 1 } },
  });

  return NextResponse.json({ results: formatted });
}
