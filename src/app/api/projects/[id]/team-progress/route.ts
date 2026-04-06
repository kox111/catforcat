import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/team-progress — PM dashboard progress data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    // Verify user is a project member
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user!.id } },
    });

    if (project.userId !== user!.id && !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // (a) Overall progress
    const totalSegments = await prisma.segment.count({
      where: { projectId: id },
    });

    const [
      translatingCount,
      reviewingCount,
      proofreadingCount,
      completedCount,
      awaitingApprovalCount,
      needsRecheckCount,
    ] = await Promise.all([
      prisma.segment.count({ where: { projectId: id, workflowStage: "translating" } }),
      prisma.segment.count({ where: { projectId: id, workflowStage: "reviewing" } }),
      prisma.segment.count({ where: { projectId: id, workflowStage: "proofreading" } }),
      prisma.segment.count({ where: { projectId: id, workflowStage: "completed" } }),
      prisma.segment.count({ where: { projectId: id, workflowStage: "awaiting_approval" } }),
      prisma.segment.count({ where: { projectId: id, needsRecheck: true } }),
    ]);

    // (b) Per-member progress
    const assignments = await prisma.segmentAssignment.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    const memberProgress = await Promise.all(
      assignments.map(async (assignment) => {
        const member = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: id, userId: assignment.userId } },
          select: { color: true, role: true },
        });

        const hasRange = assignment.rangeStart != null && assignment.rangeEnd != null;
        const totalInRange = hasRange
          ? assignment.rangeEnd! - assignment.rangeStart! + 1
          : totalSegments;

        const rangeWhere = hasRange
          ? {
              projectId: id,
              position: { gte: assignment.rangeStart!, lte: assignment.rangeEnd! },
            }
          : { projectId: id };

        const [memberCompleted, memberConfirmed] = await Promise.all([
          prisma.segment.count({
            where: { ...rangeWhere, workflowStage: "completed" },
          }),
          prisma.segment.count({
            where: { ...rangeWhere, status: "confirmed" },
          }),
        ]);

        const percentDone = totalInRange > 0
          ? Math.round((memberCompleted / totalInRange) * 100)
          : 0;

        return {
          userId: assignment.userId,
          name: assignment.user.name,
          username: assignment.user.username,
          avatarUrl: assignment.user.avatarUrl,
          color: member?.color ?? "#a09090",
          role: member?.role ?? "translator",
          rangeStart: assignment.rangeStart,
          rangeEnd: assignment.rangeEnd,
          completedCount: memberCompleted,
          confirmedCount: memberConfirmed,
          totalInRange,
          percentDone,
        };
      }),
    );

    // (c) Online members (heartbeat within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30_000);
    const onlineMembers = await prisma.userPresence.findMany({
      where: {
        projectId: id,
        lastHeartbeat: { gte: thirtySecondsAgo },
      },
      select: {
        userId: true,
        currentSegmentPosition: true,
      },
    });

    // (d) Pending checkpoints
    const pendingCheckpoints = awaitingApprovalCount;

    // (e) Pending reviews: unresolved suggestions + post-its
    const [pendingSuggestions, pendingPostIts] = await Promise.all([
      prisma.suggestion.count({
        where: {
          segment: { projectId: id },
          status: "pending",
        },
      }),
      prisma.postIt.count({
        where: {
          segment: { projectId: id },
          resolved: false,
        },
      }),
    ]);

    return NextResponse.json({
      overallProgress: {
        total: totalSegments,
        byStage: {
          translating: translatingCount,
          reviewing: reviewingCount,
          proofreading: proofreadingCount,
          completed: completedCount,
          awaiting_approval: awaitingApprovalCount,
        },
        needsRecheck: needsRecheckCount,
      },
      memberProgress,
      onlineMembers,
      pendingCheckpoints,
      pendingReviews: pendingSuggestions + pendingPostIts,
    });
  } catch (err) {
    console.error("team-progress error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
