import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/assignments/[id]/clone-for-student — clone for late-joining student
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    const { studentId } = await req.json();

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classroom: { select: { professorId: true } },
        project: { include: { segments: { orderBy: { position: "asc" } } } },
      },
    });

    if (!assignment || assignment.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify student is a member of the classroom
    const studentMember = await prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId: assignment.classroomId, userId: studentId } },
    });
    if (!studentMember) {
      return NextResponse.json({ error: "Student is not a member of this classroom" }, { status: 400 });
    }

    // Check if student already has a submission
    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: id, studentId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Student already has a submission" }, { status: 409 });
    }

    const template = assignment.project;
    const clonedProject = await prisma.project.create({
      data: {
        userId: studentId,
        name: `${assignment.title} — ${template.name}`,
        srcLang: template.srcLang,
        tgtLang: template.tgtLang,
        sourceFile: template.sourceFile,
        fileFormat: template.fileFormat,
        dueDate: assignment.dueDate,
        segments: {
          create: template.segments.map((seg) => ({
            position: seg.position,
            sourceText: seg.sourceText,
            targetText: "",
            status: "empty",
          })),
        },
      },
    });

    const submission = await prisma.submission.create({
      data: {
        assignmentId: id,
        studentId,
        projectId: clonedProject.id,
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (err) {
    console.error("Clone for student error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
