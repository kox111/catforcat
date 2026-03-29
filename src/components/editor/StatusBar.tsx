"use client";

import { Keyboard } from "lucide-react";

/* ─── Provider logos (original shapes, themed colors) ─── */
function GoogleLogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="var(--accent)"
        opacity="0.8"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="var(--green)"
        opacity="0.85"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="var(--amber)"
        opacity="0.85"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="var(--red)"
        opacity="0.85"
      />
    </svg>
  );
}

function DeepLLogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 12l10 10 10-10L12 2z"
        fill="var(--accent)"
        opacity="0.15"
      />
      <path
        d="M12 5.5l-3.5 3.5h2.2v5.5h2.6V9h2.2L12 5.5z"
        fill="var(--accent)"
      />
      <circle cx="8" cy="16.5" r="1.3" fill="var(--accent)" opacity="0.6" />
      <circle cx="12" cy="18" r="1.3" fill="var(--accent)" opacity="0.8" />
      <circle cx="16" cy="16.5" r="1.3" fill="var(--accent)" opacity="0.6" />
    </svg>
  );
}

function OpenAILogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.28 9.37a5.83 5.83 0 0 0-.5-4.79 5.89 5.89 0 0 0-6.36-2.83A5.84 5.84 0 0 0 11.04 0a5.88 5.88 0 0 0-5.62 4.1 5.83 5.83 0 0 0-3.9 2.83 5.88 5.88 0 0 0 .73 6.89 5.83 5.83 0 0 0 .5 4.79 5.89 5.89 0 0 0 6.36 2.84A5.84 5.84 0 0 0 13.5 24a5.88 5.88 0 0 0 5.62-4.1 5.83 5.83 0 0 0 3.9-2.83 5.88 5.88 0 0 0-.73-6.89l-.01-.01zM13.5 22.3a4.38 4.38 0 0 1-2.81-1.02l.14-.08 4.67-2.7a.76.76 0 0 0 .38-.66v-6.58l1.97 1.14a.07.07 0 0 1 .04.05v5.45a4.4 4.4 0 0 1-4.39 4.4zM3.58 18.2a4.37 4.37 0 0 1-.52-2.94l.14.08 4.67 2.7a.76.76 0 0 0 .76 0l5.7-3.29v2.27a.07.07 0 0 1-.03.06l-4.72 2.73a4.4 4.4 0 0 1-6-1.61zM2.34 7.89A4.37 4.37 0 0 1 4.63 5.96v5.54a.76.76 0 0 0 .38.66l5.7 3.29-1.97 1.14a.07.07 0 0 1-.07 0L4.95 13.86a4.4 4.4 0 0 1-2.6-5.97zm17.3 4.03l-5.7-3.29 1.97-1.14a.07.07 0 0 1 .07 0l4.72 2.73a4.4 4.4 0 0 1-.67 7.93v-5.57a.76.76 0 0 0-.38-.66zm1.96-2.94l-.14-.08-4.67-2.7a.76.76 0 0 0-.76 0l-5.7 3.29V7.22a.07.07 0 0 1 .03-.06l4.72-2.73a4.4 4.4 0 0 1 6.52 4.55zM8.64 13.29l-1.97-1.14a.07.07 0 0 1-.04-.05V6.65a4.4 4.4 0 0 1 7.2-3.38l-.14.08-4.67 2.7a.76.76 0 0 0-.38.66v6.58zm1.07-2.31L12 9.57l2.29 1.32v2.64L12 14.86l-2.29-1.32v-2.56z"
        fill="var(--text-secondary)"
      />
    </svg>
  );
}

function ClaudeLogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M16.98 2.6a1.1 1.1 0 0 0-1.96 0L13.7 5.94l-3.72.54a1.1 1.1 0 0 0-.6 1.87l2.69 2.62-.64 3.7a1.1 1.1 0 0 0 1.59 1.16L16 13.92l3.28 1.72a1.1 1.1 0 0 0 1.59-1.16l-.63-3.7 2.69-2.62a1.1 1.1 0 0 0-.61-1.87l-3.72-.54-1.62-3.34z"
        fill="var(--accent)"
      />
      <path
        d="M7.5 12.6a.8.8 0 0 0-1.42 0L5.06 14.6l-2.7.4a.8.8 0 0 0-.44 1.36l1.95 1.9-.46 2.68a.8.8 0 0 0 1.16.84L7 20.46l2.43 1.32a.8.8 0 0 0 1.16-.84l-.46-2.69 1.95-1.9a.8.8 0 0 0-.44-1.35l-2.7-.39-1.44-2z"
        fill="var(--accent)"
        opacity="0.55"
      />
    </svg>
  );
}

function ProviderLogo({ provider, size = 12 }: { provider: string; size?: number }) {
  const name = provider.toLowerCase();
  if (name.includes("google")) return <GoogleLogo size={size} />;
  if (name.includes("deepl")) return <DeepLLogo size={size} />;
  if (name.includes("openai") || name.includes("gpt")) return <OpenAILogo size={size} />;
  if (name.includes("claude") || name.includes("anthropic")) return <ClaudeLogo size={size} />;
  return null;
}

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

      {/* Right: Powered by [provider] */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onProviderClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--glass-bg)",
            border: "0.5px solid var(--glass-border)",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 9,
            color: "var(--text-muted)",
            fontFamily: "var(--font-ui-family)",
            cursor: "pointer",
            transition: "all 180ms ease-out",
            boxShadow: "var(--btn-depth)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "var(--btn-glow-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.boxShadow = "var(--btn-depth)";
            e.currentTarget.style.transform = "none";
          }}
          title="Change translation provider"
        >
          <span style={{ letterSpacing: "0.02em" }}>powered by</span>
          <ProviderLogo provider={translationProvider} size={11} />
          <span
            style={{
              fontWeight: 600,
              color: "var(--text-secondary)",
              letterSpacing: "0.01em",
            }}
          >
            {translationProvider}
          </span>
        </button>
      </div>
    </div>
  );
}
