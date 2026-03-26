"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const LANGS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

export default function TMAlignPage() {
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("es");
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const srcFileRef = useRef<HTMLInputElement>(null);
  const tgtFileRef = useRef<HTMLInputElement>(null);

  const loadFile = async (file: File, setter: (text: string) => void) => {
    const text = await file.text();
    setter(text);
  };

  const handleAlign = async () => {
    const sourceLines = sourceText.split("\n").filter((l) => l.trim());
    const targetLines = targetText.split("\n").filter((l) => l.trim());

    if (sourceLines.length === 0 || targetLines.length === 0) {
      setResult("Please provide both source and target text.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tm/align", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLines,
          targetLines,
          srcLang,
          tgtLang,
          domain: domain.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        let msg = `Aligned ${data.totalPairs} pairs: ${data.imported} imported, ${data.skipped} skipped`;
        if (data.mismatch) msg += `. Note: ${data.mismatch}`;
        if (data.stopped) msg += `. Stopped: ${data.message}`;
        setResult(msg);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Alignment failed — network error");
    } finally {
      setLoading(false);
    }
  };

  const sourceLines = sourceText.split("\n").filter((l) => l.trim()).length;
  const targetLines = targetText.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/app/tm"
          className="text-xs px-2 py-1 rounded"
          style={{ color: "var(--accent)", border: "1px solid var(--border)" }}
        >
          ← Back to TM
        </Link>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          TM Alignment Tool
        </h1>
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Paste or upload matching source and target texts (one sentence per
        line). Sentences are aligned by line number (1:1 mapping) and added to
        your Translation Memory.
      </p>

      {/* Language pair + domain */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Source:
          </label>
          <select
            value={srcLang}
            onChange={(e) => setSrcLang(e.target.value)}
            className="text-xs px-2 py-1.5 rounded"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          →
        </span>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Target:
          </label>
          <select
            value={tgtLang}
            onChange={(e) => setTgtLang(e.target.value)}
            className="text-xs px-2 py-1.5 rounded"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Domain:
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Optional (e.g. legal, medical)"
            className="text-xs px-2 py-1.5 rounded w-48"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
      </div>

      {/* Two text areas side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Source text ({sourceLines} lines)
            </label>
            <div>
              <input
                ref={srcFileRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFile(f, setSourceText);
                }}
              />
              <button
                onClick={() => srcFileRef.current?.click()}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                Upload .txt
              </button>
            </div>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              minHeight: "250px",
              fontFamily: "inherit",
            }}
            placeholder="Paste source text here (one sentence per line)..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Target text ({targetLines} lines)
            </label>
            <div>
              <input
                ref={tgtFileRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFile(f, setTargetText);
                }}
              />
              <button
                onClick={() => tgtFileRef.current?.click()}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                Upload .txt
              </button>
            </div>
          </div>
          <textarea
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              minHeight: "250px",
              fontFamily: "inherit",
            }}
            placeholder="Paste target text here (one sentence per line)..."
          />
        </div>
      </div>

      {/* Mismatch warning */}
      {sourceLines > 0 && targetLines > 0 && sourceLines !== targetLines && (
        <div
          style={{
            marginBottom: "12px",
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingTop: "8px",
            paddingBottom: "8px",
            borderRadius: "6px",
            fontSize: "12px",
            background: "var(--amber-soft)",
            color: "var(--amber-text)",
          }}
        >
          Line count mismatch: source has {sourceLines} lines, target has{" "}
          {targetLines}. Only the first {Math.min(sourceLines, targetLines)}{" "}
          pairs will be aligned.
        </div>
      )}

      {/* Result toast */}
      {result && (
        <div
          style={{
            marginBottom: "12px",
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingTop: "8px",
            paddingBottom: "8px",
            borderRadius: "6px",
            fontSize: "12px",
            background: result.startsWith("Error")
              ? "var(--red-soft)"
              : "var(--green-soft)",
            color: result.startsWith("Error")
              ? "var(--red-text)"
              : "var(--green-text)",
          }}
        >
          {result}
        </div>
      )}

      {/* Align button */}
      <button
        onClick={handleAlign}
        disabled={loading || sourceLines === 0 || targetLines === 0}
        className="px-4 py-2 rounded text-sm font-medium"
        style={{
          background: loading ? "var(--text-muted)" : "var(--accent-soft)",
          color: "var(--text-primary)",
          border: "0.5px solid var(--border)",
          opacity: sourceLines === 0 || targetLines === 0 ? 0.5 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading
          ? "Aligning..."
          : `Align & Import ${Math.min(sourceLines, targetLines)} pairs to TM`}
      </button>
    </div>
  );
}
