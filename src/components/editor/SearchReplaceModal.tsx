"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface SearchMatch {
  segmentId: string;
  segmentPosition: number;
  field: "source" | "target";
  text: string; // full field text
  matchStart: number; // char index of match start
  matchEnd: number; // char index of match end
}

interface SearchReplaceModalProps {
  segments: Array<{
    id: string;
    position: number;
    sourceText: string;
    targetText: string;
    status: string;
  }>;
  onClose: () => void;
  onNavigateToSegment: (segmentId: string) => void;
  onReplaceInTarget: (segmentId: string, newTargetText: string) => void;
}

type SearchScope = "both" | "source" | "target";

export default function SearchReplaceModal({
  segments,
  onClose,
  onNavigateToSegment,
  onReplaceInTarget,
}: SearchReplaceModalProps) {
  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [scope, setScope] = useState<SearchScope>("both");
  const [matchCase, setMatchCase] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [previewReplace, setPreviewReplace] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search whenever query/scope/matchCase changes
  const doSearch = useCallback(() => {
    if (query.length === 0) {
      setMatches([]);
      return;
    }

    const flags = matchCase ? "g" : "gi";
    let regex: RegExp;
    try {
      // Escape regex special chars for literal search
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      regex = new RegExp(escaped, flags);
    } catch {
      setMatches([]);
      return;
    }

    const results: SearchMatch[] = [];

    for (const seg of segments) {
      if (scope === "source" || scope === "both") {
        let match;
        while ((match = regex.exec(seg.sourceText)) !== null) {
          results.push({
            segmentId: seg.id,
            segmentPosition: seg.position,
            field: "source",
            text: seg.sourceText,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }
      if (scope === "target" || scope === "both") {
        let match;
        while ((match = regex.exec(seg.targetText)) !== null) {
          results.push({
            segmentId: seg.id,
            segmentPosition: seg.position,
            field: "target",
            text: seg.targetText,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }
    }

    setMatches(results);
    setActiveMatchIdx(0);

    // Navigate to first match
    if (results.length > 0) {
      onNavigateToSegment(results[0].segmentId);
    }
  }, [query, scope, matchCase, segments, onNavigateToSegment]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  // Navigate to match
  const goToMatch = useCallback(
    (idx: number) => {
      if (matches.length === 0) return;
      const wrapped =
        ((idx % matches.length) + matches.length) % matches.length;
      setActiveMatchIdx(wrapped);
      onNavigateToSegment(matches[wrapped].segmentId);
    },
    [matches, onNavigateToSegment],
  );

  // Replace current match (only in targets)
  const replaceCurrent = useCallback(() => {
    if (matches.length === 0) return;
    const m = matches[activeMatchIdx];
    if (m.field !== "target") return; // only replace in targets

    const before = m.text.slice(0, m.matchStart);
    const after = m.text.slice(m.matchEnd);
    const newText = before + replaceText + after;
    onReplaceInTarget(m.segmentId, newText);

    // Re-search after replacement
    setTimeout(doSearch, 50);
  }, [matches, activeMatchIdx, replaceText, onReplaceInTarget, doSearch]);

  // Replace all (only target matches)
  const replaceAll = useCallback(() => {
    if (matches.length === 0 || query.length === 0) return;

    const flags = matchCase ? "g" : "gi";
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);

    // Group by segment, only target matches
    const segmentIds = new Set(
      matches.filter((m) => m.field === "target").map((m) => m.segmentId),
    );

    for (const segId of segmentIds) {
      const seg = segments.find((s) => s.id === segId);
      if (!seg) continue;
      const newText = seg.targetText.replace(regex, replaceText);
      onReplaceInTarget(segId, newText);
    }

    setTimeout(doSearch, 50);
  }, [
    matches,
    query,
    matchCase,
    replaceText,
    segments,
    onReplaceInTarget,
    doSearch,
  ]);

  // Keyboard shortcuts within modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goToMatch(activeMatchIdx + 1);
      }
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        goToMatch(activeMatchIdx - 1);
      }
    },
    [onClose, goToMatch, activeMatchIdx],
  );

  // Count target-only matches for replace info
  const targetMatchCount = matches.filter((m) => m.field === "target").length;

  return (
    <div
      style={{
        position: "fixed",
        top: "3rem",
        left: "60px",
        zIndex: 50,
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-md), var(--panel-glow)",
        width: "22rem",
        background: "var(--bg-panel)",
        border: "0.5px solid var(--glass-border)",
        backdropFilter: "blur(16px) saturate(140%)",
        animation: "fadeSlideIn 150ms ease-out",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "0.75rem",
          paddingRight: "0.75rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          Find & Replace
        </span>
        <button
          onClick={onClose}
          style={{
            fontSize: "0.75rem",
            paddingLeft: "0.25rem",
            paddingRight: "0.25rem",
            color: "var(--text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div
        style={{
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            style={{
              flex: 1,
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              background: "var(--bg-deep)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              fontSize: "0.75rem",
              alignSelf: "center",
              whiteSpace: "nowrap",
              color: "var(--text-muted)",
            }}
          >
            {matches.length > 0
              ? `${activeMatchIdx + 1}/${matches.length}`
              : "0/0"}
          </span>
        </div>

        {/* Options row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.75rem",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--text-secondary)",
            }}
          >
            <span>In:</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as SearchScope)}
              style={{
                paddingLeft: "0.25rem",
                paddingRight: "0.25rem",
                paddingTop: "0.125rem",
                paddingBottom: "0.125rem",
                borderRadius: "0.25rem",
                background: "var(--bg-deep)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontSize: "0.75rem",
                fontFamily: "inherit",
              }}
            >
              <option value="both">Both</option>
              <option value="source">Source</option>
              <option value="target">Target</option>
            </select>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              style={{ borderRadius: "0.125rem" }}
            />
            Match case
          </label>
          <button
            onClick={() => setShowReplace(!showReplace)}
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              textDecoration: "underline",
              color: "var(--accent)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showReplace ? "Hide replace" : "Replace"}
          </button>
        </div>

        {/* Navigation arrows */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            onClick={() => goToMatch(activeMatchIdx - 1)}
            disabled={matches.length === 0}
            style={{
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              opacity: matches.length === 0 ? 0.4 : 1,
              cursor: "pointer",
            }}
          >
            ↑ Prev
          </button>
          <button
            onClick={() => goToMatch(activeMatchIdx + 1)}
            disabled={matches.length === 0}
            style={{
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              opacity: matches.length === 0 ? 0.4 : 1,
              cursor: "pointer",
            }}
          >
            ↓ Next
          </button>
        </div>

        {/* Replace section */}
        {showReplace && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              paddingTop: "0.25rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              style={{
                width: "100%",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingTop: "0.375rem",
                paddingBottom: "0.375rem",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                background: "var(--bg-deep)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontFamily: "inherit",
              }}
            />
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <button
                onClick={replaceCurrent}
                disabled={targetMatchCount === 0}
                style={{
                  paddingLeft: "0.5rem",
                  paddingRight: "0.5rem",
                  paddingTop: "0.25rem",
                  paddingBottom: "0.25rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  background: "var(--accent-soft)",
                  color: "var(--text-primary)",
                  opacity: targetMatchCount === 0 ? 0.4 : 1,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Replace
              </button>
              <button
                onClick={replaceAll}
                disabled={targetMatchCount === 0}
                style={{
                  paddingLeft: "0.5rem",
                  paddingRight: "0.5rem",
                  paddingTop: "0.25rem",
                  paddingBottom: "0.25rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  opacity: targetMatchCount === 0 ? 0.4 : 1,
                  cursor: "pointer",
                }}
              >
                Replace All ({targetMatchCount})
              </button>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  marginLeft: "auto",
                  color: "var(--text-muted)",
                }}
              >
                <input
                  type="checkbox"
                  checked={previewReplace}
                  onChange={(e) => setPreviewReplace(e.target.checked)}
                />
                Preview
              </label>
            </div>
            {previewReplace && targetMatchCount > 0 && (
              <div
                style={{
                  maxHeight: "7rem",
                  overflowY: "auto",
                  borderRadius: "0.25rem",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  background: "var(--bg-deep)",
                }}
              >
                {matches
                  .filter((m) => m.field === "target")
                  .slice(0, 10)
                  .map((m, i) => {
                    const before = m.text.slice(0, m.matchStart);
                    const matched = m.text.slice(m.matchStart, m.matchEnd);
                    const after = m.text.slice(m.matchEnd);
                    return (
                      <div key={i} style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--text-muted)" }}>
                          #{m.segmentPosition}:{" "}
                        </span>
                        {before}
                        <span
                          style={{
                            background: "var(--mark-delete-bg)",
                            color: "var(--text-primary)",
                            textDecoration: "line-through",
                          }}
                        >
                          {matched}
                        </span>
                        <span
                          style={{
                            background: "var(--mark-insert-bg)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {replaceText}
                        </span>
                        {after}
                      </div>
                    );
                  })}
                {targetMatchCount > 10 && (
                  <div style={{ color: "var(--text-muted)" }}>
                    ...and {targetMatchCount - 10} more
                  </div>
                )}
              </div>
            )}
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Replace only modifies targets, never source text.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
