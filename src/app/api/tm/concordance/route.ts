import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/tm/concordance
 * Substring search across the entire TM.
 * Returns matches with the search term highlighted in context.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { query, srcLang, tgtLang, page = 1, pageSize = 10 } = await req.json();

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 },
    );
  }

  const where: Record<string, unknown> = { userId: user.id };
  if (srcLang) where.srcLang = srcLang;
  if (tgtLang) where.tgtLang = tgtLang;

  // Get all TM entries for this user (filtered by lang pair if provided)
  const allEntries = await prisma.translationMemory.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  // Substring search (case-insensitive) in both source and target
  const queryLower = query.trim().toLowerCase();
  const matches = allEntries.filter(
    (e: { sourceText: string; targetText: string }) =>
      e.sourceText.toLowerCase().includes(queryLower) ||
      e.targetText.toLowerCase().includes(queryLower),
  );

  const total = matches.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paginated = matches.slice(offset, offset + pageSize);

  return NextResponse.json({
    results: paginated.map((e: { id: string; sourceText: string; targetText: string; srcLang: string; tgtLang: string; usageCount: number }) => ({
      id: e.id,
      sourceText: e.sourceText,
      targetText: e.targetText,
      srcLang: e.srcLang,
      tgtLang: e.tgtLang,
      usageCount: e.usageCount,
    })),
    total,
    page,
    totalPages,
  });
}
