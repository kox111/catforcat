"use client";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 16,
        color: "var(--text-primary)",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>Could not load project</h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {error.message || "Failed to load the project editor."}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px",
            fontSize: 13,
            background: "var(--accent)",
            color: "var(--bg-deep)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/app/projects"
          style={{
            padding: "8px 20px",
            fontSize: 13,
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
          }}
        >
          Back to projects
        </a>
      </div>
    </div>
  );
}
