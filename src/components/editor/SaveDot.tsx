"use client";

import { useState, useEffect, useRef } from "react";

interface SaveDotProps {
  isSaving: boolean;
  lastSavedAt: number | null;
  saveError: string | null;
  mode: "text" | "dot";
}

type Phase = "idle" | "saving" | "saved" | "error";

const SAVING_TEXT = "Saving";
const SAVED_TEXT = "Saved";
const SAVING_CHAR_MS = 60;
const SAVED_CHAR_MS = 80;

export default function SaveDot({ isSaving, lastSavedAt, saveError, mode }: SaveDotProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [savingChars, setSavingChars] = useState(0);
  const [savedChars, setSavedChars] = useState(0);

  const prevSavingRef = useRef(false);
  const prevSavedRef = useRef<number | null>(null);
  const saveCompletedRef = useRef(false);
  const saveFailedRef = useRef(false);

  /* Detect reduced motion preference */
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Detect save START */
  useEffect(() => {
    if (isSaving && !prevSavingRef.current) {
      setPhase("saving");
      setSavingChars(0);
      saveCompletedRef.current = false;
      saveFailedRef.current = false;
    }
    prevSavingRef.current = isSaving;
  }, [isSaving]);

  /* Detect save COMPLETED */
  useEffect(() => {
    if (!lastSavedAt || lastSavedAt === prevSavedRef.current) return;
    prevSavedRef.current = lastSavedAt;
    saveCompletedRef.current = true;
    if (phase === "saving" && (savingChars >= SAVING_TEXT.length || reduceMotion || mode === "dot")) {
      setPhase("saved");
      setSavedChars(0);
    }
  }, [lastSavedAt, phase, savingChars, reduceMotion, mode]);

  /* Detect save ERROR */
  useEffect(() => {
    if (!saveError) return;
    saveFailedRef.current = true;
    if (phase === "saving" && (savingChars >= SAVING_TEXT.length || reduceMotion || mode === "dot")) {
      setPhase("error");
    }
    if (phase !== "saving") {
      setPhase("error");
    }
  }, [saveError, phase, savingChars, reduceMotion, mode]);

  /* Typewriter for "Saving" */
  useEffect(() => {
    if (phase !== "saving" || mode === "dot" || reduceMotion) return;
    setSavingChars(0);
    const iv = setInterval(() => {
      setSavingChars((p) => {
        if (p >= SAVING_TEXT.length) {
          clearInterval(iv);
          return p;
        }
        return p + 1;
      });
    }, SAVING_CHAR_MS);
    return () => clearInterval(iv);
  }, [phase, mode, reduceMotion]);

  /* Typewriter finished -> transition */
  useEffect(() => {
    if (phase !== "saving" || mode === "dot" || reduceMotion) return;
    if (savingChars < SAVING_TEXT.length) return;
    if (saveFailedRef.current) {
      setPhase("error");
    } else if (saveCompletedRef.current) {
      setPhase("saved");
      setSavedChars(0);
    }
  }, [savingChars, phase, mode, reduceMotion]);

  /* Typewriter for "Saved" */
  useEffect(() => {
    if (phase !== "saved" || mode === "dot" || reduceMotion) return;
    setSavedChars(0);
    const iv = setInterval(() => {
      setSavedChars((p) => {
        if (p >= SAVED_TEXT.length) {
          clearInterval(iv);
          return p;
        }
        return p + 1;
      });
    }, SAVED_CHAR_MS);
    return () => clearInterval(iv);
  }, [phase, mode, reduceMotion]);

  /* Auto-dismiss saved */
  useEffect(() => {
    if (phase !== "saved") return;
    const t = setTimeout(() => setPhase("idle"), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  /* Auto-dismiss error */
  useEffect(() => {
    if (phase !== "error") return;
    const t = setTimeout(() => setPhase("idle"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  /* Dot color */
  const dotColor =
    phase === "error"
      ? "var(--red)"
      : phase === "saving"
        ? "var(--amber)"
        : phase === "saved"
          ? "var(--green)"
          : "var(--text-muted)";

  const dotAnimation =
    phase === "saving" && !reduceMotion
      ? "saveDotPulse 1.4s ease-in-out infinite"
      : "none";

  /* Dot-only render */
  if (mode === "dot") {
    return (
      <>
        <style>{`
          @keyframes saveDotPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
        <div
          aria-label={
            phase === "saving"
              ? "Saving"
              : phase === "saved"
                ? "Saved"
                : phase === "error"
                  ? "Save error"
                  : "Ready"
          }
          title={
            phase === "saving"
              ? "Saving"
              : phase === "saved"
                ? "Saved"
                : phase === "error"
                  ? "Save error"
                  : "Ready"
          }
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: dotColor,
            transition: "background 400ms ease, opacity 200ms ease",
            animation: dotAnimation,
            opacity: phase === "idle" ? 0 : 1,
            flexShrink: 0,
          }}
        />
      </>
    );
  }

  /* Text-only render (typewriter, no dot) */
  return (
    <>
      <style>{`
        @keyframes saveDotPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 20,
        }}
      >
        {/* Text */}
        {phase === "error" ? (
          <span
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 11,
              color: "var(--red-text)",
              whiteSpace: "nowrap",
            }}
          >
            Error
          </span>
        ) : reduceMotion ? (
          /* No typewriter: instant text */
          phase === "saving" ? (
            <span
              style={{
                fontFamily: "var(--font-ui-family)",
                fontSize: 11,
                color: "var(--accent)",
                whiteSpace: "nowrap",
              }}
            >
              Saving
            </span>
          ) : phase === "saved" ? (
            <span
              style={{
                fontFamily: "var(--font-ui-family)",
                fontSize: 11,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Saved
            </span>
          ) : null
        ) : phase === "idle" ? null : (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              height: 16,
              minWidth: 44,
            }}
          >
            {/* "Saving" typewriter */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                transform: `translateY(${phase === "saving" ? 0 : -14}px)`,
                opacity: phase === "saving" ? 1 : 0,
                transition: "transform 0.4s ease, opacity 0.4s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ui-family)",
                  fontSize: 11,
                  color: "var(--accent)",
                }}
              >
                {SAVING_TEXT.split("").map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: i < savingChars ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </div>

            {/* "Saved" typewriter */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                transform: `translateY(${phase === "saved" ? 0 : 14}px)`,
                opacity: phase === "saved" ? 1 : 0,
                transition: "transform 0.4s ease, opacity 0.4s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ui-family)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {SAVED_TEXT.split("").map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: i < savedChars ? 1 : 0,
                      transition: "opacity 0.25s ease",
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
