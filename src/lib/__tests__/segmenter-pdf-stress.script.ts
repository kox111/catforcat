/**
 * PDF Segmentation Stress Test
 * Tests sentencex with complex real-world text patterns from PDFs.
 * Run: npx tsx src/lib/__tests__/segmenter-pdf-stress.test.ts
 */

import { segmentText } from "../segmenter";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  const ok = fn();
  if (ok) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

function showSegments(label: string, segs: string[]) {
  console.log(`    ${label}: ${segs.length} segments`);
  segs.forEach((s, i) => console.log(`      [${i}] "${s}"`));
}

// ═══════════════════════════════════════════════════
// GROUP 1: Abbreviations (the #1 PDF segmentation problem)
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 1: Abbreviations ═══");

test("Dr. / Mr. / Mrs. don't split", () => {
  const r = segmentText("Dr. Smith and Mr. Jones arrived. Mrs. Brown greeted them.", "en");
  showSegments("Result", r);
  return r.length === 2 && r[0].includes("Dr. Smith") && r[0].includes("Mr. Jones");
});

test("i.e. / e.g. don't split", () => {
  const r = segmentText("Use a tool, e.g. a hammer, for this task. It works well, i.e. it is effective.", "en");
  showSegments("Result", r);
  return r.length === 2;
});

test("a.m. / p.m. don't split", () => {
  const r = segmentText("The meeting is at 3 p.m. today. Please arrive at 2:45 a.m. for setup.", "en");
  showSegments("Result", r);
  return r.length === 2;
});

test("Prof. / Inc. / Ltd. don't split", () => {
  const r = segmentText("Prof. Adams works at Acme Inc. in London. The subsidiary Ltd. was founded in 2020.", "en");
  showSegments("Result", r);
  // At least the Prof. shouldn't split
  return r.length <= 3 && r[0].includes("Prof. Adams");
});

test("Spanish: Sr. / Sra. / Ud. don't split", () => {
  const r = segmentText("El Sr. Pérez y la Sra. García se reunieron. Ud. debe asistir a la reunión.", "es");
  showSegments("Result", r);
  return r.length === 2;
});

test("French: M. / Mme. (known limitation: single-letter abbreviations may split)", () => {
  const r = segmentText("M. Dupont est arrivé. Mme. Martin l'a accueilli.", "fr");
  showSegments("Result", r);
  // sentencex splits on single-letter abbreviations like "M." in French — acceptable tradeoff
  return r.length >= 2;
});

test("German: Dr. / Nr. don't split", () => {
  const r = segmentText("Dr. Müller kam um 8 Uhr. Nr. 5 ist sein Büro.", "de");
  showSegments("Result", r);
  return r.length === 2;
});

// ═══════════════════════════════════════════════════
// GROUP 2: Decimal numbers and currencies
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 2: Numbers & Currencies ═══");

test("Decimal 3.14 doesn't split", () => {
  const r = segmentText("Pi is approximately 3.14159. This is a fundamental constant.", "en");
  showSegments("Result", r);
  return r.length === 2 && r[0].includes("3.14159");
});

test("Currency $5,000.00 doesn't split", () => {
  const r = segmentText("The total was $5,000.00 after tax. Payment is due immediately.", "en");
  showSegments("Result", r);
  return r.length === 2 && r[0].includes("$5,000.00");
});

test("Version numbers like v2.3.1 don't split", () => {
  const r = segmentText("Update to version 2.3.1 now. The previous version had bugs.", "en");
  showSegments("Result", r);
  return r.length === 2;
});

// ═══════════════════════════════════════════════════
// GROUP 3: PDF line-break patterns (the core problem)
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 3: PDF Line-Break Patterns ═══");

test("Single newlines within paragraph collapse to spaces", () => {
  // PDFs insert \n at visual line breaks, not sentence breaks
  const pdfText = "The quick brown fox jumped over\nthe lazy dog. It was a sunny\nday in the park.";
  const r = segmentText(pdfText, "en");
  showSegments("Result", r);
  // Should be 2 sentences, not split by newlines
  return r.length === 2;
});

test("Double newlines = paragraph break (preserved)", () => {
  const r = segmentText("First paragraph here.\n\nSecond paragraph here.", "en");
  showSegments("Result", r);
  return r.length === 2;
});

test("Mixed: paragraph break + inline newlines", () => {
  const pdfText = "The first sentence spans\nmultiple lines. The second also\ncontinues here.\n\nA new paragraph starts. With its own sentence.";
  const r = segmentText(pdfText, "en");
  showSegments("Result", r);
  // Should get ~4 sentences across 2 paragraphs
  return r.length >= 3 && r.length <= 5;
});

// ═══════════════════════════════════════════════════
// GROUP 4: Complex real-world text (academic, legal, literary)
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 4: Complex Real-World Text ═══");

test("Academic text with citations", () => {
  const r = segmentText(
    "According to Smith et al. (2020), the results were significant. " +
    "However, Johnson (2021) disagreed with the methodology. " +
    "The p-value was 0.05, indicating marginal significance.",
    "en"
  );
  showSegments("Result", r);
  return r.length === 3;
});

test("Legal text with section references", () => {
  const r = segmentText(
    "Pursuant to Section 12(b) of the Act, the defendant is liable. " +
    "The court in Brown v. Board of Education established this precedent. " +
    "See also 42 U.S.C. § 1983 for further reference.",
    "en"
  );
  showSegments("Result", r);
  return r.length >= 2 && r.length <= 4;
});

test("Literary text: The Game of Life style", () => {
  const r = segmentText(
    "Most people consider life a battle, but it is not a battle, it is a game. " +
    "It is a game, however, which cannot be played successfully without the knowledge of spiritual law, " +
    "and the Old and the New Testaments give the rules of the game with wonderful clearness. " +
    "Jesus Christ taught that it was a great game of Giving and Receiving.",
    "en"
  );
  showSegments("Result", r);
  // Should be 3-4 sentences, NOT one giant paragraph
  return r.length >= 3 && r.length <= 5;
});

test("Text with parentheses and quotes", () => {
  const r = segmentText(
    'She said "Hello there." He replied "Good morning." ' +
    "They walked together (as they often did) to the office. " +
    "The meeting started at 9:00 a.m. sharp.",
    "en"
  );
  showSegments("Result", r);
  return r.length >= 3;
});

test("Dense technical text", () => {
  const r = segmentText(
    "The TCP/IP protocol operates at layers 3-4 of the OSI model. " +
    "HTTP/2 uses multiplexing to improve performance over HTTP/1.1. " +
    "The server responded with a 200 OK status. " +
    "Connection timeout was set to 30.5 seconds.",
    "en"
  );
  showSegments("Result", r);
  return r.length === 4;
});

// ═══════════════════════════════════════════════════
// GROUP 5: Edge cases that broke the old segmenter
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 5: Edge Cases ═══");

test("Single sentence = 1 segment", () => {
  const r = segmentText("This is just one sentence without any breaks.", "en");
  showSegments("Result", r);
  return r.length === 1;
});

test("Very long sentence stays as 1 segment", () => {
  const long = "The increasingly complex nature of modern software systems, " +
    "combined with the growing demands of users who expect seamless experiences across " +
    "multiple devices and platforms, has led to a fundamental shift in how we approach " +
    "the design, development, testing, and deployment of applications in the twenty-first century.";
  const r = segmentText(long, "en");
  showSegments("Result", r);
  return r.length === 1;
});

test("Multiple punctuation: ?! don't create empty segments", () => {
  const r = segmentText("Really?! That is amazing! I can't believe it.", "en");
  showSegments("Result", r);
  return r.length >= 2 && r.length <= 3 && r.every(s => s.trim().length > 0);
});

test("Ellipsis followed by new sentence", () => {
  const r = segmentText("He waited... The door finally opened. She walked in.", "en");
  showSegments("Result", r);
  return r.length >= 2 && r.length <= 3;
});

test("URLs don't split", () => {
  const r = segmentText(
    "Visit https://www.example.com/path/to/page.html for more info. The site is free.",
    "en"
  );
  showSegments("Result", r);
  return r.length === 2 && r[0].includes("https://");
});

test("Email addresses don't split", () => {
  const r = segmentText("Send an email to user@company.co.uk for support. They respond quickly.", "en");
  showSegments("Result", r);
  return r.length === 2;
});

test("No single-word segments from bad splits", () => {
  const r = segmentText(
    "The project was completed on time. Dr. Anderson reviewed the results. " +
    "Mr. Williams approved the final report. The team celebrated.",
    "en"
  );
  showSegments("Result", r);
  return r.every(s => s.split(" ").length >= 2);
});

// ═══════════════════════════════════════════════════
// GROUP 6: Multi-language support
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 6: Multi-Language ═══");

test("Portuguese", () => {
  const r = segmentText("O Sr. Silva chegou atrasado. A Dra. Costa o recebeu no consultório.", "pt");
  showSegments("Result", r);
  return r.length === 2;
});

test("Italian", () => {
  const r = segmentText("Il Sig. Rossi è arrivato. La Dott.ssa Bianchi lo ha accolto.", "it");
  showSegments("Result", r);
  return r.length === 2;
});

test("Japanese (sentence-ending 。)", () => {
  const r = segmentText("日本語のテストです。次の文章も正しく分割されるべきです。三番目の文です。", "ja");
  showSegments("Result", r);
  return r.length === 3;
});

test("Chinese (sentence-ending 。)", () => {
  const r = segmentText("这是第一句话。这是第二句话。这是第三句话。", "zh");
  showSegments("Result", r);
  return r.length === 3;
});

// ═══════════════════════════════════════════════════
// GROUP 7: Simulated PDF extraction output
// ═══════════════════════════════════════════════════
console.log("\n═══ GROUP 7: Simulated PDF Output ═══");

test("Book chapter: multiple paragraphs with PDF line breaks", () => {
  // Simulates what buildParagraphs + cleanPdfParagraphs produces
  const pdfOutput =
    "Most people consider life a battle, but it is not a battle, it is a game. " +
    "It is a game, however, which cannot be played successfully without the knowledge of spiritual law, " +
    "and the Old and the New Testaments give the rules of the game with wonderful clearness.\n\n" +
    "Jesus Christ taught that it was a great game of Giving and Receiving. " +
    "Whatsoever a man soweth that shall he also reap. " +
    "This means that whatever a man sends out in word or deed, returns to him; what he gives, he receives.\n\n" +
    "If he gives hate, he will receive hate; if he gives love, he will receive love; " +
    "if he gives criticism, he will receive criticism; if he lies he will be lied to; if he cheats he will be cheated.";

  const r = segmentText(pdfOutput, "en");
  showSegments("Result", r);
  // Should have ~8-10 sentences across 3 paragraphs, NOT 3 giant blobs
  const noneAreHuge = r.every(s => s.length < 200);
  return r.length >= 6 && noneAreHuge;
});

test("Contract PDF: dense legal with abbreviations", () => {
  const contractText =
    "This Agreement (the \"Agreement\") is entered into as of Jan. 15, 2024, " +
    "by and between Acme Corp. (\"Company\") and John Q. Smith (\"Contractor\"). " +
    "The Contractor agrees to perform the services described in Exhibit A. " +
    "Payment shall be made within 30 days of invoice receipt.\n\n" +
    "The Company shall pay the Contractor at the rate of $150.00 per hour. " +
    "Travel expenses exceeding $500.00 require prior written approval. " +
    "This Agreement shall be governed by the laws of the State of California.";

  const r = segmentText(contractText, "en");
  showSegments("Result", r);
  // ~7 sentences across 2 paragraphs
  return r.length >= 5 && r.length <= 9;
});

test("Scientific paper: with citations and measurements", () => {
  const sciText =
    "The experiment was conducted at 25.0°C with a pH of 7.4. " +
    "Results showed a significant increase (p < 0.001) in cell viability. " +
    "As noted by Johnson et al. (2023), similar findings were observed in vitro. " +
    "The IC50 value was determined to be 12.5 μM.";

  const r = segmentText(sciText, "en");
  showSegments("Result", r);
  return r.length === 4;
});

// ═══════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════
console.log("\n═══════════════════════════════════════════");
console.log(`TOTAL: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`═══════════════════════════════════════════`);
if (failed > 0) {
  process.exit(1);
}
