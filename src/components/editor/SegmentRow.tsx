"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Check, MessageSquare, Sparkles, BookOpen } from "lucide-react";
import type { Segment } from "@/lib/store";

interface SegmentRowProps {
  segment: Segment & {
    previousTargetText?: string;
    reviewStatus?: string;
    aiScore?: number | null;
    aiScoreReason?: string | null;
    terminologyUsed?: boolean;
  };
  isActive: boolean;
  onActivate: () => void;
  onTargetChange: (text: string) => void;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  highlightTerms?: string[];
  onRequestAI?: () => void;
  aiLoading?: boolean;
  tgtLang?: string;
  comment?: string;
  onNoteClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  fontSize?: number;
  columnRatio?: number;
  // B.1 Review mode
  reviewMode?: boolean;
  onAcceptSegment?: () => void;
  onRejectSegment?: () => void;
  // Focus mode
  dimmed?: boolean;
}

/**
 * Render source text with glossary terms highlighted.
 */
function HighlightedSource({
  text,
  terms,
  subtle = false,
}: {
  text: string;
  terms: string[];
  subtle?: boolean;
}) {
  if (terms.length === 0) return <>{text}</>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some(
          (t) => t.toLowerCase() === part.toLowerCase(),
        );
        if (isMatch) {
          return (
            <span
              key={i}
              style={
                subtle
                  ? {
                      borderBottom: "1px dotted var(--purple)",
                      color: "var(--text-secondary)",
                      paddingBottom: 1,
                    }
                  : {
                      background: "var(--purple-soft)",
                      color: "var(--purple)",
                      borderRadius: 3,
                      padding: "1px 4px",
                      fontWeight: 500,
                    }
              }
              title={subtle ? "Glossary term" : undefined}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/**
 * B.1 — Simple diff view: show old text (strikethrough red) and new text (green).
 */
function ReviewDiff({
  oldText,
  newText,
}: {
  oldText: string;
  newText: string;
}) {
  if (oldText === newText || !oldText) return null;
  return (
    <div style={{ marginBottom: 4, fontSize: 12, lineHeight: 1.6 }}>
      <span
        style={{
          textDecoration: "line-through",
          color: "var(--red)",
          opacity: 0.6,
          marginRight: 8,
        }}
      >
        {oldText}
      </span>
      <span
        style={{
          color: "var(--green)",
          background: "var(--green-soft)",
          borderRadius: 3,
          padding: "1px 4px",
        }}
      >
        {newText}
      </span>
    </div>
  );
}

/**
 * B.4 — AI Score badge (18px circle, color-coded).
 */
function AIScoreBadge({
  score,
  reason,
}: {
  score: number;
  reason?: string | null;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color =
    score >= 90 ? "var(--green)" : score >= 70 ? "var(--amber)" : "var(--red)";
  const bg =
    score >= 90
      ? "var(--green-soft)"
      : score >= 70
        ? "var(--amber-soft)"
        : "var(--red-soft)";

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: bg,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
          fontWeight: 500,
          fontFamily: "var(--font-editor-family)",
          cursor: reason ? "help" : "default",
        }}
      >
        {score}
      </div>
      {showTooltip && reason && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 6,
            padding: "6px 10px",
            borderRadius: 6,
            background: "var(--bg-panel)",
            border: "0.5px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            fontSize: 11,
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
            maxWidth: 250,
            zIndex: 50,
          }}
        >
          {reason}
        </div>
      )}
    </div>
  );
}

export default function SegmentRow({
  segment,
  isActive,
  onActivate,
  onTargetChange,
  registerRef,
  highlightTerms = [],
  onRequestAI,
  aiLoading = false,
  tgtLang,
  comment,
  onNoteClick,
  onContextMenu,
  fontSize = 15,
  columnRatio = 0.5,
  // B.1 Review mode
  reviewMode = false,
  onAcceptSegment,
  onRejectSegment,
  // Focus mode
  dimmed = false,
}: SegmentRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, 36) + "px";
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [segment.targetText, autoResize]);
  useEffect(() => {
    if (isActive && textareaRef.current) textareaRef.current.focus();
  }, [isActive]);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el;
      registerRef(el);
    },
    [registerRef],
  );

  const isConfirmed = segment.status === "confirmed";
  const isDraft = segment.status === "draft";

  return (
    <div
      className="segment-row"
      onClick={onActivate}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(e);
        }
      }}
      style={{
        display: "flex",
        alignItems: "stretch",
        position: "relative",
        cursor: "pointer",
        transition: "background 150ms ease, opacity 0.3s ease",
        background: isActive ? "var(--bg-active)" : "transparent",
        borderRadius: 6,
        opacity: dimmed ? 0.25 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Active segment left border indicator */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 2,
            background: "var(--accent)",
            transition: "opacity 150ms ease",
          }}
        />
      )}

      {/* Segment number gutter */}
      <div
        style={{
          width: 36,
          minWidth: 36,
          paddingTop: 18,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-editor-family)",
            fontSize: 10,
            color: "var(--text-muted)",
            opacity: isActive ? 1 : 0.6,
            fontWeight: 400,
          }}
        >
          {segment.position}
        </span>

        {/* Status: tiny colored dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background:
              segment.reviewStatus === "accepted"
                ? "var(--purple)"
                : segment.reviewStatus === "rejected"
                  ? "var(--red)"
                  : isConfirmed
                    ? "var(--green)"
                    : isDraft
                      ? "var(--amber)"
                      : "var(--text-muted)",
            opacity:
              segment.reviewStatus === "accepted" ||
              segment.reviewStatus === "rejected" ||
              isConfirmed ||
              isDraft
                ? 1
                : 0.3,
            transition: "background 200ms",
          }}
        />

        {/* B.4 — AI Score badge */}
        {segment.aiScore != null && (
          <AIScoreBadge
            score={segment.aiScore}
            reason={segment.aiScoreReason}
          />
        )}

        {/* Note icon */}
        {onNoteClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNoteClick();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: comment ? "var(--amber)" : "var(--text-muted)",
              opacity: comment ? 0.8 : 0,
              padding: 0,
              display: "flex",
              transition: "opacity 200ms",
            }}
            title={comment || "Add note"}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = comment ? "0.8" : "0")
            }
          >
            <MessageSquare size={11} />
          </button>
        )}
      </div>

      {/* Source paragraph */}
      <div
        className="segment-source"
        style={{
          flex: columnRatio,
          padding: "16px 24px 16px 16px",
          color: "var(--text-primary)",
          fontSize: `${fontSize}px`,
          lineHeight: "1.7",
          letterSpacing: "0.01em",
          userSelect: "text",
        }}
      >
        <HighlightedSource
          text={segment.sourceText}
          terms={highlightTerms}
          subtle={!isActive}
        />
      </div>

      {/* Subtle vertical divider between source and target */}
      <div
        style={{
          width: 1,
          background: "var(--segment-divider)",
          margin: "12px 0",
          alignSelf: "stretch",
          opacity: 0.5,
          flexShrink: 0,
        }}
      />

      {/* Target paragraph — editable */}
      <div
        className="segment-target"
        style={{
          flex: 1 - columnRatio,
          padding: "12px 20px 12px 16px",
          position: "relative",
        }}
      >
        {/* B.1 — Review diff */}
        {reviewMode &&
          segment.previousTargetText &&
          segment.previousTargetText !== segment.targetText && (
            <ReviewDiff
              oldText={segment.previousTargetText}
              newText={segment.targetText}
            />
          )}

        {/* B.3 — Terminology-aware badge */}
        {segment.terminologyUsed && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 10,
              background: "var(--purple-soft)",
              color: "var(--purple)",
              fontWeight: 500,
              marginBottom: 4,
            }}
            title="This translation was guided by glossary terms"
          >
            <BookOpen size={10} /> Terminology-aware
          </span>
        )}

        <textarea
          ref={setRef}
          value={segment.targetText}
          onChange={(e) => {
            onTargetChange(e.target.value);
            autoResize();
          }}
          onFocus={onActivate}
          style={{
            width: "100%",
            padding: "4px 8px",
            borderRadius: 4,
            background: isActive ? "var(--bg-card)" : "transparent",
            color: aiLoading ? "var(--text-muted)" : "var(--text-primary)",
            border: isActive
              ? "1px solid var(--border)"
              : "1px solid transparent",
            minHeight: 36,
            fontFamily: "var(--font-ui-family)",
            fontSize: `${fontSize}px`,
            lineHeight: "1.7",
            letterSpacing: "0.01em",
            resize: "none",
            outline: "none",
            transition:
              "color 200ms, border-color 150ms ease, background 150ms ease",
            boxShadow: "none",
          }}
          placeholder={
            isActive
              ? aiLoading
                ? "AI is thinking..."
                : "Type translation..."
              : ""
          }
          rows={1}
          disabled={aiLoading}
          spellCheck={true}
          lang={tgtLang || undefined}
        />

        {/* B.1 — Accept / Reject buttons in review mode */}
        {reviewMode &&
          isActive &&
          segment.previousTargetText &&
          segment.previousTargetText !== segment.targetText && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcceptSegment?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "3px 10px",
                  borderRadius: 14,
                  background: "var(--green-soft)",
                  color: "var(--green)",
                  border: "0.5px solid var(--border)",
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Check size={10} /> Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRejectSegment?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "3px 10px",
                  borderRadius: 14,
                  background: "var(--red-soft)",
                  color: "var(--red)",
                  border: "0.5px solid var(--border)",
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✕ Reject
              </button>
            </div>
          )}

        {/* Confirmed checkmark */}
        {isConfirmed && !isActive && !reviewMode && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "var(--green)",
              opacity: 0.5,
            }}
          >
            <Check size={14} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
}
