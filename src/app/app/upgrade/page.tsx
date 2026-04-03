"use client";

import Link from "next/link";

const FREE_FEATURES = [
  "3 projects",
  "2,000 segments per project",
  "1,000 TM entries",
  "200 glossary terms",
  "5,000 AI requests/month",
];

const PRO_FEATURES = [
  "Unlimited projects",
  "Unlimited segments per project",
  "Unlimited TM entries",
  "Unlimited glossary terms",
  "Unlimited AI requests",
];

const cardBase: React.CSSProperties = {
  flex: "1 1 320px",
  maxWidth: 340,
  padding: 32,
  borderRadius: "var(--radius-lg)",
  background: "var(--bg-card)",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

export default function UpgradePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-deep)",
        padding: 24,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display-family)",
          fontSize: 28,
          fontWeight: 400,
          color: "var(--text-primary)",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Upgrade your plan
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        Unlock unlimited translations
      </p>

      <div
        style={{
          display: "flex",
          gap: 24,
          maxWidth: 720,
          width: "100%",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {/* FREE card */}
        <div
          style={{
            ...cardBase,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-ui-family)",
                marginBottom: 4,
              }}
            >
              Free
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-ui-family)",
              }}
            >
              $0
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                /month
              </span>
            </div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-ui-family)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>&bull;</span>
                {f}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: "auto",
              padding: "10px 0",
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            Current plan
          </div>
        </div>

        {/* PRO card */}
        <div
          style={{
            ...cardBase,
            border: "2px solid var(--accent)",
            boxShadow: "var(--shadow-float)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--accent)",
                fontFamily: "var(--font-ui-family)",
                marginBottom: 4,
              }}
            >
              Pro
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-ui-family)",
              }}
            >
              $30
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                /month
              </span>
            </div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-ui-family)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700 }}>{"\u2713"}</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/api/stripe/checkout"
            style={{
              display: "block",
              marginTop: "auto",
              padding: "12px 0",
              textAlign: "center",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-ui-family)",
              background: "var(--cta-bg-gradient)",
              color: "var(--cta-text)",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              boxShadow: "var(--cta-shadow)",
              transition: "all 200ms ease",
            }}
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>

      <Link
        href="/app/projects"
        style={{
          marginTop: 32,
          fontSize: 13,
          color: "var(--text-muted)",
          textDecoration: "none",
          fontFamily: "var(--font-ui-family)",
        }}
      >
        Back to projects
      </Link>
    </div>
  );
}
