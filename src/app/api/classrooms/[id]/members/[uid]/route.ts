import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { VALID_CLASSROOM_ROLES } from "@/lib/roles";

// PATCH /api/classrooms/[id]/members/[uid] — change color/role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, uid } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.color) data.color = body.color;
    if (body.role) {
      if (!(VALID_CLASSROOM_ROLES as readonly string[]).includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = body.role;
    }

    const member = await prisma.classroomMember.update({
      where: { classroomId_userId: { classroomId: id, userId: uid } },
      data,
    });

    return NextResponse.json({ member });
  } catch (err) {
    console.error("Update classroom member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/classrooms/[id]/members/[uid] — remove member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, uid } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.classroomMember.delete({
      where: { classroomId_userId: { classroomId: id, userId: uid } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove classroom member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
