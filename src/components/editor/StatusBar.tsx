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
  const pillStyle: React.CSSProperties = {
    background: "var(--bg-hover)",
    border: "0.5px solid var(--border)",
    borderRadius: 10,
    padding: "2px 8px",
    fontSize: 9,
    color: "var(--text-muted)",
    fontFamily: "'JetBrains Mono', monospace",
    cursor: "pointer",
    transition: "color 150ms, border-color 150ms",
  };

  return (
    <div
      style={{
        height: 28,
        minHeight: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        background: "var(--status-bar)",
        borderTop: "0.5px solid var(--border)",
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        color: "var(--text-muted)",
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
            gap: 4,
            padding: "2px 8px",
            borderRadius: 10,
            background: "var(--bg-hover)",
            border: "0.5px solid var(--border)",
            cursor: "pointer",
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: "border-color 150ms, color 150ms",
            marginRight: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard size={11} />
          <span>Shortcuts</span>
        </button>

        <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>

        <button
          onClick={onGoToClick}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 0,
            fontFamily: "inherit",
            fontSize: "inherit",
            transition: "color 200ms",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
          title="Go to segment"
        >
          Seg {activeSegmentPosition}/{totalSegments}
        </button>
        <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
        <span>{activeSegmentWordCount} words</span>
        <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
        <span>{totalWordCount} total</span>

        {/* Focus mode badge */}
        {focusMode && (
          <>
            <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
            <span style={{ color: "var(--accent)", fontWeight: 500 }}>
              Focus
            </span>
          </>
        )}
      </div>

      {/* Right: Provider pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onProviderClick}
          style={pillStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
          title="Change translation provider"
        >
          {translationProvider}
        </button>
      </div>
    </div>
  );
}
