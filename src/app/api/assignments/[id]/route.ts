import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/assignments/[id] — detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classroom: { select: { id: true, name: true, professorId: true } },
        submissions: {
          include: {
            student: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify access
    const membership = await prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId: assignment.classroomId, userId: user!.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Students only see their own submission
    if (membership.role === "student") {
      const filtered = assignment.submissions.filter((s) => s.studentId === user!.id);
      return NextResponse.json({ assignment: { ...assignment, submissions: filtered }, myRole: membership.role });
    }

    return NextResponse.json({ assignment, myRole: membership.role });
  } catch (err) {
    console.error("Get assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/assignments/[id] — edit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { classroom: { select: { professorId: true } } },
    });
    if (!assignment || assignment.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.title) data.title = body.title;
    if (body.instructions !== undefined) data.instructions = body.instructions;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.status) data.status = body.status;

    const updated = await prisma.assignment.update({ where: { id }, data });
    return NextResponse.json({ assignment: updated });
  } catch (err) {
    console.error("Update assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/assignments/[id] — delete (cascade)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { classroom: { select: { professorId: true } } },
    });
    if (!assignment || assignment.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
