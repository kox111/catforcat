"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TextSearch,
  Search,
  Book,
  StickyNote,
  Sparkles,
  FileCheck,
  BarChart3,
  FolderOutput,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface EditorSidebarProps {
  onPreTranslate?: (mode: "tm-only" | "full") => void;
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onGlossaryOpen?: () => void;
  onNotesOpen?: () => void;
  onRunQA?: () => void;
  onAnalysis?: () => void;
  onExportOpen?: () => void;
  editorFontSize?: number;
  onFontSizeChange?: (size: number) => void;
  qaRunning?: boolean;
  preTranslating?: boolean;
  activePanel?: string | null;
  onPanelToggle?: (panel: string) => void;
}

const STORAGE_KEY = "catforcat-sidebar-expanded";

function SidebarTooltip({
  label,
  visible,
}: {
  label: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "calc(100% + 8px)",
        top: "50%",
        transform: "translateY(-50%)",
        background: "var(--bg-panel)",
        border: "0.5px solid var(--border)",
        borderRadius: 6,
        padding: "4px 10px",
        boxShadow: "var(--shadow-md)",
        whiteSpace: "nowrap",
        zIndex: 50,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        color: "var(--text-primary)",
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}

export default function EditorSidebar({
  onPreTranslate,
  onSearchOpen,
  onConcordanceOpen,
  onGlossaryOpen,
  onNotesOpen,
  onRunQA,
  onAnalysis,
  onExportOpen,
  editorFontSize = 13,
  onFontSizeChange,
  qaRunning,
  preTranslating,
  activePanel,
  onPanelToggle,
}: EditorSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(1440);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setExpanded(stored === "true");
    const check = () => setWindowWidth(window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Hide completely below 1080px
  if (windowWidth < 1080) return null;

  // Auto-collapse between 1080-1439
  const isExpanded =
    windowWidth >= 1440 ? expanded : expanded && windowWidth >= 1440;
  const sidebarWidth = isExpanded ? 200 : 44;

  const pillStyle = (
    active?: boolean,
    special?: boolean,
  ): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: isExpanded ? 6 : 0,
    padding: isExpanded ? "5px 12px" : "5px 0",
    borderRadius: 20,
    border: special
      ? "0.5px solid var(--amber-soft)"
      : active
        ? "0.5px solid var(--accent)"
        : "0.5px solid var(--border)",
    background: special
      ? "linear-gradient(135deg, var(--amber-soft), transparent)"
      : active
        ? "var(--accent-soft)"
        : "transparent",
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
    color: special
      ? "var(--amber-text)"
      : active
        ? "var(--text-primary)"
        : "var(--text-muted)",
    transition: "border-color 150ms, color 150ms, background 150ms",
    marginBottom: 4,
    width: isExpanded ? "fit-content" : 32,
    height: isExpanded ? "auto" : 32,
    justifyContent: isExpanded ? "flex-start" : "center",
    position: "relative" as const,
  });

  const items = [
    {
      group: "search",
      buttons: [
        {
          id: "concordance",
          icon: <TextSearch size={13} />,
          label: "Translations",
          onClick: onConcordanceOpen,
        },
        {
          id: "search",
          icon: <Search size={13} />,
          label: "Find & replace",
          onClick: onSearchOpen,
        },
      ],
    },
    {
      group: "reference",
      buttons: [
        {
          id: "glossary",
          icon: <Book size={13} />,
          label: "Glossary",
          onClick: () => onPanelToggle?.("glossary"),
          active: activePanel === "glossary",
        },
        {
          id: "notes",
          icon: <StickyNote size={13} />,
          label: "Notes",
          onClick: onNotesOpen,
        },
      ],
    },
    {
      group: "translate",
      buttons: [
        {
          id: "pretranslate",
          icon: <Sparkles size={13} />,
          label: "Pre-translate all",
          onClick: () => onPreTranslate?.("full"),
          special: true,
          disabled: preTranslating,
        },
      ],
    },
    {
      group: "review",
      buttons: [
        {
          id: "qa",
          icon: <FileCheck size={13} />,
          label: "QA",
          onClick: onRunQA,
          disabled: qaRunning,
        },
        {
          id: "analysis",
          icon: <BarChart3 size={13} />,
          label: "Analysis",
          onClick: onAnalysis,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: "100%",
        background: "var(--bg-sidebar)",
        borderRight: "0.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: isExpanded ? "12px 10px" : "12px 6px",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
        transition:
          "width 200ms ease, min-width 200ms ease, padding 200ms ease",
        position: "relative",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={toggle}
        style={{
          position: "absolute",
          top: 8,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          boxShadow: "var(--shadow-sm)",
          transition: "background 150ms",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {isExpanded ? (
          <PanelLeftClose size={12} />
        ) : (
          <PanelLeftOpen size={12} />
        )}
      </button>

      {/* Groups */}
      {items.map((group, gi) => (
        <div key={group.group}>
          {/* Group title */}
          {isExpanded && (
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 9,
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "lowercase",
                marginBottom: 6,
                marginTop: gi === 0 ? 0 : 16,
                paddingLeft: 4,
                transition: "opacity 150ms ease",
              }}
            >
              {group.group}
            </div>
          )}

          {/* Collapsed separator */}
          {!isExpanded && gi > 0 && (
            <div
              style={{
                width: 24,
                height: 0.5,
                background: "var(--border)",
                margin: "8px auto",
              }}
            />
          )}

          {/* Buttons */}
          {group.buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={btn.onClick}
              disabled={"disabled" in btn ? btn.disabled : false}
              onMouseEnter={() => setHoveredItem(btn.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                ...pillStyle(
                  "active" in btn ? btn.active : false,
                  "special" in btn ? btn.special : false,
                ),
                opacity: "disabled" in btn && btn.disabled ? 0.5 : 1,
                pointerEvents:
                  "disabled" in btn && btn.disabled ? "none" : "auto",
              }}
            >
              {btn.icon}
              {isExpanded && (
                <span
                  style={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "opacity 150ms ease 50ms, max-width 150ms ease",
                  }}
                >
                  {btn.label}
                </span>
              )}
              {!isExpanded && (
                <SidebarTooltip
                  label={btn.label}
                  visible={hoveredItem === btn.id}
                />
              )}
            </button>
          ))}
        </div>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* View group — Font size */}
      {isExpanded && (
        <>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 9,
              fontStyle: "italic",
              fontWeight: 400,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "lowercase",
              marginBottom: 6,
              marginTop: 16,
              paddingLeft: 4,
            }}
          >
            view
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <button
              onClick={() =>
                onFontSizeChange?.(Math.max(10, editorFontSize - 1))
              }
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                border: "0.5px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                cursor: "pointer",
                transition: "border-color 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              A−
            </button>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--text-muted)",
                padding: "4px 8px",
                borderRadius: 20,
                border: "0.5px solid var(--border)",
                minWidth: 16,
                textAlign: "center",
              }}
            >
              {editorFontSize}
            </span>
            <button
              onClick={() =>
                onFontSizeChange?.(Math.min(24, editorFontSize + 1))
              }
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                border: "0.5px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                cursor: "pointer",
                transition: "border-color 150ms, color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              A+
            </button>
          </div>
        </>
      )}

      {/* Export */}
      {isExpanded ? (
        <button
          onClick={onExportOpen}
          onMouseEnter={() => setHoveredItem("export")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 20,
            border: "0.5px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            marginTop: 8,
            transition: "border-color 150ms, color 150ms",
            width: "fit-content",
          }}
        >
          <FolderOutput size={12} />
          Export
        </button>
      ) : (
        <button
          onClick={onExportOpen}
          onMouseEnter={() => setHoveredItem("export")}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            ...pillStyle(),
            marginTop: 8,
          }}
        >
          <FolderOutput size={13} />
          {!isExpanded && (
            <SidebarTooltip label="Export" visible={hoveredItem === "export"} />
          )}
        </button>
      )}
    </div>
  );
}
