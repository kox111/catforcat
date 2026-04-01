"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme, type Theme } from "@/components/ThemeProvider";

/* ─── Tour step definitions ─── */
interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right";
  action?: "click" | "next"; // "click" = user must click the element
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "__welcome__",
    title: "Welcome to catforcat.",
    description: "Let me show you around. This will take 15 seconds.",
    position: "bottom",
  },
  {
    target: "new-project",
    title: "Create a project",
    description:
      "Upload a file or paste text to start translating. We support DOCX, PDF, XLIFF, SDLXLIFF, and 15+ formats.",
    position: "bottom",
  },
  {
    target: "first-project",
    title: "Your projects",
    description:
      "Each card shows your progress. Click any project to open the editor.",
    position: "top",
  },
  {
    target: "avatar",
    title: "You're all set",
    description:
      "Settings, theme, and account live here. Now go translate something.",
    position: "left",
  },
];

const THEME_DOTS: { id: Theme; color: string; border: string }[] = [
  { id: "dark", color: "#1a1a1e", border: "1px solid #3e3e42" },
  { id: "sakura", color: "#e4c8cc", border: "1px solid rgba(120,90,100,0.14)" },
  { id: "light", color: "#f5f5f2", border: "1px solid rgba(0,0,0,0.12)" },
  { id: "linen", color: "#C4AA90", border: "1px solid #B09878" },
  { id: "forest", color: "#3A3028", border: "1px solid #4A3E32" },
];

/* ─── Spotlight cutout overlay ─── */
function SpotlightOverlay({
  rect,
  onClick,
}: {
  rect: DOMRect | null;
  onClick: () => void;
}) {
  const pad = 8;
  const radius = 12;

  // If no rect (welcome step), full dark overlay
  if (!rect) {
    return (
      <div
        onClick={onClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "var(--overlay)",
          transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
        }}
      />
    );
  }

  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;

  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        cursor: "pointer",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={radius}
              fill="black"
              style={{
                transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      {/* Glow ring around spotlight */}
      <div
        style={{
          position: "absolute",
          left: x - 2,
          top: y - 2,
          width: w + 4,
          height: h + 4,
          borderRadius: radius + 2,
          border: "1px solid var(--accent)",
          boxShadow: "0 0 20px var(--glow-accent-strong), 0 0 40px var(--glow-accent)",
          transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: "none",
          animation: "spotlightPulse 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ─── Tooltip with arrow ─── */
function TourTooltip({
  step,
  currentStep,
  totalSteps,
  rect,
  onNext,
  onSkip,
  isThemeStep,
}: {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  rect: DOMRect | null;
  onNext: () => void;
  onSkip: () => void;
  isThemeStep: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [typedTitle, setTypedTitle] = useState("");
  const [typedDesc, setTypedDesc] = useState("");
  const [showContent, setShowContent] = useState(false);

  // Typewriter effect
  useEffect(() => {
    setTypedTitle("");
    setTypedDesc("");
    setShowContent(false);

    let titleIdx = 0;
    let descIdx = 0;
    const title = step.title;
    const desc = step.description;

    const titleTimer = setInterval(() => {
      titleIdx++;
      setTypedTitle(title.slice(0, titleIdx));
      if (titleIdx >= title.length) {
        clearInterval(titleTimer);
        setShowContent(true);
        // Start description typewriter
        const descTimer = setInterval(() => {
          descIdx++;
          setTypedDesc(desc.slice(0, descIdx));
          if (descIdx >= desc.length) clearInterval(descTimer);
        }, 12);
      }
    }, 30);

    return () => clearInterval(titleTimer);
  }, [step.title, step.description]);

  // Position tooltip relative to target
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    background: "var(--bg-panel)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "24px 28px",
    maxWidth: 360,
    width: "90vw",
    boxShadow:
      "0 8px 32px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.15)",
    animation: "tourSlideIn 400ms cubic-bezier(0.4, 0, 0.2, 1)",
  };

  if (!rect) {
    // Center for welcome step
    tooltipStyle = {
      ...tooltipStyle,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  } else {
    const gap = 16;
    const tooltipW = 360;
    const margin = 16;
    // Clamp horizontal position to stay within viewport
    const clampLeft = (idealLeft: number) =>
      Math.max(margin, Math.min(idealLeft, window.innerWidth - tooltipW - margin));

    switch (step.position) {
      case "bottom":
        tooltipStyle.top = rect.bottom + gap;
        tooltipStyle.left = clampLeft(rect.left + rect.width / 2 - tooltipW / 2);
        break;
      case "top":
        tooltipStyle.bottom = window.innerHeight - rect.top + gap;
        tooltipStyle.left = clampLeft(rect.left + rect.width / 2 - tooltipW / 2);
        break;
      case "left":
        tooltipStyle.top = Math.max(margin, Math.min(rect.top + rect.height / 2 - 80, window.innerHeight - 220));
        tooltipStyle.right = window.innerWidth - rect.left + gap;
        break;
      case "right":
        tooltipStyle.top = Math.max(margin, rect.top + rect.height / 2 - 80);
        tooltipStyle.left = rect.right + gap;
        break;
    }
  }

  return (
    <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
      {/* Step counter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-editor-family)",
            fontSize: 10,
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          {currentStep + 1} / {totalSteps}
        </span>
        <button
          onClick={onSkip}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "var(--font-ui-family)",
            padding: "2px 6px",
            borderRadius: 4,
            transition: "color 150ms",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          Skip tour
        </button>
      </div>

      {/* Title with typewriter */}
      <h3
        style={{
          fontFamily: "var(--font-display-family)",
          fontSize: currentStep === 0 ? 24 : 18,
          fontWeight: 400,
          color: "var(--text-primary)",
          marginBottom: 8,
          minHeight: currentStep === 0 ? 32 : 24,
        }}
      >
        {typedTitle}
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: currentStep === 0 ? 20 : 16,
            background: "var(--accent)",
            marginLeft: 2,
            animation: "cursorBlink 800ms ease-in-out infinite",
            verticalAlign: "text-bottom",
            opacity: typedDesc.length >= step.description.length ? 0 : 1,
            transition: "opacity 300ms",
          }}
        />
      </h3>

      {/* Description with typewriter */}
      <p
        style={{
          fontFamily: "var(--font-ui-family)",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: 20,
          minHeight: 40,
        }}
      >
        {typedDesc}
      </p>

      {/* Theme picker on last step */}
      {isThemeStep && showContent && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            marginBottom: 20,
            animation: "tourFadeIn 300ms ease-out",
          }}
        >
          {THEME_DOTS.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: t.color,
                border: t.border,
                cursor: "pointer",
                boxShadow:
                  theme === t.id
                    ? "0 0 0 2px var(--bg-panel), 0 0 0 4px var(--accent)"
                    : "none",
                transition: "all 200ms",
                transform: theme === t.id ? "scale(1.15)" : "scale(1)",
              }}
              title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
            />
          ))}
        </div>
      )}

      {/* Next button */}
      {showContent && (
        <div style={{ animation: "tourFadeIn 300ms ease-out" }}>
          <button
            onClick={onNext}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 9999,
              background: "var(--accent)",
              border: "none",
              color: "var(--btn-primary-text, #fff)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
              transition: "all 150ms",
              boxShadow: "var(--btn-primary-shadow)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "var(--btn-primary-shadow-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "var(--btn-primary-shadow)";
            }}
          >
            {currentStep === totalSteps - 1
              ? "Start translating"
              : currentStep === 0
                ? "Show me around"
                : "Next"}
          </button>
        </div>
      )}

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 16,
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentStep ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background:
                i === currentStep ? "var(--accent)" : "var(--border)",
              transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Tour Component ─── */
export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem("catforcat-tour-v2")) {
        // Small delay so DOM elements are ready
        setTimeout(() => setShow(true), 500);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Find and track target element position
  const updateTargetRect = useCallback(() => {
    const currentStep = TOUR_STEPS[step];
    if (!currentStep || currentStep.target === "__welcome__") {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!show) return;
    updateTargetRect();

    // Track on scroll/resize
    const onUpdate = () => {
      rafRef.current = requestAnimationFrame(updateTargetRect);
    };
    window.addEventListener("scroll", onUpdate, true);
    window.addEventListener("resize", onUpdate);

    return () => {
      window.removeEventListener("scroll", onUpdate, true);
      window.removeEventListener("resize", onUpdate);
      cancelAnimationFrame(rafRef.current);
    };
  }, [show, step, updateTargetRect]);

  if (!show) return null;

  // Find next valid step (skip steps whose target element doesn't exist in DOM)
  const findNextValidStep = (fromStep: number): number => {
    for (let i = fromStep; i < TOUR_STEPS.length; i++) {
      const s = TOUR_STEPS[i];
      if (s.target === "__welcome__") return i;
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (el) return i;
    }
    return -1; // no valid steps left
  };

  const finish = () => {
    try {
      localStorage.setItem("catforcat-tour-v2", "true");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const next = () => {
    const nextValid = findNextValidStep(step + 1);
    if (nextValid >= 0) {
      setStep(nextValid);
    } else {
      finish();
    }
  };

  const currentTourStep = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes spotlightPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes tourSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tourFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <SpotlightOverlay rect={targetRect} onClick={next} />
      <TourTooltip
        step={currentTourStep}
        currentStep={step}
        totalSteps={TOUR_STEPS.length}
        rect={targetRect}
        onNext={next}
        onSkip={finish}
        isThemeStep={isLastStep}
      />
    </>
  );
}
