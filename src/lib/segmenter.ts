/**
 * CATforCAT — Segmentation Engine
 * Converts raw text into translatable segments (sentences).
 * Based on simplified SRX rules per spec section 4.1.
 */

// Abbreviations by language that should NOT trigger sentence breaks
const ABBREVIATIONS: Record<string, string[]> = {
  en: [
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "Inc", "Ltd", "Corp",
    "etc", "vs", "approx", "dept", "est", "govt", "e.g", "i.e",
    "Fig", "No", "Vol", "pp", "ed", "Rev", "St", "Ave", "Blvd",
    "Gen", "Gov", "Sgt", "Cpl", "Pvt", "Capt", "Lt", "Col", "Maj",
    "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
  es: [
    "Sr", "Sra", "Srta", "Dr", "Dra", "Prof", "Lic", "Ing", "Arq",
    "Ud", "Uds", "pág", "núm", "etc", "aprox", "tel", "dept",
    "vol", "ed", "fig", "art", "cap",
  ],
};

// Placeholder character that won't appear in normal text
const PLACEHOLDER = "\u0000";

/**
 * Escape abbreviation dots so they don't trigger sentence splits.
 * "Dr. Smith" → "Dr\0 Smith" (dot replaced by placeholder)
 */
function protectAbbreviations(text: string, lang: string): string {
  const abbrevs = [
    ...(ABBREVIATIONS[lang] || []),
    ...(ABBREVIATIONS["en"] || []), // always include English as fallback
  ];
  // Remove duplicates
  const unique = [...new Set(abbrevs)];

  let result = text;
  for (const abbr of unique) {
    // Match abbreviation followed by a dot: "Dr." → "Dr\0"
    // Use word boundary before abbreviation
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(\\b${escaped})\\.`, "g");
    result = result.replace(regex, `$1${PLACEHOLDER}`);
  }
  return result;
}

/**
 * Protect decimal numbers: "3.14" should not split.
 */
function protectDecimals(text: string): string {
  return text.replace(/(\d)\.(\d)/g, `$1${PLACEHOLDER}$2`);
}

/**
 * Protect URLs: "https://example.com/page.html" should not split.
 */
function protectUrls(text: string): string {
  // Match http(s):// URLs and www. URLs
  // Don't capture trailing punctuation (.!?) that's likely sentence-ending
  return text.replace(
    /(https?:\/\/[^\s]+?|www\.[^\s]+?)(?=[.!?]\s|[.!?]$|\s|$)/g,
    (match) => match.replace(/\./g, PLACEHOLDER)
  );
}

/**
 * Protect email addresses: "user@domain.com" should not split.
 */
function protectEmails(text: string): string {
  return text.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match) => match.replace(/\./g, PLACEHOLDER)
  );
}

/**
 * Protect numbered lists: "1. Item" should not split if number is 1-2 digits.
 */
function protectNumberedLists(text: string): string {
  return text.replace(/^(\d{1,2})\./gm, `$1${PLACEHOLDER}`);
}

/**
 * Protect ellipsis: "..." should not split unless followed by space + uppercase.
 * We protect "..." always, then the split regex handles the space+uppercase case.
 */
function protectEllipsis(text: string): string {
  // Protect ellipsis NOT followed by space+uppercase (those are NOT break points)
  // Ellipsis followed by space+uppercase IS a break point, so don't protect those
  return text.replace(/\.\.\.(?!\s+[A-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇ])/g, `${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}`);
}

/**
 * Restore all placeholders back to dots.
 */
function restorePlaceholders(text: string): string {
  return text.replace(new RegExp(PLACEHOLDER, "g"), ".");
}

/**
 * Main segmentation function.
 * Takes raw text and returns an array of segments (sentences).
 */
export function segmentText(text: string, lang: string = "en"): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  let processed = text;

  // Step 1: Protect elements that contain dots but are NOT sentence boundaries
  processed = protectUrls(processed);
  processed = protectEmails(processed);
  processed = protectDecimals(processed);
  processed = protectNumberedLists(processed);
  processed = protectEllipsis(processed);
  processed = protectAbbreviations(processed, lang);

  // Step 2: Split on paragraph breaks first (double newline always splits)
  const paragraphs = processed.split(/\n\s*\n/);

  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue;

    // Step 3: Within each paragraph, split on sentence-ending punctuation
    // Pattern: sentence-ending punctuation (.!?) followed by whitespace and then
    // an uppercase letter (or end of string for the last segment)
    const sentenceParts = paragraph.split(
      /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇА-ЯÀ-Ÿ\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af])/
    );

    for (const part of sentenceParts) {
      const cleaned = part.replace(/\s+/g, " ").trim();
      if (cleaned.length > 0) {
        // Restore placeholders back to dots
        segments.push(restorePlaceholders(cleaned));
      }
    }
  }

  return segments;
}

/**
 * Get supported abbreviations for a language (for testing/debugging).
 */
export function getAbbreviations(lang: string): string[] {
  return ABBREVIATIONS[lang] || [];
}

/**
 * RawSegment interface for structured segment data.
 */
export interface RawSegment {
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * Segment JSON content (flat or nested).
 * Each key-value pair becomes a segment.
 * For nested objects, uses dot notation: {"menu": {"file": "Open"}} → key="menu.file"
 */
export function segmentJSON(content: string): RawSegment[] {
  const segments: RawSegment[] = [];

  try {
    const json = JSON.parse(content);

    // Recursively extract all leaf values
    function extractKeyValues(
      obj: unknown,
      keyPath: string = ""
    ): Array<{ key: string; value: string }> {
      const results: Array<{ key: string; value: string }> = [];

      if (typeof obj === "string") {
        results.push({ key: keyPath, value: obj });
      } else if (typeof obj === "number" || typeof obj === "boolean") {
        results.push({ key: keyPath, value: String(obj) });
      } else if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        const objRecord = obj as Record<string, unknown>;
        for (const [k, v] of Object.entries(objRecord)) {
          const newPath = keyPath ? `${keyPath}.${k}` : k;
          results.push(...extractKeyValues(v, newPath));
        }
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const newPath = `${keyPath}[${i}]`;
          results.push(...extractKeyValues(obj[i], newPath));
        }
      }

      return results;
    }

    const keyValues = extractKeyValues(json);

    for (const { key, value } of keyValues) {
      if (value.trim().length > 0) {
        segments.push({
          text: value,
          metadata: {
            fileFormat: "json",
            keyPath: key,
          },
        });
      }
    }
  } catch (error) {
    console.error("JSON parsing error:", error);
  }

  return segments;
}

/**
 * Segment SRT (SubRip) content.
 * Each subtitle block = 1 segment.
 * Format: number, timestamp, text lines, blank line
 */
export function segmentSRT(content: string): RawSegment[] {
  const segments: RawSegment[] = [];

  // Split by blank lines
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    // First line: sequence number
    const seqNum = lines[0].trim();
    if (!/^\d+$/.test(seqNum)) continue;

    // Second line: timestamps (00:00:00,000 --> 00:00:02,000)
    const timeLine = lines[1].trim();
    if (!timeLine.includes("-->")) continue;

    // Remaining lines: subtitle text
    const textLines = lines.slice(2).join(" ").trim();

    if (textLines.length > 0) {
      segments.push({
        text: textLines,
        metadata: {
          fileFormat: "srt",
          sequenceNumber: parseInt(seqNum, 10),
          timestamps: timeLine,
        },
      });
    }
  }

  return segments;
}

/**
 * Segment PO (gettext) content.
 * Each msgid = source text, msgstr = target text (if pre-translated).
 * Skip header (empty msgid).
 */
export function segmentPO(content: string): RawSegment[] {
  const segments: RawSegment[] = [];

  // Simple regex-based PO parser
  // Pattern: msgctxt (optional), msgid, msgstr
  const poRegex =
    /(?:^|\n)(?:msgctxt\s+"([^"]*)"\s*\n)?msgid\s+"([^"]*)"\s*\nmsgstr\s+"([^"]*)"/gm;

  let match;
  let index = 0;

  while ((match = poRegex.exec(content)) !== null) {
    const msgctxt = match[1] || "";
    const msgid = match[2];
    const msgstr = match[3];

    // Skip header (empty msgid)
    if (msgid === "") continue;

    // Unescape PO strings
    const unescapedMsgid = unescapePOString(msgid);

    if (unescapedMsgid.trim().length > 0) {
      segments.push({
        text: unescapedMsgid,
        metadata: {
          fileFormat: "po",
          index,
          msgctxt: msgctxt || undefined,
          targetText: msgstr ? unescapePOString(msgstr) : undefined,
        },
      });
      index++;
    }
  }

  return segments;
}

/**
 * Unescape a PO string (e.g., "Hello\\nWorld" → "Hello\nWorld").
 */
function unescapePOString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/**
 * Escape a PO string (e.g., "Hello\nWorld" → "Hello\\nWorld").
 */
function escapePOString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r");
}

/**
 * Segment Markdown content.
 * Split by paragraphs/headings.
 * Each paragraph or heading = 1 segment.
 * Preserve markdown formatting in text.
 */
export function segmentMarkdown(content: string): RawSegment[] {
  const segments: RawSegment[] = [];

  // Split by blank lines to get blocks
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length === 0) continue;

    // Detect block type
    let blockType = "paragraph";
    if (/^#{1,6}\s/.test(trimmed)) {
      const headingMatch = trimmed.match(/^(#{1,6})\s/);
      const level = headingMatch ? headingMatch[1].length : 1;
      blockType = `heading-${level}`;
    } else if (/^[\s\-*+]\s/.test(trimmed)) {
      blockType = "list";
    } else if (/^>\s/.test(trimmed)) {
      blockType = "blockquote";
    } else if (/^```/.test(trimmed)) {
      blockType = "code-block";
    }

    segments.push({
      text: trimmed,
      metadata: {
        fileFormat: "markdown",
        blockType,
      },
    });
  }

  return segments;
}

/**
 * Export segments back to JSON format.
 * Reconstructs the JSON structure using dot notation keys.
 */
export function exportToJSON(
  segments: { sourceText: string; targetText: string; metadata: Record<string, unknown> }[],
  originalContent: string
): string {
  // Try to parse original to preserve structure
  try {
    const original = JSON.parse(originalContent);
    const result = JSON.parse(JSON.stringify(original)); // Deep clone

    // Build a map of keyPath -> targetText
    const translations: Record<string, string> = {};
    for (const seg of segments) {
      const metadata = seg.metadata as Record<string, unknown>;
      const keyPath = metadata.keyPath as string;
      if (keyPath) {
        translations[keyPath] = seg.targetText;
      }
    }

    // Recursively update values
    function updateValues(obj: unknown, path: string = ""): void {
      if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        const objRecord = obj as Record<string, unknown>;
        for (const [k, v] of Object.entries(objRecord)) {
          const newPath = path ? `${path}.${k}` : k;
          if (translations[newPath]) {
            objRecord[k] = translations[newPath];
          } else {
            updateValues(v, newPath);
          }
        }
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const newPath = `${path}[${i}]`;
          if (translations[newPath]) {
            obj[i] = translations[newPath];
          } else {
            updateValues(obj[i], newPath);
          }
        }
      }
    }

    updateValues(result);
    return JSON.stringify(result, null, 2);
  } catch {
    // If original parsing fails, return empty object
    return "{}";
  }
}

/**
 * Export segments back to SRT format.
 */
export function exportToSRT(
  segments: { sourceText: string; targetText: string; metadata: Record<string, unknown> }[]
): string {
  const lines: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const metadata = seg.metadata as Record<string, unknown>;
    const seqNum = (metadata.sequenceNumber as number) || i + 1;
    const timestamps = (metadata.timestamps as string) || "00:00:00,000 --> 00:00:02,000";

    lines.push(String(seqNum));
    lines.push(timestamps);
    lines.push(seg.targetText || seg.sourceText);
    lines.push(""); // Blank line between blocks
  }

  return lines.join("\n");
}

/**
 * Export segments back to PO format.
 */
export function exportToPO(
  segments: { sourceText: string; targetText: string; metadata: Record<string, unknown> }[]
): string {
  const lines: string[] = [];

  // Add header
  lines.push('msgid ""');
  lines.push('msgstr ""');
  lines.push('"Content-Type: text/plain; charset=UTF-8\\n"');
  lines.push("");

  // Add segments
  for (const seg of segments) {
    const metadata = seg.metadata as Record<string, unknown>;
    const msgctxt = metadata.msgctxt as string | undefined;

    if (msgctxt) {
      lines.push(`msgctxt "${escapePOString(msgctxt)}"`);
    }

    lines.push(`msgid "${escapePOString(seg.sourceText)}"`);
    lines.push(`msgstr "${escapePOString(seg.targetText || "")}"`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Export segments back to Markdown format.
 */
export function exportToMarkdown(
  segments: { sourceText: string; targetText: string; metadata: Record<string, unknown> }[]
): string {
  const lines: string[] = [];

  for (const seg of segments) {
    const metadata = seg.metadata as Record<string, unknown>;
    const blockType = (metadata.blockType as string) || "paragraph";
    const text = seg.targetText || seg.sourceText;

    lines.push(text);
    lines.push(""); // Blank line between blocks
  }

  return lines.join("\n");
}
