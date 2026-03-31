import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/class-sessions/[id]/live — polling: student progress
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Rate limit: 20/minute
    const rl = await checkRateLimit(`live-poll:${user!.id}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await prisma.classSession.findUnique({
      where: { id },
      include: { classroom: { select: { professorId: true, id: true } } },
    });

    if (!session || session.classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.status !== "active") {
      return NextResponse.json({ error: "Session ended" }, { status: 410 });
    }

    // Get all student submissions for this classroom
    const students = await prisma.classroomMember.findMany({
      where: { classroomId: session.classroom.id, role: "student" },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
      },
    });

    // Get submission progress
    const submissions = session.assignmentId
      ? await prisma.submission.findMany({
          where: { assignmentId: session.assignmentId },
          select: {
            studentId: true,
            projectId: true,
            progressPct: true,
            lastActiveAt: true,
            status: true,
          },
        })
      : [];

    const subMap = new Map(submissions.map((s) => [s.studentId, s]));

    const liveData = students.map((m) => {
      const sub = subMap.get(m.userId);
      return {
        user: m.user,
        color: m.color,
        projectId: sub?.projectId || null,
        progressPct: sub?.progressPct || 0,
        lastActiveAt: sub?.lastActiveAt || null,
        status: sub?.status || "in_progress",
      };
    });

    return NextResponse.json({ students: liveData, session: { id: session.id, status: session.status } });
  } catch (err) {
    console.error("Live poll error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
