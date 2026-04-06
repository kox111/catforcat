import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/segments/[id]/reject
 * Reject a segment — moves it back to "translating" and propagates
 * a needsRecheck flag to downstream segments from the same translator.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ segId: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { segId: id } = await params;

  const body = await req.json();
  const reason: string | undefined =
    typeof body.reason === "string" ? body.reason : undefined;

  // Find segment with project and its segment assignments + members
  const segment = await prisma.segment.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          segmentAssignments: true,
          members: true,
        },
      },
    },
  });

  if (!segment) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  // Verify user is a project member
  const isMember = segment.project.members.some(
    (m) => m.userId === user.id,
  );
  if (!isMember) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  // Update the rejected segment
  const updated = await prisma.segment.update({
    where: { id },
    data: {
      workflowStage: "translating",
      reviewStatus: "rejected",
      reviewedBy: user.id,
      reviewedAt: new Date(),
      needsRecheck: false,
    },
  });

  // Error propagation: flag downstream segments from the same translator
  let propagatedCount = 0;
  if (segment.confirmedBy) {
    // Find the translator's assignment to get their rangeEnd
    const assignment = segment.project.segmentAssignments.find(
      (a) => a.userId === segment.confirmedBy,
    );

    const maxPosition = assignment?.rangeEnd
      ? Math.min(segment.position + 20, assignment.rangeEnd)
      : segment.position + 20;

    const result = await prisma.segment.updateMany({
      where: {
        projectId: segment.projectId,
        position: {
          gt: segment.position,
          lte: maxPosition,
        },
        confirmedBy: segment.confirmedBy,
        workflowStage: { not: "translating" },
      },
      data: {
        needsRecheck: true,
      },
    });

    propagatedCount = result.count;

    // Create notification for the translator
    await prisma.notification.create({
      data: {
        userId: segment.confirmedBy,
        type: "correction_needed",
        title: `Segment #${segment.position} was rejected`,
        body:
          reason || "The reviewer found an issue with this segment.",
        link: `/app/projects/${segment.projectId}?seg=${segment.position}`,
      },
    });
  }

  return NextResponse.json({
    segment: updated,
    propagatedCount,
  });
}
