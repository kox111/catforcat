"use client";

import { useState, useEffect } from "react";
import { Check, Database } from "lucide-react";
import type { TMMatch } from "@/lib/fuzzy-match";
import { matchColor, matchLabel } from "@/lib/fuzzy-match";

interface TMPanelProps {
  sourceText: string;
  srcLang: string;
  tgtLang: string;
  isActive: boolean;
  onApplyMatch: (targetText: string) => void;
  onMatchesUpdate?: (matches: TMMatch[]) => void;
}

export default function TMPanel({
  sourceText,
  srcLang,
  tgtLang,
  isActive,
  onApplyMatch,
  onMatchesUpdate,
}: TMPanelProps) {
  const [matches, setMatches] = useState<TMMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive || !sourceText.trim()) {
      setMatches([]);
      onMatchesUpdate?.([]);
      return;
    }

    let cancelled = false;
    const searchTM = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/tm/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceText, srcLang, tgtLang, threshold: 50 }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMatches(data);
          onMatchesUpdate?.(data);
        }
      } catch {
        /* silently fail */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(searchTM, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sourceText, srcLang, tgtLang, isActive]);

  // Reset applied state when source changes
  useEffect(() => { setAppliedId(null); }, [sourceText]);

  if (!isActive) {
    return (
      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <Database size={14} />
        Select a segment to see TM matches
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 12px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        <Database size={12} />
        Translation Memory
        {loading && (
          <span
            style={{
              fontWeight: 400,
              color: "var(--text-muted)",
              textTransform: "none",
              letterSpacing: 0,
              marginLeft: 4,
            }}
          >
            Searching...
          </span>
        )}
        {!loading && matches.length > 0 && (
          <span
            style={{
              fontWeight: 500,
              color: "var(--text-muted)",
              textTransform: "none",
              letterSpacing: 0,
              marginLeft: 4,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ({matches.length})
          </span>
        )}
      </div>

      {matches.length === 0 && !loading && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}
        >
          No matches found
        </div>
      )}

      {/* Match Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {matches.map((match, idx) => {
          const score = match.score;
          const color = matchColor(score);
          const isApplied = appliedId === match.id;

          return (
            <button
              key={match.id}
              onClick={() => {
                onApplyMatch(match.targetText);
                setAppliedId(match.id);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                background: isApplied ? "var(--green-soft)" : "var(--bg-deep)",
                border: "none",
                cursor: "pointer",
                transition: "background 150ms, box-shadow 150ms",
                fontFamily: "inherit",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isApplied) e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isApplied ? "var(--green-soft)" : "var(--bg-deep)";
                e.currentTarget.style.boxShadow = "none";
              }}
              title={`Click to apply · Ctrl+${idx + 1}`}
            >
              {/* Top row: score badge + shortcut */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                {/* Score badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "var(--radius-sm)",
                    color: "#fff",
                    background: color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {score}%
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: color,
                    fontWeight: 500,
                  }}
                >
                  {matchLabel(score)}
                </span>
                {/* Shortcut */}
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--text-muted)",
                  }}
                >
                  Ctrl+{idx + 1}
                </span>
                {/* Applied indicator */}
                {isApplied && (
                  <Check
                    size={12}
                    style={{ color: "var(--green)", flexShrink: 0 }}
                    strokeWidth={3}
                  />
                )}
              </div>

              {/* Source */}
              <div
                style={{
                  fontSize: 12,
                  lineHeight: "1.5",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 2,
                }}
              >
                {match.sourceText}
              </div>

              {/* Target */}
              <div
                style={{
                  fontSize: 12,
                  lineHeight: "1.5",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {match.targetText}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
