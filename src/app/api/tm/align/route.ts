import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/tm/align — Align source + target texts and add to TM
 *
 * Accepts: { sourceLines: string[], targetLines: string[], srcLang, tgtLang, domain? }
 * Simple sentence alignment: pair by index (1:1 mapping).
 * Skips empty lines and mismatched counts (trims to shortest).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { sourceLines, targetLines, srcLang, tgtLang, domain } = await req.json();

    if (!sourceLines || !targetLines || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "sourceLines, targetLines, srcLang, and tgtLang are required" },
        { status: 400 }
      );
    }

    // Filter out empty lines and align by index
    const srcFiltered: string[] = sourceLines.filter((l: string) => l.trim());
    const tgtFiltered: string[] = targetLines.filter((l: string) => l.trim());
    const count = Math.min(srcFiltered.length, tgtFiltered.length);

    if (count === 0) {
      return NextResponse.json({ error: "No valid sentence pairs found" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    // Check plan limits
    const { canAddTMEntry } = await import("@/lib/plan-limits");

    for (let i = 0; i < count; i++) {
      const sourceText = srcFiltered[i].trim();
      const targetText = tgtFiltered[i].trim();

      if (!sourceText || !targetText) {
        skipped++;
        continue;
      }

      // Check if already exists
      const existing = await prisma.translationMemory.findFirst({
        where: {
          userId: user.id,
          sourceText,
          srcLang,
          tgtLang,
        },
      });

      if (existing) {
        // Update target and increment usage
        await prisma.translationMemory.update({
          where: { id: existing.id },
          data: { targetText, usageCount: existing.usageCount + 1 },
        });
        skipped++;
        continue;
      }

      // Check plan limit
      const check = await canAddTMEntry(user.id, user.plan);
      if (!check.allowed) {
        return NextResponse.json({
          imported,
          skipped,
          stopped: true,
          message: check.message,
          totalPairs: count,
        });
      }

      await prisma.translationMemory.create({
        data: {
          userId: user.id,
          sourceText,
          targetText,
          srcLang,
          tgtLang,
          domain: domain || null,
        },
      });
      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      totalPairs: count,
      mismatch: srcFiltered.length !== tgtFiltered.length
        ? `Source had ${srcFiltered.length} lines, target had ${tgtFiltered.length}. Used first ${count} pairs.`
        : undefined,
    });
  } catch (error) {
    console.error("TM alignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
