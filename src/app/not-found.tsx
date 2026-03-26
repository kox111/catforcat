import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 20,
        background: "var(--bg-deep)",
        color: "var(--text-primary)",
      }}
    >
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: "0.03em",
        }}
      >
        catforcat.
      </span>
      <h1
        style={{
          fontSize: 48,
          fontWeight: 300,
          color: "var(--text-muted)",
          margin: 0,
        }}
      >
        404
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
        This page does not exist.
      </p>
      <Link
        href="/app/projects"
        style={{
          padding: "10px 24px",
          fontSize: 13,
          background: "var(--accent)",
          color: "var(--bg-deep)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          marginTop: 8,
        }}
      >
        Go to projects
      </Link>
    </div>
  );
}
