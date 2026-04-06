import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/presence — heartbeat: update current segment position
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id: projectId } = await params;
    const body = await req.json();
    const { segmentPosition } = body as { segmentPosition: number };

    if (typeof segmentPosition !== "number") {
      return NextResponse.json(
        { error: "segmentPosition is required and must be a number" },
        { status: 400 },
      );
    }

    await prisma.userPresence.upsert({
      where: { projectId_userId: { projectId, userId: user!.id } },
      update: { currentSegmentPosition: segmentPosition, lastHeartbeat: new Date() },
      create: { projectId, userId: user!.id, currentSegmentPosition: segmentPosition, lastHeartbeat: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Presence heartbeat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/projects/[id]/presence — get all active presences (last 30s)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id: projectId } = await params;

    const thirtySecondsAgo = new Date(Date.now() - 30_000);

    const presences = await prisma.userPresence.findMany({
      where: {
        projectId,
        lastHeartbeat: { gte: thirtySecondsAgo },
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    // Get member info (color + role) for each present user
    const userIds = presences.map((p) => p.userId);
    const members = await prisma.projectMember.findMany({
      where: { projectId, userId: { in: userIds } },
      select: { userId: true, color: true, role: true },
    });

    const memberMap = new Map(members.map((m) => [m.userId, m]));

    const result = presences.map((p) => {
      const member = memberMap.get(p.userId);
      return {
        userId: p.user.id,
        name: p.user.name,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl,
        color: member?.color ?? "#a09090",
        role: member?.role ?? "translator",
        currentSegmentPosition: p.currentSegmentPosition,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Get presences error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
