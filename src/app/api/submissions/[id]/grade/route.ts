import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/submissions/[id]/grade — grade submission
export async function POST(
  req: NextRequest,
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
          include: { classroom: { select: { professorId: true } } },
        },
      },
    });

    if (!submission || submission.assignment.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { gradeValue, gradeComment, rubricScores } = body;

    if (gradeValue === undefined && !rubricScores) {
      return NextResponse.json({ error: "gradeValue or rubricScores required" }, { status: 400 });
    }

    await prisma.submission.update({
      where: { id },
      data: {
        status: "graded",
        gradeValue: gradeValue != null ? gradeValue : null,
        gradeComment: gradeComment || null,
        rubricScores: rubricScores ? JSON.stringify(rubricScores) : null,
        gradedAt: new Date(),
      },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        type: "grade",
        title: "Assignment graded",
        body: `"${submission.assignment.title}" has been graded`,
        link: `/app/classrooms/${submission.assignment.classroomId}/assignments/${submission.assignmentId}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Grade error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/submissions/[id]/grade — modify grade
export async function PATCH(
  req: NextRequest,
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
          include: { classroom: { select: { professorId: true } } },
        },
      },
    });

    if (!submission || submission.assignment.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = { gradedAt: new Date() };
    if (body.gradeValue !== undefined) data.gradeValue = body.gradeValue;
    if (body.gradeComment !== undefined) data.gradeComment = body.gradeComment;
    if (body.rubricScores !== undefined) data.rubricScores = body.rubricScores ? JSON.stringify(body.rubricScores) : null;

    await prisma.submission.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Modify grade error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
