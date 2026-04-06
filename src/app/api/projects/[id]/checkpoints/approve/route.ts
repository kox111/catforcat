import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approveSchema = z.object({
  position: z.number().int().min(0),
});

const ROLE_TO_STAGE: Record<string, string> = {
  translator: "translating",
  reviewer: "reviewing",
  proofreader: "proofreading",
  dtp: "completing",
};

const DEFAULT_STAGES = ["translator", "reviewer"];

/**
 * POST /api/projects/[id]/checkpoints/approve
 *
 * PM approves a checkpoint at a given segment position.
 * All segments at that position with workflowStage "awaiting_approval"
 * advance to the next stage in the workflow pipeline.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id: projectId } = await params;

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "position is required and must be a non-negative integer" },
      { status: 400 },
    );
  }

  const { position } = parsed.data;

  // Verify user is a project member with role "owner" or "pm"
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });

  if (!membership || (membership.role !== "owner" && membership.role !== "pm")) {
    return NextResponse.json(
      { error: "Only the project owner or PM can approve checkpoints" },
      { status: 403 },
    );
  }

  // Load project with workflow template
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workflowTemplate: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  // Parse workflow stages from template
  let stages: string[] = DEFAULT_STAGES;
  if (project.workflowTemplate?.stages) {
    try {
      const parsed = JSON.parse(project.workflowTemplate.stages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stages = parsed;
      }
    } catch {
      // fallback to default
    }
  }

  // Build stage name list from roles: ["translating", "reviewing", ...]
  const stageNames = stages.map((role) => ROLE_TO_STAGE[role] ?? role);

  // Find segments at this position with workflowStage "awaiting_approval"
  const segments = await prisma.segment.findMany({
    where: {
      projectId,
      position,
      workflowStage: "awaiting_approval",
    },
  });

  if (segments.length === 0) {
    return NextResponse.json(
      { error: "No segments awaiting approval at this position" },
      { status: 404 },
    );
  }

  const updatedSegments = [];

  for (const segment of segments) {
    // Determine which stage the confirmer belonged to
    let confirmerRole: string | null = null;

    if (segment.confirmedBy) {
      const confirmerMembership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: segment.confirmedBy },
        },
      });
      if (confirmerMembership) {
        confirmerRole = confirmerMembership.role;
      }
    }

    // Map confirmer role to stage name
    const confirmerStageName = confirmerRole
      ? (ROLE_TO_STAGE[confirmerRole] ?? confirmerRole)
      : null;

    // Find index of the confirmer's stage
    let currentStageIndex = -1;
    if (confirmerStageName) {
      currentStageIndex = stageNames.indexOf(confirmerStageName);
    }

    // Determine next stage
    let nextStage: string;
    if (currentStageIndex >= 0 && currentStageIndex < stageNames.length - 1) {
      nextStage = stageNames[currentStageIndex + 1];
    } else {
      // Last stage or unknown -- mark as completed
      nextStage = "completed";
    }

    const updated = await prisma.segment.update({
      where: { id: segment.id },
      data: { workflowStage: nextStage },
    });

    updatedSegments.push(updated);

    // Find the role for the next stage and notify those members
    const nextRole = stages[currentStageIndex + 1];
    if (nextRole) {
      const nextMembers = await prisma.projectMember.findMany({
        where: { projectId, role: nextRole },
      });

      if (nextMembers.length > 0) {
        await prisma.notification.createMany({
          data: nextMembers.map((m) => ({
            userId: m.userId,
            type: "review",
            title: "Checkpoint approved",
            body: `Segment ${position} has been approved and is ready for ${nextStage}.`,
            link: `/projects/${projectId}`,
          })),
        });
      }
    }
  }

  return NextResponse.json({
    approved: updatedSegments.length,
    segments: updatedSegments,
  });
}
