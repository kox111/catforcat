"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, ChevronDown, WifiOff, Check } from "lucide-react";

export type SegmentFilter = "all" | "empty" | "draft" | "confirmed";

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
}

const EXPORT_FORMATS = [
  { key: "txt-bilingual", label: "TXT Bilingual", desc: "Source + Target" },
  { key: "txt-target", label: "TXT Target", desc: "Translation only" },
  { key: "docx", label: "DOCX", desc: "Word document" },
  { key: "tmx", label: "TMX", desc: "Translation Memory" },
  { key: "xliff", label: "XLIFF", desc: "CAT exchange" },
  { key: "html-bilingual", label: "HTML Table", desc: "Side-by-side" },
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
}: EditorToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 52,
        background: "#161616",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}
    >
      {/* Left: Back + Logo + Lang pair */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link
          href="/app/projects"
          style={{
            display: "flex",
            alignItems: "center",
            color: "var(--text-muted)",
            textDecoration: "none",
            padding: "4px",
            borderRadius: "var(--radius-sm)",
            transition: "color 200ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft size={18} />
        </Link>

        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {projectName}
        </span>

        <span
          style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(59,130,246,0.08)",
            color: "var(--accent)",
            fontWeight: 500,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.02em",
          }}
        >
          {srcLang} → {tgtLang}
        </span>

        {!isOnline && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 20,
              background: "var(--amber-soft)",
              color: "var(--amber)",
              fontWeight: 500,
            }}
          >
            <WifiOff size={12} /> Offline
          </span>
        )}
      </div>

      {/* Center: Filter + Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <select
          value={segmentFilter}
          onChange={(e) => onFilterChange?.(e.target.value as SegmentFilter)}
          style={{
            background: "rgba(255,255,255,0.04)",
            color: segmentFilter === "all" ? "var(--text-muted)" : "var(--text-primary)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <option value="all">All segments</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
        </select>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 100,
              height: 3,
              borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 2,
                background: progress === 100 ? "var(--green)" : "var(--accent)",
                transition: "width 400ms ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
            }}
          >
            {confirmedCount}/{totalCount}
          </span>
        </div>

        {preTranslateProgress?.running && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--accent)",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
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

      {/* Right: Status + Export + Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {saving && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Saving...</span>
        )}
        {!saving && savedIndicator && (
          <span style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 3 }}>
            <Check size={13} /> Saved
          </span>
        )}
        {saveError && (
          <span style={{ fontSize: 11, color: "var(--amber)" }}>{saveError}</span>
        )}
        {exporting && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Exporting...</span>
        )}

        {/* Export dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "border-color 200ms",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          >
            Export <ChevronDown size={13} />
          </button>

          {exportOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                width: 220,
                borderRadius: "var(--radius)",
                overflow: "hidden",
                zIndex: 50,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {EXPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt.key}
                  onClick={() => handleExport(fmt.key)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    fontSize: 12,
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
                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{fmt.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 16px",
            borderRadius: 20,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 200ms",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Save size={13} /> Save
        </button>
      </div>
    </div>
  );
}
