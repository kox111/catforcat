import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import initSqlJs from "sql.js";

// POST /api/tm/import-sdltm — import Trados .sdltm file (SQLite database)
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 50MB limit
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const SQL = await initSqlJs();

    let db;
    try {
      db = new SQL.Database(new Uint8Array(buffer));
    } catch {
      return NextResponse.json(
        { error: "Invalid .sdltm file. Could not open as SQLite database." },
        { status: 400 },
      );
    }

    // Determine available tables
    const tablesResult = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    const tableNames =
      tablesResult.length > 0
        ? tablesResult[0].values.map((r) => String(r[0]).toLowerCase())
        : [];

    // SDLTM files contain a "translation_units" table with translation data
    // They also have "translation_memories" for TM metadata
    const entries: SDLTMEntry[] = [];
    const errors: string[] = [];

    if (tableNames.includes("translation_units")) {
      // Get column info to handle different SDLTM versions
      const colInfo = db.exec("PRAGMA table_info(translation_units)");
      const columnNames =
        colInfo.length > 0
          ? colInfo[0].values.map((r) => String(r[1]).toLowerCase())
          : [];

      // Common columns: source_segment, target_segment, source_language, target_language
      // Some versions use: source_hash, source_segment, target_segment
      const hasSourceSegment = columnNames.includes("source_segment");
      const hasTargetSegment = columnNames.includes("target_segment");

      if (!hasSourceSegment || !hasTargetSegment) {
        db.close();
        return NextResponse.json(
          {
            error:
              "Unsupported .sdltm format: missing source_segment or target_segment columns.",
          },
          { status: 400 },
        );
      }

      // Get TM-level language info from translation_memories table if available
      let tmSrcLang = "";
      let tmTgtLang = "";
      if (tableNames.includes("translation_memories")) {
        try {
          const tmInfo = db.exec(
            "SELECT source_language, target_language FROM translation_memories LIMIT 1",
          );
          if (tmInfo.length > 0 && tmInfo[0].values.length > 0) {
            tmSrcLang = normalizeLang(String(tmInfo[0].values[0][0] || ""));
            tmTgtLang = normalizeLang(String(tmInfo[0].values[0][1] || ""));
          }
        } catch {
          // Some SDLTM files may not have this table structure
        }
      }

      // Check if per-unit language columns exist
      const hasSourceLang = columnNames.includes("source_language");
      const hasTargetLang = columnNames.includes("target_language");

      // Build safe SELECT query with only known columns
      const selectCols = ["source_segment", "target_segment"];
      if (hasSourceLang) selectCols.push("source_language");
      if (hasTargetLang) selectCols.push("target_language");

      const query = `SELECT ${selectCols.join(", ")} FROM translation_units`;
      const results = db.exec(query);

      if (results.length > 0) {
        const cols = results[0].columns.map((c) => c.toLowerCase());
        const srcSegIdx = cols.indexOf("source_segment");
        const tgtSegIdx = cols.indexOf("target_segment");
        const srcLangIdx = cols.indexOf("source_language");
        const tgtLangIdx = cols.indexOf("target_language");

        for (const row of results[0].values) {
          try {
            const rawSource = String(row[srcSegIdx] || "");
            const rawTarget = String(row[tgtSegIdx] || "");

            // SDLTM segments may contain XML markup — strip tags
            const sourceText = stripXmlTags(rawSource).trim();
            const targetText = stripXmlTags(rawTarget).trim();

            if (!sourceText || !targetText) continue;

            // Language: per-unit > TM-level > skip
            const srcLang =
              srcLangIdx >= 0
                ? normalizeLang(String(row[srcLangIdx] || ""))
                : tmSrcLang;
            const tgtLang =
              tgtLangIdx >= 0
                ? normalizeLang(String(row[tgtLangIdx] || ""))
                : tmTgtLang;

            if (!srcLang || !tgtLang) {
              errors.push(
                `Skipped entry: missing language info for "${sourceText.substring(0, 40)}..."`,
              );
              continue;
            }

            entries.push({ sourceText, targetText, srcLang, tgtLang });
          } catch {
            errors.push("Skipped malformed row");
          }
        }
      }
    } else {
      db.close();
      return NextResponse.json(
        {
          error:
            "No translation_units table found. This may not be a valid .sdltm file.",
        },
        { status: 400 },
      );
    }

    db.close();

    if (entries.length === 0) {
      return NextResponse.json(
        {
          error: "No valid translation entries found in .sdltm file.",
          details: errors.slice(0, 10),
        },
        { status: 400 },
      );
    }

    // Deduplicate and import
    let imported = 0;
    let skipped = 0;

    for (const entry of entries) {
      const existing = await prisma.translationMemory.findFirst({
        where: {
          userId: user.id,
          sourceText: entry.sourceText,
          srcLang: entry.srcLang,
          tgtLang: entry.tgtLang,
        },
      });

      if (existing) {
        skipped++;
      } else {
        await prisma.translationMemory.create({
          data: {
            userId: user.id,
            sourceText: entry.sourceText,
            targetText: entry.targetText,
            srcLang: entry.srcLang,
            tgtLang: entry.tgtLang,
            usageCount: 1,
          },
        });
        imported++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      total: entries.length,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("SDLTM import error:", err);
    return NextResponse.json(
      { error: "Failed to parse .sdltm file" },
      { status: 400 },
    );
  }
}

// ── Types ──

interface SDLTMEntry {
  sourceText: string;
  targetText: string;
  srcLang: string;
  tgtLang: string;
}

// ── Helpers ──

function normalizeLang(lang: string): string {
  // "en-US" -> "en", "es-MX" -> "es", "EN" -> "en"
  // Trados may use culture codes like "en-US" or just "en"
  return lang.split(/[-_]/)[0].toLowerCase();
}

function stripXmlTags(str: string): string {
  // SDLTM segments contain SDL markup like <Elements>, <Text>, etc.
  // Extract only text content
  return str
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}
