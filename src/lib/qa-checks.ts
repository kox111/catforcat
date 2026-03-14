/**
 * QA Checks for TranslatePro
 *
 * Runs quality assurance checks on translated segments.
 * Each check returns an array of QAIssue objects.
 */

export type QASeverity = "error" | "warning" | "info";

export interface QAIssue {
  segmentId: string;
  segmentPosition: number;
  check: string;
  message: string;
  severity: QASeverity;
}

export interface QASegment {
  id: string;
  position: number;
  sourceText: string;
  targetText: string;
  status: string;
}

export interface GlossaryTermForQA {
  sourceTerm: string;
  targetTerm: string;
}

export interface QARuleForQA {
  id: string;
  type: "wordlist" | "regex";
  wrong: string;
  correct: string;
  severity: "warning" | "error";
  enabled: boolean;
}

// ─────────────────────────────────────────────
// Individual checks
// ─────────────────────────────────────────────

/** Error: Target is empty but segment is marked as confirmed */
function checkEmptyConfirmed(seg: QASegment): QAIssue | null {
  if (seg.status === "confirmed" && seg.targetText.trim() === "") {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "empty_confirmed",
      message: "Confirmed segment has empty target",
      severity: "error",
    };
  }
  return null;
}

/** Warning: Source contains glossary term but target doesn't have its translation */
function checkGlossaryViolation(
  seg: QASegment,
  glossaryTerms: GlossaryTermForQA[]
): QAIssue[] {
  if (!seg.targetText.trim() || glossaryTerms.length === 0) return [];

  const issues: QAIssue[] = [];
  const sourceLower = seg.sourceText.toLowerCase();
  const targetLower = seg.targetText.toLowerCase();

  for (const term of glossaryTerms) {
    if (
      sourceLower.includes(term.sourceTerm.toLowerCase()) &&
      !targetLower.includes(term.targetTerm.toLowerCase())
    ) {
      issues.push({
        segmentId: seg.id,
        segmentPosition: seg.position,
        check: "glossary_violated",
        message: `Glossary: "${term.sourceTerm}" → "${term.targetTerm}" not found in target`,
        severity: "warning",
      });
    }
  }
  return issues;
}

/**
 * Warning: Numbers in source don't match numbers in target.
 * Extracts numbers (integers and decimals like 3.14) and compares as sorted sets.
 */
function checkNumbersInconsistent(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  // Match integers and decimals, including negative numbers
  const numRegex = /-?\d+(?:[.,]\d+)*/g;

  const sourceNums = (seg.sourceText.match(numRegex) || [])
    .map(normalizeNumber)
    .sort();
  const targetNums = (seg.targetText.match(numRegex) || [])
    .map(normalizeNumber)
    .sort();

  if (sourceNums.length === 0) return null;

  const sourceSet = new Set(sourceNums);
  const targetSet = new Set(targetNums);

  // Check if every source number exists in target
  const missing = [...sourceSet].filter((n) => !targetSet.has(n));

  if (missing.length > 0) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "numbers_inconsistent",
      message: `Numbers missing in target: ${missing.join(", ")}`,
      severity: "warning",
    };
  }
  return null;
}

/** Normalize number: treat comma as decimal separator in some locales */
function normalizeNumber(n: string): string {
  // If pattern is like "1.234" or "1,234" (thousands), keep as-is for comparison
  // But normalize comma-as-decimal: "3,14" → "3.14"
  // Heuristic: if exactly 1 comma and digits after < 3, it's decimal
  if (n.includes(",") && !n.includes(".")) {
    const parts = n.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      return n.replace(",", ".");
    }
  }
  return n;
}

/** Info: Source ends with punctuation but target doesn't (or vice versa) */
function checkFinalPunctuation(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  const srcEnd = seg.sourceText.trim().slice(-1);
  const tgtEnd = seg.targetText.trim().slice(-1);

  const punctuation = new Set([".", "!", "?", ":", ";"]);

  const srcHasPunct = punctuation.has(srcEnd);
  const tgtHasPunct = punctuation.has(tgtEnd);

  if (srcHasPunct !== tgtHasPunct) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "punctuation_mismatch",
      message: `Final punctuation mismatch: source ends with "${srcEnd}", target ends with "${tgtEnd}"`,
      severity: "info",
    };
  }
  return null;
}

/** Error: Tags/placeholders in source must exist in target */
function checkTagsPlaceholders(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  // Match {variable}, {{variable}}, <tag>, </tag>
  const tagRegex = /\{[^}]+\}|<[^>]+>/g;

  const sourceTags = seg.sourceText.match(tagRegex) || [];
  if (sourceTags.length === 0) return null;

  const missing = sourceTags.filter((tag) => !seg.targetText.includes(tag));

  if (missing.length > 0) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "tags_missing",
      message: `Tags/placeholders missing in target: ${missing.join(", ")}`,
      severity: "error",
    };
  }
  return null;
}

/** Warning: Target is identical to source (possible untranslated segment) */
function checkTargetEqualsSource(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  if (seg.sourceText.trim() === seg.targetText.trim()) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "target_equals_source",
      message: "Target is identical to source (may be untranslated)",
      severity: "warning",
    };
  }
  return null;
}

/** Info: Target contains double spaces */
function checkDoubleSpace(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  if (/  /.test(seg.targetText)) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "double_space",
      message: "Target contains double spaces",
      severity: "info",
    };
  }
  return null;
}

/** Warning: Target length is >200% or <30% of source length */
function checkExtremeLength(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim() || !seg.sourceText.trim()) return null;

  const srcLen = seg.sourceText.trim().length;
  const tgtLen = seg.targetText.trim().length;

  // Skip very short segments (less than 5 chars) — ratios are unreliable
  if (srcLen < 5) return null;

  const ratio = tgtLen / srcLen;

  if (ratio > 2.0) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "length_extreme",
      message: `Target is ${Math.round(ratio * 100)}% of source length (too long)`,
      severity: "warning",
    };
  }
  if (ratio < 0.3) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "length_extreme",
      message: `Target is ${Math.round(ratio * 100)}% of source length (too short)`,
      severity: "warning",
    };
  }
  return null;
}

/** Warning: Target has leading or trailing whitespace */
function checkLeadingTrailingSpaces(seg: QASegment): QAIssue | null {
  if (!seg.targetText) return null;

  const hasLeading = seg.targetText !== seg.targetText.trimStart();
  const hasTrailing = seg.targetText !== seg.targetText.trimEnd();

  if (hasLeading || hasTrailing) {
    const where = [hasLeading && "leading", hasTrailing && "trailing"].filter(Boolean).join(" and ");
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "leading_trailing_spaces",
      message: `Target has ${where} whitespace`,
      severity: "warning",
    };
  }
  return null;
}

/** Info: Source starts with uppercase but target doesn't */
function checkCapitalization(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim() || !seg.sourceText.trim()) return null;

  const srcFirst = seg.sourceText.trim()[0];
  const tgtFirst = seg.targetText.trim()[0];

  // Only check if source starts with a letter
  if (!/[A-Za-zÀ-ÿ]/.test(srcFirst)) return null;

  const srcIsUpper = srcFirst === srcFirst.toUpperCase() && srcFirst !== srcFirst.toLowerCase();
  const tgtIsUpper = tgtFirst === tgtFirst.toUpperCase() && tgtFirst !== tgtFirst.toLowerCase();

  if (srcIsUpper && !tgtIsUpper) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "capitalization_mismatch",
      message: "Source starts uppercase but target starts lowercase",
      severity: "info",
    };
  }
  return null;
}

/** Warning: Brackets/parentheses count mismatch between source and target */
function checkBracketMismatch(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  const pairs: [string, string][] = [["(", ")"], ["[", "]"]];
  const mismatches: string[] = [];

  for (const [open, close] of pairs) {
    const srcOpen = (seg.sourceText.match(new RegExp(`\\${open}`, "g")) || []).length;
    const srcClose = (seg.sourceText.match(new RegExp(`\\${close}`, "g")) || []).length;
    const tgtOpen = (seg.targetText.match(new RegExp(`\\${open}`, "g")) || []).length;
    const tgtClose = (seg.targetText.match(new RegExp(`\\${close}`, "g")) || []).length;

    if (srcOpen !== tgtOpen || srcClose !== tgtClose) {
      mismatches.push(`${open}${close}`);
    }
  }

  if (mismatches.length > 0) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "bracket_mismatch",
      message: `Bracket mismatch: ${mismatches.join(", ")} count differs between source and target`,
      severity: "warning",
    };
  }
  return null;
}

/** Error: URLs in source must appear identically in target */
function checkURLPreservation(seg: QASegment): QAIssue | null {
  if (!seg.targetText.trim()) return null;

  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  const sourceURLs = seg.sourceText.match(urlRegex) || [];
  if (sourceURLs.length === 0) return null;

  const missing = sourceURLs.filter((url) => !seg.targetText.includes(url));

  if (missing.length > 0) {
    return {
      segmentId: seg.id,
      segmentPosition: seg.position,
      check: "url_missing",
      message: `URL(s) missing in target: ${missing.join(", ")}`,
      severity: "error",
    };
  }
  return null;
}

/**
 * Check word list rules: searches for forbidden terms in target text (case-insensitive)
 */
function checkWordList(
  seg: QASegment,
  rules: QARuleForQA[]
): QAIssue[] {
  if (!seg.targetText.trim()) return [];

  const issues: QAIssue[] = [];
  const targetLower = seg.targetText.toLowerCase();

  for (const rule of rules) {
    if (rule.type !== "wordlist" || !rule.enabled) continue;

    const wrongLower = rule.wrong.toLowerCase();
    // Simple case-insensitive word search
    if (targetLower.includes(wrongLower)) {
      issues.push({
        segmentId: seg.id,
        segmentPosition: seg.position,
        check: "wordlist_violation",
        message: `Word list rule: "${rule.wrong}" found in target. Should be "${rule.correct}"`,
        severity: rule.severity,
      });
    }
  }

  return issues;
}

/**
 * Check regex rules: applies regex patterns to target text
 */
function checkRegex(
  seg: QASegment,
  rules: QARuleForQA[]
): QAIssue[] {
  if (!seg.targetText.trim()) return [];

  const issues: QAIssue[] = [];

  for (const rule of rules) {
    if (rule.type !== "regex" || !rule.enabled) continue;

    try {
      const regex = new RegExp(rule.wrong, "g");
      const matches = seg.targetText.match(regex);

      if (matches && matches.length > 0) {
        issues.push({
          segmentId: seg.id,
          segmentPosition: seg.position,
          check: "regex_violation",
          message: `Regex rule matched: "${rule.wrong}". ${rule.correct}`,
          severity: rule.severity,
        });
      }
    } catch (e) {
      // Invalid regex pattern - skip this rule
      // (validation should happen at rule creation time)
    }
  }

  return issues;
}

/**
 * Warning: Inconsistency — same source text has different translations in project.
 * Only works in batch mode (needs all segments).
 */
export function checkInconsistencies(segments: QASegment[]): QAIssue[] {
  const issues: QAIssue[] = [];

  // Group segments by normalized source text
  const bySource = new Map<string, QASegment[]>();
  for (const seg of segments) {
    if (!seg.targetText.trim()) continue;
    const key = seg.sourceText.trim().toLowerCase();
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(seg);
  }

  // Check for inconsistent translations
  for (const [, segs] of bySource) {
    if (segs.length < 2) continue;

    const uniqueTargets = new Set(segs.map((s) => s.targetText.trim().toLowerCase()));
    if (uniqueTargets.size > 1) {
      // Mark all but the first occurrence
      for (let i = 1; i < segs.length; i++) {
        issues.push({
          segmentId: segs[i].id,
          segmentPosition: segs[i].position,
          check: "inconsistency",
          message: `Inconsistent translation: same source has ${uniqueTargets.size} different translations`,
          severity: "warning",
        });
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────
// Main QA runner
// ─────────────────────────────────────────────

/**
 * Run all QA checks on a single segment.
 * Used both for batch QA and inline QA on confirm.
 */
export function runQAChecksForSegment(
  seg: QASegment,
  glossaryTerms: GlossaryTermForQA[] = [],
  qaRules: QARuleForQA[] = []
): QAIssue[] {
  const issues: QAIssue[] = [];

  const emptyCheck = checkEmptyConfirmed(seg);
  if (emptyCheck) issues.push(emptyCheck);

  issues.push(...checkGlossaryViolation(seg, glossaryTerms));

  const numbersCheck = checkNumbersInconsistent(seg);
  if (numbersCheck) issues.push(numbersCheck);

  const punctCheck = checkFinalPunctuation(seg);
  if (punctCheck) issues.push(punctCheck);

  const tagsCheck = checkTagsPlaceholders(seg);
  if (tagsCheck) issues.push(tagsCheck);

  const identicalCheck = checkTargetEqualsSource(seg);
  if (identicalCheck) issues.push(identicalCheck);

  const doubleCheck = checkDoubleSpace(seg);
  if (doubleCheck) issues.push(doubleCheck);

  const lengthCheck = checkExtremeLength(seg);
  if (lengthCheck) issues.push(lengthCheck);

  const spacesCheck = checkLeadingTrailingSpaces(seg);
  if (spacesCheck) issues.push(spacesCheck);

  const capCheck = checkCapitalization(seg);
  if (capCheck) issues.push(capCheck);

  const bracketCheck = checkBracketMismatch(seg);
  if (bracketCheck) issues.push(bracketCheck);

  const urlCheck = checkURLPreservation(seg);
  if (urlCheck) issues.push(urlCheck);

  // Custom QA rules: word list and regex checks
  issues.push(...checkWordList(seg, qaRules));
  issues.push(...checkRegex(seg, qaRules));

  return issues;
}

/**
 * Run QA on all segments (batch mode).
 */
export function runQABatch(
  segments: QASegment[],
  glossaryTerms: GlossaryTermForQA[] = [],
  qaRules: QARuleForQA[] = []
): QAIssue[] {
  const allIssues: QAIssue[] = [];

  for (const seg of segments) {
    allIssues.push(...runQAChecksForSegment(seg, glossaryTerms, qaRules));
  }

  // Batch-only: inconsistency check across all segments
  allIssues.push(...checkInconsistencies(segments));

  return allIssues;
}

/**
 * Export QA issues as a CSV string.
 */
export function exportQAReportCSV(issues: QAIssue[]): string {
  const header = "Segment #,Check,Severity,Message";
  const rows = issues.map((i) => {
    const msg = i.message.replace(/"/g, '""');
    return `${i.segmentPosition},"${i.check}","${i.severity}","${msg}"`;
  });
  return [header, ...rows].join("\n");
}

/**
 * Group issues by severity for display.
 */
export function groupIssuesBySeverity(issues: QAIssue[]): {
  errors: QAIssue[];
  warnings: QAIssue[];
  infos: QAIssue[];
} {
  return {
    errors: issues.filter((i) => i.severity === "error"),
    warnings: issues.filter((i) => i.severity === "warning"),
    infos: issues.filter((i) => i.severity === "info"),
  };
}
