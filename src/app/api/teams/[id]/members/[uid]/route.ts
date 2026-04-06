import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_COLORS = ["rojo", "rosa", "morado", "azul", "celeste", "teal", "verde", "amarillo"] as const;
const VALID_ROLES = ["pm", "translator", "reviewer", "proofreader", "terminologist", "dtp"] as const;

const updateMemberSchema = z.object({
  role: z.enum(VALID_ROLES).optional(),
  color: z.enum(VALID_COLORS).optional(),
});

// PATCH /api/teams/[id]/members/[uid] — change role/color (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, uid } = await params;

    // Only owner can update members
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team || team.ownerId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.role !== undefined) data.role = parsed.data.role;

    if (parsed.data.color !== undefined) {
      // Check color uniqueness within team (excluding the member being updated)
      const colorTaken = await prisma.teamMember.findFirst({
        where: {
          teamId: id,
          color: parsed.data.color,
          userId: { not: uid },
        },
      });
      if (colorTaken) {
        return NextResponse.json(
          { error: `Color "${parsed.data.color}" is already taken in this team` },
          { status: 409 },
        );
      }
      data.color = parsed.data.color;
    }

    const member = await prisma.teamMember.update({
      where: { teamId_userId: { teamId: id, userId: uid } },
      data,
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
      },
    });

    return NextResponse.json({ member });
  } catch (err) {
    console.error("Update team member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members/[uid] — remove member (owner or self)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, uid } = await params;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = team.ownerId === user!.id;
    const isSelf = uid === user!.id;

    // Only owner or the member themselves can remove
    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Owner cannot remove themselves (would orphan the team)
    if (isOwner && isSelf) {
      return NextResponse.json(
        { error: "Owner cannot leave the team. Delete the team or transfer ownership first." },
        { status: 409 },
      );
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId: id, userId: uid } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove team member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
