"use client";

import { useState, useRef, useEffect } from "react";

interface GoToSegmentModalProps {
  totalSegments: number;
  onGoTo: (position: number) => void;
  onClose: () => void;
}

export default function GoToSegmentModal({
  totalSegments,
  onGoTo,
  onClose,
}: GoToSegmentModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > totalSegments) return;
    onGoTo(num);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "8rem" }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.25)" }} onClick={onClose} />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: "relative",
          zIndex: 10,
          borderRadius: "0.5rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          width: "18rem",
          padding: "1rem",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
        }}
      >
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
          Go to segment # (1–{totalSegments})
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={totalSegments}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="e.g. 42"
            style={{
              flex: 1,
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              background: "var(--bg-deep)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              paddingLeft: "0.75rem",
              paddingRight: "0.75rem",
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go
          </button>
        </div>
      </form>
    </div>
  );
}
