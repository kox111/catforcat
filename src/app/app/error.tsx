"use client";

export default function Error({
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
      <h2 style={{ fontSize: 18, fontWeight: 500 }}>Something went wrong</h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {error.message || "An unexpected error occurred."}
      </p>
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
    </div>
  );
}
