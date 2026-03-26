"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface TMEntry {
  id: string;
  sourceText: string;
  targetText: string;
  srcLang: string;
  tgtLang: string;
  domain: string | null;
  usageCount: number;
  createdAt: string;
}

export default function TMPage() {
  const [entries, setEntries] = useState<TMEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exportingTmx, setExportingTmx] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    byLangPair: { pair: string; count: number }[];
    mostUsed: { sourceText: string; targetText: string; usageCount: number }[];
    mostRecent: { sourceText: string; targetText: string; createdAt: string }[];
    byMonth: { month: string; count: number }[];
  } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // G3: Aligned file import
  const [importingAligned, setImportingAligned] = useState(false);
  const alignedFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTMX = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tm/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(
          `Imported ${data.imported} entries (${data.skipped} duplicates skipped)`,
        );
        fetchEntries(); // refresh list
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch {
      setImportResult("Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportAligned = async (file: File) => {
    setImportingAligned(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("srcLang", "en");
      formData.append("tgtLang", "es");
      const res = await fetch("/api/tm/import-aligned", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(
          `Imported ${data.imported} aligned pairs (${data.skipped} skipped)`,
        );
        fetchEntries();
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch {
      setImportResult("Aligned import failed");
    } finally {
      setImportingAligned(false);
      if (alignedFileInputRef.current) alignedFileInputRef.current.value = "";
    }
  };

  // Auto-dismiss import result
  useEffect(() => {
    if (importResult) {
      const timer = setTimeout(() => setImportResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importResult]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `/api/tm?q=${encodeURIComponent(searchQuery.trim())}`
        : "/api/tm";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchEntries, 300);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/tm?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/tm/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (showStats && !stats) fetchStats();
  }, [showStats, stats, fetchStats]);

  const LANG_LABELS: Record<string, string> = {
    en: "EN",
    es: "ES",
    fr: "FR",
    de: "DE",
    pt: "PT",
    it: "IT",
    zh: "ZH",
    ja: "JA",
    ko: "KO",
  };

  return (
    <div
      className="p-6 max-w-5xl mx-auto"
      style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Translation Memory
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Alignment Tool */}
          <Link
            href="/app/tm/align"
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Align Texts
          </Link>

          {/* Stats Toggle */}
          <button
            onClick={() => setShowStats((v) => !v)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: showStats ? "var(--accent-soft)" : "var(--bg-card)",
              color: showStats
                ? "var(--text-primary)"
                : "var(--text-secondary)",
              border: "0.5px solid var(--border)",
            }}
          >
            {showStats ? "Hide Stats" : "Stats"}
          </button>

          {/* Import TMX */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".tmx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportTMX(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              opacity: importing ? 0.6 : 1,
            }}
          >
            {importing ? "Importing..." : "Import TMX"}
          </button>

          {/* G3: Import Aligned (.txt/.csv) */}
          <input
            ref={alignedFileInputRef}
            type="file"
            accept=".txt,.csv,.tsv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportAligned(file);
            }}
          />
          <button
            onClick={() => alignedFileInputRef.current?.click()}
            disabled={importingAligned}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              opacity: importingAligned ? 0.6 : 1,
            }}
          >
            {importingAligned ? "Importing..." : "Import Aligned"}
          </button>

          {/* Export TMX */}
          {entries.length > 0 && (
            <button
              onClick={async () => {
                setExportingTmx(true);
                try {
                  const res = await fetch("/api/tm/export");
                  if (res.ok) {
                    const blob = await res.blob();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "translation_memory.tmx";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                  }
                } catch {
                  // silent
                } finally {
                  setExportingTmx(false);
                }
              }}
              disabled={exportingTmx}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: "var(--accent-soft)",
                color: "var(--text-primary)",
                border: "0.5px solid var(--border)",
                opacity: exportingTmx ? 0.6 : 1,
              }}
            >
              {exportingTmx ? "Exporting..." : "Export TMX"}
            </button>
          )}
        </div>
      </div>

      {/* Import result toast */}
      {importResult && (
        <div
          style={{
            marginBottom: "16px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "8px",
            paddingBottom: "8px",
            borderRadius: "6px",
            fontSize: "12px",
            background: importResult.startsWith("Error")
              ? "var(--red-soft)"
              : "var(--accent-soft)",
            color: importResult.startsWith("Error")
              ? "var(--red-text)"
              : "var(--text-primary)",
          }}
        >
          {importResult}
        </div>
      )}

      {/* E4: TM Statistics Panel */}
      {showStats && stats && (
        <div
          style={{
            marginBottom: "16px",
            borderRadius: "6px",
            padding: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            TM Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div
              className="rounded p-3"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {stats.total}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Total entries
              </div>
            </div>
            <div
              className="rounded p-3"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {stats.byLangPair.length}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Language pairs
              </div>
            </div>
            <div
              className="rounded p-3"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {stats.mostUsed.length > 0 ? stats.mostUsed[0].usageCount : 0}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Top usage count
              </div>
            </div>
            <div
              className="rounded p-3"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {stats.byMonth.length}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Active months
              </div>
            </div>
          </div>

          {/* Language pair distribution */}
          {stats.byLangPair.length > 0 && (
            <div className="mb-3">
              <h3
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                By Language Pair
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.byLangPair.map((lp) => (
                  <span
                    key={lp.pair}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: "var(--bg-deep)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {lp.pair}: <strong>{lp.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Most used entries */}
          {stats.mostUsed.length > 0 && (
            <div className="mb-3">
              <h3
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Most Used Entries
              </h3>
              <div className="flex flex-col gap-1">
                {stats.mostUsed.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--text-primary)",
                        border: "0.5px solid var(--border)",
                      }}
                    >
                      {e.usageCount}x
                    </span>
                    <span
                      className="truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {e.sourceText}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>→</span>
                    <span className="truncate">{e.targetText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth by month */}
          {stats.byMonth.length > 0 && (
            <div>
              <h3
                className="text-xs font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Growth by Month
              </h3>
              <div className="flex items-end gap-1" style={{ height: "60px" }}>
                {(() => {
                  const maxCount = Math.max(
                    ...stats.byMonth.map((m) => m.count),
                  );
                  return stats.byMonth.map((m) => (
                    <div
                      key={m.month}
                      className="flex flex-col items-center flex-1"
                      style={{ height: "100%" }}
                    >
                      <div className="flex-1 flex items-end w-full">
                        <div
                          className="w-full rounded-t"
                          style={{
                            background: "var(--accent)",
                            height: `${Math.max(4, (m.count / maxCount) * 100)}%`,
                            opacity: 0.8,
                          }}
                          title={`${m.month}: ${m.count} entries`}
                        />
                      </div>
                      <span
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)", fontSize: "9px" }}
                      >
                        {m.month}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search translation memory..."
          className="w-full px-3 py-2 rounded text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-focus)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Entries list */}
      {loading ? (
        <div
          className="text-sm py-8 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div
          className="text-sm py-8 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          {searchQuery
            ? "No matching entries found"
            : "Your translation memory is empty. Start translating to build your TM."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded px-4 py-3"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Language pair */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--bg-deep)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {LANG_LABELS[entry.srcLang] || entry.srcLang} →{" "}
                      {LANG_LABELS[entry.tgtLang] || entry.tgtLang}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Used {entry.usageCount}x
                    </span>
                  </div>
                  {/* Source */}
                  <div
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {entry.sourceText}
                  </div>
                  {/* Target */}
                  <div
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {entry.targetText}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="text-xs px-2 py-1 rounded transition-colors shrink-0"
                  style={{
                    color: "var(--text-muted)",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--red)";
                    e.currentTarget.style.borderColor = "var(--red)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  {deleting === entry.id ? "..." : "×"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
