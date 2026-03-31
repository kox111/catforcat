import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/notifications/[id] — mark one as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== user!.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
