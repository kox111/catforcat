import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = "TRAD";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${code}`;
}

// POST /api/classrooms — create classroom
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Rate limit: 5/hour/user
    const rl = await checkRateLimit(`classroom-create:${user!.id}`, 5, 3_600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many classrooms created" }, { status: 429 });
    }

    const body = await req.json();
    const { name, description, srcLang, tgtLang } = body;

    if (!name || !srcLang || !tgtLang) {
      return NextResponse.json({ error: "name, srcLang, tgtLang required" }, { status: 400 });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.classroom.findUnique({ where: { inviteCode } });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const classroom = await prisma.classroom.create({
      data: {
        professorId: user!.id,
        name,
        description: description || null,
        srcLang,
        tgtLang,
        inviteCode,
      },
    });

    // Add professor as member
    await prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        userId: user!.id,
        role: "professor",
        color: "#7986CB",
      },
    });

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (err) {
    console.error("Create classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/classrooms — list my classrooms
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const memberships = await prisma.classroomMember.findMany({
      where: { userId: user!.id },
      include: {
        classroom: {
          include: {
            _count: { select: { members: true, assignments: true } },
            professor: { select: { id: true, name: true, username: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const classrooms = memberships.map((m) => ({
      ...m.classroom,
      myRole: m.role,
      myColor: m.color,
    }));

    return NextResponse.json({ classrooms });
  } catch (err) {
    console.error("List classrooms error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
