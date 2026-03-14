"use client";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface StatusBarProps {
  activeSegmentPosition?: number;
  totalSegments: number;
  activeSegmentWordCount?: number;
  totalWordCount: number;
  translationProvider?: string;
  savedIndicator?: boolean;
  saveStatus?: SaveStatus;
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
  savedIndicator,
  saveStatus = "idle",
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
    transition: "color 150ms",
  };

  return (
    <div
      style={{
        height: 28,
        minHeight: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--status-bar)",
        borderTop: "1px solid var(--border)",
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        color: "var(--text-muted)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Left: Seg X/Y · words · total */}
      <div style={{ display: "flex", alignItems: "center" }}>
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
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
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
            <span style={{ color: "var(--accent)", fontWeight: 500 }}>Focus</span>
          </>
        )}

        {/* Save status */}
        {(saveStatus !== "idle" || savedIndicator) && (
          <>
            <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color:
                  saveStatus === "saving"
                    ? "var(--amber-text)"
                    : saveStatus === "error"
                    ? "var(--red-text)"
                    : "var(--green-text)",
                animation: saveStatus === "saving" ? "savePulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background:
                    saveStatus === "saving"
                      ? "var(--amber)"
                      : saveStatus === "error"
                      ? "var(--red)"
                      : "var(--green)",
                }}
              />
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "error"
                ? "Error"
                : "Saved"}
            </span>
          </>
        )}
      </div>

      {/* Right: Provider pill + Shortcuts pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={onProviderClick}
          style={pillStyle}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          title="Change translation provider"
        >
          {translationProvider}
        </button>
      </div>

      <style>{`
        @keyframes savePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
