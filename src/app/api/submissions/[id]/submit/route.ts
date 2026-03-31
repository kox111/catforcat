import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/submissions/[id]/submit — student submits
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { classroom: { select: { professorId: true, name: true } } },
        },
      },
    });

    if (!submission || submission.studentId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "in_progress") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    await prisma.submission.update({
      where: { id },
      data: { status: "submitted", submittedAt: new Date() },
    });

    // Notify professor
    await prisma.notification.create({
      data: {
        userId: submission.assignment.classroom.professorId,
        type: "submission",
        title: "New submission",
        body: `@${user!.username || user!.name} submitted "${submission.assignment.title}"`,
        link: `/app/classrooms/${submission.assignment.classroomId}/assignments/${submission.assignmentId}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
