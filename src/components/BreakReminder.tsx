"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const STORAGE_KEY = "catforcat-break-interval";

export default function BreakReminder() {
  const pathname = usePathname();
  const isEditor = /^\/app\/projects\/[^/]+$/.test(pathname);

  const [minutesSinceBreak, setMinutesSinceBreak] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [showReminder, setShowReminder] = useState(false);
  const [interval, setIntervalMin] = useState(20);
  const [snoozedUntil, setSnoozedUntil] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load interval from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if ([0, 15, 20, 30, 45].includes(val)) {
          setIntervalMin(val);
        }
      }
    } catch {}
  }, []);

  // Timer — only runs while in editor
  useEffect(() => {
    if (!isEditor || interval === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const now = Date.now();
      setMinutesSinceBreak((prev) => {
        const next = prev + 1;
        if (next >= interval && now >= snoozedUntil) {
          setShowReminder(true);
        }
        return next;
      });
      setTotalFocusTime((prev) => prev + 1);
    }, 60000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEditor, interval, snoozedUntil]);

  // Don't render anything if not in editor or break reminders are off
  if (!isEditor || interval === 0) return null;

  function handleTookBreak() {
    setMinutesSinceBreak(0);
    setBreaksTaken((p) => p + 1);
    setShowReminder(false);
  }

  function handleSnooze() {
    setShowReminder(false);
    setSnoozedUntil(Date.now() + 5 * 60 * 1000);
  }

  function handleDismiss() {
    setShowReminder(false);
  }

  function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  if (!showReminder) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 52,
        right: 20,
        width: 280,
        background: "var(--bg-panel)",
        border: "0.5px solid var(--border)",
        backdropFilter: "blur(12px)",
        borderRadius: 10,
        padding: "14px 16px",
        zIndex: 60,
        boxShadow: "var(--shadow-md)",
        animation: "slideInBreak 0.3s ease",
      }}
    >
      <style>{`
        @keyframes slideInBreak {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Close */}
      <button
        onClick={handleDismiss}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 2,
          display: "flex",
        }}
      >
        <X size={12} />
      </button>

      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        Time for a break
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        Look at something 20ft away for 20 seconds.
      </div>

      {/* Stats */}
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--font-editor-family)",
          color: "var(--text-muted)",
          marginBottom: 12,
        }}
      >
        Focus time: {formatTime(totalFocusTime)} · Breaks: {breaksTaken}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={handleTookBreak}
          style={{
            background: "var(--accent-soft)",
            color: "var(--text-primary)",
            border: "0.5px solid var(--border)",
            borderRadius: 16,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "var(--font-ui-family)",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "background 150ms, border-color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent-soft)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          I took a break
        </button>
        <button
          onClick={handleSnooze}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "var(--font-ui-family)",
            padding: "4px 8px",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          Snooze 5min
        </button>
      </div>
    </div>
  );
}
