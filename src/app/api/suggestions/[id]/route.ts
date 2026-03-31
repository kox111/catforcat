import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/suggestions/[id] — accept/reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
      include: {
        segment: { include: { project: { select: { userId: true } } } },
      },
    });
    if (!suggestion) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only project owner, translator, or student can accept/reject
    const isOwner = suggestion.segment.project.userId === user!.id;
    let canAccept = false;
    if (!isOwner) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: suggestion.segment.projectId, userId: user!.id } },
      });
      canAccept = member?.role === "translator" || member?.role === "student";
    }

    if (!isOwner && !canAccept) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await req.json();
    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.suggestion.update({ where: { id }, data: { status } });

    // If accepted, apply the suggested text to the segment
    if (status === "accepted") {
      await prisma.segment.update({
        where: { id: suggestion.segmentId },
        data: { targetText: suggestion.suggestedText },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update suggestion error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/suggestions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const suggestion = await prisma.suggestion.findUnique({ where: { id } });
    if (!suggestion || suggestion.authorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.suggestion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete suggestion error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
