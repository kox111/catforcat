/**
 * Auto-Glossary Detection
 * Analyzes confirmed segments to find frequently repeated terms (2-4 words)
 * that appear 3+ times across project source texts.
 * Returns suggestions for terms not already in the glossary.
 */

// Common stopwords for EN and ES
const STOPWORDS = new Set([
  // English
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "to", "of", "in",
  "for", "on", "with", "at", "by", "from", "as", "into", "through",
  "during", "before", "after", "above", "below", "between", "out",
  "off", "over", "under", "again", "further", "then", "once", "and",
  "but", "or", "nor", "not", "no", "so", "if", "than", "too", "very",
  "just", "about", "up", "down", "each", "all", "any", "both", "few",
  "more", "most", "other", "some", "such", "only", "own", "same",
  "that", "this", "these", "those", "it", "its", "he", "she", "they",
  "them", "their", "we", "our", "you", "your", "i", "me", "my",
  "who", "which", "what", "when", "where", "how", "there", "here",
  // Spanish
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del",
  "en", "con", "por", "para", "al", "es", "son", "está", "están",
  "ser", "estar", "ha", "han", "fue", "y", "o", "pero", "si", "no",
  "que", "como", "más", "menos", "se", "su", "sus", "le", "les",
  "lo", "me", "te", "nos", "yo", "tú", "él", "ella", "ellos", "ellas",
  "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "todo", "toda", "todos", "todas", "otro", "otra", "otros", "otras",
]);

export interface GlossarySuggestion {
  term: string;
  count: number;
  // The translation the user used most frequently
  suggestedTarget: string;
}

/**
 * Extract n-grams (2-4 words) from text, filtered by stopwords
 */
function extractNgrams(text: string): string[] {
  const words = text.toLowerCase().replace(/[^\w\sáéíóúñüàèìòùâêîôûäëïöü-]/g, "").split(/\s+/).filter(Boolean);
  const ngrams: string[] = [];

  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const gram = words.slice(i, i + n);
      // Skip if first or last word is a stopword
      if (STOPWORDS.has(gram[0]) || STOPWORDS.has(gram[gram.length - 1])) continue;
      // Skip if ALL words are stopwords
      if (gram.every((w) => STOPWORDS.has(w))) continue;
      ngrams.push(gram.join(" "));
    }
  }

  // Also add single words that are long enough and not stopwords
  for (const word of words) {
    if (word.length >= 4 && !STOPWORDS.has(word)) {
      ngrams.push(word);
    }
  }

  return ngrams;
}

/**
 * Analyze segments to find frequent terms that could be glossary entries.
 *
 * @param segments All project segments
 * @param existingGlossaryTerms Source terms already in glossary (lowercase)
 * @param minOccurrences Minimum occurrences to suggest (default: 3)
 * @returns Array of suggestions sorted by frequency
 */
export function detectFrequentTerms(
  segments: Array<{
    sourceText: string;
    targetText: string;
    status: string;
  }>,
  existingGlossaryTerms: string[],
  minOccurrences = 3,
): GlossarySuggestion[] {
  const existingLower = new Set(existingGlossaryTerms.map((t) => t.toLowerCase()));

  // Count n-gram frequency across all source texts
  const ngramCounts = new Map<string, number>();
  for (const seg of segments) {
    const ngrams = extractNgrams(seg.sourceText);
    // Deduplicate within same segment
    const unique = new Set(ngrams);
    for (const gram of unique) {
      ngramCounts.set(gram, (ngramCounts.get(gram) || 0) + 1);
    }
  }

  // Filter: >= minOccurrences, not already in glossary
  const candidates: Array<{ term: string; count: number }> = [];
  for (const [term, count] of ngramCounts) {
    if (count >= minOccurrences && !existingLower.has(term)) {
      candidates.push({ term, count });
    }
  }

  // Remove substrings: if "machine learning" (5x) exists, don't suggest "machine" (5x)
  const filtered = candidates.filter((c) => {
    return !candidates.some(
      (other) =>
        other.term !== c.term &&
        other.term.includes(c.term) &&
        other.count >= c.count
    );
  });

  // For confirmed segments, try to find what translation the user used
  const confirmedSegs = segments.filter((s) => s.status === "confirmed" && s.targetText.trim());

  const suggestions: GlossarySuggestion[] = filtered
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 suggestions max
    .map((c) => {
      // Find the most common translation context
      let suggestedTarget = "";
      for (const seg of confirmedSegs) {
        if (seg.sourceText.toLowerCase().includes(c.term)) {
          // Use the target of the first confirmed segment containing this term
          suggestedTarget = seg.targetText;
          break;
        }
      }
      return {
        term: c.term,
        count: c.count,
        suggestedTarget,
      };
    });

  return suggestions;
}
