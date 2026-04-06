import { levenshteinDistance, fuzzyMatch, TMEntry } from "../fuzzy-match";

// Test Levenshtein distance
console.log("=== Levenshtein Distance Tests ===");
console.log(
  "identical:",
  levenshteinDistance("hello", "hello") === 0 ? "PASS" : "FAIL",
);
console.log(
  "one char:",
  levenshteinDistance("hello", "hallo") === 1 ? "PASS" : "FAIL",
);
console.log("empty:", levenshteinDistance("", "hello") === 5 ? "PASS" : "FAIL");
console.log(
  "case:",
  levenshteinDistance("Hello", "hello") === 1 ? "PASS" : "FAIL",
);

// Test fuzzy matching with TM entries
console.log("\n=== Fuzzy Match Tests ===");

const tmEntries: TMEntry[] = [
  {
    id: "1",
    sourceText: "The cat is on the table",
    targetText: "El gato está en la mesa",
    srcLang: "en",
    tgtLang: "es",
    usageCount: 3,
    createdAt: new Date(),
  },
  {
    id: "2",
    sourceText: "The cat is on the chair",
    targetText: "El gato está en la silla",
    srcLang: "en",
    tgtLang: "es",
    usageCount: 1,
    createdAt: new Date(),
  },
  {
    id: "3",
    sourceText: "The dog is in the garden",
    targetText: "El perro está en el jardín",
    srcLang: "en",
    tgtLang: "es",
    usageCount: 2,
    createdAt: new Date(),
  },
  {
    id: "4",
    sourceText: "Something completely different and much longer text here",
    targetText: "Algo completamente diferente",
    srcLang: "en",
    tgtLang: "es",
    usageCount: 1,
    createdAt: new Date(),
  },
];

// Test 1: Exact match
const exact = fuzzyMatch("The cat is on the table", tmEntries);
console.log(
  "Exact match:",
  exact[0]?.score === 100 ? "PASS" : `FAIL (${exact[0]?.score})`,
);

// Test 2: "The cat is on the chair" vs "The cat is on the table" — checkpoint: ~85%
const similar = fuzzyMatch("The cat is on the chair", tmEntries);
const tableMatch = similar.find((m) => m.id === "1");
// "table" vs "chair" = 5 char diff in ~23 char string. Levenshtein gives ~78%
console.log(
  "Similar match score:",
  tableMatch?.score,
  tableMatch?.score && tableMatch.score >= 70 && tableMatch.score <= 90
    ? "PASS (70-90%)"
    : "FAIL",
);

// Test 3: Top result for similar query should be exact match (chair)
console.log(
  "Top result is exact:",
  similar[0]?.score === 100 ? "PASS" : `FAIL (${similar[0]?.score})`,
);

// Test 4: "The dog is in the garden" should NOT match well with cat entries
const dogMatches = fuzzyMatch("The dog is in the garden", tmEntries, 50);
const dogExact = dogMatches.find((m) => m.id === "3");
console.log(
  "Dog exact match:",
  dogExact?.score === 100 ? "PASS" : `FAIL (${dogExact?.score})`,
);

// Test 5: Very different text should match with low score or not at all
const noMatch = fuzzyMatch("Completely unrelated short", tmEntries, 80);
console.log(
  "No high match:",
  noMatch.length === 0 ? "PASS" : `FAIL (${noMatch.length} matches)`,
);

// Test 6: Length filter should exclude very long entries
const longFilter = fuzzyMatch("Short text", tmEntries, 10);
const hasLong = longFilter.find((m) => m.id === "4");
console.log(
  "Length filter:",
  hasLong === undefined ? "PASS" : "FAIL (long entry included)",
);

// Test 7: Threshold filtering
const highThreshold = fuzzyMatch("The cat is on the table", tmEntries, 90);
console.log(
  "High threshold filters partials:",
  highThreshold.every((m) => m.score >= 90) ? "PASS" : "FAIL",
);

// Test 8: Empty input
const empty = fuzzyMatch("", tmEntries);
console.log("Empty input:", empty.length === 0 ? "PASS" : "FAIL");

// Test 9: Results sorted by score
const sorted = fuzzyMatch("The cat is on the table", tmEntries, 50);
let isSorted = true;
for (let i = 1; i < sorted.length; i++) {
  if (sorted[i].score > sorted[i - 1].score) isSorted = false;
}
console.log("Results sorted:", isSorted ? "PASS" : "FAIL");

// Summary
console.log("\n=== SUMMARY ===");
const results = [
  exact[0]?.score === 100,
  tableMatch?.score && tableMatch.score >= 70 && tableMatch.score <= 90,
  similar[0]?.score === 100,
  dogExact?.score === 100,
  noMatch.length === 0,
  hasLong === undefined,
  highThreshold.every((m) => m.score >= 90),
  empty.length === 0,
  isSorted,
];
const passed = results.filter(Boolean).length;
console.log(`${passed}/${results.length} tests passed`);
