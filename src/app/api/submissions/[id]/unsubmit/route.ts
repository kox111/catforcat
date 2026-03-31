import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/submissions/[id]/unsubmit — student withdraws submission
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission || submission.studentId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "submitted") {
      return NextResponse.json(
        { error: "Can only unsubmit while status is 'submitted'" },
        { status: 400 },
      );
    }

    await prisma.submission.update({
      where: { id },
      data: { status: "in_progress", submittedAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unsubmit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
