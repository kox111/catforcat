"use client";

import { useState, useEffect } from "react";
import { useTheme, type Theme } from "./ThemeProvider";

const THEME_PREVIEWS: {
  id: Theme;
  label: string;
  previewBg: string;
  labelBg: string;
  labelText: string;
  toolbarText: string;
  lineText: string;
  lineMuted: string;
}[] = [
  {
    id: "sakura",
    label: "Sakura",
    previewBg: "#EFC4CC",
    labelBg: "#F2CCD3",
    labelText: "#5C4A50",
    toolbarText: "#5C4A50",
    lineText: "#5C4A50",
    lineMuted: "#B0A0A6",
  },
  {
    id: "dark",
    label: "Dark",
    previewBg: "#202124",
    labelBg: "#2A2A2D",
    labelText: "#BDB8B2",
    toolbarText: "#BDB8B2",
    lineText: "#BDB8B2",
    lineMuted: "#5A5A5D",
  },
  {
    id: "light",
    label: "Light",
    previewBg: "#F7F6F3",
    labelBg: "#F0EFEC",
    labelText: "#1A1A1A",
    toolbarText: "#1A1A1A",
    lineText: "#1A1A1A",
    lineMuted: "#AAAAAA",
  },
  {
    id: "linen",
    label: "Linen",
    previewBg: "#E0D0C4",
    labelBg: "#C4AA90",
    labelText: "#3E2820",
    toolbarText: "#4A3028",
    lineText: "#4A3028",
    lineMuted: "#C4A898",
  },
];

export default function ThemeOnboarding() {
  const { theme, setTheme } = useTheme();
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<Theme>("sakura");

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem("catforcat-onboarded");
      if (!onboarded) {
        setShow(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  const handleSelect = (t: Theme) => {
    setSelected(t);
    setTheme(t);
  };

  const handleContinue = () => {
    try {
      localStorage.setItem("catforcat-onboarded", "true");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
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
          padding: "28px 24px",
          maxWidth: 440,
          width: "100%",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: 22,
            fontWeight: 400,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Welcome to catforcat.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 13,
            fontWeight: 400,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Choose your workspace theme. You can change it anytime.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {THEME_PREVIEWS.map((t) => {
            const isActive = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                style={{
                  background: "transparent",
                  border: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                {/* Mini editor preview */}
                <div
                  style={{
                    height: 72,
                    background: t.previewBg,
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display-family)",
                        fontSize: 7,
                        color: t.toolbarText,
                      }}
                    >
                      catforcat.
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-editor-family)",
                        fontSize: 5,
                        color: t.lineMuted,
                      }}
                    >
                      ES→EN
                    </span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 6,
                        color: t.lineText,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: 2,
                      }}
                    >
                      Source text here...
                    </div>
                    <div
                      style={{
                        fontSize: 6,
                        color: t.lineMuted,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Target translation...
                    </div>
                  </div>
                </div>
                {/* Label */}
                <div
                  style={{
                    background: t.labelBg,
                    padding: "5px 10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      fontFamily: "var(--font-ui-family)",
                      color: t.labelText,
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleContinue}
            style={{
              background: "var(--accent-soft)",
              color: "var(--text-primary)",
              border: "0.5px solid var(--border)",
              borderRadius: 24,
              padding: "10px 32px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-ui-family)",
              backdropFilter: "blur(4px)",
              cursor: "pointer",
              transition: "background 150ms, border-color 150ms",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
