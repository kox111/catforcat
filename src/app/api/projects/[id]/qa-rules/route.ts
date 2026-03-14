import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/qa-rules — get all QA rules for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify the project belongs to this user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const rules = await prisma.qARule.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rules);
}

// POST /api/projects/[id]/qa-rules — create a new QA rule
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify the project belongs to this user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { type, wrong, correct, severity = "warning" } = body;

    if (!type || !wrong || !correct) {
      return NextResponse.json(
        { error: "Missing required fields: type, wrong, correct" },
        { status: 400 }
      );
    }

    if (!["wordlist", "regex"].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "wordlist" or "regex"' },
        { status: 400 }
      );
    }

    if (!["warning", "error"].includes(severity)) {
      return NextResponse.json(
        { error: 'Severity must be "warning" or "error"' },
        { status: 400 }
      );
    }

    // Validate regex if type is "regex"
    if (type === "regex") {
      try {
        new RegExp(wrong);
      } catch (e) {
        return NextResponse.json(
          { error: `Invalid regex pattern: ${(e as Error).message}` },
          { status: 400 }
        );
      }
    }

    const rule = await prisma.qARule.create({
      data: {
        projectId,
        type,
        wrong,
        correct,
        severity,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create QA rule" },
      { status: 500 }
    );
  }
}
