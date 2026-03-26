import { NextResponse } from "next/server";
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
      aiRequestsUsed: true,
      aiRequestsResetAt: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
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

  const aiLimit = userData.plan === "pro" ? 1000 : 50;

  return NextResponse.json({
    plan: userData.plan,
    translationProvider:
      userData.plan === "pro" ? "DeepL Pro" : "Google Translate",
    aiRequestsUsed,
    aiRequestsLimit: aiLimit,
    hasSubscription: !!userData.stripeSubscriptionId,
    subscriptionEndsAt: userData.stripeCurrentPeriodEnd?.toISOString() || null,
  });
}
