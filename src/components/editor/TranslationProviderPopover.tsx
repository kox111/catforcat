"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Sparkles, Lock, Star, ChevronRight, X } from "lucide-react";

export type TranslationProvider = "google" | "deepl" | "ai";

interface ProviderOption {
  id: TranslationProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  badge?: string;
  stars: number; // 1-3 quality stars
}

interface TranslationProviderPopoverProps {
  currentProvider: TranslationProvider;
  onSelect: (provider: TranslationProvider) => void;
  onClose: () => void;
  isPro?: boolean;
  usageCount?: number;
  usageLimit?: number;
}

export default function TranslationProviderPopover({
  currentProvider,
  onSelect,
  onClose,
  isPro = false,
  usageCount = 0,
  usageLimit = 50,
}: TranslationProviderPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const providers: ProviderOption[] = [
    {
      id: "google",
      name: "Google Translate",
      description: "Fast, reliable machine translation",
      icon: <Globe size={18} style={{ color: "var(--accent)" }} />,
      available: true,
      stars: 1,
    },
    {
      id: "deepl",
      name: "DeepL Pro",
      description: "Neural MT, professional quality",
      icon: <Sparkles size={18} style={{ color: "var(--accent)" }} />,
      available: isPro,
      badge: isPro ? undefined : "PRO",
      stars: 3,
    },
    {
      id: "ai",
      name: "AI Advanced",
      description: "Context-aware LLM translation",
      icon: <Sparkles size={18} style={{ color: "var(--purple)" }} />,
      available: false,
      badge: "SOON",
      stars: 3,
    },
  ];

  function renderStars(count: number) {
    return (
      <span style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            size={10}
            style={{
              color: n <= count ? "var(--amber)" : "var(--text-muted)",
              opacity: n <= count ? 1 : 0.3,
            }}
            fill={n <= count ? "var(--amber)" : "none"}
          />
        ))}
      </span>
    );
  }

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: 0,
        left: "calc(100% + 8px)",
        width: 300,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-md)",
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
        transition: "opacity 150ms ease, transform 150ms ease",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px 8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Translation Engine
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            borderRadius: "var(--radius-sm)",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <X size={14} />
        </button>
      </div>

      {/* Usage bar */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 6,
          }}
        >
          <span>Monthly usage</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
            }}
          >
            {usageCount}/{usageLimit}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, (usageCount / usageLimit) * 100)}%`,
              height: "100%",
              borderRadius: 2,
              background:
                usageCount / usageLimit > 0.9
                  ? "var(--red)"
                  : usageCount / usageLimit > 0.7
                    ? "var(--amber)"
                    : "var(--accent)",
              transition: "width 300ms ease",
            }}
          />
        </div>
      </div>

      {/* Provider list */}
      <div style={{ padding: "6px 0" }}>
        {providers.map((provider) => {
          const isSelected = currentProvider === provider.id;
          const isLocked = !provider.available;

          return (
            <button
              key={provider.id}
              onClick={() => {
                if (provider.available) {
                  onSelect(provider.id);
                  onClose();
                }
              }}
              disabled={isLocked}
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: isSelected ? "var(--accent-soft)" : "transparent",
                border: "none",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.5 : 1,
                transition: "background 100ms",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!isLocked && !isSelected) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isSelected ? "var(--accent-soft)" : "transparent";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-sm)",
                  background: isSelected ? "var(--accent)" : "var(--bg-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isLocked ? (
                  <Lock size={16} style={{ color: "var(--text-muted)" }} />
                ) : (
                  <span style={{ filter: isSelected ? "brightness(10)" : "none" }}>
                    {provider.icon}
                  </span>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    }}
                  >
                    {provider.name}
                  </span>
                  {provider.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background:
                          provider.badge === "PRO"
                            ? "var(--accent-soft)"
                            : "var(--purple-soft)",
                        color:
                          provider.badge === "PRO"
                            ? "var(--text-primary)"
                            : "var(--purple)",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {provider.badge}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  {renderStars(provider.stars)}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                    }}
                  >
                    {provider.description}
                  </span>
                </div>
              </div>

              {/* Selected check / Upgrade arrow */}
              {isSelected ? (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    flexShrink: 0,
                  }}
                />
              ) : isLocked && provider.badge === "PRO" ? (
                <ChevronRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Upgrade CTA for free users */}
      {!isPro && (
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            style={{
              width: "100%",
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)",
              color: "var(--text-primary)",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 200ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
}
