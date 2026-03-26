import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/tm — list all TM entries for current user
export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const srcLang = searchParams.get("srcLang");
  const tgtLang = searchParams.get("tgtLang");
  const query = searchParams.get("q");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: user.id };
  if (srcLang) where.srcLang = srcLang;
  if (tgtLang) where.tgtLang = tgtLang;
  if (query) {
    where.OR = [
      { sourceText: { contains: query } },
      { targetText: { contains: query } },
    ];
  }

  const entries = await prisma.translationMemory.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json(entries);
}

// POST /api/tm — add entry to TM (called when confirming a segment)
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { sourceText, targetText, srcLang, tgtLang } = await req.json();

    if (!sourceText || !targetText || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "sourceText, targetText, srcLang, and tgtLang are required" },
        { status: 400 },
      );
    }

    // Plan limit: TM entries (only check for new entries, not updates)
    const existing = await prisma.translationMemory.findFirst({
      where: {
        userId: user.id,
        sourceText,
        srcLang,
        tgtLang,
      },
    });

    if (existing) {
      // Update target and increment usage count
      const updated = await prisma.translationMemory.update({
        where: { id: existing.id },
        data: {
          targetText,
          usageCount: existing.usageCount + 1,
        },
      });
      return NextResponse.json(updated);
    }

    // Plan limit: TM entries (only for new, not updates)
    const { canAddTMEntry } = await import("@/lib/plan-limits");
    const tmCheck = await canAddTMEntry(user.id, user.plan);
    if (!tmCheck.allowed) {
      // Silently skip — don't block confirm workflow
      return NextResponse.json({ skipped: true, message: tmCheck.message });
    }

    // Create new TM entry
    const entry = await prisma.translationMemory.create({
      data: {
        userId: user.id,
        sourceText,
        targetText,
        srcLang,
        tgtLang,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("TM creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/tm — delete a TM entry
export async function DELETE(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    // Support both query param and JSON body
    let id = req.nextUrl.searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no body
      }
    }
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const entry = await prisma.translationMemory.findFirst({
      where: { id, userId: user.id },
    });
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.translationMemory.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("TM deletion error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
