"use client";

import { useState, useRef, useCallback } from "react";
import { Minimize2, Maximize2, X } from "lucide-react";

type PanelMode = "maximized" | "preview" | "minimized";

interface FloatingPanelProps {
  anchor: "left" | "right";
  mode: PanelMode;
  onModeChange: (mode: PanelMode) => void;
  title: string;
  icon: React.ReactNode;
  hasNotification: boolean;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
}

export default function FloatingPanel({
  anchor,
  mode,
  onModeChange,
  title,
  icon,
  hasNotification,
  children,
  defaultWidth = 360,
  defaultHeight = 300,
}: FloatingPanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDraggingX = useRef(false);
  const isDraggingY = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startW = useRef(0);
  const startH = useRef(0);

  // Determine dimensions by mode
  const isPreview = mode === "preview";
  const panelWidth = isPreview ? 260 : width;
  const panelHeight = isPreview ? 220 : height;

  // Horizontal resize handler (drag the inner edge)
  const onMouseDownX = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingX.current = true;
    startX.current = e.clientX;
    startW.current = width;

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingX.current) return;
      const dx = ev.clientX - startX.current;
      // Left-anchored: drag RIGHT edge → width increases with positive dx
      // Right-anchored: drag LEFT edge → width increases with negative dx
      const newW = anchor === "left"
        ? Math.max(200, Math.min(startW.current + dx, window.innerWidth * 0.6))
        : Math.max(200, Math.min(startW.current - dx, window.innerWidth * 0.6));
      setWidth(newW);
    };
    const onUp = () => {
      isDraggingX.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [anchor, width]);

  // Vertical resize handler (drag bottom edge)
  const onMouseDownY = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingY.current = true;
    startY.current = e.clientY;
    startH.current = height;

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingY.current) return;
      const dy = ev.clientY - startY.current;
      const newH = Math.max(150, Math.min(startH.current + dy, window.innerHeight * 0.8));
      setHeight(newH);
    };
    const onUp = () => {
      isDraggingY.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [height]);

  if (mode === "minimized") return null;

  const isLeft = anchor === "left";

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        [isLeft ? "left" : "right"]: 0,
        bottom: 8,
        width: panelWidth,
        height: panelHeight,
        background: "var(--bg-panel)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.08)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: `floatPanelIn${isLeft ? "Left" : "Right"} 250ms ease-out`,
        transition: "width 200ms ease, height 200ms ease",
      }}
    >
      <style>{`
        @keyframes floatPanelInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes floatPanelInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        cursor: "default",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: hasNotification ? "var(--accent)" : "var(--text-secondary)", transition: "color 200ms ease", display: "flex" }}>
            {icon}
          </span>
          <span style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}>
            {title}
          </span>
          {hasNotification && (
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
            }} />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            onClick={() => onModeChange(mode === "preview" ? "maximized" : "preview")}
            style={{
              width: 24, height: 24, borderRadius: 4, border: "none",
              background: "transparent", color: "var(--text-muted)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            aria-label={mode === "preview" ? "Maximize panel" : "Preview panel"}
            title={mode === "preview" ? "Maximize" : "Preview"}
          >
            {mode === "preview" ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onClick={() => onModeChange("minimized")}
            style={{
              width: 24, height: 24, borderRadius: 4, border: "none",
              background: "transparent", color: "var(--text-muted)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            aria-label="Close panel"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {children}
      </div>

      {/* Horizontal resize handle (inner edge) — only in maximized mode */}
      {!isPreview && (
        <div
          onMouseDown={onMouseDownX}
          style={{
            position: "absolute",
            top: 0,
            [isLeft ? "right" : "left"]: -2,
            width: 4,
            height: "100%",
            cursor: "col-resize",
            zIndex: 1,
          }}
        />
      )}

      {/* Vertical resize handle (bottom edge) — only in maximized mode */}
      {!isPreview && (
        <div
          onMouseDown={onMouseDownY}
          style={{
            position: "absolute",
            bottom: -2,
            left: 0,
            width: "100%",
            height: 4,
            cursor: "row-resize",
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
