import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getPrivacyConfig, type PrivacyLevel } from "@/lib/privacy";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/projects/[id]/smart-review
 *
 * AI-powered quality scoring for translated segments.
 * Evaluates translations on accuracy, fluency, terminology consistency, and grammar.
 *
 * Body: { segmentIds?: string[] }
 * - If segmentIds provided: review only those segments
 * - If omitted: review all segments with non-empty targetText
 *
 * Rate limited to 30 requests/minute per user.
 * Monthly AI request limits: Free = 5000/month, Pro = unlimited.
 */

// ─────────────────────────────────────────────
// Plan limits for AI requests per month
// ─────────────────────────────────────────────
const AI_LIMITS: Record<string, number> = { free: 5000, pro: 999999999 };

// ─────────────────────────────────────────────
// Request types
// ─────────────────────────────────────────────
interface SmartReviewRequestBody {
  segmentIds?: string[];
}

interface SmartReviewResult {
  segmentId: string;
  score: number;
  reason: string;
}

interface SmartReviewResponse {
  results: SmartReviewResult[];
  usage: {
    used: number;
    limit: number;
  };
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  // Rate limit check (per-minute, DB-backed)
  const rateLimit = await checkRateLimit(`smart-review:${user.id}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 30 requests per minute." },
      { status: 429 },
    );
  }

  // Monthly AI request limit check
  const plan = user.plan;
  const monthlyLimit = AI_LIMITS[plan] || AI_LIMITS.free;
  const now = new Date();

  // Reset counter if new month
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

  const { id } = await params;

  // Get project to verify ownership and get language codes
  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      srcLang: true,
      tgtLang: true,
      privacyLevel: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Privacy enforcement
  const privacy = getPrivacyConfig(project.privacyLevel as PrivacyLevel);
  if (!privacy.smartReviewEnabled) {
    return NextResponse.json(
      { error: "Smart Review disabled for this privacy level" },
      { status: 403 },
    );
  }

  const body: SmartReviewRequestBody = await req.json();
  const { segmentIds } = body;

  // Get segments to review
  let segments = await prisma.segment.findMany({
    where: {
      projectId: project.id,
      ...(segmentIds && segmentIds.length > 0
        ? { id: { in: segmentIds } }
        : { targetText: { not: "" } }),
    },
    orderBy: { position: "asc" },
  });

  if (segments.length === 0) {
    return NextResponse.json({
      results: [],
      usage: { used: currentUsed, limit: monthlyLimit },
    } as SmartReviewResponse);
  }

  // Check if we have enough quota for all segments
  const requiredQuota = segments.length;
  if (currentUsed + requiredQuota > monthlyLimit) {
    return NextResponse.json(
      {
        error: `Insufficient quota to review ${segments.length} segment(s). Current usage: ${currentUsed}/${monthlyLimit}. ${
          plan === "free"
            ? "Upgrade to Pro for 1,000/month."
            : "Limit resets next month."
        }`,
      },
      { status: 429 },
    );
  }

  try {
    const results: SmartReviewResult[] = [];

    // Score each segment
    for (const segment of segments) {
      const score = await scoreSegment(
        segment.sourceText,
        segment.targetText,
        project.srcLang,
        project.tgtLang,
      );

      // Update segment with AI score
      await prisma.segment.update({
        where: { id: segment.id },
        data: {
          aiScore: score.score,
          aiScoreReason: score.reason,
          aiScoredAt: new Date(),
        },
      });

      results.push({
        segmentId: segment.id,
        score: score.score,
        reason: score.reason,
      });
    }

    // Increment monthly counter
    await prisma.user.update({
      where: { id: user.id },
      data: { aiRequestsUsed: { increment: requiredQuota } },
    });

    return NextResponse.json({
      results,
      usage: { used: currentUsed + requiredQuota, limit: monthlyLimit },
    } as SmartReviewResponse);
  } catch (error) {
    console.error("Smart Review error:", error);
    const message = error instanceof Error ? error.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ─────────────────────────────────────────────
// Score a single segment using LLM
// ─────────────────────────────────────────────
interface LLMScore {
  score: number;
  reason: string;
}

async function scoreSegment(
  sourceText: string,
  targetText: string,
  srcLang: string,
  tgtLang: string,
): Promise<LLMScore> {
  // Sanitize user text to prevent prompt injection
  const sanitize = (text: string) =>
    text.replace(/["""]/g, "'").replace(/\n/g, " ").slice(0, 2000);

  const prompt = `You are a professional translation quality evaluator. Rate the following translation from 0 to 100.

Consider: accuracy, fluency, terminology consistency, grammar.

Source language: ${srcLang}
Target language: ${tgtLang}

<source_text>${sanitize(sourceText)}</source_text>
<translation>${sanitize(targetText)}</translation>

Respond in JSON format ONLY, nothing else:
{"score": 85, "reason": "One sentence explanation."}`;

  // Try OpenAI API first (if configured)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return scoreWithOpenAI(prompt, openaiKey);
  }

  // Fallback to generic LLM endpoint
  const llmEndpoint = process.env.LLM_ENDPOINT;
  if (llmEndpoint) {
    return scoreWithLLMEndpoint(prompt, llmEndpoint);
  }

  throw new Error(
    "Smart Review not configured. Set OPENAI_API_KEY or LLM_ENDPOINT in environment.",
  );
}

// ─────────────────────────────────────────────
// Score using OpenAI API
// ─────────────────────────────────────────────
async function scoreWithOpenAI(
  prompt: string,
  apiKey: string,
): Promise<LLMScore> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    if (response.status === 401) {
      throw new Error("OpenAI API key is invalid.");
    }
    if (response.status === 429) {
      throw new Error("OpenAI rate limit exceeded. Try again later.");
    }
    throw new Error("OpenAI API unavailable");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return parseScoreResponse(content);
}

// ─────────────────────────────────────────────
// Score using generic LLM endpoint
// ─────────────────────────────────────────────
async function scoreWithLLMEndpoint(
  prompt: string,
  endpoint: string,
): Promise<LLMScore> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      temperature: 0.3,
      maxTokens: 200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LLM endpoint error:", response.status, errorText);
    throw new Error("LLM service unavailable");
  }

  const data = await response.json();
  const content = data.content || data.text || data.response;

  if (!content) {
    throw new Error("No response from LLM endpoint");
  }

  return parseScoreResponse(content);
}

// ─────────────────────────────────────────────
// Parse JSON response from LLM
// ─────────────────────────────────────────────
function parseScoreResponse(content: string): LLMScore {
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.score !== "number" || typeof parsed.reason !== "string") {
      throw new Error("Response missing score or reason");
    }

    // Validate score range
    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));

    return {
      score,
      reason: parsed.reason.substring(0, 500), // Limit reason length
    };
  } catch (error) {
    console.error("Failed to parse score response:", content, error);
    throw new Error(
      `Failed to parse LLM response: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
