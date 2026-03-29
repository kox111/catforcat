import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/projects/[id]/start-review
 *
 * Start review mode for a project:
 * 1. Change project.status to "review"
 * 2. For all segments with non-empty targetText, copy targetText → previousTargetText
 * 3. Return the updated project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  // Verify project ownership
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

  try {
    const body = await req.json();
    const { reviewerId } = body;

    if (!reviewerId) {
      return NextResponse.json(
        { error: "reviewerId is required" },
        { status: 400 },
      );
    }

    if (reviewerId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: you can only assign yourself as reviewer" },
        { status: 403 },
      );
    }

    // Update project status to "review"
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "review",
      },
    });

    // For all segments with non-empty targetText, copy targetText → previousTargetText
    const segmentsToUpdate = project.segments.filter(
      (seg: { id: string; targetText: string }) => seg.targetText && seg.targetText.trim() !== "",
    );

    if (segmentsToUpdate.length > 0) {
      await prisma.$transaction(
        segmentsToUpdate.map((seg: { id: string; targetText: string }) =>
          prisma.segment.update({
            where: { id: seg.id },
            data: {
              previousTargetText: seg.targetText,
            },
          }),
        ),
      );
    }

    // Fetch the updated project with segments
    const projectWithSegments = await prisma.project.findUnique({
      where: { id },
      include: {
        segments: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ project: projectWithSegments });
  } catch (error) {
    console.error("Start review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
