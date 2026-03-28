import Stripe from "stripe";

// Lazy initialization — only create Stripe client when actually needed
// This prevents build errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Keep backward compat alias
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      projects: 3,
      segmentsPerProject: 500,
      tmEntries: 1000,
      glossaryTerms: 200,
      aiRequestsPerMonth: 5000,
      importFormats: [
        "txt",
        "docx",
        "pdf",
        "xlf",
        "xliff",
        "json",
        "srt",
        "po",
        "md",
      ],
      exportFormats: [
        "txt",
        "docx",
        "xliff",
        "tmx",
        "html-bilingual",
        "json",
        "srt",
        "po",
        "markdown",
      ],
      xliffImport: true,
    },
  },
  pro: {
    name: "Pro",
    price: 10,
    limits: {
      projects: Infinity,
      segmentsPerProject: Infinity,
      tmEntries: Infinity,
      glossaryTerms: Infinity,
      aiRequestsPerMonth: 999999999,
      importFormats: [
        "txt",
        "docx",
        "pdf",
        "xlf",
        "xliff",
        "json",
        "srt",
        "po",
        "md",
      ],
      exportFormats: [
        "txt",
        "docx",
        "xliff",
        "tmx",
        "html-bilingual",
        "json",
        "srt",
        "po",
        "markdown",
      ],
      xliffImport: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  return PLANS[plan as PlanName]?.limits || PLANS.free.limits;
}
