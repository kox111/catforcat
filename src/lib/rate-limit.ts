import { prisma } from "./prisma";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const now = new Date();

  const record = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, windowStart: now },
    update: {},
  });

  const windowStart = new Date(record.windowStart);
  const windowEnd = new Date(windowStart.getTime() + windowMs);

  // Window expired — reset
  if (now >= windowEnd) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, windowStart: now },
    });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now.getTime() + windowMs) };
  }

  // Window active — check count
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: windowEnd };
  }

  // Increment
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: limit - updated.count, resetAt: windowEnd };
}
