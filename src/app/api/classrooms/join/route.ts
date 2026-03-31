import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/classrooms/join — join by invite_code
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit(`classroom-join:${ip}`, 10, 3_600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many join attempts" }, { status: 429 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { inviteCode: code.trim().toUpperCase() },
    });

    if (!classroom || classroom.status !== "active") {
      return NextResponse.json({ error: "Invalid or expired invite code" }, { status: 404 });
    }

    // Invite codes expire 30 days after classroom creation
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(classroom.createdAt).getTime() > thirtyDaysMs) {
      return NextResponse.json(
        { error: "Invite code expired. Ask the professor for a new one." },
        { status: 410 },
      );
    }

    // Check if already a member
    const existing = await prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId: classroom.id, userId: user!.id } },
    });
    if (existing) {
      return NextResponse.json({ classroomId: classroom.id, message: "Already a member" });
    }

    await prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        userId: user!.id,
        role: "student",
      },
    });

    // Notify professor
    await prisma.notification.create({
      data: {
        userId: classroom.professorId,
        type: "submission",
        title: "New student joined",
        body: `@${user!.username || user!.name} joined "${classroom.name}"`,
        link: `/app/classrooms/${classroom.id}`,
      },
    });

    return NextResponse.json({ classroomId: classroom.id }, { status: 201 });
  } catch (err) {
    console.error("Join classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
