"use client";

import { useState, useEffect, useRef } from "react";

/* ─── Types ─── */

interface SaveIndicatorProps {
  hasPendingChanges: boolean;
  lastSavedAt: number | null;
  saveError: string | null;
}

type Phase = "idle" | "saving" | "saved" | "error";

/* ─── Component ─── */

export default function SaveIndicator({
  hasPendingChanges,
  lastSavedAt,
  saveError,
}: SaveIndicatorProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [savingChars, setSavingChars] = useState(0);
  const [savedChars, setSavedChars] = useState(0);
  const [checkDrawn, setCheckDrawn] = useState(false);
  const prevSavedRef = useRef<number | null>(null);

  const SAVING_TEXT = "Saving..."; // 9 chars * ~1.5s = ~13.5s (fits in 15s cycle)
  const SAVED_TEXT = "Saved";

  /* ── Error → show 2s then back to idle ── */
  useEffect(() => {
    if (!saveError) return;
    setPhase("error");
    const t = setTimeout(() => setPhase("idle"), 2000);
    return () => clearTimeout(t);
  }, [saveError]);

  /* ── Pending changes appear → start SAVING phase ── */
  useEffect(() => {
    if (phase === "saved" || phase === "error") return;
    if (hasPendingChanges) {
      if (phase !== "saving") {
        setPhase("saving");
        setSavingChars(0);
      }
    } else if (phase === "saving") {
      // No more pending but we haven't saved yet — go idle
      setPhase("idle");
    }
  }, [hasPendingChanges, phase]);

  /* ── Save completed → SAVED phase ── */
  useEffect(() => {
    if (!lastSavedAt || lastSavedAt === prevSavedRef.current) return;
    prevSavedRef.current = lastSavedAt;
    setPhase("saved");
    setSavedChars(0);
    setCheckDrawn(false);
  }, [lastSavedAt]);

  /* ── Typewriter for "Saving..." — human typing speed ~220ms/char ── */
  useEffect(() => {
    if (phase !== "saving") return;
    setSavingChars(0);
    const iv = setInterval(() => {
      setSavingChars((p) => {
        if (p >= SAVING_TEXT.length) {
          clearInterval(iv);
          return p;
        }
        return p + 1;
      });
    }, 220);
    return () => clearInterval(iv);
  }, [phase]);

  /* ── Typewriter for "Saved" — human speed ~200ms/char, then draw check ── */
  useEffect(() => {
    if (phase !== "saved") return;
    setSavedChars(0);
    setCheckDrawn(false);
    const iv = setInterval(() => {
      setSavedChars((p) => {
        if (p >= SAVED_TEXT.length) {
          clearInterval(iv);
          setTimeout(() => setCheckDrawn(true), 300);
          return p;
        }
        return p + 1;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [phase]);

  /* ── After 2.5s in "saved" → back to idle or saving ── */
  useEffect(() => {
    if (phase !== "saved") return;
    const t = setTimeout(() => {
      if (hasPendingChanges) {
        setPhase("saving");
        setSavingChars(0);
      } else {
        setPhase("idle");
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [phase, hasPendingChanges]);

  /* ── Computed styles ── */

  // Dot color: muted (idle/saving), green (saved), red (error)
  const dotColor =
    phase === "error"
      ? "var(--red)"
      : phase === "saved"
        ? "var(--green)"
        : "var(--text-muted)";

  const dotPulse =
    phase === "saving" ? "saveIndicatorPulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite" : "none";

  // Slide positions for saving→saved transition
  const savingY = phase === "saving" ? 0 : -14;
  const savingO = phase === "saving" ? 1 : 0;
  const savedY = phase === "saved" ? 0 : 14;
  const savedO = phase === "saved" ? 1 : 0;

  return (
    <>
      <style>{`
        @keyframes saveIndicatorPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
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

        {/* Text area — empty in idle, content in saving/saved/error */}
        {phase === "error" ? (
          <span
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 12,
              color: "var(--red-text)",
              whiteSpace: "nowrap",
            }}
          >
            Error
          </span>
        ) : phase === "idle" ? null : (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              height: 16,
              width: 62,
            }}
          >
            {/* "Saving..." — slow typewriter (1 char per ~1.5s) */}
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
                  fontFamily: "var(--font-ui-family)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                {SAVING_TEXT.split("").map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: i < savingChars ? 1 : 0,
                      transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </div>

            {/* "Saved" — fast typewriter (90ms) + animated check */}
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
                  fontFamily: "var(--font-ui-family)",
                  fontSize: 12,
                  color: "var(--green-text)",
                }}
              >
                {SAVED_TEXT.split("").map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: i < savedChars ? 1 : 0,
                      transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                style={{ marginLeft: 1, overflow: "visible" }}
              >
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
