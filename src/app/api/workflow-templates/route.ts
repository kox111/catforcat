import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_STAGES = [
  "translator",
  "reviewer",
  "proofreader",
  "terminologist",
  "dtp",
] as const;

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  stages: z
    .array(z.enum(VALID_STAGES))
    .min(2, "At least 2 stages required")
    .max(6, "Maximum 6 stages allowed"),
});

// GET /api/workflow-templates — list default + user's custom templates
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const templates = await prisma.workflowTemplate.findMany({
      where: {
        OR: [{ isDefault: true }, { ownerId: user!.id }],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(templates);
  } catch (err) {
    console.error("Workflow templates list error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/workflow-templates — create a custom template
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, stages } = parsed.data;

    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        stages: JSON.stringify(stages),
        ownerId: user!.id,
        isDefault: false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("Workflow template creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
