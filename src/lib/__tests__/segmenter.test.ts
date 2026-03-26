import { segmentText } from "../segmenter";

// Test 1: Basic sentences (checkpoint requirement)
console.log("=== Test 1: Abbreviations ===");
const t1 = segmentText("Dr. Smith went home. He was tired.", "en");
console.log("Result:", JSON.stringify(t1));
console.log(
  "Expected 2 segments:",
  t1.length === 2 ? "PASS" : `FAIL (got ${t1.length})`,
);

// Test 2: URLs should not break
console.log("\n=== Test 2: URLs ===");
const t2 = segmentText("Visit https://example.com/page. It works.", "en");
console.log("Result:", JSON.stringify(t2));
console.log(
  "Expected 2 segments:",
  t2.length === 2 ? "PASS" : `FAIL (got ${t2.length})`,
);

// Test 3: Spanish abbreviations
console.log("\n=== Test 3: Spanish abbreviations ===");
const t3 = segmentText(
  "El Sr. García llegó tarde. La Dra. López lo atendió.",
  "es",
);
console.log("Result:", JSON.stringify(t3));
console.log(
  "Expected 2 segments:",
  t3.length === 2 ? "PASS" : `FAIL (got ${t3.length})`,
);

// Test 4: Decimal numbers
console.log("\n=== Test 4: Decimal numbers ===");
const t4 = segmentText("The value is 3.14 approximately. That is pi.", "en");
console.log("Result:", JSON.stringify(t4));
console.log(
  "Expected 2 segments:",
  t4.length === 2 ? "PASS" : `FAIL (got ${t4.length})`,
);

// Test 5: Paragraph breaks
console.log("\n=== Test 5: Paragraph breaks ===");
const t5 = segmentText("First paragraph.\n\nSecond paragraph.", "en");
console.log("Result:", JSON.stringify(t5));
console.log(
  "Expected 2 segments:",
  t5.length === 2 ? "PASS" : `FAIL (got ${t5.length})`,
);

// Test 6: Numbered list
console.log("\n=== Test 6: Numbered list ===");
const t6 = segmentText("1. First item\n2. Second item\n3. Third item", "en");
console.log("Result:", JSON.stringify(t6));
// Single paragraph with numbered items — should be 1 segment (no sentence-ending punctuation)
console.log(
  "Expected 1 segment:",
  t6.length === 1 ? "PASS" : `FAIL (got ${t6.length})`,
);

// Test 7: Email addresses
console.log("\n=== Test 7: Email addresses ===");
const t7 = segmentText(
  "Contact john@example.com for details. He will respond.",
  "en",
);
console.log("Result:", JSON.stringify(t7));
console.log(
  "Expected 2 segments:",
  t7.length === 2 ? "PASS" : `FAIL (got ${t7.length})`,
);

// Test 8: Ellipsis
console.log("\n=== Test 8: Ellipsis ===");
const t8 = segmentText(
  "He thought about it... and then decided. It was final.",
  "en",
);
console.log("Result:", JSON.stringify(t8));
console.log(
  "Expected 2 segments:",
  t8.length === 2 ? "PASS" : `FAIL (got ${t8.length})`,
);

// Test 9: Multiple abbreviations in one sentence
console.log("\n=== Test 9: Multiple abbreviations ===");
const t9 = segmentText(
  "Mr. and Mrs. Johnson visited Dr. Brown. They were happy.",
  "en",
);
console.log("Result:", JSON.stringify(t9));
console.log(
  "Expected 2 segments:",
  t9.length === 2 ? "PASS" : `FAIL (got ${t9.length})`,
);

// Test 10: UTF-8 characters (Chinese, Japanese, accented)
console.log("\n=== Test 10: UTF-8 characters ===");
const t10 = segmentText(
  "La economía global cambió. El año 2024 fue difícil.",
  "es",
);
console.log("Result:", JSON.stringify(t10));
console.log(
  "Expected 2 segments:",
  t10.length === 2 ? "PASS" : `FAIL (got ${t10.length})`,
);

// Test 11: Realistic legal text
console.log("\n=== Test 11: Realistic legal text ===");
const t11 = segmentText(
  "This Agreement is entered into as of Jan. 15, 2024. The parties agree to the following terms. " +
    "Section 1. The Contractor shall deliver the goods within 30 days. " +
    "Section 2. Payment of $5,000.00 shall be made upon delivery.",
  "en",
);
console.log("Result:", JSON.stringify(t11));
console.log(`Segments: ${t11.length}`);

// Test 12: Empty and whitespace
console.log("\n=== Test 12: Empty input ===");
console.log("Empty string:", segmentText("").length === 0 ? "PASS" : "FAIL");
console.log("Whitespace:", segmentText("   ").length === 0 ? "PASS" : "FAIL");

// Summary
console.log("\n=== SUMMARY ===");
const tests = [
  t1.length === 2,
  t2.length === 2,
  t3.length === 2,
  t4.length === 2,
  t5.length === 2,
  t6.length === 1,
  t7.length === 2,
  t8.length === 2,
  t9.length === 2,
  t10.length === 2,
  t11.length >= 3, // Should be at least 3 segments
  segmentText("").length === 0,
];
const passed = tests.filter(Boolean).length;
console.log(`${passed}/${tests.length} tests passed`);
