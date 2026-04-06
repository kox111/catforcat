import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_COLORS = ["rojo", "rosa", "morado", "azul", "celeste", "teal", "verde", "amarillo"] as const;
const VALID_ROLES = ["pm", "translator", "reviewer", "proofreader", "terminologist", "dtp"] as const;
const MAX_MEMBERS = 8;

const addMemberSchema = z.object({
  username: z.string().min(1),
  role: z.enum(VALID_ROLES),
  color: z.enum(VALID_COLORS),
});

// POST /api/teams/[id]/members — add member by username
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Only owner can add members
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team || team.ownerId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { username, role, color } = parsed.data;

    // Find user by username
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, name: true, username: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: targetUser.id } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 409 });
    }

    // Check max members
    const memberCount = await prisma.teamMember.count({ where: { teamId: id } });
    if (memberCount >= MAX_MEMBERS) {
      return NextResponse.json({ error: `Team cannot exceed ${MAX_MEMBERS} members` }, { status: 409 });
    }

    // Check color uniqueness within team
    const colorTaken = await prisma.teamMember.findUnique({
      where: { teamId_color: { teamId: id, color } },
    });
    if (colorTaken) {
      return NextResponse.json({ error: `Color "${color}" is already taken in this team` }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: targetUser.id,
        role,
        color,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error("Add team member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
