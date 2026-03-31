import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/suggestions — list all suggestions for project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id }, select: { userId: true } });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMember = project.userId === user!.id || await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user!.id } },
    });
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const suggestions = await prisma.suggestion.findMany({
      where: { segment: { projectId: id } },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        segment: { select: { id: true, position: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("List suggestions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
