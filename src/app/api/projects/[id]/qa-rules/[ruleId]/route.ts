import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PUT /api/projects/[id]/qa-rules/[ruleId] — update a QA rule
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id: projectId, ruleId } = await params;

  // Verify the project belongs to this user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify the rule belongs to this project
  const existingRule = await prisma.qARule.findFirst({
    where: { id: ruleId, projectId },
  });
  if (!existingRule) {
    return NextResponse.json({ error: "QA rule not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { wrong, correct, severity, enabled } = body;

    const updateData: Record<string, unknown> = {};

    if (wrong !== undefined) {
      updateData.wrong = wrong;
    }
    if (correct !== undefined) {
      updateData.correct = correct;
    }
    if (severity !== undefined) {
      if (!["warning", "error"].includes(severity)) {
        return NextResponse.json(
          { error: 'Severity must be "warning" or "error"' },
          { status: 400 },
        );
      }
      updateData.severity = severity;
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled;
    }

    // Validate regex if wrong is being updated and rule type is "regex"
    if (wrong !== undefined && existingRule.type === "regex") {
      try {
        new RegExp(wrong);
      } catch (e) {
        return NextResponse.json(
          { error: `Invalid regex pattern: ${(e as Error).message}` },
          { status: 400 },
        );
      }
    }

    const updatedRule = await prisma.qARule.update({
      where: { id: ruleId },
      data: updateData,
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update QA rule" },
      { status: 500 },
    );
  }
}

// DELETE /api/projects/[id]/qa-rules/[ruleId] — delete a QA rule
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id: projectId, ruleId } = await params;

  // Verify the project belongs to this user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify the rule belongs to this project
  const existingRule = await prisma.qARule.findFirst({
    where: { id: ruleId, projectId },
  });
  if (!existingRule) {
    return NextResponse.json({ error: "QA rule not found" }, { status: 404 });
  }

  try {
    await prisma.qARule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete QA rule" },
      { status: 500 },
    );
  }
}
