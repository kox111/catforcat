/**
 * CATforCAT — Fuzzy Matching Engine
 * Calculates similarity between translation memory entries and source segments.
 * Based on Levenshtein distance per spec section 4.2.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * Uses Wagner-Fischer algorithm with O(min(m,n)) space.
 */
export function levenshteinDistance(a: string, b: string): number {
  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) [a, b] = [b, a];

  const m = a.length;
  const n = b.length;

  // Previous and current rows
  let prev = new Array(m + 1);
  let curr = new Array(m + 1);

  // Initialize first row
  for (let i = 0; i <= m; i++) prev[i] = i;

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      if (a[i - 1] === b[j - 1]) {
        curr[i] = prev[i - 1];
      } else {
        curr[i] = 1 + Math.min(prev[i - 1], prev[i], curr[i - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }

  return prev[m];
}

/**
 * Normalize text for comparison:
 * - lowercase
 * - trim
 * - collapse whitespace
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

export interface TMEntry {
  id: string;
  sourceText: string;
  targetText: string;
  srcLang: string;
  tgtLang: string;
  domain?: string | null;
  usageCount: number;
  createdAt: Date | string;
}

export interface TMMatch {
  id: string;
  sourceText: string;
  targetText: string;
  score: number; // 0-100
  domain?: string | null;
  usageCount: number;
  createdAt: Date | string;
}

/**
 * Find fuzzy matches in Translation Memory for a given source segment.
 *
 * Algorithm:
 * 1. Normalize both texts (lowercase, trim, collapse whitespace)
 * 2. Pre-filter by length (±30% of source length)
 * 3. Calculate Levenshtein distance
 * 4. Score = ((max_length - distance) / max_length) * 100
 * 5. Filter by threshold, sort descending, return top N
 */
/**
 * E2: TM Penalty System
 * - If TM entry domain differs from current project domain → -5%
 * - If TM entry has no domain but project does → -3%
 */
function applyPenalty(
  score: number,
  entryDomain: string | null | undefined,
  currentDomain?: string,
): number {
  if (!currentDomain) return score;
  if (!entryDomain) return Math.max(0, score - 3);
  if (entryDomain.toLowerCase() !== currentDomain.toLowerCase()) {
    return Math.max(0, score - 5);
  }
  return score;
}

export function fuzzyMatch(
  source: string,
  tmEntries: TMEntry[],
  threshold: number = 50,
  maxResults: number = 5,
  currentDomain?: string,
): TMMatch[] {
  const normalizedSource = normalizeText(source);
  const sourceLen = normalizedSource.length;

  if (sourceLen === 0) return [];

  const matches: TMMatch[] = [];

  for (const entry of tmEntries) {
    const normalizedTM = normalizeText(entry.sourceText);
    const tmLen = normalizedTM.length;

    // Pre-filter by length: only compare entries within ±30% of source length
    if (tmLen < sourceLen * 0.7 || tmLen > sourceLen * 1.3) {
      continue;
    }

    // Exact match shortcut
    if (normalizedSource === normalizedTM) {
      const penalized = applyPenalty(100, entry.domain, currentDomain);
      matches.push({
        id: entry.id,
        sourceText: entry.sourceText,
        targetText: entry.targetText,
        score: penalized,
        domain: entry.domain,
        usageCount: entry.usageCount,
        createdAt: entry.createdAt,
      });
      continue;
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(normalizedSource, normalizedTM);
    const maxLen = Math.max(sourceLen, tmLen);
    const rawScore = Math.round(((maxLen - distance) / maxLen) * 100);
    const score = applyPenalty(rawScore, entry.domain, currentDomain);

    if (score >= threshold) {
      matches.push({
        id: entry.id,
        sourceText: entry.sourceText,
        targetText: entry.targetText,
        score,
        domain: entry.domain,
        usageCount: entry.usageCount,
        createdAt: entry.createdAt,
      });
    }
  }

  // Sort by score descending, then by usage count descending
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.usageCount - a.usageCount;
  });

  return matches.slice(0, maxResults);
}

/**
 * Classify match score for visual display.
 * 100% = exact (green), 75-99% = high (amber), 50-74% = partial (gray)
 */
export function matchColor(score: number): string {
  if (score === 100) return "var(--green)";
  if (score >= 75) return "var(--amber)";
  return "var(--text-muted)";
}

export function matchLabel(score: number): string {
  if (score === 100) return "Exact";
  if (score >= 75) return "High";
  return "Partial";
}
