import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/workflow-templates/[id] — delete a custom template (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default templates" },
        { status: 403 },
      );
    }

    if (template.ownerId !== user!.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this template" },
        { status: 403 },
      );
    }

    // Check if any project is using this template
    const projectsUsingTemplate = await prisma.project.count({
      where: { workflowTemplateId: id },
    });

    if (projectsUsingTemplate > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${projectsUsingTemplate} project(s) are using this template`,
        },
        { status: 409 },
      );
    }

    await prisma.workflowTemplate.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Workflow template deletion error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
