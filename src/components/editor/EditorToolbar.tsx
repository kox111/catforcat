"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Star, FileText, Sparkles, Download, Maximize, Minimize } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useUserPlan } from "@/components/UserPlanProvider";
import SaveIndicator from "@/components/editor/SaveIndicator";

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
};

const THEME_DOTS: {
  id: Theme;
  color: string;
  border: string;
  label: string;
}[] = [
  { id: "dark", color: "#202124", border: "0.5px solid #3C3C3F", label: "Dark" },
  { id: "sakura", color: "#EFC4CC", border: "0.5px solid #ffffff33", label: "Sakura" },
  { id: "light", color: "#F7F6F3", border: "0.5px solid #ECEAE5", label: "Light" },
  { id: "linen", color: "#C4AA90", border: "0.5px solid #B09878", label: "Linen" },
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
  const [preHover, setPreHover] = useState(false);
  const [exportHover, setExportHover] = useState(false);
  const [aMinusHover, setAMinusHover] = useState(false);
  const [aPlusHover, setAPlusHover] = useState(false);

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

  return (
    <div
      className="editor-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 44,
        background: "var(--bg-deep)",
        borderBottom: "0.5px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* ── LEFT: Breadcrumbs ── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 0, minWidth: 0, flex: 1 }}
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
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          catforcat.
        </Link>

        <span
          style={{
            fontFamily: "var(--font-editor-family)",
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--text-muted)",
            background: "var(--glass-bg)",
            border: "0.5px solid var(--border)",
            borderRadius: 4,
            padding: "1px 4px",
            marginLeft: 6,
            flexShrink: 0,
            lineHeight: 1.4,
          }}
        >
          BETA
        </span>

        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            margin: "0 8px",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          ›
        </span>

        <span
          style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 13,
            color: "var(--text-primary)",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {projectName}
        </span>

        <span
          style={{
            fontFamily: "var(--font-editor-family)",
            fontSize: 11,
            color: "var(--text-secondary)",
            background: "var(--bg-card)",
            padding: "2px 8px",
            borderRadius: 4,
            marginLeft: 12,
            flexShrink: 0,
          }}
        >
          {srcLang} → {tgtLang}
        </span>
      </div>

      {/* ── CENTER: Pre-translate + progress ── */}
      {!isCompact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: "0 0 auto",
          }}
        >
          <button
            onClick={() => onPreTranslate?.("full")}
            disabled={preTranslating}
            onMouseEnter={() => setPreHover(true)}
            onMouseLeave={() => setPreHover(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 14px",
              borderRadius: 7,
              border: "0.5px solid var(--amber-soft)",
              background:
                preHover && !preTranslating
                  ? "linear-gradient(135deg, var(--amber-soft), transparent)"
                  : "var(--glass-bg)",
              color: preTranslating ? "var(--text-muted)" : "var(--amber-text)",
              cursor: preTranslating ? "not-allowed" : "pointer",
              opacity: preTranslating ? 0.5 : 1,
              fontFamily: "var(--font-ui-family)",
              fontSize: 11,
              fontWeight: 450,
              transition: "all 180ms ease-out",
              boxShadow:
                preHover && !preTranslating
                  ? "0 0 14px var(--amber-soft), var(--btn-depth)"
                  : "var(--btn-depth)",
            }}
          >
            <Sparkles size={13} />
            <span>Pre-translate</span>
          </button>

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

          {/* Progress counter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: "var(--font-editor-family)",
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {confirmedCount}/{totalCount}
            </span>
            <div
              style={{
                width: 40,
                height: 2,
                background: "var(--border)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 1,
                  background: "var(--green)",
                  transition: "width 400ms ease",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT: A-/A+ · Export · Save · Avatar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        {/* Font size controls */}
        {!isCompact && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 4 }}>
            <button
              onClick={() => onFontSizeChange?.(Math.max(10, editorFontSize - 2))}
              disabled={editorFontSize <= 10}
              onMouseEnter={() => setAMinusHover(true)}
              onMouseLeave={() => setAMinusHover(false)}
              style={{
                padding: "2px 6px",
                borderRadius: 5,
                border: `0.5px solid ${aMinusHover && editorFontSize > 10 ? "var(--accent)" : "var(--border)"}`,
                background: aMinusHover && editorFontSize > 10 ? "var(--glass-bg)" : "transparent",
                fontFamily: "var(--font-editor-family)",
                fontSize: 10,
                color: editorFontSize <= 10 ? "var(--text-muted)" : aMinusHover ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: editorFontSize <= 10 ? "default" : "pointer",
                opacity: editorFontSize <= 10 ? 0.4 : 1,
                transition: "all 150ms ease-out",
              }}
            >
              A−
            </button>
            <span
              style={{
                fontFamily: "var(--font-editor-family)",
                fontSize: 10,
                color: "var(--text-muted)",
                padding: "0 2px",
                minWidth: 14,
                textAlign: "center",
              }}
            >
              {editorFontSize}
            </span>
            <button
              onClick={() => onFontSizeChange?.(Math.min(24, editorFontSize + 2))}
              disabled={editorFontSize >= 24}
              onMouseEnter={() => setAPlusHover(true)}
              onMouseLeave={() => setAPlusHover(false)}
              style={{
                padding: "2px 6px",
                borderRadius: 5,
                border: `0.5px solid ${aPlusHover && editorFontSize < 24 ? "var(--accent)" : "var(--border)"}`,
                background: aPlusHover && editorFontSize < 24 ? "var(--glass-bg)" : "transparent",
                fontFamily: "var(--font-editor-family)",
                fontSize: 10,
                color: editorFontSize >= 24 ? "var(--text-muted)" : aPlusHover ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: editorFontSize >= 24 ? "default" : "pointer",
                opacity: editorFontSize >= 24 ? 0.4 : 1,
                transition: "all 150ms ease-out",
              }}
            >
              A+
            </button>
          </div>
        )}

        {/* Separator */}
        {!isCompact && (
          <div style={{ width: 0.5, height: 16, background: "var(--border)", margin: "0 4px", opacity: 0.5 }} />
        )}

        {/* Export button */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            onMouseEnter={() => setExportHover(true)}
            onMouseLeave={() => setExportHover(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: 7,
              border: "0.5px solid var(--action-border)",
              background: exportHover ? "var(--action-gradient)" : "var(--glass-bg)",
              color: exportHover ? "var(--green-text)" : "var(--text-secondary)",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
              fontSize: 11,
              fontWeight: 450,
              transition: "all 180ms ease-out",
              boxShadow: exportHover ? "var(--action-glow), var(--btn-depth)" : "var(--btn-depth)",
            }}
          >
            <Download size={12} />
            <span>Export</span>
          </button>

          {/* Export dropdown */}
          {exportOpen && (
            <div
              style={{
                position: "absolute",
                top: 36,
                right: 0,
                width: 220,
                background: "var(--bg-panel)",
                backdropFilter: "blur(16px) saturate(140%)",
                border: "0.5px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "6px 0",
                zIndex: 40,
                boxShadow: "var(--shadow-md), var(--panel-glow)",
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

        {/* Separator */}
        <div style={{ width: 0.5, height: 16, background: "var(--border)", margin: "0 2px", opacity: 0.5 }} />

        {/* Save indicator */}
        <SaveIndicator
          hasPendingChanges={hasPendingChanges}
          lastSavedAt={lastSavedAt ?? null}
          saveError={saveError ?? null}
        />

        {/* PRO pill */}
        {isPro && (
          <span
            style={{
              padding: "1px 4px",
              borderRadius: 6,
              background: ring.gradient,
              fontFamily: "var(--font-ui-family)",
              fontSize: 7,
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: "var(--bg-deep)",
              lineHeight: 1,
            }}
          >
            PRO
          </span>
        )}

        {/* Avatar with gradient ring */}
        <div ref={avatarRef} style={{ position: "relative" }}>
          <div
            onClick={() => setAvatarOpen(!avatarOpen)}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: ring.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: isPro ? 2 : 1.5,
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
              style={{
                position: "absolute",
                top: 38,
                right: 0,
                width: 220,
                background: "var(--bg-panel)",
                backdropFilter: "blur(16px) saturate(140%)",
                border: "0.5px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                zIndex: 40,
                boxShadow: "var(--shadow-md), var(--panel-glow)",
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
  );
}
