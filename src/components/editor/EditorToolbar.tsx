"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, Settings, LogOut, Star, FileText } from "lucide-react";
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
  {
    id: "dark",
    color: "#202124",
    border: "0.5px solid #3C3C3F",
    label: "Dark",
  },
  {
    id: "sakura",
    color: "#EFC4CC",
    border: "0.5px solid #ffffff33",
    label: "Sakura",
  },
  {
    id: "light",
    color: "#F7F6F3",
    border: "0.5px solid #ECEAE5",
    label: "Light",
  },
  {
    id: "linen",
    color: "#C4AA90",
    border: "0.5px solid #B09878",
    label: "Linen",
  },
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
  segmentFilter = "all",
  onFilterChange,
  preTranslateProgress,
  lastSavedAt,
  saveError,
  progress = 0,
  confirmedCount = 0,
  totalCount = 0,
  onToast,
  exportOpen: exportOpenProp,
  onExportOpenChange,
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
    <>
      <style>{`
        @keyframes topBarDropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ Unified Editor Header Bar ═══ */}
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
        {/* ── Left: catforcat. › project-name [EN → ES] ── */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 0, minWidth: 0 }}
        >
          {/* Wordmark */}
          <Link
            href="/app/projects"
            style={{
              textDecoration: "none",
              fontFamily: "'Playfair Display', Georgia, serif",
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

          {/* Separator */}
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

          {/* Project name */}
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
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

          {/* Lang pair badge */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
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

        {/* ── Right: progress + save + [PRO] + Avatar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {/* Progress counter + bar */}
          {!isCompact && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {confirmedCount}/{totalCount}
              </span>

              <div
                style={{
                  width: 50,
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
          {exporting && (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              Exporting...
            </span>
          )}

          {/* Save indicator — right next to avatar */}
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
                fontFamily: "'Inter', system-ui, sans-serif",
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
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: ring.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: isPro ? 2.5 : 1.5,
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
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  fontFamily: "'Inter', system-ui, sans-serif",
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
                  top: 40,
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: ring.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isPro ? 2 : 1.5,
                      flexShrink: 0,
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
                        fontSize: 10,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {userInitials}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userName || session?.user?.email || "User"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {isPro ? "Pro plan" : "Free plan"}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "0.5px solid var(--border)" }} />

                {/* Settings */}
                <Link
                  href="/app/settings"
                  onClick={() => setAvatarOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    fontSize: 13,
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    background: "transparent",
                    transition: "background 150ms",
                    cursor: "pointer",
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Settings
                    size={13}
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <span>Settings</span>
                </Link>

                {/* Changelog */}
                <Link
                  href="/changelog"
                  onClick={() => setAvatarOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    fontSize: 13,
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    background: "transparent",
                    transition: "background 150ms",
                    cursor: "pointer",
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <FileText
                    size={13}
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <span>Changelog</span>
                </Link>

                {/* Theme picker */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 14px",
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-secondary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span
                      style={{ fontSize: 13, color: "var(--text-primary)" }}
                    >
                      Theme
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    {THEME_DOTS.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        style={{
                          width: theme === t.id ? 16 : 14,
                          height: theme === t.id ? 16 : 14,
                          borderRadius: "50%",
                          background: t.color,
                          border:
                            theme === t.id
                              ? "1.5px solid var(--accent)"
                              : t.border,
                          cursor: "pointer",
                          transition: "all 150ms",
                        }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: "0.5px solid var(--border)" }} />

                {/* Upgrade to Pro */}
                {!isPro && (
                  <>
                    <button
                      onClick={() => {
                        setAvatarOpen(false);
                        router.push("/app/settings");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 14px",
                        fontSize: 13,
                        color: "var(--accent)",
                        background: "transparent",
                        border: "none",
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Star size={13} style={{ color: "var(--accent)" }} />
                      <span>Upgrade to Pro</span>
                    </button>
                    <div style={{ borderTop: "0.5px solid var(--border)" }} />
                  </>
                )}

                {/* Sign out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    fontSize: 13,
                    width: "100%",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    background: "transparent",
                    border: "none",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    transition: "background 150ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut size={13} style={{ color: "var(--text-muted)" }} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
