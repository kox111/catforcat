"use client";

interface StatusBarProps {
  activeSegmentPosition?: number;
  totalSegments: number;
  activeSegmentWordCount?: number;
  totalWordCount: number;
  translationProvider?: string;
  savedIndicator?: boolean;
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
  savedIndicator,
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
        padding: "0 16px",
        background: "#0F0F0F",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color: "var(--text-muted)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Left items */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={onGoToClick}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "0 4px",
            fontFamily: "inherit",
            fontSize: "inherit",
            transition: "color 200ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          title="Go to segment"
        >
          Seg {activeSegmentPosition}/{totalSegments}
        </button>

        <span>
          {activeSegmentWordCount} words
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 6px" }}>|</span>
          {totalWordCount} total
        </span>
      </div>

      {/* Right items */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={onProviderClick}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            padding: "0 4px",
            fontFamily: "inherit",
            fontSize: "inherit",
            fontWeight: 500,
            transition: "opacity 200ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          title="Change translation provider"
        >
          {translationProvider}
        </button>

        {savedIndicator && (
          <span style={{ color: "var(--green)" }}>Saved</span>
        )}

        <button
          onClick={onShortcutsClick}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "0 4px",
            fontFamily: "inherit",
            fontSize: "inherit",
            transition: "color 200ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          Ctrl+/ Shortcuts
        </button>
      </div>
    </div>
  );
}
