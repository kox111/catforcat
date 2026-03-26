"use client";

import { useState, useEffect } from "react";

interface Segment {
  id: string;
  sourceText: string;
  targetText: string;
  status: string;
}

interface TMMatchBucket {
  label: string;
  count: number;
  color: string;
}

interface AnalysisModalProps {
  segments: Segment[];
  srcLang: string;
  tgtLang: string;
  onClose: () => void;
}

interface AnalysisData {
  totalSegments: number;
  totalWords: number;
  tm100: number;
  tm75_99: number;
  tm50_74: number;
  noMatch: number;
  internalRepetitions: number;
  uniqueSegments: number;
  confirmed: number;
  draft: number;
  empty: number;
  loading: boolean;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function AnalysisModal({
  segments,
  srcLang,
  tgtLang,
  onClose,
}: AnalysisModalProps) {
  const [data, setData] = useState<AnalysisData>({
    totalSegments: 0,
    totalWords: 0,
    tm100: 0,
    tm75_99: 0,
    tm50_74: 0,
    noMatch: 0,
    internalRepetitions: 0,
    uniqueSegments: 0,
    confirmed: 0,
    draft: 0,
    empty: 0,
    loading: true,
  });

  useEffect(() => {
    async function analyze() {
      const totalSegments = segments.length;
      const totalWords = segments.reduce(
        (sum, s) => sum + wordCount(s.sourceText),
        0,
      );

      // Internal repetitions
      const sourceMap = new Map<string, number>();
      for (const s of segments) {
        sourceMap.set(s.sourceText, (sourceMap.get(s.sourceText) || 0) + 1);
      }
      const uniqueSegments = sourceMap.size;
      const internalRepetitions =
        segments.filter((s) => (sourceMap.get(s.sourceText) || 0) > 1).length -
        sourceMap.size +
        Array.from(sourceMap.values()).filter((v) => v > 1).length;
      // Simpler: count total - unique among repeated
      const repeatedCount = totalSegments - uniqueSegments;

      // Status counts
      const confirmed = segments.filter((s) => s.status === "confirmed").length;
      const draft = segments.filter(
        (s) =>
          s.status === "draft" ||
          (s.targetText.trim() !== "" && s.status !== "confirmed"),
      ).length;
      const empty = segments.filter(
        (s) => s.targetText.trim() === "" && s.status !== "confirmed",
      ).length;

      // TM analysis: fetch matches for each unique source text
      let tm100 = 0;
      let tm75_99 = 0;
      let tm50_74 = 0;
      let noMatch = 0;

      try {
        // Search TM for each unique source text
        const uniqueSources = Array.from(sourceMap.keys());
        for (const sourceText of uniqueSources) {
          const count = sourceMap.get(sourceText) || 1;
          try {
            const res = await fetch("/api/tm/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sourceText,
                srcLang,
                tgtLang,
                threshold: 50,
              }),
            });
            if (res.ok) {
              const matches = await res.json();
              if (matches.length > 0) {
                const bestScore = matches[0].score;
                if (bestScore >= 100) tm100 += count;
                else if (bestScore >= 75) tm75_99 += count;
                else if (bestScore >= 50) tm50_74 += count;
                else noMatch += count;
              } else {
                noMatch += count;
              }
            } else {
              noMatch += count;
            }
          } catch {
            noMatch += count;
          }
        }
      } catch {
        noMatch = totalSegments;
      }

      setData({
        totalSegments,
        totalWords,
        tm100,
        tm75_99,
        tm50_74,
        noMatch,
        internalRepetitions: repeatedCount,
        uniqueSegments,
        confirmed,
        draft,
        empty,
        loading: false,
      });
    }
    analyze();
  }, [segments, srcLang, tgtLang]);

  const buckets: TMMatchBucket[] = [
    { label: "100% TM Match", count: data.tm100, color: "var(--green)" },
    { label: "75-99% TM Match", count: data.tm75_99, color: "var(--accent)" },
    { label: "50-74% TM Match", count: data.tm50_74, color: "var(--amber)" },
    { label: "No Match (new)", count: data.noMatch, color: "var(--red)" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "5rem",
        background: "var(--overlay)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "32rem",
          borderRadius: "0.5rem",
          boxShadow: "var(--shadow-md)",
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
            Project Analysis
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
            ×
          </button>
        </div>

        {data.loading ? (
          <div
            style={{
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "2rem",
              paddingBottom: "2rem",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            Analyzing project...
          </div>
        ) : (
          <div
            style={{
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "1rem",
              paddingBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Overview */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.75rem",
              }}
            >
              <StatBox label="Segments" value={data.totalSegments} />
              <StatBox label="Source Words" value={data.totalWords} />
              <StatBox label="Unique" value={data.uniqueSegments} />
            </div>

            {/* TM Match Distribution */}
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                  color: "var(--text-secondary)",
                }}
              >
                TM Match Distribution
              </div>
              {/* Visual bar */}
              <div
                style={{
                  display: "flex",
                  borderRadius: "0.25rem",
                  overflow: "hidden",
                  height: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                {buckets.map((b, i) => {
                  const pct =
                    data.totalSegments > 0
                      ? (b.count / data.totalSegments) * 100
                      : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        width: `${pct}%`,
                        background: b.color,
                        minWidth: pct > 0 ? "4px" : "0",
                      }}
                      title={`${b.label}: ${b.count} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              {buckets.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    paddingTop: "0.125rem",
                    paddingBottom: "0.125rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "0.625rem",
                        height: "0.625rem",
                        borderRadius: "0.125rem",
                        background: b.color,
                      }}
                    />
                    <span style={{ color: "var(--text-secondary)" }}>
                      {b.label}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-primary)" }}>
                    {b.count} (
                    {data.totalSegments > 0
                      ? Math.round((b.count / data.totalSegments) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              ))}
            </div>

            {/* Internal Repetitions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                Internal Repetitions
              </span>
              <span style={{ color: "var(--text-primary)" }}>
                {data.internalRepetitions} segment
                {data.internalRepetitions !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Status Summary */}
            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  marginBottom: "0.5rem",
                  color: "var(--text-secondary)",
                }}
              >
                Translation Status
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <StatBox
                  label="Confirmed"
                  value={data.confirmed}
                  color="var(--green)"
                />
                <StatBox
                  label="Draft"
                  value={data.draft}
                  color="var(--amber)"
                />
                <StatBox
                  label="Empty"
                  value={data.empty}
                  color="var(--text-muted)"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      style={{
        borderRadius: "0.25rem",
        paddingLeft: "0.75rem",
        paddingRight: "0.75rem",
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        textAlign: "center",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          color: color || "var(--text-primary)",
        }}
      >
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}
