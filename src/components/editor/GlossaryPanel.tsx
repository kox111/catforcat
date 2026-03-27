"use client";

import { useState, useEffect } from "react";
import { BookOpen, ArrowRight, Plus } from "lucide-react";

interface GlossaryMatch {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  note: string;
}

export interface GlossaryPanelProps {
  sourceText: string;
  srcLang: string;
  tgtLang: string;
  isActive: boolean;
  onInsertTerm: (targetTerm: string) => void;
  onTermsFound?: (terms: GlossaryMatch[]) => void;
}

export default function GlossaryPanel({
  sourceText,
  srcLang,
  tgtLang,
  isActive,
  onInsertTerm,
  onTermsFound,
}: GlossaryPanelProps) {
  const [matches, setMatches] = useState<GlossaryMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive || !sourceText.trim()) {
      setMatches([]);
      onTermsFound?.([]);
      return;
    }

    let cancelled = false;
    const checkGlossary = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/glossary/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceText, srcLang, tgtLang }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMatches(data);
          onTermsFound?.(data);
        }
      } catch {
        /* silently fail */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(checkGlossary, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sourceText, srcLang, tgtLang, isActive]);

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
        <BookOpen size={14} />
        Select a segment to see glossary terms
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 14px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <BookOpen size={12} />
        Glossary
        {loading && (
          <span
            style={{
              fontWeight: 400,
              color: "var(--text-muted)",
              textTransform: "none",
              letterSpacing: 0,
              marginLeft: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                border: "1.5px solid var(--accent)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 1s linear infinite",
              }}
            />
            Checking...
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
          No glossary terms in this segment
        </div>
      )}

      {/* Term Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {matches.map((match) => (
          <button
            key={match.id}
            onClick={() => onInsertTerm(match.targetTerm)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "inherit",
              background: "var(--purple-soft)",
              border: "0.5px solid var(--glass-border)",
              cursor: "pointer",
              transition: "all 180ms ease-out",
              boxShadow: "var(--btn-depth)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--purple)";
              e.currentTarget.style.boxShadow = "var(--btn-depth-hover), 0 0 12px var(--purple-soft)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--glass-border)";
              e.currentTarget.style.boxShadow = "var(--btn-depth)";
              e.currentTarget.style.transform = "none";
            }}
            title={match.note || `Click to insert "${match.targetTerm}"`}
          >
            {/* Source term */}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              {match.sourceTerm}
            </span>

            {/* Arrow */}
            <ArrowRight
              size={10}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />

            {/* Target term */}
            <span style={{ color: "var(--purple)", fontWeight: 600 }}>
              {match.targetTerm}
            </span>

            {/* Insert hint */}
            <Plus
              size={10}
              style={{
                color: "var(--purple)",
                opacity: 0.5,
                flexShrink: 0,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
