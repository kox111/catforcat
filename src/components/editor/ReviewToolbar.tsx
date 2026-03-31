"use client";

interface ReviewToolbarProps {
  mode: "edit" | "suggest" | "view";
  onModeChange: (mode: "edit" | "suggest" | "view") => void;
}

const MODES = [
  { value: "edit" as const, label: "Edit" },
  { value: "suggest" as const, label: "Suggestions" },
  { value: "view" as const, label: "View" },
];

export default function ReviewToolbar({ mode, onModeChange }: ReviewToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onModeChange(m.value)}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 500,
            background: mode === m.value ? "var(--accent-soft)" : "transparent",
            color: mode === m.value ? "var(--accent)" : "var(--text-muted)",
            border: "none",
            borderRight: m.value !== "view" ? "1px solid var(--border)" : "none",
            cursor: "pointer",
            fontFamily: "var(--font-ui-family)",
            transition: "all 150ms",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
