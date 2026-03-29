import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/glossary — list glossary terms for current user
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
      { sourceTerm: { contains: query, mode: "insensitive" as const } },
      { targetTerm: { contains: query, mode: "insensitive" as const } },
    ];
  }

  const terms = await prisma.glossaryTerm.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(terms);
}

// POST /api/glossary — add a glossary term
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { sourceTerm, targetTerm, srcLang, tgtLang, note } = await req.json();

    if (!sourceTerm || !targetTerm || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "sourceTerm, targetTerm, srcLang, and tgtLang are required" },
        { status: 400 },
      );
    }

    // Upsert: update if same source+lang pair exists
    const existing = await prisma.glossaryTerm.findFirst({
      where: {
        userId: user.id,
        sourceTerm,
        srcLang,
        tgtLang,
      },
    });

    if (existing) {
      const updated = await prisma.glossaryTerm.update({
        where: { id: existing.id },
        data: { targetTerm, note: note || "" },
      });
      return NextResponse.json(updated);
    }

    // Plan limit: glossary terms
    const { canAddGlossaryTerm } = await import("@/lib/plan-limits");
    const glossaryCheck = await canAddGlossaryTerm(user.id, user.plan);
    if (!glossaryCheck.allowed) {
      return NextResponse.json(
        { error: glossaryCheck.message },
        { status: 403 },
      );
    }

    const term = await prisma.glossaryTerm.create({
      data: {
        userId: user.id,
        sourceTerm,
        targetTerm,
        srcLang,
        tgtLang,
        note: note || "",
      },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (err) {
    console.error("Glossary creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/glossary — delete a glossary term
export async function DELETE(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
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

    const entry = await prisma.glossaryTerm.findFirst({
      where: { id, userId: user.id },
    });
    if (!entry) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    await prisma.glossaryTerm.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Glossary deletion error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
