import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for managing subscription.
 */
export async function POST() {
  const { user: authUser, error } = await getAuthenticatedUser();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://catforcat.app";

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/app/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
