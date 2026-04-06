import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

// GET /api/teams/[id] — team detail + members
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: user!.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        projects: {
          select: { id: true, name: true, srcLang: true, tgtLang: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" as const },
        },
        _count: { select: { projects: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ team, myRole: membership.role, myColor: membership.color });
  } catch (err) {
    console.error("Get team error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/teams/[id] — update name/description (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team || team.ownerId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;

    const updated = await prisma.team.update({ where: { id }, data });
    return NextResponse.json({ team: updated });
  } catch (err) {
    console.error("Update team error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/teams/[id] — delete team (owner only, no active projects)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });
    if (!team || team.ownerId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (team._count.projects > 0) {
      return NextResponse.json(
        { error: "Cannot delete team with active projects. Remove all projects first." },
        { status: 409 },
      );
    }

    await prisma.team.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete team error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
