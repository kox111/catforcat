"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronDown, Check } from "lucide-react";

export type SegmentFilter = "all" | "empty" | "draft" | "confirmed" | "low-score";

export interface PreTranslateProgress {
  running: boolean;
  done: number;
  total: number;
  tmFilled: number;
  apiFilled: number;
}

interface EditorToolbarProps {
  projectName: string;
  projectId: string;
  srcLang: string;
  tgtLang: string;
  saving: boolean;
  onSave: () => void;
  onRunQA: () => void;
  qaRunning?: boolean;
  isOnline?: boolean;
  segmentFilter?: SegmentFilter;
  onFilterChange?: (filter: SegmentFilter) => void;
  onPreTranslate?: (mode: "tm-only" | "full") => void;
  preTranslateProgress?: PreTranslateProgress | null;
  savedIndicator?: boolean;
  saveError?: string | null;
  onAnalysis?: () => void;
  onCopyAllSource?: () => void;
  progress?: number;
  confirmedCount?: number;
  totalCount?: number;
  // B.1 Review mode
  reviewMode?: boolean;
  onStartReview?: () => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  // B.4 Smart Review
  onSmartReview?: () => void;
  smartReviewRunning?: boolean;
}

const EXPORT_FORMATS = [
  { key: "txt-bilingual", label: "TXT Bilingual", desc: "Source + Target" },
  { key: "txt-target", label: "TXT Target", desc: "Translation only" },
  { key: "docx", label: "DOCX", desc: "Word document" },
  { key: "tmx", label: "TMX", desc: "Translation Memory" },
  { key: "xliff", label: "XLIFF", desc: "CAT exchange" },
  { key: "html-bilingual", label: "HTML Table", desc: "Side-by-side" },
  { key: "json", label: "JSON", desc: "Key-value pairs" },
  { key: "srt", label: "SRT", desc: "Subtitles" },
  { key: "po", label: "PO", desc: "Gettext format" },
  { key: "markdown", label: "Markdown", desc: "Formatted text" },
];

export default function EditorToolbar({
  projectName,
  projectId,
  srcLang,
  tgtLang,
  saving,
  onSave,
  isOnline = true,
  segmentFilter = "all",
  onFilterChange,
  preTranslateProgress,
  savedIndicator = false,
  saveError,
  progress = 0,
  confirmedCount = 0,
  totalCount = 0,
  // B.1 Review mode
  reviewMode = false,
  onStartReview,
  onAcceptAll,
  onRejectAll,
  // B.4 Smart Review
  onSmartReview,
  smartReviewRunning = false,
}: EditorToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reviewDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exportOpen && !reviewDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (reviewDropdownOpen && reviewDropdownRef.current && !reviewDropdownRef.current.contains(e.target as Node)) {
        setReviewDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen, reviewDropdownOpen]);

  const handleExport = async (format: string) => {
    setExporting(format);
    setExportOpen(false);
    try {
      const url = `/api/files/export?projectId=${projectId}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Export failed");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename="(.+?)"/);
      const fileName = fileNameMatch?.[1] || `export.${format === "tmx" ? "tmx" : format === "docx" ? "docx" : "txt"}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  /* ── Save status indicator ── */
  const saveStatusColor = saving
    ? "var(--amber-text)"
    : saveError
    ? "var(--red-text)"
    : savedIndicator
    ? "var(--green-text)"
    : "var(--text-muted)";

  const saveStatusLabel = saving
    ? "Saving..."
    : saveError
    ? "Error"
    : savedIndicator
    ? "Saved"
    : "";

  /* ── Glass button base style ── */
  const glassBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: 8,
    background: "var(--btn-bg)",
    color: "var(--text-secondary)",
    border: "1px solid var(--btn-border)",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 150ms, color 150ms",
  };

  return (
    <>
      {/* ═══ Pulse animation for saving indicator ═══ */}
      <style>{`
        @keyframes editorSavePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ═══ Unified Header Bar ═══ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          height: 44,
          background: "var(--bg-deep)",
          borderBottom: "0.5px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {/* ── Left: Back + separator + name + lang + save status ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/app/projects"
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text-secondary)",
              textDecoration: "none",
              cursor: "pointer",
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <ArrowLeft size={16} />
          </Link>

          {/* Vertical separator */}
          <div
            style={{
              width: 0.5,
              height: 20,
              background: "var(--border)",
              flexShrink: 0,
            }}
          />

          {/* Project name */}
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {projectName}
          </span>

          {/* Lang pair badge */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "var(--text-secondary)",
              background: "var(--accent-soft)",
              padding: "2px 8px",
              borderRadius: 10,
            }}
          >
            {srcLang} → {tgtLang}
          </span>

          {/* Save status indicator */}
          {saveStatusLabel && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: saveStatusColor,
                fontFamily: "'Inter', system-ui, sans-serif",
                animation: saving ? "editorSavePulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: saveStatusColor,
                  flexShrink: 0,
                }}
              />
              {saveStatusLabel}
            </span>
          )}

          {/* Pre-translate progress (inline, only when running) */}
          {preTranslateProgress?.running && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "var(--accent)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  border: "1.5px solid var(--accent)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 1s linear infinite",
                }}
              />
              {preTranslateProgress.done}/{preTranslateProgress.total}
            </span>
          )}
        </div>

        {/* ── Center: Segment counter + mini progress bar ── */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "var(--text-muted)",
            }}
          >
            {confirmedCount}/{totalCount}
          </span>

          <div
            style={{
              width: 60,
              height: 3,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 2,
                background: "var(--green)",
                transition: "width 400ms ease",
              }}
            />
          </div>
        </div>

        {/* ── Right: Review + Export + Save ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {exporting && (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Exporting...</span>
          )}

          {/* Review button with dropdown */}
          <div style={{ position: "relative" }} ref={reviewDropdownRef}>
            <button
              onClick={() => setReviewDropdownOpen(!reviewDropdownOpen)}
              style={glassBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--btn-bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--btn-bg)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Review <ChevronDown size={10} />
            </button>

            {reviewDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 4px)",
                  width: 170,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  zIndex: 50,
                  background: "var(--bg-panel)",
                  border: "0.5px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {!reviewMode && (
                  <button
                    onClick={() => { onStartReview?.(); setReviewDropdownOpen(false); }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 11,
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 150ms",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Start Review
                  </button>
                )}
                {reviewMode && (
                  <>
                    <button
                      onClick={() => { onAcceptAll?.(); setReviewDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: 11,
                        color: "var(--green-text)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Check size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Accept All
                    </button>
                    <button
                      onClick={() => { onRejectAll?.(); setReviewDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: 11,
                        color: "var(--red-text)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      ✕ Reject All
                    </button>
                  </>
                )}
                <div style={{ borderTop: "0.5px solid var(--border)", margin: "2px 0" }} />
                <button
                  onClick={() => { onSmartReview?.(); setReviewDropdownOpen(false); }}
                  disabled={smartReviewRunning}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 11,
                    color: smartReviewRunning ? "var(--text-muted)" : "var(--text-primary)",
                    background: "transparent",
                    border: "none",
                    cursor: smartReviewRunning ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: smartReviewRunning ? 0.6 : 1,
                    transition: "background 150ms",
                  }}
                  onMouseEnter={(e) => { if (!smartReviewRunning) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {smartReviewRunning ? "Reviewing..." : "Smart Review"}
                </button>
              </div>
            )}
          </div>

          {/* Export dropdown */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              style={glassBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--btn-bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--btn-bg)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Export <ChevronDown size={10} />
            </button>

            {exportOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 4px)",
                  width: 220,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  zIndex: 50,
                  background: "var(--bg-panel)",
                  border: "0.5px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.key}
                    onClick={() => handleExport(fmt.key)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 11,
                      color: "var(--text-primary)",
                      display: "flex",
                      justifyContent: "space-between",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 150ms",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontWeight: 500 }}>{fmt.label}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{fmt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save button — accent glass */}
          <button
            onClick={onSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 12px",
              borderRadius: 8,
              background: "var(--btn-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--btn-border)",
              fontSize: 10,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--btn-bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--btn-bg)";
            }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
