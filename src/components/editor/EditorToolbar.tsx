"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  Star,
  FileText,
  Sparkles,
  Download,
  Maximize,
  Minimize,
  Languages,
  Book,
  FileCheck,
  ChevronRight,
  Search,
  TextSearch,
  StickyNote,
  BarChart3,
} from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useUserPlan } from "@/components/UserPlanProvider";
import SaveDot from "@/components/editor/SaveDot";

export type SegmentFilter =
  | "all"
  | "empty"
  | "draft"
  | "confirmed"
  | "low-score";

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
  hasPendingChanges?: boolean;
  isOnline?: boolean;
  segmentFilter?: SegmentFilter;
  onFilterChange?: (filter: SegmentFilter) => void;
  preTranslateProgress?: PreTranslateProgress | null;
  lastSavedAt?: number | null;
  saveError?: string | null;
  progress?: number;
  confirmedCount?: number;
  totalCount?: number;
  onToast?: (message: string) => void;
  exportOpen?: boolean;
  onExportOpenChange?: (open: boolean) => void;
  /* New props for consolidated header */
  onPreTranslate?: (mode: "tm-only" | "full") => void;
  preTranslating?: boolean;
  editorFontSize?: number;
  onFontSizeChange?: (size: number) => void;
  onExportOpen?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /* Sidebar callback props (Track A) */
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onNotesOpen?: () => void;
  onRunQA?: () => void;
  onAnalysis?: () => void;
  qaRunning?: boolean;
  activePanel?: string | null;
  onPanelToggle?: (panel: string) => void;
  activeSegment?: number;
}

/* ─── Theme gradient ring colors per theme ─── */
const AVATAR_RING: Record<Theme, { gradient: string; bg: string }> = {
  dark: {
    gradient: "linear-gradient(135deg, #BDB8B2, #8A8580)",
    bg: "var(--bg-deep)",
  },
  sakura: {
    gradient: "linear-gradient(135deg, #8B5A6B, #B08090)",
    bg: "var(--bg-deep)",
  },
  light: {
    gradient: "linear-gradient(135deg, #6B6B6B, #AAAAAA)",
    bg: "var(--bg-deep)",
  },
  linen: {
    gradient: "linear-gradient(135deg, #A47864, #C4A898)",
    bg: "var(--bg-deep)",
  },
  forest: {
    gradient: "linear-gradient(135deg, #8B7355, #6A8A58)",
    bg: "var(--bg-deep)",
  },
  midnight: {
    gradient: "linear-gradient(135deg, #8a8594, #6a6574)",
    bg: "var(--bg-deep)",
  },
};

const THEME_DOTS: {
  id: Theme;
  color: string;
  border: string;
  label: string;
}[] = [
  { id: "dark", color: "#121214", border: "0.5px solid #3a3a40", label: "Dark" },
  { id: "sakura", color: "#e4c8cc", border: "0.5px solid rgba(120,90,100,0.14)", label: "Sakura" },
  { id: "light", color: "#f5f5f2", border: "0.5px solid rgba(0,0,0,0.12)", label: "Light" },
  { id: "linen", color: "#C4AA90", border: "0.5px solid #B09878", label: "Linen" },
  { id: "forest", color: "#3A3028", border: "0.5px solid #4A3E32", label: "Forest" },
  { id: "midnight", color: "#0a0a0c", border: "0.5px solid #2a2a30", label: "Midnight" },
];

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
  hasPendingChanges = false,
  preTranslateProgress,
  lastSavedAt,
  saveError,
  progress = 0,
  confirmedCount = 0,
  totalCount = 0,
  onToast,
  exportOpen: exportOpenProp,
  onExportOpenChange,
  onPreTranslate,
  preTranslating,
  editorFontSize = 13,
  onFontSizeChange,
  onExportOpen,
  isFullscreen = false,
  onToggleFullscreen,
  onSearchOpen,
  onConcordanceOpen,
  onNotesOpen,
  onRunQA,
  onAnalysis,
  qaRunning,
  activePanel,
  onPanelToggle,
  activeSegment,
}: EditorToolbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { plan: userPlan } = useUserPlan();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const [exportOpenLocal, setExportOpenLocal] = useState(false);
  const exportOpen =
    exportOpenProp !== undefined ? exportOpenProp : exportOpenLocal;
  const setExportOpen = (v: boolean) => {
    setExportOpenLocal(v);
    onExportOpenChange?.(v);
  };
  const [exporting, setExporting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  /* Track A: expanded toolbar state */
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem("catforcat-toolbar-expanded") === "true";
    } catch {
      return false;
    }
  });

  /* Persist expanded state */
  useEffect(() => {
    try {
      localStorage.setItem("catforcat-toolbar-expanded", String(expanded));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  useEffect(() => {
    const check = () => setIsCompact(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!exportOpen && !avatarOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        exportOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
      if (
        avatarOpen &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen, avatarOpen]);

  const handleExport = async (format: string) => {
    setExporting(format);
    setExportOpen(false);
    try {
      const url = `/api/files/export?projectId=${projectId}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        onToast?.(data.error || "Export failed");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename="(.+?)"/);
      const fileName =
        fileNameMatch?.[1] ||
        `export.${format === "tmx" ? "tmx" : format === "docx" ? "docx" : "txt"}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      onToast?.("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const userName = session?.user?.name || "";
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || (session?.user?.email?.[0] || "U").toUpperCase();
  const ring = AVATAR_RING[theme] || AVATAR_RING.dark;
  const isPro = userPlan === "pro";

  /* ─── Toolbar icon button style helper ─── */
  const toolIconStyle = (active: boolean): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: 6,
    border: "none",
    background: active ? "var(--bg-hover)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 150ms ease",
    flexShrink: 0,
  });

  return (
    <>
      {/* PRO shimmer keyframe */}
      <style>{`
        @keyframes proShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        className="editor-header glass-header-fade"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 52,
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* ── LEFT: Logo (link back) + Project name ── */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}
        >
          <Link
            href="/app/projects"
            style={{
              textDecoration: "none",
              fontFamily: "var(--font-display-family)",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--brand-wordmark)",
              letterSpacing: "0.03em",
              cursor: "pointer",
              transition: "opacity 150ms",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            title="Back to projects"
          >
            catforcat.
          </Link>

          <span
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              maxWidth: 280,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {projectName}
          </span>
        </div>

        {/* ── CENTER: Book page counter ── */}
        {!isCompact && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 0, flex: "0 0 auto" }}>
            <span style={{ fontFamily: "var(--font-editor-family)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
              {activeSegment ?? 1}
            </span>
            <span style={{ fontFamily: "var(--font-editor-family)", fontSize: 14, color: "var(--text-primary)", opacity: 0.25 }}>/</span>
            <span style={{ fontFamily: "var(--font-editor-family)", fontSize: 14, color: "var(--text-primary)", opacity: 0.35 }}>
              {totalCount}
            </span>
          </div>
        )}

        {/* ── RIGHT: Tool icons + Export + Save + Avatar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flex: 1,
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          {/* Pre-translate icon */}
          {!isCompact && (
            <button
              onClick={() => onPreTranslate?.("full")}
              disabled={preTranslating}
              style={{
                ...toolIconStyle(false),
                opacity: preTranslating ? 0.4 : 1,
                cursor: preTranslating ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => { if (!preTranslating) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              title="Pre-translate"
            >
              <Sparkles size={15} />
            </button>
          )}

          {/* Pre-translate progress */}
          {preTranslateProgress?.running && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "var(--accent)",
                fontFamily: "var(--font-editor-family)",
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

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: "var(--border)", opacity: 0.4, margin: "0 4px", flexShrink: 0 }} />

          {/* ── 3 Primary tool icons ── */}
          <button
            onClick={() => onPanelToggle?.("tm")}
            style={toolIconStyle(activePanel === "tm")}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = activePanel === "tm" ? "var(--bg-hover)" : "transparent";
              e.currentTarget.style.color = activePanel === "tm" ? "var(--text-primary)" : "var(--text-secondary)";
            }}
            title="TM Matches"
          >
            <Languages size={15} />
          </button>

          <button
            onClick={() => onPanelToggle?.("glossary")}
            style={toolIconStyle(activePanel === "glossary")}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = activePanel === "glossary" ? "var(--bg-hover)" : "transparent";
              e.currentTarget.style.color = activePanel === "glossary" ? "var(--text-primary)" : "var(--text-secondary)";
            }}
            title="Glossary"
          >
            <Book size={15} />
          </button>

          <button
            onClick={onRunQA}
            disabled={qaRunning}
            style={{
              ...toolIconStyle(false),
              opacity: qaRunning ? 0.4 : 1,
              cursor: qaRunning ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!qaRunning) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            title="QA Check"
          >
            <FileCheck size={15} />
          </button>

          {/* ── Secondary icons (push animation container) ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              overflow: "hidden",
              maxWidth: expanded ? 200 : 0,
              transition: "max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onSearchOpen}
              style={toolIconStyle(false)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              title="Find & Replace"
            >
              <Search size={15} />
            </button>

            <button
              onClick={onConcordanceOpen}
              style={toolIconStyle(false)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              title="Concordance Search"
            >
              <TextSearch size={15} />
            </button>

            <button
              onClick={onNotesOpen}
              style={toolIconStyle(false)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              title="Notes"
            >
              <StickyNote size={15} />
            </button>

            <button
              onClick={onAnalysis}
              style={toolIconStyle(false)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              title="Analysis"
            >
              <BarChart3 size={15} />
            </button>
          </div>

          {/* Expand/collapse arrow */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              ...toolIconStyle(false),
              width: 24,
              height: 24,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            title={expanded ? "Collapse toolbar" : "Expand toolbar"}
          >
            <ChevronRight
              size={13}
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
            />
          </button>

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: "var(--border)", opacity: 0.4, margin: "0 4px", flexShrink: 0 }} />

          {/* Export button — icon-only */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              style={toolIconStyle(exportOpen)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = exportOpen ? "var(--bg-hover)" : "transparent";
                e.currentTarget.style.color = exportOpen ? "var(--text-primary)" : "var(--text-secondary)";
              }}
              title="Export"
            >
              <Download size={15} />
            </button>

            {/* Export dropdown */}
            {exportOpen && (
              <div
                className="glass-panel"
                style={{
                  position: "absolute",
                  top: 36,
                  right: 0,
                  width: 220,
                  background: "var(--bg-panel)",
                  borderRadius: "var(--radius)",
                  padding: "6px 0",
                  zIndex: 40,
                  animation: "fadeSlideIn 150ms ease-out",
                }}
              >
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.key}
                    onClick={() => handleExport(fmt.key)}
                    disabled={!!exporting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "7px 14px",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      cursor: exporting ? "wait" : "pointer",
                      fontFamily: "var(--font-ui-family)",
                      transition: "background 120ms",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span style={{ fontWeight: 450 }}>{fmt.label}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {fmt.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {exporting && (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              Exporting...
            </span>
          )}

          {/* Fullscreen toggle */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              title={isFullscreen ? "Exit fullscreen (F11)" : "Fullscreen (F11)"}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}

          {/* SaveDot */}
          <SaveDot
            isSaving={saving}
            lastSavedAt={lastSavedAt ?? null}
            saveError={saveError ?? null}
            compact={expanded}
          />

          {/* ── Avatar section (pushed off by expanded icons) ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            {/* Avatar with gradient ring + PRO shimmer */}
            <div ref={avatarRef} style={{ position: "relative" }}>
              <div
                onClick={() => setAvatarOpen(!avatarOpen)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: isPro ? ring.gradient : ring.gradient,
                  backgroundSize: isPro ? "200% 200%" : undefined,
                  animation: isPro ? "proShimmer 3s ease infinite" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: isPro ? 2 : 1.5,
                  border: isPro ? "none" : "1px solid var(--border)",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: ring.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-ui-family)",
                  }}
                >
                  {userInitials}
                </div>
              </div>

              {/* Avatar dropdown */}
              {avatarOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: "absolute",
                    top: 38,
                    right: 0,
                    width: 220,
                    background: "var(--bg-panel)",
                    borderRadius: "var(--radius)",
                    zIndex: 40,
                    animation: "fadeSlideIn 150ms ease-out",
                    overflow: "hidden",
                  }}
                >
                  {/* User info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
                    <div
                      style={{
                        width: 24, height: 24, borderRadius: "50%", background: ring.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: isPro ? 2 : 1.5, flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: "100%", height: "100%", borderRadius: "50%", background: ring.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)",
                      }}>
                        {userInitials}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {userName || session?.user?.email || "User"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-ui-family)" }}>
                        {isPro ? "Pro plan" : "Free plan"}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "0.5px solid var(--border)" }} />

                  {/* Settings */}
                  <Link href="/app/settings" onClick={() => setAvatarOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, textDecoration: "none", color: "var(--text-primary)", background: "transparent", transition: "background 150ms", cursor: "pointer", fontFamily: "var(--font-ui-family)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Settings size={13} style={{ color: "var(--text-secondary)" }} />
                    <span>Settings</span>
                  </Link>

                  {/* Changelog */}
                  <Link href="/changelog" onClick={() => setAvatarOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, textDecoration: "none", color: "var(--text-primary)", background: "transparent", transition: "background 150ms", cursor: "pointer", fontFamily: "var(--font-ui-family)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <FileText size={13} style={{ color: "var(--text-secondary)" }} />
                    <span>Changelog</span>
                  </Link>

                  {/* Theme picker */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", fontFamily: "var(--font-ui-family)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Theme</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {THEME_DOTS.map((t) => (
                        <div key={t.id} onClick={() => setTheme(t.id)}
                          style={{ width: theme === t.id ? 16 : 14, height: theme === t.id ? 16 : 14, borderRadius: "50%", background: t.color, border: theme === t.id ? "1.5px solid var(--accent)" : t.border, cursor: "pointer", transition: "all 150ms" }}
                          title={t.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: "0.5px solid var(--border)" }} />

                  {/* Upgrade to Pro */}
                  {!isPro && (
                    <>
                      <button onClick={() => { setAvatarOpen(false); router.push("/app/settings"); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, color: "var(--accent)", background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-ui-family)", transition: "background 150ms" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Star size={13} style={{ color: "var(--accent)" }} />
                        <span>Upgrade to Pro</span>
                      </button>
                      <div style={{ borderTop: "0.5px solid var(--border)" }} />
                    </>
                  )}

                  {/* Sign out */}
                  <button onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, width: "100%", textAlign: "left", color: "var(--text-muted)", background: "transparent", border: "none", fontFamily: "var(--font-ui-family)", transition: "background 150ms", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut size={13} style={{ color: "var(--text-muted)" }} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
