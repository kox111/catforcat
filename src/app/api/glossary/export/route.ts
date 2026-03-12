import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/glossary/export?srcLang=xx&tgtLang=yy
 * Exports glossary as CSV with BOM for Excel compatibility.
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

  const terms = await prisma.glossaryTerm.findMany({
    where,
    orderBy: { sourceTerm: "asc" },
  });

  // CSV with UTF-8 BOM for Excel
  const BOM = "\uFEFF";
  const lines: string[] = [];
  lines.push("source_term,target_term,source_lang,target_lang,note");

  for (const t of terms) {
    lines.push(
      [
        csvEscape(t.sourceTerm),
        csvEscape(t.targetTerm),
        t.srcLang,
        t.tgtLang,
        csvEscape(t.note || ""),
      ].join(",")
    );
  }

  const content = BOM + lines.join("\n");
  const langSuffix = srcLang && tgtLang ? `_${srcLang}_${tgtLang}` : "";
  const fileName = `glossary${langSuffix}.csv`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
