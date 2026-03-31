import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[id]/duplicate — clone project
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { segments: { orderBy: { position: "asc" } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only owner or members can duplicate
    if (project.userId !== user!.id) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId: user!.id } },
      });
      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const clone = await prisma.project.create({
      data: {
        userId: user!.id,
        name: `${project.name} (copy)`,
        srcLang: project.srcLang,
        tgtLang: project.tgtLang,
        sourceFile: project.sourceFile,
        fileFormat: project.fileFormat,
        segments: {
          create: project.segments.map((seg) => ({
            position: seg.position,
            sourceText: seg.sourceText,
            targetText: "",
            status: "empty",
          })),
        },
      },
    });

    return NextResponse.json({ project: clone }, { status: 201 });
  } catch (err) {
    console.error("Duplicate project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
