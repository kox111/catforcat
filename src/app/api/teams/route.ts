import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_COLORS = ["rojo", "rosa", "morado", "azul", "celeste", "teal", "verde", "amarillo"] as const;
const VALID_ROLES = ["pm", "translator", "reviewer", "proofreader", "terminologist", "dtp"] as const;

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// POST /api/teams — create team
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, description } = parsed.data;

    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        ownerId: user!.id,
      },
    });

    // Add owner as PM with color "azul"
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user!.id,
        role: "pm",
        color: "azul",
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    console.error("Create team error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/teams — list my teams
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const memberships = await prisma.teamMember.findMany({
      where: { userId: user!.id },
      include: {
        team: {
          include: {
            _count: { select: { members: true, projects: true } },
            owner: { select: { id: true, name: true, username: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const teams = memberships.map((m) => ({
      ...m.team,
      myRole: m.role,
      myColor: m.color,
    }));

    return NextResponse.json({ teams });
  } catch (err) {
    console.error("List teams error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
