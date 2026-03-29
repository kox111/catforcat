import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tm/stats — TM statistics for the current user
 * Returns: total, byLangPair, mostUsed, mostRecent, byMonth
 */
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    // Total entries
    const total = await prisma.translationMemory.count({
      where: { userId: user.id },
    });

    // All entries for aggregation
    const allEntries = await prisma.translationMemory.findMany({
      where: { userId: user.id },
      select: {
        sourceText: true,
        targetText: true,
        srcLang: true,
        tgtLang: true,
        usageCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // By language pair
    const langPairMap = new Map<string, number>();
    for (const e of allEntries) {
      const pair = `${e.srcLang.toUpperCase()}→${e.tgtLang.toUpperCase()}`;
      langPairMap.set(pair, (langPairMap.get(pair) || 0) + 1);
    }
    const byLangPair = Array.from(langPairMap.entries())
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count);

    // Most used (top 5)
    const mostUsed = [...allEntries]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map((e) => ({
        sourceText:
          e.sourceText.length > 80
            ? e.sourceText.slice(0, 80) + "…"
            : e.sourceText,
        targetText:
          e.targetText.length > 80
            ? e.targetText.slice(0, 80) + "…"
            : e.targetText,
        usageCount: e.usageCount,
      }));

    // Most recent (top 5)
    const mostRecent = allEntries.slice(0, 5).map((e) => ({
      sourceText:
        e.sourceText.length > 80
          ? e.sourceText.slice(0, 80) + "…"
          : e.sourceText,
      targetText:
        e.targetText.length > 80
          ? e.targetText.slice(0, 80) + "…"
          : e.targetText,
      createdAt: e.createdAt.toISOString(),
    }));

    // Growth by month (last 12 months)
    const monthMap = new Map<string, number>();
    for (const e of allEntries) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    return NextResponse.json({
      total,
      byLangPair,
      mostUsed,
      mostRecent,
      byMonth,
    });
  } catch (error) {
    console.error("TM stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
