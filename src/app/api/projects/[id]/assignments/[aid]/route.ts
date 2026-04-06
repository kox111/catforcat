import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAssignmentSchema = z
  .object({
    rangeStart: z.number().int().min(0).nullable().optional(),
    rangeEnd: z.number().int().min(0).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.rangeStart != null && data.rangeEnd != null) {
        return data.rangeStart < data.rangeEnd;
      }
      return true;
    },
    { message: "rangeStart must be less than rangeEnd" },
  );

async function verifyPmOrOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project) return { allowed: false as const, status: 404, message: "Project not found" };

  if (project.userId === userId) return { allowed: true as const };

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (member?.role === "pm") return { allowed: true as const };

  return { allowed: false as const, status: 403, message: "Forbidden" };
}

// PATCH /api/projects/[id]/assignments/[aid] — update assignment range
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, aid } = await params;

    const access = await verifyPmOrOwner(id, user!.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const assignment = await prisma.segmentAssignment.findUnique({
      where: { id: aid },
    });
    if (!assignment || assignment.projectId !== id) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rangeStart = parsed.data.rangeStart !== undefined
      ? parsed.data.rangeStart
      : assignment.rangeStart;
    const rangeEnd = parsed.data.rangeEnd !== undefined
      ? parsed.data.rangeEnd
      : assignment.rangeEnd;

    // Validate combined range
    if (rangeStart != null && rangeEnd != null && rangeStart >= rangeEnd) {
      return NextResponse.json(
        { error: "rangeStart must be less than rangeEnd" },
        { status: 400 },
      );
    }

    // Validate range overlap with other assignments
    if (rangeStart != null && rangeEnd != null) {
      const overlapping = await prisma.segmentAssignment.findMany({
        where: {
          projectId: id,
          id: { not: aid },
          rangeStart: { not: null },
          rangeEnd: { not: null },
        },
      });

      for (const a of overlapping) {
        if (a.rangeStart != null && a.rangeEnd != null) {
          if (rangeStart < a.rangeEnd && rangeEnd > a.rangeStart) {
            return NextResponse.json(
              {
                error: "Range overlaps with an existing assignment",
                conflictUserId: a.userId,
              },
              { status: 409 },
            );
          }
        }
      }
    }

    const updated = await prisma.segmentAssignment.update({
      where: { id: aid },
      data: { rangeStart, rangeEnd },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ assignment: updated });
  } catch (err) {
    console.error("Update assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/assignments/[aid] — remove assignment
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id, aid } = await params;

    const access = await verifyPmOrOwner(id, user!.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const assignment = await prisma.segmentAssignment.findUnique({
      where: { id: aid },
    });
    if (!assignment || assignment.projectId !== id) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await prisma.segmentAssignment.delete({
      where: { id: aid },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
