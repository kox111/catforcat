import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/members — list project members
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Check user is project owner or member
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user!.id } },
    });

    if (project.userId !== user!.id && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true, plan: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (err) {
    console.error("List members error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects/[id]/members — invite user to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const { userId: targetUserId, username, email, role, color } = body;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!project || project.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find target user
    let targetId = targetUserId;
    if (!targetId && username) {
      const found = await prisma.user.findUnique({ where: { username } });
      if (found) targetId = found.id;
    }

    const assignedRole = role || "translator";
    const assignedColor = color || "#a09090";

    if (targetId) {
      // Check if already a member
      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId: targetId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Already a member" }, { status: 409 });
      }

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          fromUserId: user!.id,
          toUserId: targetId,
          projectId: id,
          role: assignedRole,
          color: assignedColor,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: targetId,
          type: "invitation",
          title: "Project invitation",
          body: `@${user!.username || user!.name} invited you to join a project`,
          link: `/app/projects`,
        },
      });

      return NextResponse.json({ invitation }, { status: 201 });
    } else if (email) {
      // Check if a user with this email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });

      const invitation = await prisma.invitation.create({
        data: {
          fromUserId: user!.id,
          toEmail: email,
          toUserId: existingUser?.id || null,
          projectId: id,
          role: assignedRole,
          color: assignedColor,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // If user exists, notify them
      if (existingUser) {
        await prisma.notification.create({
          data: {
            userId: existingUser.id,
            type: "invitation",
            title: "Project invitation",
            body: `@${user!.username || user!.name} invited you to join a project`,
            link: `/app/projects`,
          },
        });
      }

      return NextResponse.json({ invitation }, { status: 201 });
    }

    return NextResponse.json({ error: "userId, username, or email required" }, { status: 400 });
  } catch (err) {
    console.error("Invite member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
