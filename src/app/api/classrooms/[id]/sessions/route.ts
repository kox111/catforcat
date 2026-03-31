import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/classrooms/[id]/sessions — start session
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // End any existing active session
    await prisma.classSession.updateMany({
      where: { classroomId: id, status: "active" },
      data: { status: "ended", endedAt: new Date() },
    });

    const body = await req.json().catch(() => ({}));
    const session = await prisma.classSession.create({
      data: {
        classroomId: id,
        assignmentId: body.assignmentId || null,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("Start session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
