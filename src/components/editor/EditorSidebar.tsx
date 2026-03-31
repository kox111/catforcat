"use client";

import { useState, useEffect } from "react";
import {
  TextSearch,
  Search,
  Book,
  StickyNote,
  FileCheck,
  BarChart3,
} from "lucide-react";

interface EditorSidebarProps {
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onNotesOpen?: () => void;
  onRunQA?: () => void;
  onAnalysis?: () => void;
  qaRunning?: boolean;
  activePanel?: string | null;
  onPanelToggle?: (panel: string) => void;
}

const SIDEBAR_ITEMS = [
  { id: "concordance", icon: TextSearch, label: "Search translations", shortcut: "Ctrl+K" },
  { id: "search", icon: Search, label: "Find & replace", shortcut: "Ctrl+H" },
  { id: "glossary", icon: Book, label: "Glossary" },
  { id: "notes", icon: StickyNote, label: "Notes" },
  { id: "qa", icon: FileCheck, label: "QA check", shortcut: "Ctrl+Q" },
  { id: "analysis", icon: BarChart3, label: "Analysis" },
];

export default function EditorSidebar({
  onSearchOpen,
  onConcordanceOpen,
  onNotesOpen,
  onRunQA,
  onAnalysis,
  qaRunning,
  activePanel,
  onPanelToggle,
}: EditorSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(1440);

  useEffect(() => {
    const check = () => setWindowWidth(window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Hide on very small screens
  if (windowWidth < 768) return null;

  const actionMap: Record<string, (() => void) | undefined> = {
    concordance: onConcordanceOpen,
    search: onSearchOpen,
    glossary: () => onPanelToggle?.("glossary"),
    notes: onNotesOpen,
    qa: onRunQA,
    analysis: onAnalysis,
  };

  const isDisabled = (id: string) => id === "qa" && qaRunning;
  const isActive = (id: string) => id === "glossary" && activePanel === "glossary";

  return (
    <div
      style={{
        width: 44,
        minWidth: 44,
        height: "100%",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 0",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {SIDEBAR_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const hovered = hoveredItem === item.id;
        const pressed = pressedItem === item.id;
        const active = isActive(item.id);
        const disabled = isDisabled(item.id);

        // Add separator between groups: after search (idx 1), after notes (idx 3)
        const showSep = i === 2 || i === 4;

        return (
          <div key={item.id} style={{ display: "contents" }}>
            {showSep && (
              <div
                style={{
                  width: 20,
                  height: 0.5,
                  background: "var(--border)",
                  margin: "6px 0",
                  opacity: 0.5,
                }}
              />
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={actionMap[item.id]}
                disabled={disabled}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => {
                  setHoveredItem(null);
                  setPressedItem(null);
                }}
                onMouseDown={() => setPressedItem(item.id)}
                onMouseUp={() => setPressedItem(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: active
                    ? "0.5px solid var(--glass-active-border)"
                    : hovered
                      ? "0.5px solid var(--glass-border)"
                      : "0.5px solid transparent",
                  background: active
                    ? "var(--glass-active-bg)"
                    : hovered
                      ? "var(--glass-bg)"
                      : "transparent",
                  color: active
                    ? "var(--text-primary)"
                    : disabled
                      ? "var(--text-muted)"
                      : hovered
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 160ms ease-out",
                  opacity: disabled ? 0.4 : 1,
                  boxShadow: active
                    ? "var(--glass-active-shadow)"
                    : hovered
                      ? "var(--btn-glow-hover)"
                      : "none",
                  transform: pressed
                    ? "scale(0.92)"
                    : hovered
                      ? "translateY(-1px)"
                      : "none",
                }}
              >
                <Icon size={16} />
              </button>

              {/* Tooltip */}
              {hovered && !pressed && (
                <div
                  style={{
                    position: "absolute",
                    left: "calc(100% + 8px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "var(--bg-panel)",
                    border: "0.5px solid var(--glass-border)",
                    borderRadius: 8,
                    padding: "5px 12px",
                    boxShadow: "var(--shadow-md), var(--panel-glow)",
                    whiteSpace: "nowrap",
                    zIndex: 50,
                    pointerEvents: "none",
                    animation: "fadeSlideIn 100ms ease-out",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-ui-family)",
                      fontSize: 11,
                      fontWeight: 450,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <span
                      style={{
                        fontFamily: "var(--font-editor-family)",
                        fontSize: 9,
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
