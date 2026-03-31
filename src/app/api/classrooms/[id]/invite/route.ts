import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/classrooms/[id]/invite — invite by alias/email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Rate limit: 30/hour/user
    const rl = await checkRateLimit(`classroom-invite:${user!.id}`, 30, 3_600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many invitations" }, { status: 429 });
    }

    // Only professor can invite
    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId: targetUserId, username, email, role, color } = body;

    const assignedRole = role || "student";
    const assignedColor = color || "#a09090";

    let targetId = targetUserId;
    if (!targetId && username) {
      const found = await prisma.user.findUnique({ where: { username } });
      if (found) targetId = found.id;
    }

    if (targetId) {
      // Check if already a member
      const existing = await prisma.classroomMember.findUnique({
        where: { classroomId_userId: { classroomId: id, userId: targetId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Already a member" }, { status: 409 });
      }

      const invitation = await prisma.invitation.create({
        data: {
          fromUserId: user!.id,
          toUserId: targetId,
          classroomId: id,
          role: assignedRole,
          color: assignedColor,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.notification.create({
        data: {
          userId: targetId,
          type: "invitation",
          title: "Classroom invitation",
          body: `@${user!.username || user!.name} invited you to "${classroom.name}"`,
          link: `/app/classrooms`,
        },
      });

      return NextResponse.json({ invitation }, { status: 201 });
    } else if (email) {
      const invitation = await prisma.invitation.create({
        data: {
          fromUserId: user!.id,
          toEmail: email,
          classroomId: id,
          role: assignedRole,
          color: assignedColor,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({ invitation }, { status: 201 });
    }

    return NextResponse.json({ error: "userId, username, or email required" }, { status: 400 });
  } catch (err) {
    console.error("Classroom invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
