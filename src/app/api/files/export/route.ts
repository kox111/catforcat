import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import {
  exportToJSON,
  exportToSRT,
  exportToPO,
  exportToMarkdown,
} from "@/lib/segmenter";
/**
 * GET /api/files/export?projectId=xxx&format=txt-bilingual|txt-target|docx|tmx
 *
 * Exports project data in the requested format.
 * All formats are available for both Free and Pro plans.
 */
export async function GET(req: NextRequest) {
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

  const projectId = req.nextUrl.searchParams.get("projectId");
  const format = req.nextUrl.searchParams.get("format");

  if (!projectId || !format) {
    return NextResponse.json(
      { error: "projectId and format are required" },
      { status: 400 }
    );
  }

  // Get project with segments
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      segments: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    switch (format) {
      case "txt-bilingual":
        return exportTxtBilingual(project);
      case "txt-target":
        return exportTxtTarget(project);
      case "docx":
        return exportDocx(project);
      case "tmx":
        return exportTmx(project);
      case "xliff":
        return exportXliff(project);
      case "html-bilingual":
        return exportHtmlBilingual(project);
      case "json":
        return exportJsonFormat(project);
      case "srt":
        return exportSrtFormat(project);
      case "po":
        return exportPoFormat(project);
      case "markdown":
        return exportMarkdownFormat(project);
      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export file" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// TXT Bilingüe: source + target lado a lado
// ─────────────────────────────────────────────
interface ProjectWithSegments {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  segments: {
    position: number;
    sourceText: string;
    targetText: string;
    status: string;
  }[];
}

function exportTxtBilingual(project: ProjectWithSegments) {
  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  lines.push(`# ${project.srcLang.toUpperCase()} → ${project.tgtLang.toUpperCase()}`);
  lines.push(`# Exported from CATforCAT`);
  lines.push("");

  for (const seg of project.segments) {
    const statusMark =
      seg.status === "confirmed" ? "✓" : seg.status === "draft" ? "~" : "○";
    lines.push(`[${statusMark}] #${seg.position}`);
    lines.push(`SRC: ${seg.sourceText}`);
    lines.push(`TGT: ${seg.targetText || "(empty)"}`);
    lines.push("");
  }

  const content = lines.join("\n");
  const fileName = `${sanitizeFileName(project.name)}_bilingual.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// TXT Solo Target: texto traducido concatenado
// ─────────────────────────────────────────────
function exportTxtTarget(project: ProjectWithSegments) {
  const paragraphs: string[] = [];
  let currentParagraphIndex = -1;
  let currentText = "";

  for (const seg of project.segments) {
    const text = seg.targetText || seg.sourceText; // fallback to source if empty
    let meta: { paragraphIndex?: number; style?: string } = {};
    try {
      // metadata is stored as JSON string in the DB
      const rawMeta = (seg as unknown as { metadata?: string }).metadata;
      if (rawMeta) meta = JSON.parse(rawMeta);
    } catch {
      // ignore parse errors
    }

    const paraIdx = meta.paragraphIndex ?? seg.position;

    if (paraIdx !== currentParagraphIndex && currentText) {
      paragraphs.push(currentText);
      currentText = "";
    }

    currentParagraphIndex = paraIdx;

    if (currentText) {
      currentText += " " + text;
    } else {
      currentText = text;
    }
  }

  if (currentText) paragraphs.push(currentText);

  const content = paragraphs.join("\n\n");
  const fileName = `${sanitizeFileName(project.name)}_${project.tgtLang}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// DOCX traducido: documento con estilos básicos
// ─────────────────────────────────────────────
async function exportDocx(project: ProjectWithSegments) {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: project.name,
          bold: true,
          size: 32,
          font: "Calibri",
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Subtitle with language pair
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Translated: ${project.srcLang.toUpperCase()} → ${project.tgtLang.toUpperCase()}`,
          size: 20,
          color: "888888",
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Group segments by paragraphIndex and apply styles
  let currentParagraphIndex = -1;
  let currentTexts: string[] = [];
  let currentStyle = "normal";

  const flushParagraph = () => {
    if (currentTexts.length === 0) return;
    const text = currentTexts.join(" ");

    let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined;
    if (currentStyle === "h1") heading = HeadingLevel.HEADING_1;
    else if (currentStyle === "h2") heading = HeadingLevel.HEADING_2;
    else if (currentStyle === "h3") heading = HeadingLevel.HEADING_3;
    else if (currentStyle === "h4") heading = HeadingLevel.HEADING_4;

    const isList = currentStyle === "list-item";

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: isList ? `• ${text}` : text,
            size: heading ? undefined : 22,
            font: "Calibri",
          }),
        ],
        heading,
        spacing: { after: 120 },
      })
    );

    currentTexts = [];
  };

  for (const seg of project.segments) {
    const text = seg.targetText || seg.sourceText;
    let meta: { paragraphIndex?: number; style?: string } = {};
    try {
      const rawMeta = (seg as unknown as { metadata?: string }).metadata;
      if (rawMeta) meta = JSON.parse(rawMeta);
    } catch {
      // ignore
    }

    const paraIdx = meta.paragraphIndex ?? seg.position;
    const style = meta.style || "normal";

    if (paraIdx !== currentParagraphIndex) {
      flushParagraph();
      currentParagraphIndex = paraIdx;
      currentStyle = style;
    }

    currentTexts.push(text);
  }
  flushParagraph();

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);
  const fileName = `${sanitizeFileName(project.name)}_${project.tgtLang}.docx`;

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// TMX: Translation Memory eXchange format
// ─────────────────────────────────────────────
function exportTmx(project: ProjectWithSegments) {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<tmx version="1.4">');
  lines.push(
    `  <header creationtool="CATforCAT" creationtoolversion="1.0" srclang="${project.srcLang}" datatype="plaintext" segtype="sentence" adminlang="en"/>`
  );
  lines.push("  <body>");

  for (const seg of project.segments) {
    if (!seg.targetText) continue; // skip empty translations

    lines.push("    <tu>");
    lines.push(
      `      <tuv xml:lang="${project.srcLang}"><seg>${escapeXml(seg.sourceText)}</seg></tuv>`
    );
    lines.push(
      `      <tuv xml:lang="${project.tgtLang}"><seg>${escapeXml(seg.targetText)}</seg></tuv>`
    );
    lines.push("    </tu>");
  }

  lines.push("  </body>");
  lines.push("</tmx>");

  const content = lines.join("\n");
  const fileName = `${sanitizeFileName(project.name)}.tmx`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// XLIFF: XLIFF 1.2 format
// ─────────────────────────────────────────────
function exportXliff(project: ProjectWithSegments) {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">');
  lines.push(
    `  <file source-language="${project.srcLang}" target-language="${project.tgtLang}" datatype="plaintext" original="${escapeXml(project.name)}">`
  );
  lines.push("    <body>");

  for (const seg of project.segments) {
    const state = seg.status === "confirmed"
      ? ' state="final"'
      : seg.targetText
      ? ' state="needs-review-translation"'
      : ' state="new"';

    lines.push(`      <trans-unit id="${seg.position}">`);
    lines.push(`        <source>${escapeXml(seg.sourceText)}</source>`);
    lines.push(`        <target${state}>${escapeXml(seg.targetText || "")}</target>`);
    lines.push("      </trans-unit>");
  }

  lines.push("    </body>");
  lines.push("  </file>");
  lines.push("</xliff>");

  const content = lines.join("\n");
  const fileName = `${sanitizeFileName(project.name)}.xlf`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/xliff+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ\s_-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─────────────────────────────────────────────
// JSON Format Export
// ─────────────────────────────────────────────
function exportJsonFormat(project: ProjectWithSegments) {
  const segments = project.segments.map((seg) => ({
    sourceText: seg.sourceText,
    targetText: seg.targetText || "",
    metadata: seg.status === "confirmed" ? { status: "confirmed" } : {},
  }));

  // Build a simple flat JSON structure with translations
  const result: Record<string, string> = {};
  for (let i = 0; i < segments.length; i++) {
    result[`segment_${i + 1}`] = segments[i].targetText || segments[i].sourceText;
  }

  const content = JSON.stringify(result, null, 2);
  const fileName = `${sanitizeFileName(project.name)}_${project.tgtLang}.json`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// SRT Format Export
// ─────────────────────────────────────────────
function exportSrtFormat(project: ProjectWithSegments) {
  const segments = project.segments.map((seg) => ({
    sourceText: seg.sourceText,
    targetText: seg.targetText || "",
    metadata: { sequenceNumber: seg.position, timestamps: "00:00:00,000 --> 00:00:02,000" },
  }));

  const content = exportToSRT(segments);
  const fileName = `${sanitizeFileName(project.name)}_${project.tgtLang}.srt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// PO Format Export
// ─────────────────────────────────────────────
function exportPoFormat(project: ProjectWithSegments) {
  const segments = project.segments.map((seg) => ({
    sourceText: seg.sourceText,
    targetText: seg.targetText || "",
    metadata: {},
  }));

  const content = exportToPO(segments);
  const fileName = `${sanitizeFileName(project.name)}_${project.tgtLang}.po`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// Markdown Format Export
// ─────────────────────────────────────────────
function exportMarkdownFormat(project: ProjectWithSegments) {
  const lines: string[] = [];

  // Add title and metadata
  lines.push(`# ${project.name}`);
  lines.push(`Translation: ${project.srcLang.toUpperCase()} → ${project.tgtLang.toUpperCase()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Add segments
  for (let i = 0; i < project.segments.length; i++) {
    const seg = project.segments[i];
    const text = seg.targetText || seg.sourceText;
    const statusBadge =
      seg.status === "confirmed"
        ? "✓"
        : seg.status === "draft"
          ? "~"
          : "○";

    lines.push(`## Segment ${i + 1} [${statusBadge}]`);
    lines.push(text);
    lines.push("");
  }

  const content = lines.join("\n");
  const fileName = `${sanitizeFileName(project.name)}_${project.tgtLang}.md`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// ─────────────────────────────────────────────
// G2: HTML Bilingual: side-by-side table
// ─────────────────────────────────────────────
function exportHtmlBilingual(project: ProjectWithSegments) {
  const rows = project.segments.map((seg) => {
    const statusColor =
      seg.status === "confirmed" ? "#10b981" : seg.status === "draft" ? "#f59e0b" : "#9ca3af";
    const statusLabel =
      seg.status === "confirmed" ? "✓" : seg.status === "draft" ? "~" : "○";
    return `<tr>
      <td style="text-align:center;color:${statusColor};width:30px;padding:6px 4px;border:1px solid #ddd;">${seg.position}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;background:#f9fafb;">${escapeXml(seg.sourceText)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;">${escapeXml(seg.targetText || "(empty)")}</td>
      <td style="text-align:center;width:30px;padding:6px 4px;border:1px solid #ddd;color:${statusColor};">${statusLabel}</td>
    </tr>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(project.name)} — Bilingual Export</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 20px; color: #1a1d23; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f3f4f6; padding: 8px 12px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${escapeXml(project.name)}</h1>
  <p class="meta">${project.srcLang.toUpperCase()} → ${project.tgtLang.toUpperCase()} — Exported from CATforCAT</p>
  <table>
    <thead>
      <tr>
        <th style="width:30px;text-align:center;">#</th>
        <th>Source</th>
        <th>Target</th>
        <th style="width:30px;text-align:center;">St</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  const fileName = `${sanitizeFileName(project.name)}_bilingual.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
