import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) return;

  // Fetch subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceId = (subscription as any).items?.data?.[0]?.price?.id || null;
  const currentPeriodEnd = new Date(
    (subscription as unknown as { current_period_end: number })
      .current_period_end * 1000,
  );

  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "pro",
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionId = ((invoice as any).subscription ||
    (invoice as any).parent?.subscription_details?.subscription) as string;

  if (!customerId || !subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(
    (subscription as unknown as { current_period_end: number })
      .current_period_end * 1000,
  );

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "pro",
      stripeCurrentPeriodEnd: currentPeriodEnd,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const currentPeriodEnd = new Date(
    (subscription as unknown as { current_period_end: number })
      .current_period_end * 1000,
  );

  const status = subscription.status;
  const isActive = status === "active" || status === "trialing";

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: isActive ? "pro" : "free",
      stripeCurrentPeriodEnd: currentPeriodEnd,
      stripeSubscriptionId: subscription.id,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "free",
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });
}
