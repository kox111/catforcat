import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/two-factor";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/2fa/disable
 * Verifies a TOTP token and disables 2FA for the authenticated user.
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

  const rateLimit = await checkRateLimit(`2fa-disable:${user.id}`, 5, 300_000);
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

  if (!userData.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA is not enabled" },
      { status: 400 },
    );
  }

  if (!userData.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA secret not found" },
      { status: 400 },
    );
  }

  const isValid = verifyTOTP(userData.twoFactorSecret, token);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ success: true });
}
