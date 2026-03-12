/**
 * TranslatePro — Segmentation Engine
 * Converts raw text into translatable segments (sentences).
 * Based on simplified SRX rules per spec section 4.1.
 */

// Abbreviations by language that should NOT trigger sentence breaks
const ABBREVIATIONS: Record<string, string[]> = {
  en: [
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "Inc", "Ltd", "Corp",
    "etc", "vs", "approx", "dept", "est", "govt", "e.g", "i.e",
    "Fig", "No", "Vol", "pp", "ed", "Rev", "St", "Ave", "Blvd",
    "Gen", "Gov", "Sgt", "Cpl", "Pvt", "Capt", "Lt", "Col", "Maj",
    "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
  es: [
    "Sr", "Sra", "Srta", "Dr", "Dra", "Prof", "Lic", "Ing", "Arq",
    "Ud", "Uds", "pág", "núm", "etc", "aprox", "tel", "dept",
    "vol", "ed", "fig", "art", "cap",
  ],
};

// Placeholder character that won't appear in normal text
const PLACEHOLDER = "\u0000";

/**
 * Escape abbreviation dots so they don't trigger sentence splits.
 * "Dr. Smith" → "Dr\0 Smith" (dot replaced by placeholder)
 */
function protectAbbreviations(text: string, lang: string): string {
  const abbrevs = [
    ...(ABBREVIATIONS[lang] || []),
    ...(ABBREVIATIONS["en"] || []), // always include English as fallback
  ];
  // Remove duplicates
  const unique = [...new Set(abbrevs)];

  let result = text;
  for (const abbr of unique) {
    // Match abbreviation followed by a dot: "Dr." → "Dr\0"
    // Use word boundary before abbreviation
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(\\b${escaped})\\.`, "g");
    result = result.replace(regex, `$1${PLACEHOLDER}`);
  }
  return result;
}

/**
 * Protect decimal numbers: "3.14" should not split.
 */
function protectDecimals(text: string): string {
  return text.replace(/(\d)\.(\d)/g, `$1${PLACEHOLDER}$2`);
}

/**
 * Protect URLs: "https://example.com/page.html" should not split.
 */
function protectUrls(text: string): string {
  // Match http(s):// URLs and www. URLs
  // Don't capture trailing punctuation (.!?) that's likely sentence-ending
  return text.replace(
    /(https?:\/\/[^\s]+?|www\.[^\s]+?)(?=[.!?]\s|[.!?]$|\s|$)/g,
    (match) => match.replace(/\./g, PLACEHOLDER)
  );
}

/**
 * Protect email addresses: "user@domain.com" should not split.
 */
function protectEmails(text: string): string {
  return text.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match) => match.replace(/\./g, PLACEHOLDER)
  );
}

/**
 * Protect numbered lists: "1. Item" should not split if number is 1-2 digits.
 */
function protectNumberedLists(text: string): string {
  return text.replace(/^(\d{1,2})\./gm, `$1${PLACEHOLDER}`);
}

/**
 * Protect ellipsis: "..." should not split unless followed by space + uppercase.
 * We protect "..." always, then the split regex handles the space+uppercase case.
 */
function protectEllipsis(text: string): string {
  // Protect ellipsis NOT followed by space+uppercase (those are NOT break points)
  // Ellipsis followed by space+uppercase IS a break point, so don't protect those
  return text.replace(/\.\.\.(?!\s+[A-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇ])/g, `${PLACEHOLDER}${PLACEHOLDER}${PLACEHOLDER}`);
}

/**
 * Restore all placeholders back to dots.
 */
function restorePlaceholders(text: string): string {
  return text.replace(new RegExp(PLACEHOLDER, "g"), ".");
}

/**
 * Main segmentation function.
 * Takes raw text and returns an array of segments (sentences).
 */
export function segmentText(text: string, lang: string = "en"): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  let processed = text;

  // Step 1: Protect elements that contain dots but are NOT sentence boundaries
  processed = protectUrls(processed);
  processed = protectEmails(processed);
  processed = protectDecimals(processed);
  processed = protectNumberedLists(processed);
  processed = protectEllipsis(processed);
  processed = protectAbbreviations(processed, lang);

  // Step 2: Split on paragraph breaks first (double newline always splits)
  const paragraphs = processed.split(/\n\s*\n/);

  const segments: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue;

    // Step 3: Within each paragraph, split on sentence-ending punctuation
    // Pattern: sentence-ending punctuation (.!?) followed by whitespace and then
    // an uppercase letter (or end of string for the last segment)
    const sentenceParts = paragraph.split(
      /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇА-ЯÀ-Ÿ\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af])/
    );

    for (const part of sentenceParts) {
      const cleaned = part.replace(/\s+/g, " ").trim();
      if (cleaned.length > 0) {
        // Restore placeholders back to dots
        segments.push(restorePlaceholders(cleaned));
      }
    }
  }

  return segments;
}

/**
 * Get supported abbreviations for a language (for testing/debugging).
 */
export function getAbbreviations(lang: string): string[] {
  return ABBREVIATIONS[lang] || [];
}
