import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/glossary/import — import CSV glossary file
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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let text = await file.text();
    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    const entries = parseCSV(text);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No valid entries found. CSV must have columns: source_term, target_term, source_lang, target_lang (optional: note)" },
        { status: 400 },
      );
    }

    // Upsert each entry (deduplicate by sourceTerm + srcLang + tgtLang)
    let imported = 0;
    let skipped = 0;

    for (const entry of entries) {
      const existing = await prisma.glossaryTerm.findFirst({
        where: {
          userId: user.id,
          sourceTerm: entry.sourceTerm,
          srcLang: entry.srcLang,
          tgtLang: entry.tgtLang,
        },
      });

      if (existing) {
        skipped++;
      } else {
        await prisma.glossaryTerm.create({
          data: {
            userId: user.id,
            sourceTerm: entry.sourceTerm,
            targetTerm: entry.targetTerm,
            srcLang: entry.srcLang,
            tgtLang: entry.tgtLang,
            note: entry.note || undefined,
          },
        });
        imported++;
      }
    }

    return NextResponse.json({ imported, skipped, total: entries.length });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "Failed to parse CSV file" }, { status: 400 });
  }
}

// ── CSV Parser ──

interface GlossaryEntry {
  sourceTerm: string;
  targetTerm: string;
  srcLang: string;
  tgtLang: string;
  note?: string;
}

function parseCSV(text: string): GlossaryEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return []; // Need header + at least 1 row

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  const srcTermIdx = header.findIndex((h) =>
    h === "source_term" || h === "sourceterm" || h === "source" || h === "term",
  );
  const tgtTermIdx = header.findIndex((h) =>
    h === "target_term" || h === "targetterm" || h === "target" || h === "translation",
  );
  const srcLangIdx = header.findIndex((h) =>
    h === "source_lang" || h === "sourcelang" || h === "srclang" || h === "src_lang",
  );
  const tgtLangIdx = header.findIndex((h) =>
    h === "target_lang" || h === "targetlang" || h === "tgtlang" || h === "tgt_lang",
  );
  const noteIdx = header.findIndex((h) => h === "note" || h === "notes" || h === "comment");

  if (srcTermIdx === -1 || tgtTermIdx === -1) {
    // Try positional: assume col0=source, col1=target, col2=srcLang, col3=tgtLang
    if (header.length >= 4) {
      return parsePositional(lines);
    }
    return [];
  }

  const entries: GlossaryEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const sourceTerm = cols[srcTermIdx]?.trim();
    const targetTerm = cols[tgtTermIdx]?.trim();
    const srcLang = srcLangIdx >= 0 ? cols[srcLangIdx]?.trim().toLowerCase() : "";
    const tgtLang = tgtLangIdx >= 0 ? cols[tgtLangIdx]?.trim().toLowerCase() : "";
    const note = noteIdx >= 0 ? cols[noteIdx]?.trim() : undefined;

    if (sourceTerm && targetTerm && srcLang && tgtLang) {
      entries.push({ sourceTerm, targetTerm, srcLang, tgtLang, note });
    }
  }

  return entries;
}

function parsePositional(lines: string[]): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 4) {
      const sourceTerm = cols[0]?.trim();
      const targetTerm = cols[1]?.trim();
      const srcLang = cols[2]?.trim().toLowerCase();
      const tgtLang = cols[3]?.trim().toLowerCase();
      const note = cols[4]?.trim();
      if (sourceTerm && targetTerm && srcLang && tgtLang) {
        entries.push({ sourceTerm, targetTerm, srcLang, tgtLang, note });
      }
    }
  }
  return entries;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
