import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/class-sessions/[id] — end session
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const session = await prisma.classSession.findUnique({
      where: { id },
      include: { classroom: { select: { professorId: true } } },
    });

    if (!session || session.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.classSession.update({
      where: { id },
      data: { status: "ended", endedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("End session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
