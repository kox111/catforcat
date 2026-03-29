"use client";

import { Keyboard } from "lucide-react";

interface StatusBarProps {
  activeSegmentPosition?: number;
  totalSegments: number;
  activeSegmentWordCount?: number;
  totalWordCount: number;
  translationProvider?: string;
  focusMode?: boolean;
  onGoToClick?: () => void;
  onProviderClick?: () => void;
  onShortcutsClick?: () => void;
}

export default function StatusBar({
  activeSegmentPosition = 1,
  totalSegments,
  activeSegmentWordCount = 0,
  totalWordCount,
  translationProvider = "Google",
  focusMode = false,
  onGoToClick,
  onProviderClick,
  onShortcutsClick,
}: StatusBarProps) {
  return (
    <div
      style={{
        height: 28,
        minHeight: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: "var(--status-bar)",
        borderTop: "0.5px solid var(--border)",
        fontSize: 10,
        fontFamily: "var(--font-editor-family)",
        color: "var(--text-secondary)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Left: Shortcuts pill · Seg X/Y · words · total */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {/* Shortcuts pill */}
        <button
          onClick={onShortcutsClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 10px",
            borderRadius: 6,
            background: "var(--glass-bg)",
            border: "0.5px solid var(--glass-border)",
            cursor: "pointer",
            fontSize: 10,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-ui-family)",
            transition: "all 180ms ease-out",
            marginRight: 10,
            boxShadow: "var(--btn-depth)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.boxShadow = "var(--btn-glow-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.boxShadow = "var(--btn-depth)";
            e.currentTarget.style.transform = "none";
          }}
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard size={11} />
          <span>Shortcuts</span>
        </button>

        <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>

        <button
          onClick={onGoToClick}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 0,
            fontFamily: "inherit",
            fontSize: "inherit",
            transition: "color 180ms ease-out",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          title="Go to segment"
        >
          Seg {activeSegmentPosition}/{totalSegments}
        </button>
        <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
        <span>{activeSegmentWordCount} words</span>
        <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
        <span>{totalWordCount} total</span>

        {/* Focus mode badge */}
        {focusMode && (
          <>
            <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
            <span
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                fontSize: 9,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--accent-soft)",
                border: "0.5px solid var(--accent)",
              }}
            >
              Focus
            </span>
          </>
        )}
      </div>

      {/* Right: Provider pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onProviderClick}
          style={{
            background: "var(--glass-bg)",
            border: "0.5px solid var(--glass-border)",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 9,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-editor-family)",
            cursor: "pointer",
            transition: "all 180ms ease-out",
            boxShadow: "var(--btn-depth)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "var(--btn-glow-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.boxShadow = "var(--btn-depth)";
            e.currentTarget.style.transform = "none";
          }}
          title="Change translation provider"
        >
          {translationProvider}
        </button>
      </div>
    </div>
  );
}
