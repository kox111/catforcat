"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, AlertCircle, Info, Download, X, ChevronDown, ChevronRight, CheckCircle2, GripHorizontal } from "lucide-react";
import {
  type QAIssue,
  groupIssuesBySeverity,
  exportQAReportCSV,
} from "@/lib/qa-checks";

interface QAPanelProps {
  issues: QAIssue[];
  onNavigateToSegment: (segmentId: string) => void;
  onClose: () => void;
  translatedCount?: number;
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    label: "Errors",
    color: "var(--red)",
    bg: "rgba(138, 92, 94, 0.08)",
    text: "var(--red-text)",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warnings",
    color: "var(--amber)",
    bg: "rgba(184, 154, 108, 0.08)",
    text: "var(--amber-text)",
  },
  info: {
    icon: Info,
    label: "Info",
    color: "var(--accent)",
    bg: "rgba(160, 144, 144, 0.06)",
    text: "var(--accent)",
  },
};

export default function QAPanel({
  issues,
  onNavigateToSegment,
  onClose,
  translatedCount = -1,
}: QAPanelProps) {
  const grouped = groupIssuesBySeverity(issues);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Initialize position to bottom-right
  useEffect(() => {
    if (position.x === -1) {
      const x = window.innerWidth - 380;
      const y = window.innerHeight - 420;
      setPosition({ x: Math.max(40, x), y: Math.max(60, y) });
    }
    requestAnimationFrame(() => setVisible(true));
  }, [position.x]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 340, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
      });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderGroup = (
    groupIssues: QAIssue[],
    severity: "error" | "warning" | "info",
  ) => {
    if (groupIssues.length === 0) return null;
    const config = SEVERITY_CONFIG[severity];
    const Icon = config.icon;
    const isCollapsed = collapsed[severity];

    return (
      <div key={severity}>
        {/* Group header */}
        <button
          onClick={() => toggleGroup(severity)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            background: config.bg,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "var(--font-ui-family)",
            transition: "background 150ms",
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={11} style={{ color: config.color, flexShrink: 0 }} />
          ) : (
            <ChevronDown size={11} style={{ color: config.color, flexShrink: 0 }} />
          )}
          <Icon size={12} style={{ color: config.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: config.text, flex: 1, textAlign: "left" }}>
            {config.label}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: 9999,
              background: config.color,
              color: "var(--bg-deep)",
              fontFamily: "var(--font-editor-family)",
            }}
          >
            {groupIssues.length}
          </span>
        </button>

        {/* Issues */}
        {!isCollapsed && (
          <div style={{ padding: "2px 0 2px 16px" }}>
            {groupIssues.map((issue, idx) => (
              <button
                key={`${issue.segmentId}-${issue.check}-${idx}`}
                onClick={() => onNavigateToSegment(issue.segmentId)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 150ms",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui-family)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-editor-family)",
                    padding: "0px 4px",
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.04)",
                    flexShrink: 0,
                  }}
                >
                  #{issue.segmentPosition}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {issue.message}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 150,
        width: 340,
        maxHeight: 360,
        display: "flex",
        flexDirection: "column",
        borderRadius: 14,
        background: "rgba(var(--bg-card-rgb, 42, 42, 45), 0.82)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "0.5px solid rgba(255, 255, 255, 0.08)",
        boxShadow: visible
          ? "0 8px 40px rgba(0, 0, 0, 0.35), 0 2px 12px rgba(0, 0, 0, 0.2), inset 0 0.5px 0 rgba(255, 255, 255, 0.06)"
          : "0 4px 20px rgba(0, 0, 0, 0.2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(6px)",
        transition: "opacity 200ms ease-out, transform 200ms ease-out, box-shadow 300ms ease",
        userSelect: dragging ? "none" : "auto",
      }}
    >
      {/* Drag handle + Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 12px",
          cursor: dragging ? "grabbing" : "grab",
          flexShrink: 0,
          borderBottom: "0.5px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GripHorizontal size={12} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui-family)",
              letterSpacing: "0.02em",
            }}
          >
            QA
          </span>
          {issues.length > 0 && (
            <span
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                fontFamily: "var(--font-editor-family)",
              }}
            >
              {issues.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {issues.length > 0 && (
            <button
              onClick={() => {
                const csv = exportQAReportCSV(issues);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "qa-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 6,
                color: "var(--text-muted)",
                border: "0.5px solid rgba(255, 255, 255, 0.08)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-ui-family)",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <Download size={10} /> CSV
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: 6,
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "color 150ms, background 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "6px 8px",
        }}
      >
        {issues.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 0",
              gap: 6,
            }}
          >
            {translatedCount === 0 ? (
              <>
                <Info size={18} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-ui-family)" }}>
                  No translations to check yet
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} style={{ color: "var(--green)", opacity: 0.8 }} />
                <span style={{ fontSize: 11, color: "var(--green-text)", fontFamily: "var(--font-ui-family)", fontWeight: 500 }}>
                  All segments look good
                </span>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {renderGroup(grouped.errors, "error")}
            {renderGroup(grouped.warnings, "warning")}
            {renderGroup(grouped.infos, "info")}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(panel, document.body);
  }
  return panel;
}
