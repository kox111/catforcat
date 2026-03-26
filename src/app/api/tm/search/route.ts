import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { fuzzyMatch } from "@/lib/fuzzy-match";

// POST /api/tm/search — search TM for fuzzy matches
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { sourceText, srcLang, tgtLang, threshold = 50 } = await req.json();

    if (!sourceText || !srcLang || !tgtLang) {
      return NextResponse.json(
        { error: "sourceText, srcLang, and tgtLang are required" },
        { status: 400 },
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
      { status: 500 },
    );
  }
}
