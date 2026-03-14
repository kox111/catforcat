"use client";

import { useState, useEffect, useRef } from "react";
import { Paintbrush, X } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

const THEMES: { id: Theme; label: string; color: string; border: string }[] = [
  { id: "sakura", label: "Sakura", color: "#EFC4CC", border: "rgba(255,255,255,0.2)" },
  { id: "dark", label: "Dark", color: "#202124", border: "#3C3C3F" },
  { id: "light", label: "Light", color: "#F7F6F3", border: "#ECEAE5" },
  { id: "linen", label: "Linen", color: "#C4AA90", border: "#B09878" },
];

export default function ThemeFAB() {
  const { theme, setTheme } = useTheme();
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
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 50 }}>
      {open && (
        <div
          ref={popupRef}
          style={{
            position: "absolute",
            bottom: 52,
            right: 0,
            background: "var(--bg-panel)",
            border: "0.5px solid var(--border)",
            backdropFilter: "blur(12px)",
            borderRadius: 12,
            padding: "12px 16px",
            minWidth: 160,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "'Inter', system-ui, sans-serif",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}>
            Theme
          </div>
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "5px 0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: t.color,
                  border: `0.5px solid ${t.border}`,
                  boxShadow: isActive ? "0 0 0 2px var(--bg-deep), 0 0 0 4px var(--accent)" : "none",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}>
                  {t.label}
                </span>
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
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: open ? "var(--accent-soft)" : "var(--bg-hover)",
          border: `0.5px solid ${fabHover ? "var(--accent)" : "var(--border)"}`,
          backdropFilter: "blur(4px)",
          cursor: "pointer",
          transition: "background 150ms, border-color 150ms",
        }}
      >
        {open ? (
          <X size={16} style={{ color: "var(--text-secondary)" }} />
        ) : (
          <Paintbrush size={18} style={{ color: "var(--text-secondary)" }} />
        )}
      </button>
    </div>
  );
}
