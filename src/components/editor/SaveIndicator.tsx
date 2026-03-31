"use client";

import { useState, useEffect, useRef } from "react";

/* ─── Types ─── */

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: number | null;
  saveError: string | null;
}

type Phase = "idle" | "saving" | "saved" | "error";

/* ─── Component ─── */

export default function SaveIndicator({
  isSaving,
  lastSavedAt,
  saveError,
}: SaveIndicatorProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [savingChars, setSavingChars] = useState(0);
  const [savedChars, setSavedChars] = useState(0);
  const [checkDrawn, setCheckDrawn] = useState(false);

  const prevSavingRef = useRef(false);
  const prevSavedRef = useRef<number | null>(null);
  const saveCompletedRef = useRef(false);
  const saveFailedRef = useRef(false);

  const SAVING_TEXT = "Saving..."; // 9 chars × 1s = 9s animation
  const SAVED_TEXT = "Saved";

  /* ── Detect save START (isSaving false → true) ── */
  useEffect(() => {
    if (isSaving && !prevSavingRef.current) {
      setPhase("saving");
      setSavingChars(0);
      saveCompletedRef.current = false;
      saveFailedRef.current = false;
    }
    prevSavingRef.current = isSaving;
  }, [isSaving]);

  /* ── Detect save COMPLETED (lastSavedAt changed) ── */
  useEffect(() => {
    if (!lastSavedAt || lastSavedAt === prevSavedRef.current) return;
    prevSavedRef.current = lastSavedAt;
    saveCompletedRef.current = true;
    // If typewriter already finished, transition immediately
    if (phase === "saving" && savingChars >= SAVING_TEXT.length) {
      setPhase("saved");
      setSavedChars(0);
      setCheckDrawn(false);
    }
  }, [lastSavedAt, phase, savingChars]);

  /* ── Detect save ERROR ── */
  useEffect(() => {
    if (!saveError) return;
    saveFailedRef.current = true;
    // If typewriter already finished, show error immediately
    if (phase === "saving" && savingChars >= SAVING_TEXT.length) {
      setPhase("error");
    }
    // If not saving, show error directly
    if (phase !== "saving") {
      setPhase("error");
    }
  }, [saveError, phase, savingChars]);

  /* ── Typewriter for "Saving..." — 1 second per character ── */
  useEffect(() => {
    if (phase !== "saving") return;
    setSavingChars(0);
    saveCompletedRef.current = false;
    saveFailedRef.current = false;
    const iv = setInterval(() => {
      setSavingChars((p) => {
        if (p >= SAVING_TEXT.length) {
          clearInterval(iv);
          return p;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  /* ── Typewriter finished → check if save completed or failed ── */
  useEffect(() => {
    if (phase !== "saving") return;
    if (savingChars < SAVING_TEXT.length) return;
    // Typewriter done — transition based on save result
    if (saveFailedRef.current) {
      setPhase("error");
    } else if (saveCompletedRef.current) {
      setPhase("saved");
      setSavedChars(0);
      setCheckDrawn(false);
    }
    // If save is still in progress (rare), wait — lastSavedAt effect will handle it
  }, [savingChars, phase]);

  /* ── Typewriter for "Saved" — fast (200ms/char), then draw check ── */
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

  /* ── After 2.5s in "saved" → back to idle ── */
  useEffect(() => {
    if (phase !== "saved") return;
    const t = setTimeout(() => setPhase("idle"), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── Error → show 2s then back to idle ── */
  useEffect(() => {
    if (phase !== "error") return;
    const t = setTimeout(() => setPhase("idle"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── Computed styles ── */

  const dotColor =
    phase === "error"
      ? "var(--red)"
      : phase === "saved"
        ? "var(--green)"
        : "var(--text-muted)";

  const dotPulse =
    phase === "saving" ? "saveIndicatorPulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite" : "none";

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
            {/* "Saving..." — slow typewriter (1 char per second) */}
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

            {/* "Saved" — fast typewriter (200ms) + animated check */}
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
