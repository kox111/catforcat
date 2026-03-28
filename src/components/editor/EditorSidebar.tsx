"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TextSearch,
  Search,
  Book,
  StickyNote,
  FileCheck,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface EditorSidebarProps {
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onGlossaryOpen?: () => void;
  onNotesOpen?: () => void;
  onRunQA?: () => void;
  onAnalysis?: () => void;
  editorFontSize?: number;
  onFontSizeChange?: (size: number) => void;
  qaRunning?: boolean;
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
        left: "calc(100% + 10px)",
        top: "50%",
        transform: "translateY(-50%)",
        background: "var(--bg-panel)",
        border: "0.5px solid var(--glass-border)",
        borderRadius: 8,
        padding: "5px 12px",
        boxShadow: "var(--shadow-md), var(--panel-glow)",
        whiteSpace: "nowrap",
        zIndex: 50,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 450,
        color: "var(--text-primary)",
        pointerEvents: "none",
        animation: "fadeSlideIn 120ms ease-out",
        backdropFilter: "blur(8px)",
      }}
    >
      {label}
    </div>
  );
}

export default function EditorSidebar({
  onSearchOpen,
  onConcordanceOpen,
  onGlossaryOpen,
  onNotesOpen,
  onRunQA,
  onAnalysis,
  editorFontSize = 13,
  onFontSizeChange,
  qaRunning,
  activePanel,
  onPanelToggle,
}: EditorSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pressedItem, setPressedItem] = useState<string | null>(null);
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

  const items = [
    {
      group: "search",
      buttons: [
        {
          id: "concordance",
          icon: <TextSearch size={14} />,
          label: "Translations",
          onClick: onConcordanceOpen,
        },
        {
          id: "search",
          icon: <Search size={14} />,
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
          icon: <Book size={14} />,
          label: "Glossary",
          onClick: () => onPanelToggle?.("glossary"),
          active: activePanel === "glossary",
        },
        {
          id: "notes",
          icon: <StickyNote size={14} />,
          label: "Notes",
          onClick: onNotesOpen,
        },
      ],
    },
    {
      group: "review",
      buttons: [
        {
          id: "qa",
          icon: <FileCheck size={14} />,
          label: "QA",
          onClick: onRunQA,
          disabled: qaRunning,
        },
        {
          id: "analysis",
          icon: <BarChart3 size={14} />,
          label: "Analysis",
          onClick: onAnalysis,
        },
      ],
    },
  ];

  const getBtnStyle = (
    btn: { active?: boolean; special?: boolean; disabled?: boolean; id: string },
  ): React.CSSProperties => {
    const isHovered = hoveredItem === btn.id;
    const isPressed = pressedItem === btn.id;
    const isActive = btn.active;
    const isSpecial = btn.special;

    return {
      display: "flex",
      alignItems: "center",
      gap: isExpanded ? 8 : 0,
      padding: isExpanded ? "6px 12px" : "6px 0",
      borderRadius: 8,
      border: isSpecial
        ? "0.5px solid var(--amber-soft)"
        : isActive
          ? "0.5px solid var(--accent)"
          : isHovered
            ? "0.5px solid var(--glass-border)"
            : "0.5px solid transparent",
      background: isSpecial
        ? isHovered
          ? "linear-gradient(135deg, var(--amber-soft), transparent)"
          : "var(--glass-bg)"
        : isActive
          ? "var(--glass-bg-hover)"
          : isHovered
            ? "var(--glass-bg)"
            : "transparent",
      cursor: btn.disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 12,
      fontWeight: isActive ? 500 : 400,
      color: isSpecial
        ? "var(--amber-text)"
        : isActive
          ? "var(--text-primary)"
          : isHovered
            ? "var(--text-primary)"
            : "var(--text-secondary)",
      transition: "all 180ms ease-out",
      marginBottom: 3,
      width: isExpanded ? "100%" : 34,
      height: isExpanded ? "auto" : 34,
      justifyContent: isExpanded ? "flex-start" : "center",
      position: "relative" as const,
      boxShadow: isSpecial && isHovered
        ? "0 0 14px var(--amber-soft), var(--btn-depth)"
        : isActive
          ? "var(--btn-depth-hover)"
          : isHovered
            ? "var(--btn-glow-hover)"
            : "none",
      transform: isPressed
        ? "scale(0.96)"
        : isHovered
          ? "translateY(-0.5px)"
          : "none",
      opacity: btn.disabled ? 0.45 : 1,
      pointerEvents: btn.disabled ? "none" : "auto",
    };
  };

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
        padding: isExpanded ? "12px 10px" : "12px 5px",
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
          boxShadow: "var(--btn-depth)",
          transition: "all 180ms ease-out",
          color: "var(--text-secondary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--glass-bg-hover)";
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "var(--btn-depth-hover)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "var(--btn-depth)";
          e.currentTarget.style.transform = "scale(1)";
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
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 9,
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6,
                marginTop: gi === 0 ? 0 : 18,
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
                width: 20,
                height: 0.5,
                background: "var(--border)",
                margin: "10px auto",
                opacity: 0.6,
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
              onMouseLeave={() => {
                setHoveredItem(null);
                setPressedItem(null);
              }}
              onMouseDown={() => setPressedItem(btn.id)}
              onMouseUp={() => setPressedItem(null)}
              style={getBtnStyle(btn)}
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
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 9,
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
              marginTop: 18,
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
                borderRadius: 8,
                border: "0.5px solid var(--border)",
                background: "var(--glass-bg)",
                color: "var(--text-secondary)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                cursor: "pointer",
                transition: "all 180ms ease-out",
                boxShadow: "var(--btn-depth)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.boxShadow = "var(--btn-depth-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.boxShadow = "var(--btn-depth)";
                e.currentTarget.style.transform = "none";
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
                borderRadius: 8,
                border: "0.5px solid var(--border)",
                background: "var(--glass-bg)",
                minWidth: 16,
                textAlign: "center",
                boxShadow: "var(--btn-depth)",
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
                borderRadius: 8,
                border: "0.5px solid var(--border)",
                background: "var(--glass-bg)",
                color: "var(--text-secondary)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                cursor: "pointer",
                transition: "all 180ms ease-out",
                boxShadow: "var(--btn-depth)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.boxShadow = "var(--btn-depth-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.boxShadow = "var(--btn-depth)";
                e.currentTarget.style.transform = "none";
              }}
            >
              A+
            </button>
          </div>
        </>
      )}

    </div>
  );
}
