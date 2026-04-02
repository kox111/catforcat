import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/glossary/import-tbx — import TBX (TermBase eXchange) glossary file
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 20MB limit
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 },
      );
    }

    let xml = await file.text();
    // Strip UTF-8 BOM if present
    if (xml.charCodeAt(0) === 0xfeff) {
      xml = xml.slice(1);
    }

    // SECURITY: Remove DOCTYPE declarations to prevent XXE attacks
    xml = xml.replace(/<!DOCTYPE[^>]*>/gi, "");

    const entries = parseTBX(xml);

    if (entries.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid term entries found in TBX file. Ensure the file contains <termEntry> elements with <langSet> and <term> children.",
        },
        { status: 400 },
      );
    }

    // Deduplicate and import
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
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
      } catch {
        errors.push(
          `Failed to import: "${entry.sourceTerm.substring(0, 40)}"`,
        );
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      total: entries.length,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("TBX import error:", err);
    return NextResponse.json(
      { error: "Failed to parse TBX file" },
      { status: 400 },
    );
  }
}

// ── Types ──

interface TBXEntry {
  sourceTerm: string;
  targetTerm: string;
  srcLang: string;
  tgtLang: string;
  note?: string;
}

// ── TBX Parser (regex-based, no eval/innerHTML) ──

function parseTBX(xml: string): TBXEntry[] {
  const entries: TBXEntry[] = [];

  // Extract all <termEntry> blocks
  const termEntryRegex = /<termEntry[^>]*>([\s\S]*?)<\/termEntry>/gi;
  let entryMatch: RegExpExecArray | null;

  while ((entryMatch = termEntryRegex.exec(xml)) !== null) {
    const entryBlock = entryMatch[1];

    // Extract all <langSet> blocks within this termEntry
    const langSets = extractLangSets(entryBlock);

    if (langSets.length < 2) continue; // Need at least source + target

    // Extract definition/note from termEntry level
    const note = extractDescrip(entryBlock);

    // First langSet = source, second = target
    const source = langSets[0];
    const target = langSets[1];

    if (source.term && target.term && source.lang && target.lang) {
      entries.push({
        sourceTerm: decodeXmlEntities(source.term),
        targetTerm: decodeXmlEntities(target.term),
        srcLang: normalizeLang(source.lang),
        tgtLang: normalizeLang(target.lang),
        note: note ? decodeXmlEntities(note) : undefined,
      });
    }

    // If there are more than 2 langSets, create pairs for each additional target
    for (let i = 2; i < langSets.length; i++) {
      const extra = langSets[i];
      if (source.term && extra.term && source.lang && extra.lang) {
        entries.push({
          sourceTerm: decodeXmlEntities(source.term),
          targetTerm: decodeXmlEntities(extra.term),
          srcLang: normalizeLang(source.lang),
          tgtLang: normalizeLang(extra.lang),
          note: note ? decodeXmlEntities(note) : undefined,
        });
      }
    }
  }

  return entries;
}

interface LangSetData {
  lang: string;
  term: string;
}

function extractLangSets(block: string): LangSetData[] {
  const results: LangSetData[] = [];
  const langSetRegex = /<langSet[^>]*xml:lang=["']([^"']+)["'][^>]*>([\s\S]*?)<\/langSet>/gi;
  let match: RegExpExecArray | null;

  while ((match = langSetRegex.exec(block)) !== null) {
    const lang = match[1];
    const langSetBody = match[2];

    // Extract term from <tig><term>...</term></tig> or <ntig>...<termGrp><term>...</term></termGrp>...</ntig>
    // or directly <term>...</term> within the langSet
    const term = extractTerm(langSetBody);

    if (term) {
      results.push({ lang, term });
    }
  }

  return results;
}

function extractTerm(langSetBody: string): string {
  // Try <tig><term>...</term></tig>
  const tigMatch = /<tig[^>]*>[\s\S]*?<term[^>]*>([\s\S]*?)<\/term>[\s\S]*?<\/tig>/i.exec(langSetBody);
  if (tigMatch) return tigMatch[1].trim();

  // Try <ntig>...<termGrp><term>...</term></termGrp>...</ntig>
  const ntigMatch = /<ntig[^>]*>[\s\S]*?<term[^>]*>([\s\S]*?)<\/term>[\s\S]*?<\/ntig>/i.exec(langSetBody);
  if (ntigMatch) return ntigMatch[1].trim();

  // Try bare <term>...</term> within langSet
  const bareMatch = /<term[^>]*>([\s\S]*?)<\/term>/i.exec(langSetBody);
  if (bareMatch) return bareMatch[1].trim();

  return "";
}

function extractDescrip(entryBlock: string): string {
  // Look for <descrip type="definition">...</descrip> or <note>...</note> at termEntry level
  // But NOT inside a <langSet> (to avoid picking up langSet-level notes)
  // We strip langSet blocks first, then search the remainder
  const withoutLangSets = entryBlock.replace(/<langSet[^>]*>[\s\S]*?<\/langSet>/gi, "");

  const descripMatch = /<descrip[^>]*>([\s\S]*?)<\/descrip>/i.exec(withoutLangSets);
  if (descripMatch) return descripMatch[1].trim();

  const noteMatch = /<note[^>]*>([\s\S]*?)<\/note>/i.exec(withoutLangSets);
  if (noteMatch) return noteMatch[1].trim();

  return "";
}

function normalizeLang(lang: string): string {
  // "en-US" -> "en", "es-MX" -> "es", "EN" -> "en"
  return lang.split(/[-_]/)[0].toLowerCase();
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}
