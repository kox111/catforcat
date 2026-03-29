"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ─── Types ─── */
interface ChangelogItem {
  name: string;
  items: string[];
}

interface ChangelogVersion {
  version: string;
  date: string;
  categories: ChangelogItem[];
}

interface ChangelogData {
  versions: ChangelogVersion[];
}

/* ─── Category SVG Icons (inline, no emojis) ─── */
function IconNew({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 1v14M1 8h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFixed({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 4.5L6.5 11.5L2.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChanged({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 8h10M8 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRemoved({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3l10 10M13 3L3 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Category config ─── */
type CategoryKey = "New" | "Fixed" | "Changed" | "Removed";

const CATEGORY_CONFIG: Record<
  CategoryKey,
  {
    icon: React.ComponentType<{ size?: number }>;
    bg: string;
    text: string;
    border: string;
  }
> = {
  New: {
    icon: IconNew,
    bg: "var(--green-soft)",
    text: "var(--green-text)",
    border: "var(--green)",
  },
  Fixed: {
    icon: IconFixed,
    bg: "var(--purple-soft)",
    text: "var(--purple-text)",
    border: "var(--purple)",
  },
  Changed: {
    icon: IconChanged,
    bg: "var(--amber-soft)",
    text: "var(--amber-text)",
    border: "var(--amber)",
  },
  Removed: {
    icon: IconRemoved,
    bg: "var(--red-soft)",
    text: "var(--red-text)",
    border: "var(--red)",
  },
};

function getCategoryConfig(name: string) {
  const key = name as CategoryKey;
  return (
    CATEGORY_CONFIG[key] ?? {
      icon: IconChanged,
      bg: "var(--accent-soft)",
      text: "var(--text-secondary)",
      border: "var(--accent)",
    }
  );
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            marginBottom: 48,
            padding: 24,
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              height: 24,
              width: 180,
              background: "var(--bg-hover)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 12,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              height: 14,
              width: 120,
              background: "var(--bg-hover)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 24,
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: "0.2s",
            }}
          />
          {[1, 2].map((j) => (
            <div
              key={j}
              style={{
                height: 12,
                width: `${70 + j * 10}%`,
                background: "var(--bg-hover)",
                borderRadius: "var(--radius-sm)",
                marginBottom: 8,
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${0.1 * j}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Error state ─── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "80px auto",
        textAlign: "center",
        padding: 32,
        background: "var(--red-soft)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--red)",
      }}
    >
      <svg
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="none"
        style={{ margin: "0 auto 16px", color: "var(--red-text)" }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p
        style={{
          fontFamily: "var(--font-ui-family)",
          fontSize: 14,
          color: "var(--red-text)",
          marginBottom: 16,
        }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          fontFamily: "var(--font-ui-family)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-primary)",
          background: "var(--btn-bg)",
          border: "1px solid var(--btn-border)",
          borderRadius: 16,
          padding: "8px 24px",
          cursor: "pointer",
          transition: "background 150ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--btn-bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--btn-bg)")}
      >
        Try again
      </button>
    </div>
  );
}

/* ─── Format date ─── */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ─── Main page ─── */
export default function ChangelogPage() {
  const [data, setData] = useState<ChangelogData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChangelog = () => {
    setLoading(true);
    setError(null);
    fetch("/api/changelog")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: ChangelogData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load changelog: ${msg}`);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChangelog();
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .changelog-nav { height: 60px; padding: 0 32px; }
        .changelog-container { padding: 48px 24px 80px; }
        .changelog-title { font-size: 36px; margin-bottom: 8px; }
        .changelog-subtitle { font-size: 15px; margin-bottom: 48px; }
        .version-card { padding: 32px; margin-bottom: 40px; }
        .version-number { font-size: 22px; }
        .version-date { font-size: 13px; }
        .category-badge { font-size: 12px; padding: 4px 12px; }
        .category-item { font-size: 14px; }

        @media (max-width: 768px) {
          .changelog-nav { height: 52px; padding: 0 16px; }
          .changelog-container { padding: 32px 16px 64px; }
          .changelog-title { font-size: 28px; }
          .changelog-subtitle { font-size: 13px; margin-bottom: 32px; }
          .version-card { padding: 20px; margin-bottom: 28px; }
          .version-number { font-size: 18px; }
          .version-date { font-size: 12px; }
          .category-badge { font-size: 11px; padding: 3px 10px; }
          .category-item { font-size: 13px; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-deep)",
          color: "var(--text-primary)",
        }}
      >
        {/* Nav */}
        <nav
          className="changelog-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: 20,
              fontWeight: 400,
              color: "var(--brand-wordmark)",
              letterSpacing: "0.03em",
              textDecoration: "none",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            catforcat.
          </Link>

          <Link
            href="/"
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 13,
              fontWeight: 400,
              color: "var(--text-secondary)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
        </nav>

        {/* Content */}
        <main
          className="changelog-container"
          style={{
            flex: 1,
            maxWidth: 800,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <h1
            className="changelog-title"
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 400,
              color: "var(--text-primary)",
              letterSpacing: "0.01em",
            }}
          >
            Changelog
          </h1>
          <p
            className="changelog-subtitle"
            style={{
              fontFamily: "var(--font-ui-family)",
              fontWeight: 400,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            New features, fixes, and improvements to catforcat.
          </p>

          {/* States */}
          {loading && <LoadingSkeleton />}
          {error && <ErrorState message={error} onRetry={fetchChangelog} />}
          {!loading && !error && data && (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {data.versions.map((version, vIdx) => (
                <article
                  key={version.version}
                  className="version-card"
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    position: "relative",
                  }}
                >
                  {/* Version header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 24,
                    }}
                  >
                    <span
                      className="version-number"
                      style={{
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      v{version.version}
                    </span>
                    <time
                      className="version-date"
                      style={{
                        fontFamily: "var(--font-ui-family)",
                        fontWeight: 400,
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatDate(version.date)}
                    </time>
                  </div>

                  {/* Categories */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {version.categories.map((cat) => {
                      const config = getCategoryConfig(cat.name);
                      const Icon = config.icon;
                      return (
                        <div key={cat.name}>
                          {/* Badge */}
                          <div
                            className="category-badge"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontFamily: "var(--font-ui-family)",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: config.text,
                              background: config.bg,
                              borderRadius: 20,
                              marginBottom: 10,
                            }}
                          >
                            <Icon size={12} />
                            {cat.name}
                          </div>

                          {/* Items list */}
                          <ul
                            style={{
                              listStyle: "none",
                              margin: 0,
                              padding: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {cat.items.map((item) => (
                              <li
                                key={item}
                                className="category-item"
                                style={{
                                  fontFamily: "var(--font-ui-family)",
                                  fontWeight: 400,
                                  color: "var(--text-secondary)",
                                  lineHeight: 1.6,
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 10,
                                  paddingLeft: 4,
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: config.border,
                                    flexShrink: 0,
                                    marginTop: 8,
                                    opacity: 0.6,
                                  }}
                                />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}

              {/* End marker */}
              {data.versions.length > 0 && (
                <p
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-ui-family)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 16,
                    opacity: 0.7,
                  }}
                >
                  That&#39;s all for now.
                </p>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data && data.versions.length === 0 && (
            <p
              style={{
                textAlign: "center",
                fontFamily: "var(--font-ui-family)",
                fontSize: 14,
                color: "var(--text-muted)",
                marginTop: 80,
              }}
            >
              No changelog entries yet. Check back soon.
            </p>
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
            gap: 8,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
              textDecoration: "none",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            catforcat.
          </Link>
        </footer>
      </div>
    </>
  );
}
