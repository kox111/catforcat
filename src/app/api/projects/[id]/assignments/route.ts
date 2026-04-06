import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAssignmentSchema = z
  .object({
    userId: z.string().min(1),
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

// GET /api/projects/[id]/assignments — list assignments for project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Any project member can view assignments
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user!.id } },
    });
    if (project.userId !== user!.id && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignments = await prisma.segmentAssignment.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error("List assignments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects/[id]/assignments — create assignment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const access = await verifyPmOrOwner(id, user!.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = await req.json();
    const parsed = createAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { userId: targetUserId, rangeStart, rangeEnd } = parsed.data;

    // Verify target user is a project member
    const targetMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } },
    });
    if (!targetMember) {
      return NextResponse.json(
        { error: "User is not a member of this project" },
        { status: 400 },
      );
    }

    // Check for duplicate assignment
    const existing = await prisma.segmentAssignment.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User already has an assignment in this project" },
        { status: 409 },
      );
    }

    // Validate range overlap with existing assignments (for translators)
    const effectiveStart = rangeStart ?? null;
    const effectiveEnd = rangeEnd ?? null;

    if (effectiveStart != null && effectiveEnd != null) {
      const overlapping = await prisma.segmentAssignment.findMany({
        where: {
          projectId: id,
          rangeStart: { not: null },
          rangeEnd: { not: null },
        },
      });

      for (const a of overlapping) {
        if (a.rangeStart != null && a.rangeEnd != null) {
          if (effectiveStart < a.rangeEnd && effectiveEnd > a.rangeStart) {
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

    const assignment = await prisma.segmentAssignment.create({
      data: {
        projectId: id,
        userId: targetUserId,
        rangeStart: effectiveStart,
        rangeEnd: effectiveEnd,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error("Create assignment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
