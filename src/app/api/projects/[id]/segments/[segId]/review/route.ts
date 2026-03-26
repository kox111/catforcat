import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/projects/[id]/segments/[segId]/review
 *
 * Review a segment translation:
 * - action: "accept" | "reject"
 *
 * If accept:
 *   - Set reviewStatus = "accepted"
 *   - Set reviewedBy = userId
 *   - Set reviewedAt = now()
 *
 * If reject:
 *   - Revert targetText = previousTargetText
 *   - Set reviewStatus = "rejected"
 *   - Set reviewedBy = userId
 *   - Set reviewedAt = now()
 *
 * Returns the updated segment
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; segId: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id: projectId, segId } = await params;

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify segment belongs to project
  const segment = await prisma.segment.findFirst({
    where: { id: segId, projectId },
  });
  if (!segment) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (!action || (action !== "accept" && action !== "reject")) {
      return NextResponse.json(
        { error: "action must be 'accept' or 'reject'" },
        { status: 400 },
      );
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      reviewStatus: action === "accept" ? "accepted" : "rejected",
      reviewedBy: user.id,
      reviewedAt: now,
    };

    // If reject, revert targetText to previousTargetText
    if (action === "reject") {
      if (!segment.previousTargetText) {
        return NextResponse.json(
          { error: "Cannot reject: no previous target text to restore" },
          { status: 400 },
        );
      }
      updateData.targetText = segment.previousTargetText;
    }

    const updatedSegment = await prisma.segment.update({
      where: { id: segId },
      data: updateData,
    });

    return NextResponse.json({ segment: updatedSegment });
  } catch (error) {
    console.error("Segment review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
