import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canAddTMEntry } from "@/lib/plan-limits";

/**
 * POST /api/tm/import-aligned
 * Imports aligned text (source ||| target per line, or 2-column CSV) into TM.
 * Body: FormData with "file" (.txt or .csv), "srcLang", "tgtLang", optional "domain"
 */
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const srcLang = (formData.get("srcLang") as string) || "en";
  const tgtLang = (formData.get("tgtLang") as string) || "es";
  const domain = (formData.get("domain") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  const pairs: { source: string; target: string }[] = [];

  // Detect format: "source ||| target" or CSV (source,target / source\ttarget)
  const firstLine = lines[0] || "";
  const isTriplePipe = firstLine.includes("|||");
  const isTab = firstLine.includes("\t");

  for (const line of lines) {
    let source = "";
    let target = "";

    if (isTriplePipe) {
      const parts = line.split("|||");
      if (parts.length >= 2) {
        source = parts[0].trim();
        target = parts[1].trim();
      }
    } else if (isTab) {
      const parts = line.split("\t");
      if (parts.length >= 2) {
        source = parts[0].trim();
        target = parts[1].trim();
      }
    } else {
      // CSV: simple split by first comma (handle quoted fields)
      const match = line.match(/^"?([^"]*?)"?\s*,\s*"?([^"]*?)"?\s*$/);
      if (match) {
        source = match[1].trim();
        target = match[2].trim();
      } else {
        const parts = line.split(",");
        if (parts.length >= 2) {
          source = parts[0].trim();
          target = parts.slice(1).join(",").trim();
        }
      }
    }

    if (source && target) {
      pairs.push({ source, target });
    }
  }

  if (pairs.length === 0) {
    return NextResponse.json(
      {
        error:
          "No valid pairs found. Expected format: 'source ||| target' or CSV with 2 columns.",
      },
      { status: 400 },
    );
  }

  // Check plan limits
  const limitCheck = await canAddTMEntry(user.id, user.plan);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 403 });
  }

  // Deduplicate against existing TM
  const existing = await prisma.translationMemory.findMany({
    where: { userId: user.id, srcLang, tgtLang },
    select: { sourceText: true },
  });
  const existingSet = new Set(existing.map((e: { sourceText: string }) => e.sourceText.toLowerCase()));

  let imported = 0;
  let skipped = 0;

  for (const pair of pairs) {
    if (existingSet.has(pair.source.toLowerCase())) {
      skipped++;
      continue;
    }

    try {
      await prisma.translationMemory.create({
        data: {
          userId: user.id,
          sourceText: pair.source,
          targetText: pair.target,
          srcLang,
          tgtLang,
          domain,
        },
      });
      existingSet.add(pair.source.toLowerCase());
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    totalPairs: pairs.length,
  });
}
