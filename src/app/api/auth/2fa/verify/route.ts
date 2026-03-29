import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/two-factor";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/2fa/verify
 * Verifies a TOTP token and enables 2FA for the authenticated user.
 * Body: { token: string }
 */
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(`2fa-verify:${user.id}`, 5, 300_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 5 minutes." },
      { status: 429 },
    );
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!userData.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA setup not initiated. Call /api/auth/2fa/setup first." },
      { status: 400 },
    );
  }

  const isValid = verifyTOTP(userData.twoFactorSecret, token);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (!userData.twoFactorEnabled) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });
  }

  return NextResponse.json({ success: true });
}
