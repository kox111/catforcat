import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
  segmentText,
  segmentJSON,
  segmentSRT,
  segmentPO,
  segmentMarkdown,
  segmentVTT,
  segmentYAML,
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
  "xlf", "xliff", "sdlxliff", "mxliff", "json", "srt", "vtt", "po", "pot", "md", "yaml", "yml",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/** Rejoin paragraphs that were split mid-sentence (line doesn't end with sentence-ending punctuation) */
function rejoinPdfLines(paragraphs: string[]): string[] {
  if (paragraphs.length <= 1) return paragraphs;

  const result: string[] = [];
  let current = paragraphs[0];

  for (let i = 1; i < paragraphs.length; i++) {
    const trimmed = current.trim();
    // If current paragraph doesn't end with sentence-ending punctuation, join with next
    if (trimmed && !/[.!?:;]$/.test(trimmed)) {
      current = trimmed + " " + paragraphs[i];
    } else {
      if (trimmed) result.push(trimmed);
      current = paragraphs[i];
    }
  }
  if (current.trim()) result.push(current.trim());

  return result;
}

/** Build paragraphs from position-sorted PDF text items */
function buildParagraphs(items: { str: string; y: number; fontSize: number }[]): string[] {
  if (items.length === 0) return [];

  const paragraphs: string[] = [];
  let current = items[0].str;
  let prevY = items[0].y;
  let prevFontSize = items[0].fontSize;

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const yGap = Math.abs(prevY - item.y);
    const lineHeight = prevFontSize * 1.4;
    const fontChanged = Math.abs(item.fontSize - prevFontSize) > 1;

    // Large Y gap or font size change = new paragraph
    if (yGap > lineHeight * 2.2 || fontChanged) {
      if (current.trim()) paragraphs.push(current.trim());
      current = item.str;
    } else if (yGap > lineHeight * 0.5) {
      // Normal line break within paragraph — always join
      current += " " + item.str;
    } else {
      // Same line — concatenate with space if needed
      const needsSpace = current.length > 0 && !current.endsWith(" ") && !item.str.startsWith(" ");
      current += (needsSpace ? " " : "") + item.str;
    }

    prevY = item.y;
    prevFontSize = item.fontSize;
  }
  if (current.trim()) paragraphs.push(current.trim());

  return paragraphs;
}

export async function POST(req: NextRequest) {
  const { error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 413 },
      );
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 413 },
      );
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

    // ─── PDF (unpdf — layout-aware extraction via getDocumentProxy) ───
    } else if (ext === "pdf") {
      const { getDocumentProxy } = await import("unpdf");
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(data);

      // Collect text items with position data from all pages
      interface PdfTextItem {
        str: string;
        x: number;
        y: number;
        fontSize: number;
        page: number;
      }
      const allItems: PdfTextItem[][] = []; // grouped by page

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageItems: PdfTextItem[] = [];
        for (const item of content.items) {
          if ("str" in item && item.str.trim()) {
            pageItems.push({
              str: item.str,
              x: item.transform[4],
              y: item.transform[5],
              fontSize: Math.abs(item.transform[0]),
              page: p,
            });
          }
        }
        allItems.push(pageItems);
      }

      // Detect headers/footers: text appearing at same Y position on 3+ pages
      const yTextMap = new Map<string, { text: string; count: number }>();
      for (const pageItems of allItems) {
        const seen = new Set<string>();
        for (const item of pageItems) {
          const key = `${Math.round(item.y)}_${item.str.trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            const entry = yTextMap.get(key) || { text: item.str.trim(), count: 0 };
            entry.count++;
            yTextMap.set(key, entry);
          }
        }
      }
      const repeatedThreshold = Math.min(3, Math.ceil(pdf.numPages * 0.5));
      const headerFooterTexts = new Set<string>();
      for (const [, entry] of yTextMap) {
        if (entry.count >= repeatedThreshold && entry.text.length < 100) {
          headerFooterTexts.add(entry.text);
        }
      }

      // Detect page numbers: isolated short numbers at very top or bottom
      const isPageNumber = (str: string): boolean => /^\d{1,4}$/.test(str.trim());

      // Process each page: sort by Y (descending = top first), then X
      const allParagraphs: string[] = [];

      for (const pageItems of allItems) {
        // Filter out headers/footers and page numbers
        const filtered = pageItems.filter((item) => {
          if (headerFooterTexts.has(item.str.trim())) return false;
          if (isPageNumber(item.str)) return false;
          return true;
        });

        if (filtered.length === 0) continue;

        // Sort top-to-bottom (Y descending in PDF coords), then left-to-right
        filtered.sort((a, b) => b.y - a.y || a.x - b.x);

        // Detect columns: cluster X positions
        const xPositions = filtered.map((it) => Math.round(it.x));
        const xClusters: number[][] = [];
        const sortedX = [...new Set(xPositions)].sort((a, b) => a - b);
        let cluster: number[] = [];
        for (const xVal of sortedX) {
          if (cluster.length === 0 || xVal - cluster[cluster.length - 1] < 50) {
            cluster.push(xVal);
          } else {
            xClusters.push(cluster);
            cluster = [xVal];
          }
        }
        if (cluster.length > 0) xClusters.push(cluster);

        const isMultiColumn = xClusters.length >= 2;

        if (isMultiColumn) {
          // Process each column separately (left to right)
          for (const xCluster of xClusters) {
            const minX = Math.min(...xCluster) - 25;
            const maxX = Math.max(...xCluster) + 200;
            const colItems = filtered
              .filter((it) => it.x >= minX && it.x <= maxX)
              .sort((a, b) => b.y - a.y);
            const colText = rejoinPdfLines(buildParagraphs(colItems));
            allParagraphs.push(...colText);
          }
        } else {
          const pageText = rejoinPdfLines(buildParagraphs(filtered));
          allParagraphs.push(...pageText);
        }
      }

      paragraphs = allParagraphs.map((text, i) => ({ text, index: i }));
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

    // ─── VTT (WebVTT subtitles) ───
    } else if (ext === "vtt") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const vttText = buffer.toString("utf-8");
      fileFormat = "vtt";

      const rawSegments: RawSegment[] = segmentVTT(vttText);
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
    } else if (ext === "po" || ext === "pot") {
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

    // ─── YAML i18n ───
    } else if (ext === "yaml" || ext === "yml") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const yamlText = buffer.toString("utf-8");
      fileFormat = "yaml";

      const rawSegments: RawSegment[] = segmentYAML(yamlText);
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

    // ─── XLIFF / SDLXLIFF / MXLIFF ───
    } else if (ext === "xlf" || ext === "xliff" || ext === "sdlxliff" || ext === "mxliff") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const xliffText = buffer.toString("utf-8");
      fileFormat = ext === "sdlxliff" ? "sdlxliff" : ext === "mxliff" ? "mxliff" : "xliff";

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

    // Filter out garbage segments (single punctuation, single char, too short)
    const filtered = segments.filter((seg) => {
      const t = seg.text.trim();
      if (t.length < 2) return false;
      if (/^[.!?,;:\-–—…]+$/.test(t)) return false;
      return true;
    });

    return NextResponse.json({
      segments: filtered,
      fileName,
      fileFormat,
      totalParagraphs: paragraphs.length,
      totalSegments: filtered.length,
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
 * Parse XLIFF 1.2, XLIFF 2.0, SDLXLIFF, and MXLIFF files.
 * SDLXLIFF uses <seg-source> with <mrk mtype="seg"> for segmentation
 * and <sdl:seg-defs> for metadata (conf, origin, percent, locked).
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

  // Detect if SDLXLIFF (has SDL namespace)
  const isSdlXliff = xml.includes("sdl.com/FileTypes/SdlXliff");

  // Extract languages from <file> element
  const fileMatch = xml.match(
    /<file[^>]*source-language="([^"]+)"[^>]*(?:target-language="([^"]+)")?/i,
  );
  if (fileMatch) {
    srcLang = normalizeLangCode(fileMatch[1]);
    tgtLang = fileMatch[2] ? normalizeLangCode(fileMatch[2]) : "";
  }

  // Fallback: XLIFF 2.0 uses srcLang/trgLang on <xliff>
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
    const tuId = match[1];
    const content = match[2];

    // SDLXLIFF: extract segments from <seg-source> <mrk mtype="seg">
    const segSourceMatch = content.match(/<seg-source[^>]*>([\s\S]*?)<\/seg-source>/i);

    if (isSdlXliff && segSourceMatch) {
      // Parse <mrk mtype="seg" mid="N"> elements from seg-source
      const mrkRegex = /<mrk\s+mtype="seg"\s+mid="(\d+)"[^>]*>([\s\S]*?)<\/mrk>/gi;
      const targetContent = content.match(/<target[^>]*>([\s\S]*?)<\/target>/i);

      // Parse sdl:seg-defs for metadata
      const segDefsContent = content.match(/<sdl:seg-defs[^>]*>([\s\S]*?)<\/sdl:seg-defs>/i);
      const segMetaMap: Record<string, Record<string, string>> = {};
      if (segDefsContent) {
        const segRegex = /<sdl:seg\s+id="(\d+)"([^/]*?)(?:\/>|>[\s\S]*?<\/sdl:seg>)/gi;
        let segM;
        while ((segM = segRegex.exec(segDefsContent[1])) !== null) {
          const attrs: Record<string, string> = {};
          const attrStr = segM[2];
          const confM = attrStr.match(/conf="([^"]+)"/);
          const originM = attrStr.match(/origin="([^"]+)"/);
          const percentM = attrStr.match(/percent="([^"]+)"/);
          const lockedM = attrStr.match(/locked="([^"]+)"/);
          if (confM) attrs.conf = confM[1];
          if (originM) attrs.origin = originM[1];
          if (percentM) attrs.percent = percentM[1];
          if (lockedM) attrs.locked = lockedM[1];
          segMetaMap[segM[1]] = attrs;
        }
      }

      // Extract each <mrk> segment from seg-source
      let mrkMatch;
      while ((mrkMatch = mrkRegex.exec(segSourceMatch[1])) !== null) {
        const mid = mrkMatch[1];
        const sourceText = stripInlineTags(mrkMatch[2]).trim();
        if (!sourceText) continue;

        // Find matching target <mrk> with same mid
        let targetText: string | undefined;
        if (targetContent) {
          const tgtMrkRegex = new RegExp(
            `<mrk\\s+mtype="seg"\\s+mid="${mid}"[^>]*>([\\s\\S]*?)<\\/mrk>`,
            "i",
          );
          const tgtMrk = targetContent[1].match(tgtMrkRegex);
          if (tgtMrk) {
            targetText = stripInlineTags(tgtMrk[1]).trim() || undefined;
          }
        }

        // Get SDL metadata for this segment
        const sdlMeta = segMetaMap[mid] || {};

        segments.push({
          text: sourceText,
          targetText,
          metadata: {
            paragraphIndex: index,
            style: "normal",
            fileFormat: "sdlxliff",
            xliffId: tuId,
            segmentMid: mid,
            ...(sdlMeta.conf && { sdlConf: sdlMeta.conf }),
            ...(sdlMeta.origin && { sdlOrigin: sdlMeta.origin }),
            ...(sdlMeta.percent && { sdlPercent: parseInt(sdlMeta.percent, 10) }),
            ...(sdlMeta.locked === "true" && { locked: true }),
          },
        });
        index++;
      }
    } else {
      // Standard XLIFF: use <source> and <target>
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
              xliffId: tuId,
            },
          });
          index++;
        }
      }
    }
  }

  // Fallback: XLIFF 2.0 uses <segment> instead of <trans-unit>
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
