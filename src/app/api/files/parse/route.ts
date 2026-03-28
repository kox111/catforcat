import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
  segmentText,
  segmentJSON,
  segmentSRT,
  segmentPO,
  segmentMarkdown,
  type RawSegment,
} from "@/lib/segmenter";
/**
 * POST /api/files/parse
 * Receives a file (multipart/form-data), extracts text, segments it.
 * Returns: { segments: Array<{ text, metadata }>, fileName, fileFormat }
 *
 * Supported: .txt, .docx, .pdf, .csv, .html, .htm, .xlsx, .pptx, .xml,
 *            .xlf, .xliff, .json, .srt, .po, .md
 * All formats are available for both Free and Pro plans.
 */

const ACCEPTED_EXTENSIONS = new Set([
  "txt", "docx", "pdf", "csv", "html", "htm", "xlsx", "pptx", "xml",
  "xlf", "xliff", "json", "srt", "po", "md",
]);

export async function POST(req: NextRequest) {
  const { error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    if (!ACCEPTED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file format: .${ext}. Supported: ${[...ACCEPTED_EXTENSIONS].map(e => `.${e}`).join(", ")}`,
        },
        { status: 400 },
      );
    }

    let fileFormat = ext;
    let paragraphs: { text: string; style?: string; index: number }[] = [];

    // ─── TXT ───
    if (ext === "txt") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = buffer.toString("utf-8");
      paragraphs = text
        .split(/\n\n+/)
        .map((p, i) => ({ text: p.trim(), index: i }))
        .filter((p) => p.text.length > 0);

    // ─── DOCX ───
    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      paragraphs = extractParagraphsFromHtml(result.value);
      fileFormat = "docx";

    // ─── PDF (pdf-parse v2 API) ───
    } else if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      // pdf-parse v2 marks load/getText as private in types but they are public at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = parser as any;
      await p.load();
      const extractedText: string = p.getText();

      // Post-process: join broken lines from PDF extraction
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

    // ─── CSV ───
    } else if (ext === "csv") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const csvText = buffer.toString("utf-8");
      fileFormat = "csv";

      const segments = parseCSV(csvText);
      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── HTML / HTM ───
    } else if (ext === "html" || ext === "htm") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const htmlText = buffer.toString("utf-8");
      fileFormat = "html";

      // Strip script/style tags, then extract text from block elements
      const cleaned = htmlText
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "");

      paragraphs = extractParagraphsFromHtml(cleaned);

      // Fallback: if no block elements, strip all tags and split by newlines
      if (paragraphs.length === 0) {
        const plain = cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        paragraphs = plain
          .split(/\n\n+/)
          .map((p, i) => ({ text: p.trim(), index: i }))
          .filter((p) => p.text.length > 0);
      }

    // ─── XLSX ───
    } else if (ext === "xlsx") {
      const XLSX = await import("xlsx");
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer" });
      fileFormat = "xlsx";

      const segments: { text: string; metadata: Record<string, unknown> }[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        for (let r = 0; r < rows.length; r++) {
          for (let c = 0; c < rows[r].length; c++) {
            const cell = String(rows[r][c]).trim();
            if (cell.length > 0) {
              segments.push({
                text: cell,
                metadata: {
                  fileFormat: "xlsx",
                  sheet: sheetName,
                  row: r + 1,
                  col: c + 1,
                },
              });
            }
          }
        }
      }

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── PPTX ───
    } else if (ext === "pptx") {
      const XLSX = await import("xlsx");
      const buffer = Buffer.from(await file.arrayBuffer());
      fileFormat = "pptx";

      // xlsx can read PPTX as a workbook with sheets = slides
      // Each slide has text cells
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const segments: { text: string; metadata: Record<string, unknown> }[] = [];
        let slideIdx = 0;

        for (const sheetName of workbook.SheetNames) {
          slideIdx++;
          const sheet = workbook.Sheets[sheetName];
          const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          for (const row of rows) {
            for (const cell of row) {
              const text = String(cell).trim();
              if (text.length > 0) {
                segments.push({
                  text,
                  metadata: { fileFormat: "pptx", slide: slideIdx, slideTitle: sheetName },
                });
              }
            }
          }
        }

        if (segments.length > 0) {
          return NextResponse.json({
            segments,
            fileName,
            fileFormat,
            totalParagraphs: segments.length,
            totalSegments: segments.length,
            isStructured: true,
          });
        }
      } catch {
        // xlsx can't read this PPTX — fall through to ZIP text extraction
      }

      // Fallback: extract text from PPTX XML slides directly
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const segments: { text: string; metadata: Record<string, unknown> }[] = [];
      let slideNum = 0;

      const slideFiles = Object.keys(zip.files)
        .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
        .sort();

      for (const slideFile of slideFiles) {
        slideNum++;
        const content = await zip.files[slideFile].async("text");
        // Extract text from <a:t> tags
        const textParts: string[] = [];
        const tagRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;
        let m;
        while ((m = tagRegex.exec(content)) !== null) {
          const t = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
          if (t) textParts.push(t);
        }
        // Group text parts into segments (each paragraph-like block)
        if (textParts.length > 0) {
          // Try to group by <a:p> paragraphs
          const pRegex = /<a:p[^>]*>([\s\S]*?)<\/a:p>/gi;
          let pm;
          while ((pm = pRegex.exec(content)) !== null) {
            const pContent = pm[1];
            const innerTexts: string[] = [];
            const innerRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;
            let im;
            while ((im = innerRegex.exec(pContent)) !== null) {
              const t = im[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
              if (t) innerTexts.push(t);
            }
            const joined = innerTexts.join(" ").trim();
            if (joined) {
              segments.push({
                text: joined,
                metadata: { fileFormat: "pptx", slide: slideNum },
              });
            }
          }
        }
      }

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── XML (generic) ───
    } else if (ext === "xml") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const xmlText = buffer.toString("utf-8");
      fileFormat = "xml";

      // Extract all text content from XML elements
      const segments: { text: string; metadata: Record<string, unknown> }[] = [];
      // Remove XML declaration, processing instructions, CDATA wrappers
      const cleaned = xmlText
        .replace(/<\?[\s\S]*?\?>/g, "")
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

      // Extract text between tags
      const textRegex = />([^<]+)</g;
      let m;
      let idx = 0;
      while ((m = textRegex.exec(cleaned)) !== null) {
        const text = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();
        if (text.length > 0 && !/^\s+$/.test(text)) {
          segments.push({
            text,
            metadata: { fileFormat: "xml", index: idx++ },
          });
        }
      }

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── JSON ───
    } else if (ext === "json") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const jsonText = buffer.toString("utf-8");
      fileFormat = "json";

      const rawSegments: RawSegment[] = segmentJSON(jsonText);
      const segments = rawSegments.map((seg) => ({
        text: seg.text,
        metadata: seg.metadata,
      }));

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── SRT ───
    } else if (ext === "srt") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const srtText = buffer.toString("utf-8");
      fileFormat = "srt";

      const rawSegments: RawSegment[] = segmentSRT(srtText);
      const segments = rawSegments.map((seg) => ({
        text: seg.text,
        metadata: seg.metadata,
      }));

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── PO ───
    } else if (ext === "po") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const poText = buffer.toString("utf-8");
      fileFormat = "po";

      const rawSegments: RawSegment[] = segmentPO(poText);
      const segments = rawSegments.map((seg) => ({
        text: seg.text,
        targetText:
          (seg.metadata.targetText as string | undefined) || undefined,
        metadata: seg.metadata,
      }));

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── Markdown ───
    } else if (ext === "md") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mdText = buffer.toString("utf-8");
      fileFormat = "markdown";

      const rawSegments: RawSegment[] = segmentMarkdown(mdText);
      const segments = rawSegments.map((seg) => ({
        text: seg.text,
        metadata: seg.metadata,
      }));

      return NextResponse.json({
        segments,
        fileName,
        fileFormat,
        totalParagraphs: segments.length,
        totalSegments: segments.length,
        isStructured: true,
      });

    // ─── XLIFF ───
    } else if (ext === "xlf" || ext === "xliff") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const xliffText = buffer.toString("utf-8");
      fileFormat = "xliff";

      const xliffResult = parseXLIFF(xliffText);

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
    }

    // Segment each paragraph (for unstructured formats: txt, docx, pdf, html)
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
  } catch (err) {
    console.error("File parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse file. Please check the file format." },
      { status: 500 },
    );
  }
}

/**
 * Parse CSV: first column = source text, each row = 1 segment.
 * If there are 2+ columns, second column = pre-translation.
 */
function parseCSV(csvText: string): { text: string; targetText?: string; metadata: Record<string, unknown> }[] {
  const segments: { text: string; targetText?: string; metadata: Record<string, unknown> }[] = [];
  const lines = csvText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted fields)
    const fields = parseCSVLine(line);
    const source = fields[0]?.trim();
    const target = fields[1]?.trim();

    if (source && source.length > 0) {
      segments.push({
        text: source,
        targetText: target || undefined,
        metadata: { fileFormat: "csv", row: i + 1 },
      });
    }
  }

  return segments;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Extract paragraphs from HTML output.
 * Handles <p>, <h1>-<h6>, <li>, <blockquote>, <td>, <th>, <div>, <span> with text.
 */
function extractParagraphsFromHtml(
  html: string,
): { text: string; style: string; index: number }[] {
  const results: { text: string; style: string; index: number }[] = [];

  // Match block-level elements
  const blockRegex = /<(p|h[1-6]|li|blockquote|td|th|div|dt|dd|figcaption|caption)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let index = 0;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const text = match[2].replace(/<[^>]+>/g, "").trim();

    if (text.length === 0) continue;

    let style = "normal";
    if (tag.startsWith("h")) style = tag;
    else if (tag === "li") style = "list-item";
    else if (tag === "blockquote") style = "blockquote";
    else if (tag === "td" || tag === "th") style = "table-cell";

    results.push({ text, style, index: index++ });
  }

  // Fallback: if no block elements found, strip all tags
  if (results.length === 0 && html.trim().length > 0) {
    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const paras = plainText.split(/\n\n+/).filter((p) => p.trim().length > 0);
    for (const p of paras) {
      results.push({ text: p.trim(), style: "normal", index: index++ });
    }
  }

  return results;
}

/**
 * Parse XLIFF 1.2 or 2.0 file.
 */
function parseXLIFF(xml: string): {
  segments: {
    text: string;
    targetText?: string;
    metadata: Record<string, unknown>;
  }[];
  srcLang: string;
  tgtLang: string;
} {
  const segments: {
    text: string;
    targetText?: string;
    metadata: Record<string, unknown>;
  }[] = [];

  let srcLang = "";
  let tgtLang = "";

  const fileMatch = xml.match(
    /<file[^>]*source-language="([^"]+)"[^>]*(?:target-language="([^"]+)")?/i,
  );
  if (fileMatch) {
    srcLang = normalizeLangCode(fileMatch[1]);
    tgtLang = fileMatch[2] ? normalizeLangCode(fileMatch[2]) : "";
  }

  if (!srcLang) {
    const xliffMatch = xml.match(
      /<xliff[^>]*srcLang="([^"]+)"[^>]*(?:trgLang="([^"]+)")?/i,
    );
    if (xliffMatch) {
      srcLang = normalizeLangCode(xliffMatch[1]);
      tgtLang = xliffMatch[2] ? normalizeLangCode(xliffMatch[2]) : "";
    }
  }

  const tuRegex =
    /<trans-unit[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/trans-unit>/gi;
  let match;
  let index = 0;

  while ((match = tuRegex.exec(xml)) !== null) {
    const id = match[1];
    const content = match[2];
    const sourceMatch = content.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const targetMatch = content.match(/<target[^>]*>([\s\S]*?)<\/target>/i);

    if (sourceMatch) {
      const sourceText = stripInlineTags(sourceMatch[1]).trim();
      const targetText = targetMatch
        ? stripInlineTags(targetMatch[1]).trim()
        : undefined;

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

  if (segments.length === 0) {
    const unitRegex = /<segment[^>]*>([\s\S]*?)<\/segment>/gi;
    let segMatch;

    while ((segMatch = unitRegex.exec(xml)) !== null) {
      const content = segMatch[1];
      const sourceMatch = content.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const targetMatch = content.match(/<target[^>]*>([\s\S]*?)<\/target>/i);

      if (sourceMatch) {
        const sourceText = stripInlineTags(sourceMatch[1]).trim();
        const targetText = targetMatch
          ? stripInlineTags(targetMatch[1]).trim()
          : undefined;

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
  return text
    .replace(/<\/?(?:g|bpt|ept|ph|it|mrk)[^>]*>/gi, "")
    .replace(/<(?:x|bx|ex)[^>]*\/>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
