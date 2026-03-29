import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/segments/merge — merge two consecutive segments
export async function POST(
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

  try {
    const { segmentId, nextSegmentId } = await req.json();

    if (!segmentId || !nextSegmentId) {
      return NextResponse.json(
        { error: "segmentId and nextSegmentId are required" },
        { status: 400 },
      );
    }

    const segA = await prisma.segment.findUnique({ where: { id: segmentId } });
    const segB = await prisma.segment.findUnique({
      where: { id: nextSegmentId },
    });

    if (!segA || !segB || segA.projectId !== id || segB.projectId !== id) {
      return NextResponse.json(
        { error: "Segments not found" },
        { status: 404 },
      );
    }

    // Ensure they are consecutive
    if (segB.position !== segA.position + 1) {
      return NextResponse.json(
        { error: "Segments must be consecutive" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Merge: update first segment with combined text
      await tx.segment.update({
        where: { id: segmentId },
        data: {
          sourceText: segA.sourceText + " " + segB.sourceText,
          targetText:
            segA.targetText && segB.targetText
              ? segA.targetText + " " + segB.targetText
              : segA.targetText || segB.targetText || "",
          status: "draft",
        },
      });

      // Delete second segment
      await tx.segment.delete({ where: { id: nextSegmentId } });

      // Shift positions down
      await tx.$executeRawUnsafe(
        `UPDATE segments SET position = position - 1 WHERE project_id = $1 AND position > $2`,
        id,
        segB.position,
      );
    });

    const allSegments = await prisma.segment.findMany({
      where: { projectId: id },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ segments: allSegments });
  } catch (error) {
    console.error("Merge segments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
