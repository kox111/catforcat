import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/translate/post-edit
 *
 * Auto post-editing: takes a machine translation (from Google/DeepL)
 * and polishes it with Claude for better fluency and terminology.
 * Pro plan only.
 *
 * Body: { sourceText, machineTranslation, srcLang, tgtLang, glossaryTerms?, context? }
 * Returns: { postEdited, changes: string[] }
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
      { error: "AI post-editing requires Pro plan." },
      { status: 403 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI post-editing is not configured." },
      { status: 503 },
    );
  }

  const rateKey = `post-edit:${userData.id}`;
  const rateLimit = await checkRateLimit(rateKey, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { sourceText, machineTranslation, srcLang, tgtLang, glossaryTerms, context } = body;

  if (!sourceText || !machineTranslation || !srcLang || !tgtLang) {
    return NextResponse.json(
      { error: "sourceText, machineTranslation, srcLang, and tgtLang are required" },
      { status: 400 },
    );
  }

  const sanitize = (s: string) =>
    s.replace(/["""]/g, "'").replace(/\n/g, " ").slice(0, 2000);

  let glossaryInstr = "";
  if (glossaryTerms?.length) {
    glossaryInstr = `\nMandatory terminology (must be used exactly): ${glossaryTerms.map((t: { source: string; target: string }) => `"${sanitize(t.source)}" → "${sanitize(t.target)}"`).join(", ")}.`;
  }

  let contextInstr = "";
  if (context?.previousSegment) contextInstr += `\nPrevious sentence: "${sanitize(context.previousSegment)}"`;
  if (context?.nextSegment) contextInstr += `\nNext sentence: "${sanitize(context.nextSegment)}"`;

  const prompt = `You are a professional translator post-editor. A machine translation system translated a text from ${srcLang} to ${tgtLang}. Your job is to improve the machine translation for fluency, accuracy, and natural phrasing while keeping the meaning identical.${glossaryInstr}${contextInstr}

Source text: "${sanitize(sourceText)}"
Machine translation: "${sanitize(machineTranslation)}"

Respond in JSON format ONLY:
{"postEdited": "the improved translation", "changes": ["brief description of each change made"]}

If the machine translation is already good, return it unchanged with an empty changes array.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Claude post-edit error:", response.status);
      return NextResponse.json(
        { error: "AI post-editing service unavailable" },
        { status: 502 },
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        postEdited: machineTranslation,
        changes: [],
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    await prisma.user.update({
      where: { id: userData.id },
      data: { aiRequestsUsed: { increment: 1 } },
    });

    return NextResponse.json({
      postEdited: parsed.postEdited || machineTranslation,
      changes: parsed.changes || [],
    });
  } catch (err) {
    console.error("Post-edit error:", err);
    return NextResponse.json(
      { error: "AI post-editing failed" },
      { status: 502 },
    );
  }
}
