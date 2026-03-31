import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

interface SegmentUpdate {
  id: string;
  targetText?: string;
  status?: string;
  metadata?: string;
}

// PATCH /api/projects/[id]/segments — batch update segments
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  // Verify project ownership or membership
  const project = await prisma.project.findUnique({
    where: { id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== user.id) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });
    if (!member || !member.canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const { segments } = (await req.json()) as { segments: SegmentUpdate[] };

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json(
        { error: "segments array is required" },
        { status: 400 },
      );
    }

    // Update each segment in a transaction
    const updates = await prisma.$transaction(
      segments.map((seg) =>
        prisma.segment.update({
          where: { id: seg.id },
          data: {
            ...(seg.targetText !== undefined && { targetText: seg.targetText }),
            ...(seg.status !== undefined && { status: seg.status }),
            ...(seg.metadata !== undefined && { metadata: seg.metadata }),
          },
        }),
      ),
    );

    // Update submission progress if this project belongs to a submission
    const submission = await prisma.submission.findFirst({
      where: { projectId: id, studentId: user.id },
    });
    if (submission) {
      const total = await prisma.segment.count({ where: { projectId: id } });
      const confirmed = await prisma.segment.count({
        where: { projectId: id, status: "confirmed" },
      });
      const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
      await prisma.submission.update({
        where: { id: submission.id },
        data: { progressPct: pct, lastActiveAt: new Date() },
      });
    }

    return NextResponse.json({ updated: updates.length });
  } catch (error) {
    console.error("Segment update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
