"use client";

import { useState } from "react";
import { MessageSquare, Check, X } from "lucide-react";

interface PostItAnchorProps {
  postIt: {
    id: string;
    charStart: number;
    charEnd: number;
    content: string;
    severity: string;
    resolved: boolean;
    author: { name: string | null; username: string | null };
  };
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  error: { bg: "var(--postit-error-bg, var(--red-soft))", color: "var(--postit-error, var(--red))", icon: "!" },
  suggestion: { bg: "var(--postit-suggestion-bg, var(--amber-soft))", color: "var(--postit-suggestion, var(--amber))", icon: "?" },
  good: { bg: "var(--postit-good-bg, var(--green-soft))", color: "var(--postit-good, var(--green))", icon: "✓" },
};

export default function PostItAnchor({ postIt, onResolve, onDelete, readOnly = false }: PostItAnchorProps) {
  const [open, setOpen] = useState(false);
  const style = SEVERITY_STYLES[postIt.severity] || SEVERITY_STYLES.suggestion;

  if (postIt.resolved && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: 0.4,
          verticalAlign: "middle",
        }}
        title="Resolved post-it"
      >
        <MessageSquare size={12} style={{ color: "var(--text-muted)" }} />
      </button>
    );
  }

  return (
    <span style={{ position: "relative", display: "inline" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: 3,
          background: style.bg,
          color: style.color,
          border: "none",
          cursor: "pointer",
          fontSize: 10,
          fontWeight: 700,
          verticalAlign: "middle",
          marginLeft: 2,
          padding: 0,
        }}
        title={`Post-it: ${postIt.severity}`}
      >
        {style.icon}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            width: 240,
            padding: 10,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-card)",
            border: `1px solid ${style.color}`,
            boxShadow: "var(--shadow-float)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: style.color, fontWeight: 600, textTransform: "capitalize" }}>
              {postIt.severity}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
            >
              <X size={12} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 4 }}>
            {postIt.content}
          </p>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            @{postIt.author.username || postIt.author.name}
          </span>
          {!readOnly && !postIt.resolved && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={() => onResolve(postIt.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 8px", fontSize: 11, borderRadius: 4,
                  background: "var(--green-soft)", color: "var(--green-text)",
                  border: "none", cursor: "pointer", fontFamily: "var(--font-ui-family)",
                }}
              >
                <Check size={10} /> Resolve
              </button>
              <button
                onClick={() => onDelete(postIt.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 8px", fontSize: 11, borderRadius: 4,
                  background: "var(--red-soft)", color: "var(--red-text)",
                  border: "none", cursor: "pointer", fontFamily: "var(--font-ui-family)",
                }}
              >
                <X size={10} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
