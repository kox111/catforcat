"use client";

import { useState, useEffect, useRef } from "react";

/* ─── Types ─── */

interface SaveIndicatorProps {
  saving: boolean;
  lastSavedAt?: number | null;
  saveError?: string | null;
  hasPendingChanges?: boolean;
}

type Phase = "saving" | "saved" | "resetting";

/* ─── Component ─── */

export default function SaveIndicator({
  lastSavedAt,
  saveError,
}: SaveIndicatorProps) {
  // Default state is always "saving" (idle monitoring state)
  const [phase, setPhase] = useState<Phase>("saving");
  const [savedChars, setSavedChars] = useState(0);
  const [checkDrawn, setCheckDrawn] = useState(false);
  const prevSavedRef = useRef<number | null | undefined>(undefined);

  const SAVED = "Saved";

  /* ── Detect save completion → "saved" ── */
  useEffect(() => {
    if (!lastSavedAt || lastSavedAt === prevSavedRef.current) return;
    prevSavedRef.current = lastSavedAt;
    setPhase("saved");
    setSavedChars(0);
    setCheckDrawn(false);
  }, [lastSavedAt]);

  /* ── Typewriter for "Saved" — 1 char per 90ms, then draw check ── */
  useEffect(() => {
    if (phase !== "saved") return;
    setSavedChars(0);
    setCheckDrawn(false);
    const iv = setInterval(() => {
      setSavedChars((p) => {
        if (p >= SAVED.length) {
          clearInterval(iv);
          setTimeout(() => setCheckDrawn(true), 100);
          return p;
        }
        return p + 1;
      });
    }, 90);
    return () => clearInterval(iv);
  }, [phase]);

  /* ── After 2.5s in "saved" → "resetting" → back to "saving" ── */
  useEffect(() => {
    if (phase !== "saved") return;
    const t = setTimeout(() => setPhase("resetting"), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "resetting") return;
    const t = setTimeout(() => setPhase("saving"), 500);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── Computed styles ── */
  const isError = !!saveError;

  // Dot color
  const dotColor = isError
    ? "var(--red)"
    : phase === "saved" || phase === "resetting"
    ? "var(--green)"
    : "var(--amber)";

  const dotPulse =
    !isError && phase === "saving"
      ? "saveIndicatorPulse 2s ease-in-out infinite"
      : "none";

  // "Saving..." — visible in "saving" phase, slides up when "saved" enters
  const savingY = phase === "saving" ? 0 : -14;
  const savingO = phase === "saving" ? 1 : 0;

  // "Saved ✓" — enters from below, exits upward
  const savedY = phase === "saved" ? 0 : phase === "resetting" ? -14 : 14;
  const savedO = phase === "saved" ? 1 : 0;

  return (
    <>
      <style>{`
        @keyframes saveIndicatorPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 20,
        }}
      >
        {/* Dot — always visible */}
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: dotColor,
            transition: "background 0.8s ease",
            animation: dotPulse,
            flexShrink: 0,
          }}
        />

        {/* Text container — always has content */}
        {isError ? (
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12,
              color: "var(--red-text)",
              whiteSpace: "nowrap",
            }}
          >
            Error
          </span>
        ) : (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              height: 16,
              width: 62,
            }}
          >
            {/* "Saving..." — always-on default text */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                transform: `translateY(${savingY}px)`,
                opacity: savingO,
                transition: "transform 0.5s ease, opacity 0.5s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Saving...
              </span>
            </div>

            {/* "Saved ✓" — appears briefly after save */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: 2,
                transform: `translateY(${savedY}px)`,
                opacity: savedO,
                transition: "transform 0.5s ease, opacity 0.5s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12,
                  color: "var(--green-text)",
                }}
              >
                {SAVED.split("").map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: i < savedChars ? 1 : 0,
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              <svg width="10" height="10" viewBox="0 0 12 12" style={{ marginLeft: 1, overflow: "visible" }}>
                <path
                  d="M2 6.5L4.5 9L10 3"
                  fill="none"
                  stroke="var(--green-text)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={12}
                  strokeDashoffset={checkDrawn ? 0 : 12}
                  style={{ transition: "stroke-dashoffset 0.4s ease 0.1s" }}
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
