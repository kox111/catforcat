import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/segments/split — split a segment at cursor position
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const { segmentId, splitPosition } = await req.json();

    if (!segmentId || typeof splitPosition !== "number") {
      return NextResponse.json(
        { error: "segmentId and splitPosition are required" },
        { status: 400 }
      );
    }

    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });
    if (!segment || segment.projectId !== id) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const sourceA = segment.sourceText.slice(0, splitPosition).trim();
    const sourceB = segment.sourceText.slice(splitPosition).trim();

    if (!sourceA || !sourceB) {
      return NextResponse.json(
        { error: "Split would create an empty segment" },
        { status: 400 }
      );
    }

    // Transaction: update original + shift positions + create new segment
    const result = await prisma.$transaction(async (tx) => {
      // Shift all segments after this one up by 1
      await tx.$executeRawUnsafe(
        `UPDATE segments SET position = position + 1 WHERE project_id = ? AND position > ?`,
        id,
        segment.position
      );

      // Update original segment (first half)
      const updated = await tx.segment.update({
        where: { id: segmentId },
        data: {
          sourceText: sourceA,
          targetText: "", // Reset target since source changed
          status: "empty",
        },
      });

      // Create new segment (second half)
      const newSeg = await tx.segment.create({
        data: {
          projectId: id,
          position: segment.position + 1,
          sourceText: sourceB,
          targetText: "",
          status: "empty",
        },
      });

      return { updated, newSeg };
    });

    // Fetch all segments to return updated list
    const allSegments = await prisma.segment.findMany({
      where: { projectId: id },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ segments: allSegments });
  } catch (error) {
    console.error("Split segment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
