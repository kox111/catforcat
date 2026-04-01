import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/my-assignments — student's submissions grouped by assignment
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const submissions = await prisma.submission.findMany({
      where: { studentId: user!.id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            classroom: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by assignment for TaskBoard compatibility
    const assignmentMap = new Map<string, {
      id: string;
      title: string;
      status: string;
      dueDate: string | null;
      classroomName: string;
      submissions: Array<{
        id: string;
        projectId: string;
        status: string;
        progressPct: number;
        submittedAt: string | null;
        gradeValue: number | null;
        student: { name: string | null; username: string | null };
      }>;
    }>();

    for (const sub of submissions) {
      const a = sub.assignment;
      if (!assignmentMap.has(a.id)) {
        assignmentMap.set(a.id, {
          id: a.id,
          title: a.title,
          status: a.status,
          dueDate: a.dueDate?.toISOString() ?? null,
          classroomName: a.classroom.name,
          submissions: [],
        });
      }
      assignmentMap.get(a.id)!.submissions.push({
        id: sub.id,
        projectId: sub.projectId,
        status: sub.status,
        progressPct: sub.progressPct,
        submittedAt: sub.submittedAt?.toISOString() ?? null,
        gradeValue: sub.gradeValue ? Number(sub.gradeValue) : null,
        student: { name: a.title, username: null }, // label = assignment title for student view
      });
    }

    return NextResponse.json({
      assignments: Array.from(assignmentMap.values()),
    });
  } catch (err) {
    console.error("My assignments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
