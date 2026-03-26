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
  FolderOutput,
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
        top: "calc(100% + 4px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--bg-panel)",
        border: "0.5px solid var(--border)",
        borderRadius: 6,
        padding: "6px 10px",
        boxShadow: "var(--shadow-md)",
        zIndex: 50,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12,
          fontWeight: 400,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      {shortcut && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
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

/* ─── Icon Button ─── */

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showTip, setShowTip] = useState(false);

  const onEnter = useCallback(() => {
    setHovered(true);
    timerRef.current = setTimeout(() => setShowTip(true), 400);
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
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
        style={{
          padding: "5px 7px",
          borderRadius: 6,
          border: "none",
          background: active
            ? "var(--accent-soft)"
            : hovered
              ? "var(--bg-hover)"
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
          transition: "background 150ms, color 150ms",
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
        height: 16,
        background: "var(--border)",
        margin: "0 6px",
        flexShrink: 0,
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
  const [exportHover, setExportHover] = useState(false);
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

  const fontBtnStyle = (
    disabled: boolean,
    hovered: boolean,
  ): React.CSSProperties => ({
    padding: "2px 6px",
    borderRadius: 4,
    border: "0.5px solid var(--border)",
    background: "transparent",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: disabled
      ? "var(--text-muted)"
      : hovered
        ? "var(--text-primary)"
        : "var(--text-secondary)",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "border-color 150ms, color 150ms",
    borderColor: hovered && !disabled ? "var(--accent)" : "var(--border)",
  });

  const [aMinusHover, setAMinusHover] = useState(false);
  const [aPlusHover, setAPlusHover] = useState(false);

  return (
    <div
      style={{
        height: 32,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 2,
        background: "var(--bg-panel)",
        borderBottom: "0.5px solid var(--border)",
        borderTop: "0.5px solid var(--border)",
      }}
    >
      {/* ─── Group 1: translate ─── */}
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
            setPreTransTipShow(false);
            if (preTipTimer.current) clearTimeout(preTipTimer.current);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 6,
            border: "none",
            background:
              preHover && !preTranslating ? "var(--bg-hover)" : "transparent",
            color: preTranslating ? "var(--text-muted)" : "var(--amber-text)",
            cursor: preTranslating ? "not-allowed" : "pointer",
            opacity: preTranslating ? 0.4 : 1,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 400,
            transition: "background 150ms, color 150ms",
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

      <Sep />

      {/* ─── Group 2: search ─── */}
      <IconBtn
        icon={<TextSearch size={13} />}
        label="Search translations"
        shortcut="Ctrl+K"
        onClick={onConcordanceOpen}
      />
      <IconBtn
        icon={<Search size={13} />}
        label="Find & replace"
        shortcut="Ctrl+H"
        onClick={onSearchOpen}
      />

      <Sep />

      {/* ─── Group 3: reference ─── */}
      <IconBtn
        icon={<Book size={13} />}
        label="Glossary terms"
        onClick={onGlossaryOpen}
      />
      <IconBtn
        icon={<StickyNote size={13} />}
        label="Segment notes"
        onClick={onNotesOpen}
      />

      <Sep />

      {/* ─── Group 4: review ─── */}
      <IconBtn
        icon={<FileCheck size={13} />}
        label="QA check"
        shortcut="Ctrl+Shift+Q"
        onClick={onRunQA}
        disabled={qaRunning}
      />
      <IconBtn
        icon={<BarChart3 size={13} />}
        label="Project analysis"
        onClick={onAnalysis}
      />

      {/* ─── Spacer ─── */}
      <div style={{ flex: 1 }} />

      {/* ─── Group 5: view (font size) ─── */}
      <button
        onClick={() => onFontSizeChange?.(Math.max(10, editorFontSize - 2))}
        disabled={editorFontSize <= 10}
        onMouseEnter={() => setAMinusHover(true)}
        onMouseLeave={() => setAMinusHover(false)}
        style={fontBtnStyle(editorFontSize <= 10, aMinusHover)}
        title="Decrease font size"
      >
        A−
      </button>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--text-muted)",
          padding: "0 3px",
          minWidth: 16,
          textAlign: "center",
        }}
      >
        {editorFontSize}
      </span>
      <button
        onClick={() => onFontSizeChange?.(Math.min(24, editorFontSize + 2))}
        disabled={editorFontSize >= 24}
        onMouseEnter={() => setAPlusHover(true)}
        onMouseLeave={() => setAPlusHover(false)}
        style={fontBtnStyle(editorFontSize >= 24, aPlusHover)}
        title="Increase font size"
      >
        A+
      </button>

      <Sep />

      {/* ─── Group 6: export ─── */}
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
            setExportTipShow(false);
            if (exportTipTimer.current) clearTimeout(exportTipTimer.current);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 6,
            border: "0.5px solid var(--border)",
            background: "transparent",
            color: exportHover
              ? "var(--text-primary)"
              : "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 400,
            transition: "background 150ms, border-color 150ms, color 150ms",
            borderColor: exportHover ? "var(--accent)" : "var(--border)",
          }}
        >
          <FolderOutput size={12} />
          <span>Export</span>
        </button>
        <Tooltip label="Export project" visible={exportTipShow} />
      </div>
    </div>
  );
}
