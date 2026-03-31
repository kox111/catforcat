import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/post-its/[id] — edit/resolve
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const postIt = await prisma.postIt.findUnique({
      where: { id },
      include: { segment: { include: { project: { select: { userId: true } } } } },
    });
    if (!postIt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Author or project owner can edit
    if (postIt.authorId !== user!.id && postIt.segment.project.userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.content !== undefined) data.content = body.content;
    if (body.severity !== undefined) data.severity = body.severity;
    if (typeof body.resolved === "boolean") data.resolved = body.resolved;

    await prisma.postIt.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update post-it error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/post-its/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const postIt = await prisma.postIt.findUnique({ where: { id } });
    if (!postIt || postIt.authorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.postIt.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete post-it error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
