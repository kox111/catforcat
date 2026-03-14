import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/segments/[segId]
 * Update a single segment's target text (draft save).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ segId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { segId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify ownership through project
  const segment = await prisma.segment.findUnique({
    where: { id: segId },
    include: { project: { select: { userId: true } } },
  });

  if (!segment || segment.project.userId !== user.id) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  const body = await req.json();
  const { targetText, isDraft } = body;

  if (typeof targetText !== "string") {
    return NextResponse.json({ error: "targetText is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { targetText };

  // If isDraft is true, don't change the status (save without confirming)
  if (!isDraft) {
    updateData.status = targetText.trim() === "" ? "empty" : "draft";
  }

  const updated = await prisma.segment.update({
    where: { id: segId },
    data: updateData,
  });

  return NextResponse.json({ segment: updated });
}
