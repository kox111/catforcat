"use client";

import { useRef, useEffect, useCallback } from "react";
import { Check, MessageSquare, Sparkles } from "lucide-react";
import type { Segment } from "@/lib/store";

interface SegmentRowProps {
  segment: Segment;
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
}

/**
 * Render source text with glossary terms highlighted.
 */
function HighlightedSource({ text, terms, subtle = false }: { text: string; terms: string[]; subtle?: boolean }) {
  if (terms.length === 0) return <>{text}</>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <span
              key={i}
              style={subtle ? {
                borderBottom: "1px dotted var(--purple)",
                color: "var(--text-secondary)",
                paddingBottom: 1,
              } : {
                background: "var(--purple-soft)",
                color: "var(--purple)",
                borderRadius: 3,
                padding: "1px 4px",
                fontWeight: 500,
              }}
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
}: SegmentRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, 36) + "px";
    }
  }, []);

  useEffect(() => { autoResize(); }, [segment.targetText, autoResize]);
  useEffect(() => {
    if (isActive && textareaRef.current) textareaRef.current.focus();
  }, [isActive]);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el;
      registerRef(el);
    },
    [registerRef]
  );

  const isConfirmed = segment.status === "confirmed";
  const isDraft = segment.status === "draft";

  return (
    <div
      onClick={onActivate}
      onContextMenu={(e) => {
        if (onContextMenu) { e.preventDefault(); onContextMenu(e); }
      }}
      style={{
        display: "flex",
        alignItems: "stretch",
        position: "relative",
        cursor: "pointer",
        transition: "background 120ms",
        background: isActive ? "var(--bg-active)" : "transparent",
        borderBottom: "1px solid var(--segment-divider)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.015)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Segment number gutter */}
      <div
        style={{
          width: 44,
          minWidth: 44,
          paddingTop: 18,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          borderRight: "1px solid var(--segment-divider)",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: isActive ? "var(--text-secondary)" : "var(--text-muted)",
            fontWeight: isActive ? 600 : 400,
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
            background: isConfirmed
              ? "var(--green)"
              : isDraft
              ? "var(--amber)"
              : isActive
              ? "var(--accent)"
              : "transparent",
            transition: "background 200ms",
          }}
        />

        {/* Note icon */}
        {onNoteClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onNoteClick(); }}
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
            onMouseLeave={(e) => (e.currentTarget.style.opacity = comment ? "0.8" : "0")}
          >
            <MessageSquare size={11} />
          </button>
        )}
      </div>

      {/* Source paragraph */}
      <div
        style={{
          flex: columnRatio,
          padding: "16px 24px 16px 20px",
          color: "var(--text-primary)",
          fontSize: `${fontSize}px`,
          lineHeight: "1.7",
          letterSpacing: "0.01em",
          userSelect: "text",
          borderRight: "1px solid var(--segment-divider)",
        }}
      >
        <HighlightedSource text={segment.sourceText} terms={highlightTerms} subtle={!isActive} />
      </div>

      {/* Target paragraph — editable */}
      <div
        style={{
          flex: 1 - columnRatio,
          padding: "14px 20px 14px 20px",
          position: "relative",
        }}
      >
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
            padding: "4px 2px",
            borderRadius: 4,
            background: "transparent",
            color: aiLoading ? "var(--text-muted)" : "var(--text-primary)",
            border: isActive ? "none" : "none",
            minHeight: 36,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: `${fontSize}px`,
            lineHeight: "1.7",
            letterSpacing: "0.01em",
            resize: "none",
            outline: "none",
            transition: "color 200ms",
            boxShadow: "none",
          }}
          placeholder={isActive ? (aiLoading ? "AI is thinking..." : "Type translation...") : ""}
          rows={1}
          disabled={aiLoading}
          spellCheck={true}
          lang={tgtLang || undefined}
        />

        {/* AI Button — floating pill */}
        {isActive && onRequestAI && (
          <button
            onClick={(e) => { e.stopPropagation(); onRequestAI(); }}
            disabled={aiLoading}
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              background: aiLoading ? "rgba(255,255,255,0.06)" : "var(--accent)",
              color: aiLoading ? "var(--text-muted)" : "#fff",
              border: "none",
              fontSize: 11,
              fontWeight: 600,
              cursor: aiLoading ? "not-allowed" : "pointer",
              opacity: aiLoading ? 0.5 : 1,
              transition: "opacity 200ms, background 200ms",
              fontFamily: "inherit",
            }}
            title={aiLoading ? "AI is generating..." : "AI Suggest (Ctrl+Shift+Enter)"}
          >
            <Sparkles size={11} />
            {aiLoading ? "..." : "AI"}
          </button>
        )}

        {/* Confirmed checkmark */}
        {isConfirmed && !isActive && (
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
