"use client";

import { useState, useEffect, useRef } from "react";
import { useViewScale } from "@/components/ViewScaleProvider";
import { SCALE_MODES, type ScaleMode } from "@/lib/view-scale";

const MODE_LIST: ScaleMode[] = ["compact", "default", "large"];

export default function ZoomFAB() {
  const { mode, setMode } = useViewScale();
  const [open, setOpen] = useState(false);
  const [fabHover, setFabHover] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        fabRef.current && !fabRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div style={{ position: "fixed", bottom: 56, right: 32, zIndex: 50 }}>
      {open && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            bottom: 56,
            right: 0,
            background: "var(--bg-panel)",
            border: "0.5px solid var(--border)",
            backdropFilter: "blur(12px)",
            borderRadius: 10,
            padding: 6,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {MODE_LIST.map((key) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => { setMode(key); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "5px 14px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-hover)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {SCALE_MODES[key].label}
              </button>
            );
          })}
        </div>
      )}

      <button
        ref={fabRef}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setFabHover(true)}
        onMouseLeave={() => setFabHover(false)}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: open ? "var(--accent-soft)" : "var(--bg-hover)",
          border: `0.5px solid ${fabHover ? "var(--accent)" : "var(--border)"}`,
          cursor: "pointer",
          transition: "background 150ms, border-color 150ms",
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        )}
      </button>
    </div>
  );
}
