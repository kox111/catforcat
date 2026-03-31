import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/segments/[segId]/post-its — create post-it
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ segId: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { segId } = await params;

    // Rate limit: 60/hour
    const rl = await checkRateLimit(`postits:${user!.id}`, 60, 3_600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many post-its" }, { status: 429 });
    }

    const segment = await prisma.segment.findUnique({
      where: { id: segId },
      include: { project: { select: { id: true, userId: true } } },
    });
    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Must be owner, professor, or reviewer
    const isOwner = segment.project.userId === user!.id;
    let hasRole = false;
    if (!isOwner) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: segment.projectId, userId: user!.id } },
      });
      hasRole = member?.role === "professor" || member?.role === "reviewer";
    }

    if (!isOwner && !hasRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { charStart, charEnd, content, severity } = await req.json();
    if (charStart == null || charEnd == null || !content) {
      return NextResponse.json({ error: "charStart, charEnd, content required" }, { status: 400 });
    }

    const postIt = await prisma.postIt.create({
      data: {
        segmentId: segId,
        authorId: user!.id,
        charStart,
        charEnd,
        content,
        severity: severity || "suggestion",
      },
    });

    return NextResponse.json({ postIt }, { status: 201 });
  } catch (err) {
    console.error("Create post-it error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
