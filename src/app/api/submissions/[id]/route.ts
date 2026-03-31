import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/submissions/[id] — submission status
export async function GET(
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
        student: { select: { id: true, name: true, username: true } },
        project: { select: { id: true, name: true } },
        assignment: {
          select: {
            id: true,
            title: true,
            gradingMode: true,
            gradingScale: true,
            rubricCriteria: true,
            classroom: { select: { professorId: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only student or professor can view
    if (submission.studentId !== user!.id && submission.assignment.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ submission });
  } catch (err) {
    console.error("Get submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
