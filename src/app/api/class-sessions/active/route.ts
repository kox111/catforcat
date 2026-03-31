import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/class-sessions/active — check if student has an active session
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Find classrooms where user is a student
    const memberships = await prisma.classroomMember.findMany({
      where: { userId: user!.id, role: "student" },
      select: { classroomId: true },
    });

    if (memberships.length === 0) {
      return NextResponse.json({ active: false });
    }

    const classroomIds = memberships.map((m) => m.classroomId);

    const activeSession = await prisma.classSession.findFirst({
      where: {
        classroomId: { in: classroomIds },
        status: "active",
      },
      include: {
        classroom: { select: { name: true } },
      },
    });

    if (activeSession) {
      return NextResponse.json({
        active: true,
        session: {
          id: activeSession.id,
          classroomName: activeSession.classroom.name,
        },
      });
    }

    return NextResponse.json({ active: false });
  } catch (err) {
    console.error("Active session check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
