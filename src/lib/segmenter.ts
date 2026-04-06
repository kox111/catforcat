/**
 * CATforCAT — Segmentation Engine
 * Converts raw text into translatable segments (sentences).
 * Uses sentencex (Wikimedia Foundation) for sentence boundary detection.
 * 244 languages, abbreviation-aware, 0 dependencies.
 */

import { segment } from "sentencex";

/**
 * Main segmentation function.
 * Takes raw text and returns an array of segments (sentences).
 * Uses sentencex for accurate sentence boundary detection.
 */
export function segmentText(text: string, lang: string = "en"): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split on paragraph breaks first (double newline always splits)
  const paragraphs = text.split(/\n\s*\n/);

  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) continue;

    // Clean up internal whitespace (collapse multiple spaces/newlines into single space)
    const cleaned = trimmed.replace(/\s+/g, " ");

    // Use sentencex for sentence segmentation
    const sentences = segment(lang, cleaned);

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (s.length > 0) {
        segments.push(s);
      }
    }
  }

  return segments;
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
      keyPath: string = "",
    ): Array<{ key: string; value: string }> {
      const results: Array<{ key: string; value: string }> = [];

      if (typeof obj === "string") {
        results.push({ key: keyPath, value: obj });
      } else if (typeof obj === "number" || typeof obj === "boolean") {
        results.push({ key: keyPath, value: String(obj) });
      } else if (
        typeof obj === "object" &&
        obj !== null &&
        !Array.isArray(obj)
      ) {
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
 * Segment WebVTT subtitle content.
 * Similar to SRT but uses different timestamp format (00:00:00.000) and
 * starts with WEBVTT header.
 */
export function segmentVTT(content: string): RawSegment[] {
  const segments: RawSegment[] = [];

  // Remove WEBVTT header and NOTE blocks
  const cleaned = content
    .replace(/^WEBVTT[^\n]*\n/, "")
    .replace(/NOTE[^\n]*\n(?:(?!\n\n)[\s\S])*\n\n/g, "")
    .trim();

  const blocks = cleaned.split(/\n\s*\n/);
  let seqIndex = 1;

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Find the timestamp line (contains -->)
    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLineIdx = i;
        break;
      }
    }
    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx].trim();
    // Text is everything after the timestamp line
    const textLines = lines
      .slice(timeLineIdx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "") // Strip VTT formatting tags like <b>, <i>, <c.classname>
      .trim();

    if (textLines.length > 0) {
      segments.push({
        text: textLines,
        metadata: {
          fileFormat: "vtt",
          sequenceNumber: seqIndex,
          timestamps: timeLine,
          cueId: timeLineIdx > 0 ? lines[0].trim() : undefined,
        },
      });
      seqIndex++;
    }
  }

  return segments;
}

/**
 * Segment YAML i18n content.
 * Handles nested keys with dot notation (like JSON segmenter).
 * Common in Rails, Flutter, Hugo.
 */
export function segmentYAML(content: string): RawSegment[] {
  const segments: RawSegment[] = [];
  const lines = content.split("\n");
  const keyStack: { key: string; indent: number }[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;
    // Skip document markers
    if (/^---/.test(line) || /^\.\.\./.test(line)) continue;

    const match = line.match(/^(\s*)([\w\-.]+)\s*:\s*(.*)/);
    if (!match) continue;

    const indent = match[1].length;
    const key = match[2];
    const value = match[3].trim();

    // Pop stack to current indent level
    while (keyStack.length > 0 && keyStack[keyStack.length - 1].indent >= indent) {
      keyStack.pop();
    }

    if (value && value !== "|" && value !== ">" && !value.endsWith(":")) {
      // Leaf node with value — this is a translatable string
      const cleanValue = value
        .replace(/^["']|["']$/g, "") // Strip quotes
        .trim();

      if (cleanValue.length > 0) {
        const fullKey = [...keyStack.map((s) => s.key), key].join(".");
        segments.push({
          text: cleanValue,
          metadata: {
            fileFormat: "yaml",
            keyPath: fullKey,
          },
        });
      }
    }

    // Push to stack (even non-leaf nodes for path building)
    keyStack.push({ key, indent });
  }

  return segments;
}

/**
 * Export segments back to VTT format.
 */
export function exportToVTT(
  segments: {
    sourceText: string;
    targetText: string;
    metadata: Record<string, unknown>;
  }[],
): string {
  const lines: string[] = ["WEBVTT", ""];

  for (const seg of segments) {
    const meta = seg.metadata as Record<string, unknown>;
    const cueId = meta.cueId as string | undefined;
    const timestamps = meta.timestamps as string;
    const text = seg.targetText || seg.sourceText;

    if (cueId) lines.push(cueId);
    lines.push(timestamps);
    lines.push(text);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Export segments back to YAML format.
 */
export function exportToYAML(
  segments: {
    sourceText: string;
    targetText: string;
    metadata: Record<string, unknown>;
  }[],
): string {
  // Build nested object from dot-notation paths
  const root: Record<string, unknown> = {};

  for (const seg of segments) {
    const meta = seg.metadata as Record<string, unknown>;
    const keyPath = meta.keyPath as string;
    if (!keyPath) continue;

    const parts = keyPath.split(".");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = seg.targetText || seg.sourceText;
  }

  // Serialize to YAML manually (no dependency)
  function toYaml(obj: Record<string, unknown>, indent = 0): string {
    const prefix = "  ".repeat(indent);
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        lines.push(`${prefix}${key}:`);
        lines.push(toYaml(value as Record<string, unknown>, indent + 1));
      } else {
        const str = String(value);
        const needsQuotes = /[:#{}[\],&*?|>!%@`]/.test(str) || str === "";
        lines.push(`${prefix}${key}: ${needsQuotes ? `"${str.replace(/"/g, '\\"')}"` : str}`);
      }
    }
    return lines.join("\n");
  }

  return toYaml(root);
}

/**
 * Export segments back to JSON format.
 * Reconstructs the JSON structure using dot notation keys.
 */
export function exportToJSON(
  segments: {
    sourceText: string;
    targetText: string;
    metadata: Record<string, unknown>;
  }[],
  originalContent: string,
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
  segments: {
    sourceText: string;
    targetText: string;
    metadata: Record<string, unknown>;
  }[],
): string {
  const lines: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const metadata = seg.metadata as Record<string, unknown>;
    const seqNum = (metadata.sequenceNumber as number) || i + 1;
    const timestamps =
      (metadata.timestamps as string) || "00:00:00,000 --> 00:00:02,000";

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
  segments: {
    sourceText: string;
    targetText: string;
    metadata: Record<string, unknown>;
  }[],
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
  segments: {
    sourceText: string;
    targetText: string;
    metadata: Record<string, unknown>;
  }[],
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
