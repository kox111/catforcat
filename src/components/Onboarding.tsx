"use client";

import { useState, useEffect } from "react";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { Globe, Lock, Shield } from "lucide-react";

const THEME_DOTS: { id: Theme; color: string; border: string }[] = [
  { id: "dark", color: "#202124", border: "0.5px solid #3C3C3F" },
  {
    id: "sakura",
    color: "#EFC4CC",
    border: "0.5px solid #ffffff4d",
  },
  { id: "light", color: "#F7F6F3", border: "0.5px solid #ECEAE5" },
  { id: "linen", color: "#C4AA90", border: "0.5px solid #B09878" },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    try {
      if (!localStorage.getItem("catforcat-onboarded")) {
        setShow(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  const finish = () => {
    try {
      localStorage.setItem("catforcat-onboarded", "true");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else finish();
  };

  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: active ? "var(--accent)" : "var(--border)",
    transition: "background 200ms",
  });

  const btnStyle: React.CSSProperties = {
    padding: "10px 28px",
    borderRadius: 24,
    background: "var(--btn-bg)",
    border: "1px solid var(--btn-border)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "background 150ms",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay)",
      }}
    >
      <div
        style={{
          background: "var(--bg-panel)",
          border: "0.5px solid var(--border)",
          borderRadius: 14,
          padding: 32,
          maxWidth: 480,
          width: "90%",
          textAlign: "center",
        }}
      >
        {/* Step 1: Welcome */}
        {step === 0 && (
          <>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Welcome to catforcat.
            </h2>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              Let&apos;s show you around. It takes 30 seconds.
            </p>
            <button
              onClick={next}
              style={btnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg)")
              }
            >
              Let&apos;s go
            </button>
          </>
        )}

        {/* Step 2: Your workspace */}
        {step === 1 && (
          <>
            <h2
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Your workspace
            </h2>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              Create projects, import files, and start translating. Your editor
              has all the tools you need on the left sidebar.
            </p>
            <button
              onClick={next}
              style={btnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg)")
              }
            >
              Next
            </button>
          </>
        )}

        {/* Step 3: Privacy */}
        {step === 2 && (
          <>
            <h2
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Privacy is yours to control
            </h2>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Every project has a privacy level. Standard uses all features.
              Private keeps data off public TMs. Confidential means zero
              external calls.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 24,
                marginBottom: 28,
              }}
            >
              {[
                { icon: Globe, label: "Standard" },
                { icon: Lock, label: "Private" },
                { icon: Shield, label: "Confidential" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--accent-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={next}
              style={btnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg)")
              }
            >
              Next
            </button>
          </>
        )}

        {/* Step 4: Make it yours */}
        {step === 3 && (
          <>
            <h2
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Make it yours
            </h2>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Choose your theme and adjust your view size anytime.
            </p>

            {/* Functional theme dots */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 28,
              }}
            >
              {THEME_DOTS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: t.color,
                    border: t.border,
                    cursor: "pointer",
                    boxShadow:
                      theme === t.id
                        ? "0 0 0 2px var(--bg-panel), 0 0 0 4px var(--accent)"
                        : "none",
                    transition: "box-shadow 150ms",
                  }}
                  title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                />
              ))}
            </div>

            <button
              onClick={finish}
              style={btnStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--btn-bg)")
              }
            >
              Start translating
            </button>
          </>
        )}

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 20,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={dotStyle(i === step)} />
          ))}
        </div>
      </div>
    </div>
  );
}
