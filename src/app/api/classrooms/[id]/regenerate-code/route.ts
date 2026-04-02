import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRAD-${code}`;
}

// POST /api/classrooms/[id]/regenerate-code — generate new invite code
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let newCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.classroom.findUnique({ where: { inviteCode: newCode } });
      if (!existing) break;
      newCode = generateInviteCode();
      attempts++;
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: { inviteCode: newCode },
    });

    return NextResponse.json({ inviteCode: updated.inviteCode });
  } catch (err) {
    console.error("Regenerate code error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
