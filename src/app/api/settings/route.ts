import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/settings
 * Returns the current user's plan and usage info.
 */
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      avatarUrl: true,
      aiRequestsUsed: true,
      aiRequestsResetAt: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      twoFactorEnabled: true,
    },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  let aiRequestsUsed = userData.aiRequestsUsed;
  // Reset counter display if new month
  if (
    userData.aiRequestsResetAt.getMonth() !== now.getMonth() ||
    userData.aiRequestsResetAt.getFullYear() !== now.getFullYear()
  ) {
    aiRequestsUsed = 0;
  }

  const aiLimit = userData.plan === "pro" ? 999999999 : 5000;

  return NextResponse.json({
    plan: userData.plan,
    avatarUrl: userData.avatarUrl,
    translationProvider: "Google Translate",
    aiRequestsUsed,
    aiRequestsLimit: aiLimit,
    hasSubscription: !!userData.stripeSubscriptionId,
    subscriptionEndsAt: userData.stripeCurrentPeriodEnd?.toISOString() || null,
    twoFactorEnabled: userData.twoFactorEnabled,
  });
}

/**
 * PATCH /api/settings
 * Update user profile fields (avatarUrl, name, etc.)
 */
export async function PATCH(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    // Avatar: accept base64 dataURL or null (remove)
    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl === null) {
        data.avatarUrl = null;
      } else if (typeof body.avatarUrl === "string" && body.avatarUrl.startsWith("data:image/")) {
        // Limit size: ~200KB base64 ≈ 150KB image
        if (body.avatarUrl.length > 300_000) {
          return NextResponse.json({ error: "Image too large (max ~200KB)" }, { status: 400 });
        }
        data.avatarUrl = body.avatarUrl;
      } else {
        return NextResponse.json({ error: "Invalid avatar format" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
