"use client";

interface SuggestionInlineProps {
  suggestion: {
    id: string;
    originalText: string;
    suggestedText: string;
    status: string;
    author: { name: string | null; username: string | null };
  };
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  readOnly?: boolean;
}

export default function SuggestionInline({
  suggestion,
  onAccept,
  onReject,
  readOnly = false,
}: SuggestionInlineProps) {
  if (suggestion.status !== "pending") {
    return (
      <div
        style={{
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          color: "var(--text-muted)",
          fontStyle: "italic",
        }}
      >
        Suggestion {suggestion.status} by @{suggestion.author.username || suggestion.author.name}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "6px 8px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        background: "var(--bg-deep)",
        marginTop: 4,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
        @{suggestion.author.username || suggestion.author.name}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {/* Original */}
        <span
          style={{
            fontSize: 13,
            padding: "2px 4px",
            borderRadius: 3,
            background: "var(--suggestion-original-bg, var(--red-soft))",
            color: "var(--suggestion-original-text, var(--red-text))",
            textDecoration: "line-through",
          }}
        >
          {suggestion.originalText}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>→</span>
        {/* Proposed */}
        <span
          style={{
            fontSize: 13,
            padding: "2px 4px",
            borderRadius: 3,
            background: "var(--suggestion-proposed-bg, var(--green-soft))",
            color: "var(--suggestion-proposed-text, var(--green-text))",
          }}
        >
          {suggestion.suggestedText}
        </span>
      </div>
      {!readOnly && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button
            onClick={() => onAccept(suggestion.id)}
            style={{
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              background: "var(--green-soft)",
              color: "var(--green-text)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            Accept
          </button>
          <button
            onClick={() => onReject(suggestion.id)}
            style={{
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              background: "var(--red-soft)",
              color: "var(--red-text)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
