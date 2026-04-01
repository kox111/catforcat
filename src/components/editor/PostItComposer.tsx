"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface PostItComposerProps {
  segmentId: string;
  charStart: number;
  charEnd: number;
  selectedText: string;
  position: { x: number; y: number };
  onCreated: () => void;
  onClose: () => void;
}

export default function PostItComposer({
  segmentId,
  charStart,
  charEnd,
  selectedText,
  position,
  onCreated,
  onClose,
}: PostItComposerProps) {
  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState("suggestion");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/segments/${segmentId}/post-its`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charStart, charEnd, content: content.trim(), severity }),
      });
      if (res.ok) {
        onCreated();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 100,
        width: 260,
        padding: 12,
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-float)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Add Post-it</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
          <X size={14} />
        </button>
      </div>

      {/* Selected text preview */}
      <div
        style={{
          padding: "4px 6px",
          borderRadius: 3,
          background: "var(--bg-deep)",
          fontSize: 12,
          color: "var(--text-secondary)",
          marginBottom: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        &ldquo;{selectedText}&rdquo;
      </div>

      {/* Severity selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {(["error", "suggestion", "good"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverity(s)}
            style={{
              flex: 1,
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 4,
              background: severity === s
                ? s === "error" ? "var(--red-soft)" : s === "good" ? "var(--green-soft)" : "var(--amber-soft)"
                : "transparent",
              color: severity === s
                ? s === "error" ? "var(--red)" : s === "good" ? "var(--green)" : "var(--amber)"
                : "var(--text-muted)",
              border: severity === s ? "none" : "1px solid var(--border)",
              cursor: "pointer",
              textTransform: "capitalize",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Your comment..."
        rows={3}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 4,
          fontSize: 12,
          outline: "none",
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-ui-family)",
          resize: "vertical",
          marginBottom: 8,
        }}
      />

      <button
        onClick={handleSave}
        disabled={saving || !content.trim()}
        style={{
          width: "100%",
          padding: "6px 0",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 4,
          background: "var(--cta-bg-gradient)",
          color: "var(--cta-text)",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.6 : 1,
          fontFamily: "var(--font-ui-family)",
        }}
      >
        {saving ? "Saving..." : "Add Post-it"}
      </button>
    </div>
  );
}
