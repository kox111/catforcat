"use client";

import { useState, useEffect, useRef } from "react";

interface NoteModalProps {
  segmentPosition: number;
  initialNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

export default function NoteModal({
  segmentPosition,
  initialNote,
  onSave,
  onClose,
}: NoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
      onClick={onClose}
    >
      <div
        style={{
          borderRadius: "0.5rem",
          padding: "1rem",
          width: "100%",
          maxWidth: "28rem",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Note — Segment #{segmentPosition}
          </h3>
          <button
            onClick={onClose}
            style={{
              fontSize: "0.875rem",
              paddingLeft: "0.25rem",
              paddingRight: "0.25rem",
              color: "var(--text-muted)",
            }}
          >
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: "100%",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.875rem",
            resize: "none",
            outline: "none",
            background: "var(--bg-deep)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            minHeight: "100px",
            fontFamily: "inherit",
          }}
          placeholder="Add a note for this segment..."
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter") {
              onSave(note);
            }
            if (e.key === "Escape") {
              onClose();
            }
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.75rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Ctrl+Enter to save
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {initialNote && (
              <button
                onClick={() => onSave("")}
                style={{
                  paddingLeft: "0.75rem",
                  paddingRight: "0.75rem",
                  paddingTop: "0.375rem",
                  paddingBottom: "0.375rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  color: "var(--red)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Delete note
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                paddingLeft: "0.75rem",
                paddingRight: "0.75rem",
                paddingTop: "0.375rem",
                paddingBottom: "0.375rem",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(note)}
              style={{
                paddingLeft: "0.75rem",
                paddingRight: "0.75rem",
                paddingTop: "0.375rem",
                paddingBottom: "0.375rem",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                background: "var(--accent-soft)",
                color: "var(--text-primary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
