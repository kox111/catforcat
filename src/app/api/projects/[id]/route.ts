import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id] — get project with all segments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      segments: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/[id] — update project fields (e.g. privacyLevel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  // Privacy level update
  if (body.privacyLevel) {
    const validLevels = ["standard", "private", "confidential"];
    if (!validLevels.includes(body.privacyLevel)) {
      return NextResponse.json(
        {
          error:
            "Invalid privacy level. Must be: standard, private, or confidential",
        },
        { status: 400 },
      );
    }
    updateData.privacyLevel = body.privacyLevel;
  }

  // Name update
  if (body.name) {
    updateData.name = body.name;
  }

  // Status update
  if (body.status) {
    updateData.status = body.status;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ project: updated });
}

// DELETE /api/projects/[id] — delete project and all related data (cascade)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
