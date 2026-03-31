import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/classrooms/[id] — detail + members + assignments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const membership = await prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId: id, userId: user!.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        professor: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true, plan: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { submissions: true } },
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ classroom, myRole: membership.role });
  } catch (err) {
    console.error("Get classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/classrooms/[id] — edit
export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.srcLang) data.srcLang = body.srcLang;
    if (body.tgtLang) data.tgtLang = body.tgtLang;

    const updated = await prisma.classroom.update({ where: { id }, data });
    return NextResponse.json({ classroom: updated });
  } catch (err) {
    console.error("Update classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/classrooms/[id] — archive (soft delete)
export async function DELETE(
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

    await prisma.classroom.update({
      where: { id },
      data: { status: "archived" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Archive classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
