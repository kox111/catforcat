import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/glossary/from-project
 * Extracts frequent term pairs from a completed project and adds them to the glossary.
 * Body: { projectId: string }
 * Returns: { imported: number, skipped: number, terms: { source: string, target: string }[] }
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

  const body = await req.json();
  const { projectId } = body;
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      segments: {
        where: { status: "confirmed" },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.segments.length === 0) {
    return NextResponse.json({ error: "No confirmed segments in project" }, { status: 400 });
  }

  // Extract frequent n-gram pairs from confirmed segments
  // Simple approach: find words/phrases that appear 2+ times in source, and their translations
  const STOPWORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "between",
    "through", "after", "before", "and", "but", "or", "not", "no", "if",
    "than", "that", "this", "it", "its", "they", "them", "their", "we",
    "our", "you", "your", "he", "she", "his", "her", "my", "me",
    "de", "el", "la", "los", "las", "un", "una", "del", "al", "en",
    "es", "por", "con", "para", "que", "se", "no", "lo", "le", "les",
    "y", "o", "pero", "como", "más", "su", "sus",
  ]);

  // Build word frequency from source texts
  const wordFreq = new Map<string, number>();
  for (const seg of project.segments) {
    const words = seg.sourceText.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const seen = new Set<string>();
    for (const w of words) {
      if (!seen.has(w)) {
        seen.add(w);
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      }
    }
  }

  // Get frequent source words (appear in 2+ segments)
  const frequentWords = Array.from(wordFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);

  // For each frequent word, find the most common translation
  const termPairs: { source: string; target: string }[] = [];
  for (const word of frequentWords) {
    const translations = new Map<string, number>();
    for (const seg of project.segments) {
      if (seg.sourceText.toLowerCase().includes(word)) {
        // Extract matching target words (simple heuristic: position-based)
        const targetWords = seg.targetText.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
        for (const tw of targetWords) {
          translations.set(tw, (translations.get(tw) || 0) + 1);
        }
      }
    }
    // Get most frequent non-source-word translation
    const sorted = Array.from(translations.entries())
      .filter(([tw]) => tw !== word)
      .sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      termPairs.push({ source: word, target: sorted[0][0] });
    }
  }

  // Check existing glossary terms to skip duplicates
  const existing = await prisma.glossaryTerm.findMany({
    where: {
      userId: user.id,
      srcLang: project.srcLang,
      tgtLang: project.tgtLang,
    },
    select: { sourceTerm: true },
  });
  const existingSet = new Set(existing.map((e) => e.sourceTerm.toLowerCase()));

  const toImport = termPairs.filter((p) => !existingSet.has(p.source));

  // Import new terms
  let imported = 0;
  for (const pair of toImport.slice(0, 30)) {
    try {
      await prisma.glossaryTerm.create({
        data: {
          userId: user.id,
          sourceTerm: pair.source,
          targetTerm: pair.target,
          srcLang: project.srcLang,
          tgtLang: project.tgtLang,
        },
      });
      imported++;
    } catch {
      // skip on error (e.g. unique constraint)
    }
  }

  return NextResponse.json({
    imported,
    skipped: termPairs.length - toImport.length,
    terms: toImport.slice(0, 30),
  });
}
