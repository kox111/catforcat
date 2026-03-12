import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fuzzyMatch } from "@/lib/fuzzy-match";

// POST /api/tm/search — search TM for fuzzy matches
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
    const { sourceText, srcLang, tgtLang, threshold = 50 } = await req.json();

    if (!sourceText || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "sourceText, srcLang, and tgtLang are required" },
        { status: 400 }
      );
    }

    // Get all TM entries for this user and language pair
    const tmEntries = await prisma.translationMemory.findMany({
      where: {
        userId: user.id,
        srcLang,
        tgtLang,
      },
    });

    // Run fuzzy matching
    const matches = fuzzyMatch(sourceText, tmEntries, threshold, 5);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("TM search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
