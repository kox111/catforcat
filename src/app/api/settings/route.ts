import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/settings
 * Returns the current user's plan and usage info.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      plan: true,
      aiRequestsUsed: true,
      aiRequestsResetAt: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  let aiRequestsUsed = user.aiRequestsUsed;
  // Reset counter display if new month
  if (
    user.aiRequestsResetAt.getMonth() !== now.getMonth() ||
    user.aiRequestsResetAt.getFullYear() !== now.getFullYear()
  ) {
    aiRequestsUsed = 0;
  }

  const aiLimit = user.plan === "pro" ? 1000 : 50;

  return NextResponse.json({
    plan: user.plan,
    translationProvider: user.plan === "pro" ? "DeepL Pro" : "Google Translate",
    aiRequestsUsed,
    aiRequestsLimit: aiLimit,
    hasSubscription: !!user.stripeSubscriptionId,
    subscriptionEndsAt: user.stripeCurrentPeriodEnd?.toISOString() || null,
  });
}
