import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/glossary/check
 * Given a source text and lang pair, returns all glossary terms found in the text.
 * Used by the editor's glossary panel to highlight terms.
 */
export async function POST(req: NextRequest) {
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

  try {
    const { sourceText, srcLang, tgtLang } = await req.json();

    if (!sourceText || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "sourceText, srcLang, and tgtLang are required" },
        { status: 400 }
      );
    }

    // Get all glossary terms for this user + lang pair
    const terms = await prisma.glossaryTerm.findMany({
      where: {
        userId: user.id,
        srcLang,
        tgtLang,
      },
    });

    // Find which terms appear in the source text (case-insensitive)
    const sourceLower = sourceText.toLowerCase();
    const found = terms.filter((term) =>
      sourceLower.includes(term.sourceTerm.toLowerCase())
    );

    return NextResponse.json(found);
  } catch (error) {
    console.error("Glossary check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
