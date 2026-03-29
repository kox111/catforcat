"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  TextSearch,
  Search,
  Book,
  StickyNote,
  FileCheck,
  BarChart3,
  Download,
} from "lucide-react";

/* ─── Types ─── */

interface EditorToolstripProps {
  onPreTranslate?: (mode: "tm-only" | "full") => void;
  onAnalysis?: () => void;
  onRunQA?: () => void;
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onGlossaryOpen?: () => void;
  onExportOpen?: () => void;
  onNotesOpen?: () => void;
  qaRunning?: boolean;
  preTranslating?: boolean;
  editorFontSize?: number;
  onFontSizeChange?: (size: number) => void;
}

/* ─── Tooltip ─── */

function Tooltip({
  label,
  shortcut,
  visible,
}: {
  label: string;
  shortcut?: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--bg-panel)",
        border: "0.5px solid var(--glass-border)",
        borderRadius: 8,
        padding: "6px 12px",
        boxShadow: "var(--shadow-md), var(--panel-glow)",
        zIndex: 50,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        animation: "fadeSlideIn 120ms ease-out",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ui-family)",
          fontSize: 12,
          fontWeight: 450,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      {shortcut && (
        <div
          style={{
            fontFamily: "var(--font-editor-family)",
            fontSize: 9,
            color: "var(--text-muted)",
            marginTop: 2,
          }}
        >
          {shortcut}
        </div>
      )}
    </div>
  );
}

/* ─── Icon Button with depth & glow ─── */

function IconBtn({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showTip, setShowTip] = useState(false);

  const onEnter = useCallback(() => {
    setHovered(true);
    timerRef.current = setTimeout(() => setShowTip(true), 400);
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
    setPressed(false);
    setShowTip(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          padding: "6px 9px",
          borderRadius: 9999,
          border: active
            ? "0.5px solid var(--accent)"
            : "0.5px solid transparent",
          background: active
            ? "var(--glass-bg-hover)"
            : hovered
              ? "var(--glass-bg)"
              : "transparent",
          color: active
            ? "var(--text-primary)"
            : disabled
              ? "var(--text-muted)"
              : hovered
                ? "var(--text-primary)"
                : "var(--text-secondary)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 180ms ease-out",
          boxShadow: active
            ? "var(--btn-depth-hover)"
            : hovered
              ? "var(--btn-glow-hover)"
              : "none",
          transform: pressed && !disabled
            ? "scale(0.92)"
            : hovered && !disabled
              ? "translateY(-1px)"
              : "none",
        }}
      >
        {icon}
      </button>
      <Tooltip label={label} shortcut={shortcut} visible={showTip} />
    </div>
  );
}

/* ─── Separator ─── */

function Sep() {
  return (
    <div
      style={{
        width: 0.5,
        height: 18,
        background: "var(--border)",
        margin: "0 8px",
        flexShrink: 0,
        opacity: 0.6,
      }}
    />
  );
}

/* ─── Main Component ─── */

export default function EditorToolstrip({
  onPreTranslate,
  onAnalysis,
  onRunQA,
  onSearchOpen,
  onConcordanceOpen,
  onGlossaryOpen,
  onExportOpen,
  onNotesOpen,
  qaRunning,
  preTranslating,
  editorFontSize = 13,
  onFontSizeChange,
}: EditorToolstripProps) {
  const [preHover, setPreHover] = useState(false);
  const [prePressed, setPrePressed] = useState(false);
  const [exportHover, setExportHover] = useState(false);
  const [exportPressed, setExportPressed] = useState(false);
  const [preTransTipShow, setPreTransTipShow] = useState(false);
  const [exportTipShow, setExportTipShow] = useState(false);
  const preTipTimer = useRef<NodeJS.Timeout | null>(null);
  const exportTipTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(
    () => () => {
      if (preTipTimer.current) clearTimeout(preTipTimer.current);
      if (exportTipTimer.current) clearTimeout(exportTipTimer.current);
    },
    [],
  );


  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "center",
        padding: "8px 24px 4px",
      }}
    >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "5px 10px",
        gap: 3,
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        borderRadius: 9999,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
        backdropFilter: "blur(12px)",
        width: "fit-content",
      }}
    >
      {/* ─── Group 1: Search (most used) ─── */}
      <IconBtn
        icon={<Search size={14} />}
        label="Find & replace"
        shortcut="Ctrl+H"
        onClick={onSearchOpen}
      />
      <IconBtn
        icon={<TextSearch size={14} />}
        label="Search translations"
        shortcut="Ctrl+K"
        onClick={onConcordanceOpen}
      />

      <Sep />

      {/* ─── Group 2: Reference ─── */}
      <IconBtn
        icon={<Book size={14} />}
        label="Glossary terms"
        onClick={onGlossaryOpen}
      />
      <IconBtn
        icon={<StickyNote size={14} />}
        label="Segment notes"
        onClick={onNotesOpen}
      />

      <Sep />

      {/* ─── Group 3: Review ─── */}
      <IconBtn
        icon={<FileCheck size={14} />}
        label="QA check"
        shortcut="Ctrl+Q"
        onClick={onRunQA}
        disabled={qaRunning}
      />
      <IconBtn
        icon={<BarChart3 size={14} />}
        label="Project analysis"
        onClick={onAnalysis}
      />

      <Sep />

      {/* ─── Group 4: Pre-translate ─── */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => onPreTranslate?.("full")}
          disabled={preTranslating}
          onMouseEnter={() => {
            setPreHover(true);
            preTipTimer.current = setTimeout(
              () => setPreTransTipShow(true),
              400,
            );
          }}
          onMouseLeave={() => {
            setPreHover(false);
            setPrePressed(false);
            setPreTransTipShow(false);
            if (preTipTimer.current) clearTimeout(preTipTimer.current);
          }}
          onMouseDown={() => setPrePressed(true)}
          onMouseUp={() => setPrePressed(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 14px",
            borderRadius: 9999,
            border: "0.5px solid var(--amber-soft)",
            background:
              preHover && !preTranslating
                ? "linear-gradient(135deg, var(--amber-soft), transparent)"
                : "var(--glass-bg)",
            color: preTranslating ? "var(--text-muted)" : "var(--amber-text)",
            cursor: preTranslating ? "not-allowed" : "pointer",
            opacity: preTranslating ? 0.4 : 1,
            fontFamily: "var(--font-ui-family)",
            fontSize: 11,
            fontWeight: 450,
            transition: "all 180ms ease-out",
            boxShadow:
              preHover && !preTranslating
                ? "0 0 14px var(--amber-soft), var(--btn-depth)"
                : "var(--btn-depth)",
            transform: prePressed && !preTranslating
              ? "scale(0.96)"
              : preHover && !preTranslating
                ? "translateY(-1px)"
                : "none",
          }}
        >
          <Sparkles size={13} />
          <span>Pre-translate</span>
        </button>
        <Tooltip
          label="Pre-translate all segments"
          shortcut="Ctrl+Shift+Enter"
          visible={preTransTipShow}
        />
      </div>

      {/* ─── Spacer ─── */}
      <div style={{ flex: 1 }} />

      {/* Font size moved to Settings page */}

      {/* ─── Group 6: Export — real action button ─── */}
      <div style={{ position: "relative" }}>
        <button
          onClick={onExportOpen}
          onMouseEnter={() => {
            setExportHover(true);
            exportTipTimer.current = setTimeout(
              () => setExportTipShow(true),
              400,
            );
          }}
          onMouseLeave={() => {
            setExportHover(false);
            setExportPressed(false);
            setExportTipShow(false);
            if (exportTipTimer.current) clearTimeout(exportTipTimer.current);
          }}
          onMouseDown={() => setExportPressed(true)}
          onMouseUp={() => setExportPressed(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 14px",
            borderRadius: 9999,
            border: "0.5px solid var(--action-border)",
            background: exportHover
              ? "var(--action-gradient)"
              : "var(--glass-bg)",
            color: exportHover
              ? "var(--green-text)"
              : "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "var(--font-ui-family)",
            fontSize: 11,
            fontWeight: 450,
            transition: "all 180ms ease-out",
            boxShadow: exportHover
              ? "var(--action-glow), var(--btn-depth)"
              : "var(--btn-depth)",
            transform: exportPressed
              ? "scale(0.96)"
              : exportHover
                ? "translateY(-1px)"
                : "none",
          }}
        >
          <Download size={12} />
          <span>Export</span>
        </button>
        <Tooltip label="Export project" visible={exportTipShow} />
      </div>
    </div>
    </div>
  );
}
