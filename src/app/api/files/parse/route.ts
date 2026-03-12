import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { segmentText } from "@/lib/segmenter";
import { prisma } from "@/lib/prisma";
import { canImportFormat } from "@/lib/plan-limits";

/**
 * POST /api/files/parse
 * Receives a file (multipart/form-data), extracts text, segments it.
 * Returns: { segments: Array<{ text, metadata }>, fileName, fileFormat }
 *
 * Supported: .txt, .docx, .pdf, .xlf, .xliff
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    // Plan limit: import format
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { plan: true },
    });
    const formatCheck = canImportFormat(user?.plan || "free", ext);
    if (!formatCheck.allowed) {
      return NextResponse.json({ error: formatCheck.message }, { status: 403 });
    }

    let extractedText = "";
    let fileFormat = ext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let paragraphs: { text: string; style?: string; index: number }[] = [];

    if (ext === "txt") {
      // TXT: read as UTF-8
      const buffer = Buffer.from(await file.arrayBuffer());
      extractedText = buffer.toString("utf-8");
      // Split into paragraphs by double newlines
      paragraphs = extractedText
        .split(/\n\n+/)
        .map((p, i) => ({ text: p.trim(), index: i }))
        .filter((p) => p.text.length > 0);
    } else if (ext === "docx") {
      // DOCX: extract with mammoth
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());

      // Extract text with style info
      const result = await mammoth.convertToHtml({ buffer });
      // Also get raw text for segmentation
      const rawResult = await mammoth.extractRawText({ buffer });
      extractedText = rawResult.value;

      // Parse HTML to get paragraphs with style info
      paragraphs = extractParagraphsFromHtml(result.value);
      fileFormat = "docx";
    } else if (ext === "pdf") {
      // PDF: extract with pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;

      // Post-process: join broken lines
      // Heuristic: if line doesn't end in sentence-ending punctuation
      // and next line doesn't start with uppercase → join them
      const lines = extractedText.split("\n");
      const joined: string[] = [];
      let current = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
          if (current.trim()) {
            joined.push(current.trim());
            current = "";
          }
          continue;
        }
        if (current === "") {
          current = trimmed;
        } else {
          // Check if current line ends with sentence punctuation
          const endsWithPunct = /[.!?:;]$/.test(current);
          const nextStartsUpper = /^[A-ZÁÉÍÓÚÑÜ]/.test(trimmed);

          if (endsWithPunct && nextStartsUpper) {
            joined.push(current.trim());
            current = trimmed;
          } else {
            current += " " + trimmed;
          }
        }
      }
      if (current.trim()) joined.push(current.trim());

      paragraphs = joined.map((text, i) => ({ text, index: i }));
      fileFormat = "pdf";
    } else if (ext === "xlf" || ext === "xliff") {
      // XLIFF: parse XML to extract source/target pairs
      const buffer = Buffer.from(await file.arrayBuffer());
      const xliffText = buffer.toString("utf-8");
      fileFormat = "xliff";

      const xliffResult = parseXLIFF(xliffText);

      // XLIFF returns pre-made segments with source+target
      return NextResponse.json({
        segments: xliffResult.segments,
        fileName,
        fileFormat,
        totalParagraphs: xliffResult.segments.length,
        totalSegments: xliffResult.segments.length,
        srcLang: xliffResult.srcLang,
        tgtLang: xliffResult.tgtLang,
        isXliff: true,
      });
    } else {
      return NextResponse.json(
        { error: `Unsupported file format: .${ext}. Supported: .txt, .docx, .pdf, .xlf` },
        { status: 400 }
      );
    }

    // Segment each paragraph
    const segments: { text: string; metadata: Record<string, unknown> }[] = [];

    for (const para of paragraphs) {
      const segmented = segmentText(para.text);
      for (const segText of segmented) {
        segments.push({
          text: segText,
          metadata: {
            paragraphIndex: para.index,
            style: para.style || "normal",
            fileFormat,
          },
        });
      }
    }

    return NextResponse.json({
      segments,
      fileName,
      fileFormat,
      totalParagraphs: paragraphs.length,
      totalSegments: segments.length,
    });
  } catch (error) {
    console.error("File parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse file. Please check the file format." },
      { status: 500 }
    );
  }
}

/**
 * Extract paragraphs from mammoth HTML output.
 * mammoth produces <p>, <h1>-<h6>, <li> etc.
 */
function extractParagraphsFromHtml(
  html: string
): { text: string; style: string; index: number }[] {
  const results: { text: string; style: string; index: number }[] = [];

  // Match block-level elements
  const blockRegex = /<(p|h[1-6]|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let index = 0;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    // Strip HTML tags to get plain text
    const text = match[2].replace(/<[^>]+>/g, "").trim();

    if (text.length === 0) continue;

    let style = "normal";
    if (tag.startsWith("h")) style = tag; // h1, h2, etc.
    else if (tag === "li") style = "list-item";
    else if (tag === "blockquote") style = "blockquote";

    results.push({ text, style, index: index++ });
  }

  // Fallback: if no block elements found, split by newlines
  if (results.length === 0 && html.trim().length > 0) {
    const plainText = html.replace(/<[^>]+>/g, "").trim();
    const paras = plainText.split(/\n\n+/).filter((p) => p.trim().length > 0);
    for (const p of paras) {
      results.push({ text: p.trim(), style: "normal", index: index++ });
    }
  }

  return results;
}

/**
 * Parse XLIFF 1.2 or 2.0 file.
 * Returns segments with source and optional target text.
 */
function parseXLIFF(xml: string): {
  segments: { text: string; targetText?: string; metadata: Record<string, unknown> }[];
  srcLang: string;
  tgtLang: string;
} {
  const segments: { text: string; targetText?: string; metadata: Record<string, unknown> }[] = [];

  // Try to extract source/target language from <file> element (XLIFF 1.2)
  let srcLang = "";
  let tgtLang = "";

  const fileMatch = xml.match(/<file[^>]*source-language="([^"]+)"[^>]*(?:target-language="([^"]+)")?/i);
  if (fileMatch) {
    srcLang = normalizeLangCode(fileMatch[1]);
    tgtLang = fileMatch[2] ? normalizeLangCode(fileMatch[2]) : "";
  }

  // Try XLIFF 2.0 format
  if (!srcLang) {
    const xliffMatch = xml.match(/<xliff[^>]*srcLang="([^"]+)"[^>]*(?:trgLang="([^"]+)")?/i);
    if (xliffMatch) {
      srcLang = normalizeLangCode(xliffMatch[1]);
      tgtLang = xliffMatch[2] ? normalizeLangCode(xliffMatch[2]) : "";
    }
  }

  // Extract <trans-unit> elements (XLIFF 1.2)
  const tuRegex = /<trans-unit[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/trans-unit>/gi;
  let match;
  let index = 0;

  while ((match = tuRegex.exec(xml)) !== null) {
    const id = match[1];
    const content = match[2];

    const sourceMatch = content.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const targetMatch = content.match(/<target[^>]*>([\s\S]*?)<\/target>/i);

    if (sourceMatch) {
      const sourceText = stripInlineTags(sourceMatch[1]).trim();
      const targetText = targetMatch ? stripInlineTags(targetMatch[1]).trim() : undefined;

      if (sourceText) {
        segments.push({
          text: sourceText,
          targetText: targetText || undefined,
          metadata: {
            paragraphIndex: index,
            style: "normal",
            fileFormat: "xliff",
            xliffId: id,
          },
        });
        index++;
      }
    }
  }

  // If no trans-unit found, try XLIFF 2.0 <unit>/<segment> structure
  if (segments.length === 0) {
    const unitRegex = /<segment[^>]*>([\s\S]*?)<\/segment>/gi;
    let segMatch;

    while ((segMatch = unitRegex.exec(xml)) !== null) {
      const content = segMatch[1];
      const sourceMatch = content.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const targetMatch = content.match(/<target[^>]*>([\s\S]*?)<\/target>/i);

      if (sourceMatch) {
        const sourceText = stripInlineTags(sourceMatch[1]).trim();
        const targetText = targetMatch ? stripInlineTags(targetMatch[1]).trim() : undefined;

        if (sourceText) {
          segments.push({
            text: sourceText,
            targetText: targetText || undefined,
            metadata: {
              paragraphIndex: index,
              style: "normal",
              fileFormat: "xliff",
            },
          });
          index++;
        }
      }
    }
  }

  return { segments, srcLang, tgtLang };
}

function normalizeLangCode(lang: string): string {
  return lang.split("-")[0].toLowerCase();
}

function stripInlineTags(text: string): string {
  // Remove XLIFF inline tags like <g>, <x/>, <bx/>, <ex/>, <ph>, etc.
  // but preserve their text content
  return text
    .replace(/<\/?(?:g|bpt|ept|ph|it|mrk)[^>]*>/gi, "")
    .replace(/<(?:x|bx|ex)[^>]*\/>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
