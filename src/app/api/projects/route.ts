import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { segmentText } from "@/lib/segmenter";
import { canCreateProject } from "@/lib/plan-limits";

// GET /api/projects — list all projects for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      segments: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Add progress info to each project
  const projectsWithProgress = projects.map((p) => {
    const total = p.segments.length;
    const confirmed = p.segments.filter((s) => s.status === "confirmed").length;
    return {
      id: p.id,
      name: p.name,
      srcLang: p.srcLang,
      tgtLang: p.tgtLang,
      sourceFile: p.sourceFile,
      fileFormat: p.fileFormat,
      status: p.status,
      privacyLevel: p.privacyLevel,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      totalSegments: total,
      confirmedSegments: confirmed,
      progress: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  });

  return NextResponse.json(projectsWithProgress);
}

// POST /api/projects — create a new project with text segmentation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Plan limit: active projects
    const projectCheck = await canCreateProject(user.id, user.plan);
    if (!projectCheck.allowed) {
      return NextResponse.json({ error: projectCheck.message }, { status: 403 });
    }

    const body = await req.json();
    const { name, srcLang, tgtLang } = body;

    if (!name || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "Name, source language, and target language are required" },
        { status: 400 }
      );
    }

    // Two modes:
    // 1. text: raw text → segment it
    // 2. parsedSegments: pre-parsed from file upload (array of { text, targetText?, metadata })
    let segmentData: { sourceText: string; targetText: string; status: string; metadata: string }[];

    if (body.parsedSegments && Array.isArray(body.parsedSegments)) {
      // Pre-parsed segments from file upload
      segmentData = body.parsedSegments.map(
        (s: { text: string; targetText?: string; metadata?: Record<string, unknown> }) => ({
          sourceText: s.text,
          targetText: s.targetText || "",
          status: s.targetText ? "draft" : "empty",
          metadata: JSON.stringify(s.metadata || {}),
        })
      );
    } else if (body.text) {
      // Raw text mode
      const segments = segmentText(body.text, srcLang);
      segmentData = segments.map((sourceText) => ({
        sourceText,
        targetText: "",
        status: "empty",
        metadata: JSON.stringify({ fileFormat: "txt" }),
      }));
    } else {
      return NextResponse.json(
        { error: "Either text or parsedSegments is required" },
        { status: 400 }
      );
    }

    if (segmentData.length === 0) {
      return NextResponse.json(
        { error: "No segments could be extracted" },
        { status: 400 }
      );
    }

    // Plan limit: segments per project
    const { getPlanLimits } = await import("@/lib/stripe");
    const limits = getPlanLimits(user.plan);
    if (limits.segmentsPerProject !== Infinity && segmentData.length > limits.segmentsPerProject) {
      return NextResponse.json(
        { error: `Free plan allows ${limits.segmentsPerProject} segments per project. This text has ${segmentData.length}. Upgrade to Pro for unlimited.` },
        { status: 403 }
      );
    }

    // Create project with segments in a transaction
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        srcLang,
        tgtLang,
        sourceFile: body.sourceFile || null,
        fileFormat: body.fileFormat || "txt",
        segments: {
          create: segmentData.map((seg, index) => ({
            position: index + 1,
            sourceText: seg.sourceText,
            targetText: seg.targetText,
            metadata: seg.metadata,
            status: seg.status,
          })),
        },
      },
      include: {
        segments: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        srcLang: project.srcLang,
        tgtLang: project.tgtLang,
        totalSegments: project.segments.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
