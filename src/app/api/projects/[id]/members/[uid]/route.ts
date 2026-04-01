import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { VALID_PROJECT_ROLES } from "@/lib/roles";

// PATCH /api/projects/[id]/members/[uid] — change color/role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, uid } = await params;

    // Only project owner can change roles
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!project || project.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.color) data.color = body.color;
    if (body.role) {
      if (!VALID_PROJECT_ROLES.includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = body.role;
    }
    if (typeof body.canEdit === "boolean") data.canEdit = body.canEdit;

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: id, userId: uid } },
      data,
    });

    return NextResponse.json({ member });
  } catch (err) {
    console.error("Update member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members/[uid] — remove member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, uid } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!project || project.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId: uid } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
