import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret } from "@/lib/two-factor";

/**
 * POST /api/auth/2fa/setup
 * Generates a TOTP secret and QR code for the authenticated user.
 * Does NOT enable 2FA — that happens after the user verifies the code.
 */
export async function POST() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, twoFactorEnabled: true },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (userData.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA is already enabled" },
      { status: 400 },
    );
  }

  const { secret, uri } = generateTOTPSecret(userData.email);

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret },
  });

  const qrCode = await QRCode.toDataURL(uri);

  return NextResponse.json({ qrCode, secret });
}
