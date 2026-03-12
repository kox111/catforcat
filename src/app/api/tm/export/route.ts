import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tm/export?srcLang=xx&tgtLang=yy
 * Exports Translation Memory as TMX (XML).
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

  const srcLang = req.nextUrl.searchParams.get("srcLang");
  const tgtLang = req.nextUrl.searchParams.get("tgtLang");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: user.id };
  if (srcLang) where.srcLang = srcLang;
  if (tgtLang) where.tgtLang = tgtLang;

  const entries = await prisma.translationMemory.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<tmx version="1.4">');
  lines.push(
    `  <header creationtool="TranslatePro" creationtoolversion="1.0" srclang="${srcLang || "*all*"}" datatype="plaintext" segtype="sentence" adminlang="en"/>`
  );
  lines.push("  <body>");

  for (const entry of entries) {
    lines.push("    <tu>");
    lines.push(
      `      <tuv xml:lang="${entry.srcLang}"><seg>${escapeXml(entry.sourceText)}</seg></tuv>`
    );
    lines.push(
      `      <tuv xml:lang="${entry.tgtLang}"><seg>${escapeXml(entry.targetText)}</seg></tuv>`
    );
    lines.push("    </tu>");
  }

  lines.push("  </body>");
  lines.push("</tmx>");

  const content = lines.join("\n");
  const langSuffix = srcLang && tgtLang ? `_${srcLang}_${tgtLang}` : "";
  const fileName = `translation_memory${langSuffix}.tmx`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
