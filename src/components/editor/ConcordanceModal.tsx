"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ConcordanceResult {
  id: string;
  sourceText: string;
  targetText: string;
  srcLang: string;
  tgtLang: string;
  usageCount: number;
}

interface ConcordanceModalProps {
  srcLang: string;
  tgtLang: string;
  initialQuery?: string;
  onClose: () => void;
  onApply?: (targetText: string) => void;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: "var(--mark-bg)",
              color: "var(--mark-text)",
              borderRadius: "2px",
              padding: "0 1px",
              fontStyle: "inherit",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function ConcordanceModal({
  srcLang,
  tgtLang,
  initialQuery = "",
  onClose,
  onApply,
}: ConcordanceModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ConcordanceResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    async (q: string, p: number) => {
      if (q.trim().length < 2) {
        setResults([]);
        setTotal(0);
        setTotalPages(0);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/tm/concordance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            srcLang,
            tgtLang,
            page: p,
            pageSize: 10,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    },
    [srcLang, tgtLang],
  );

  // Auto-search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      search(query, 1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    search(query, newPage);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "6rem",
        background: "var(--overlay)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "48rem",
          borderRadius: "0.5rem",
          boxShadow: "var(--shadow-float)",
          overflow: "hidden",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            Concordance Search (TM)
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: "0.875rem",
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Esc
          </button>
        </div>

        {/* Search Input */}
        <div
          style={{
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") {
                setPage(1);
                search(query, 1);
              }
            }}
            placeholder="Search in Translation Memory..."
            style={{
              width: "100%",
              paddingLeft: "0.75rem",
              paddingRight: "0.75rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              borderRadius: "0.25rem",
              fontSize: "0.875rem",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-focus)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          {total > 0 && (
            <div
              style={{
                marginTop: "0.25rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              {total} result{total !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: "20rem", overflowY: "auto" }}>
          {loading && (
            <div
              style={{
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "1.5rem",
                paddingBottom: "1.5rem",
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div
              style={{
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "1.5rem",
                paddingBottom: "1.5rem",
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              No matches found
            </div>
          )}

          {!loading &&
            results.map((r) => (
              <div
                key={r.id}
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  paddingTop: "0.75rem",
                  paddingBottom: "0.75rem",
                  fontSize: "0.75rem",
                  transition: "background-color 0.2s",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() => onApply?.(r.targetText)}
              >
                <div
                  style={{
                    marginBottom: "0.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>
                    SRC:{" "}
                  </span>
                  <HighlightText text={r.sourceText} query={query} />
                </div>
                <div style={{ color: "var(--text-primary)" }}>
                  <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>
                    TGT:{" "}
                  </span>
                  <HighlightText text={r.targetText} query={query} />
                </div>
                <div
                  style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}
                >
                  {r.srcLang}→{r.tgtLang} · used {r.usageCount}×
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                fontSize: "0.75rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
                borderRadius: "0.25rem",
                color: page <= 1 ? "var(--text-muted)" : "var(--accent)",
                opacity: page <= 1 ? 0.5 : 1,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← Prev
            </button>
            <span
              style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                fontSize: "0.75rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
                borderRadius: "0.25rem",
                color:
                  page >= totalPages ? "var(--text-muted)" : "var(--accent)",
                opacity: page >= totalPages ? 0.5 : 1,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
