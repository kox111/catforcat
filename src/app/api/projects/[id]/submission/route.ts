import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/submission — get submission for this project (if any)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const submission = await prisma.submission.findFirst({
      where: { projectId: id, studentId: user!.id },
      select: { id: true, status: true, assignmentId: true },
    });

    if (!submission) {
      return NextResponse.json({ submission: null });
    }

    return NextResponse.json({ submission });
  } catch (err) {
    console.error("Get project submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
