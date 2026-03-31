import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/classrooms/[id]/assignments — create assignment + clone projects
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Only professor
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: { members: { where: { role: "student" } } },
    });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { projectId, title, instructions, dueDate, gradingMode, gradingScale, rubricCriteria } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
    }

    // Verify template project exists
    const template = await prisma.project.findUnique({
      where: { id: projectId },
      include: { segments: { orderBy: { position: "asc" } } },
    });
    if (!template) {
      return NextResponse.json({ error: "Template project not found" }, { status: 404 });
    }

    // Mark template
    await prisma.project.update({
      where: { id: projectId },
      data: { isTemplate: true },
    });

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        classroomId: id,
        projectId,
        title,
        instructions: instructions || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        gradingMode: gradingMode || "simple",
        gradingScale: gradingScale || "numeric-20",
        rubricCriteria: rubricCriteria ? JSON.stringify(rubricCriteria) : null,
        status: "active",
      },
    });

    // Clone project for each student
    for (const member of classroom.members) {
      const clonedProject = await prisma.project.create({
        data: {
          userId: member.userId,
          name: `${title} — ${template.name}`,
          srcLang: template.srcLang,
          tgtLang: template.tgtLang,
          sourceFile: template.sourceFile,
          fileFormat: template.fileFormat,
          dueDate: dueDate ? new Date(dueDate) : null,
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

      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: member.userId,
          projectId: clonedProject.id,
        },
      });

      // Notify student
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: "submission",
          title: "New assignment",
          body: `"${title}" has been assigned in "${classroom.name}"`,
          link: `/app/classrooms/${id}/assignments/${assignment.id}`,
        },
      });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error("Create assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/classrooms/[id]/assignments — list
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const membership = await prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId: id, userId: user!.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { classroomId: id },
      include: {
        _count: { select: { submissions: true } },
        submissions: membership.role === "student"
          ? { where: { studentId: user!.id } }
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error("List assignments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
