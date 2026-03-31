import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/invitations/[id] — accept or decline
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    const { action } = await req.json(); // 'accept' | 'decline'

    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify the invitation is for this user
    if (invitation.toUserId && invitation.toUserId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (invitation.toEmail && invitation.toEmail !== user!.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation already processed" }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({ where: { id }, data: { status: "expired" } });
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
    }

    if (action === "decline") {
      await prisma.invitation.update({ where: { id }, data: { status: "declined" } });
      return NextResponse.json({ ok: true });
    }

    if (action === "accept") {
      // Accept: create membership (upsert to avoid duplicate constraint errors)
      if (invitation.projectId) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: invitation.projectId, userId: user!.id } },
          create: {
            projectId: invitation.projectId,
            userId: user!.id,
            role: invitation.role,
            color: invitation.color,
            invitedBy: invitation.fromUserId,
          },
          update: {},
        });
      }

      if (invitation.classroomId) {
        await prisma.classroomMember.upsert({
          where: { classroomId_userId: { classroomId: invitation.classroomId, userId: user!.id } },
          create: {
            classroomId: invitation.classroomId,
            userId: user!.id,
            role: invitation.role,
            color: invitation.color,
          },
          update: {},
        });
      }

      await prisma.invitation.update({ where: { id }, data: { status: "accepted" } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Invitation action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
