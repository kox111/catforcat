import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/** Map workflow template role names to segment stage names */
const ROLE_TO_STAGE: Record<string, string> = {
  translator: "translating",
  reviewer: "reviewing",
  proofreader: "proofreading",
  dtp: "completing",
};

const DEFAULT_STAGES = ["translator", "reviewer"];

/**
 * PATCH /api/segments/[id]/confirm
 * Confirms a segment and advances it to the next workflow stage.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  // 1. Find segment with project, workflow template, assignments, and members
  const segment = await prisma.segment.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          workflowTemplate: true,
          segmentAssignments: true,
          members: true,
        },
      },
    },
  });

  if (!segment) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  const { project } = segment;

  // 2. Verify user is a project member
  const membership = project.members.find((m) => m.userId === user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  // 3. Verify segment is in user's assigned range (if assignment exists with range)
  const assignment = project.segmentAssignments.find(
    (a) => a.userId === user.id,
  );
  if (assignment && assignment.rangeStart !== null && assignment.rangeEnd !== null) {
    if (
      segment.position < assignment.rangeStart ||
      segment.position > assignment.rangeEnd
    ) {
      return NextResponse.json(
        { error: "Segment is outside your assigned range" },
        { status: 403 },
      );
    }
  }

  // 4. Get workflow stages from template or use defaults
  let stages: string[] = DEFAULT_STAGES;
  if (project.workflowTemplate?.stages) {
    try {
      const parsed = JSON.parse(project.workflowTemplate.stages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stages = parsed;
      }
    } catch {
      // Use defaults if JSON is invalid
    }
  }

  // 5. Map stages to stage names and find current position
  const stageNames = stages.map(
    (role) => ROLE_TO_STAGE[role] ?? role,
  );

  const currentStageIndex = stageNames.indexOf(segment.workflowStage);
  let nextStage: string;

  if (currentStageIndex === -1 || currentStageIndex >= stageNames.length - 1) {
    nextStage = "completed";
  } else {
    nextStage = stageNames[currentStageIndex + 1];
  }

  // 6. Check pipeline checkpoints — if position is a checkpoint, hold for approval
  let checkpoints: number[] = [];
  try {
    const parsed = JSON.parse(project.pipelineCheckpoints);
    if (Array.isArray(parsed)) {
      checkpoints = parsed;
    }
  } catch {
    // No checkpoints
  }

  if (checkpoints.includes(segment.position)) {
    nextStage = "awaiting_approval";
  }

  // 7. Update segment
  const updated = await prisma.segment.update({
    where: { id },
    data: {
      workflowStage: nextStage,
      confirmedBy: user.id,
      confirmedAt: new Date(),
      status: "confirmed",
    },
  });

  // 8. Create notifications for next-stage users (if not completed/awaiting)
  if (nextStage !== "completed" && nextStage !== "awaiting_approval") {
    // Find the role name for the next stage
    const nextRole = stages[currentStageIndex + 1];
    if (nextRole) {
      // Find project members with that role
      const nextStageMembers = project.members.filter(
        (m) => m.role === nextRole,
      );

      if (nextStageMembers.length > 0) {
        await prisma.notification.createMany({
          data: nextStageMembers.map((member) => ({
            userId: member.userId,
            type: "segments_ready",
            title: `Segment ${segment.position} ready for ${nextStage}`,
            body: `Segment ${segment.position} has been confirmed and is ready for your review.`,
            link: `/projects/${project.id}?segment=${segment.position}`,
          })),
        });
      }
    }
  }

  return NextResponse.json({ segment: updated });
}
