"use client";

import { useEffect } from "react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Ctrl + ↑", description: "Previous segment" },
      { keys: "Ctrl + ↓", description: "Next segment" },
      { keys: "Ctrl + G", description: "Go to segment #" },
      { keys: "Escape", description: "Deselect / close modal" },
    ],
  },
  {
    title: "Translation",
    shortcuts: [
      { keys: "Ctrl + Enter", description: "Confirm segment + next" },
      { keys: "Ctrl + Shift + Enter", description: "AI translation suggestion" },
      { keys: "Ctrl + D", description: "Copy source to target" },
      { keys: "Ctrl + 1/2/3", description: "Apply TM match #1/2/3" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Ctrl + ↑ / ↓", description: "Previous / next segment" },
      { keys: "Ctrl + G", description: "Go to segment" },
      { keys: "F11", description: "Fullscreen" },
    ],
  },
  {
    title: "Search & Reference",
    shortcuts: [
      { keys: "Ctrl + H", description: "Find & replace" },
      { keys: "Ctrl + K", description: "Concordance search (TM)" },
      { keys: "Ctrl + E", description: "Add to glossary" },
      { keys: "Ctrl + Q", description: "Run QA check" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: "Ctrl + Z", description: "Undo" },
      { keys: "Ctrl + Shift + Z", description: "Redo" },
      { keys: "Ctrl + /", description: "Show shortcuts" },
      { keys: "Right-click", description: "Context menu" },
    ],
  },
];

interface ShortcutsModalProps {
  onClose: () => void;
}

export default function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          borderRadius: "0.5rem",
          width: "100%",
          maxWidth: "32rem",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-md)",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: "0.875rem",
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              color: "var(--text-muted)",
            }}
          >
            Esc
          </button>
        </div>

        <div
          style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--accent)",
                }}
              >
                {group.title}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {group.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "0.25rem",
                      paddingBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {s.description}
                    </span>
                    <kbd
                      style={{
                        fontSize: "0.75rem",
                        paddingLeft: "0.5rem",
                        paddingRight: "0.5rem",
                        paddingTop: "0.125rem",
                        paddingBottom: "0.125rem",
                        borderRadius: "0.25rem",
                        fontFamily: "monospace",
                        background: "var(--bg-deep)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
