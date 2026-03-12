import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const { segments } = (await req.json()) as { segments: SegmentUpdate[] };

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json(
        { error: "segments array is required" },
        { status: 400 }
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
        })
      )
    );

    return NextResponse.json({ updated: updates.length });
  } catch (error) {
    console.error("Segment update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
