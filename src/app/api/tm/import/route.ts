import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/tm/import — import TMX file
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const entries = parseTMX(text);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No valid entries found in TMX file" },
        { status: 400 },
      );
    }

    // Upsert each entry (deduplicate by sourceText + srcLang + tgtLang)
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

    return NextResponse.json({ imported, skipped, total: entries.length });
  } catch (err) {
    console.error("TMX import error:", err);
    return NextResponse.json(
      { error: "Failed to parse TMX file" },
      { status: 400 },
    );
  }
}

// ── TMX Parser ──

interface TMXEntry {
  sourceText: string;
  targetText: string;
  srcLang: string;
  tgtLang: string;
}

function parseTMX(xml: string): TMXEntry[] {
  const entries: TMXEntry[] = [];

  // Extract header srclang
  const headerMatch = xml.match(/<header[^>]*srclang="([^"]+)"/i);
  const defaultSrcLang = headerMatch ? normalizeLang(headerMatch[1]) : "";

  // Extract all <tu> elements
  const tuRegex = /<tu[^>]*>([\s\S]*?)<\/tu>/gi;
  let tuMatch;

  while ((tuMatch = tuRegex.exec(xml)) !== null) {
    const tuContent = tuMatch[1];

    // Extract all <tuv> elements within this <tu>
    const tuvRegex = /<tuv[^>]*xml:lang="([^"]+)"[^>]*>([\s\S]*?)<\/tuv>/gi;
    const tuvs: { lang: string; text: string }[] = [];
    let tuvMatch;

    while ((tuvMatch = tuvRegex.exec(tuContent)) !== null) {
      const lang = normalizeLang(tuvMatch[1]);
      const segContent = tuvMatch[2];

      // Extract text from <seg> tag
      const segMatch = segContent.match(/<seg>([\s\S]*?)<\/seg>/i);
      if (segMatch) {
        tuvs.push({ lang, text: unescapeXml(segMatch[1].trim()) });
      }
    }

    // Also try tuv with lang= (without xml: prefix)
    if (tuvs.length === 0) {
      const tuvRegex2 = /<tuv[^>]*lang="([^"]+)"[^>]*>([\s\S]*?)<\/tuv>/gi;
      let tuvMatch2;
      while ((tuvMatch2 = tuvRegex2.exec(tuContent)) !== null) {
        const lang = normalizeLang(tuvMatch2[1]);
        const segContent = tuvMatch2[2];
        const segMatch = segContent.match(/<seg>([\s\S]*?)<\/seg>/i);
        if (segMatch) {
          tuvs.push({ lang, text: unescapeXml(segMatch[1].trim()) });
        }
      }
    }

    // Need at least 2 tuvs to form a pair
    if (tuvs.length >= 2) {
      // First tuv = source, second = target (or use defaultSrcLang to determine)
      let srcTuv = tuvs[0];
      let tgtTuv = tuvs[1];

      if (defaultSrcLang) {
        const srcIdx = tuvs.findIndex((t) => t.lang === defaultSrcLang);
        if (srcIdx >= 0) {
          srcTuv = tuvs[srcIdx];
          tgtTuv = tuvs[srcIdx === 0 ? 1 : 0];
        }
      }

      if (srcTuv.text && tgtTuv.text) {
        entries.push({
          sourceText: srcTuv.text,
          targetText: tgtTuv.text,
          srcLang: srcTuv.lang,
          tgtLang: tgtTuv.lang,
        });
      }
    }
  }

  return entries;
}

function normalizeLang(lang: string): string {
  // "en-US" → "en", "es-MX" → "es", "EN" → "en"
  return lang.split("-")[0].toLowerCase();
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
