import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/notifications/read-all — mark all as read
export async function PATCH() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    await prisma.notification.updateMany({
      where: { userId: user!.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
