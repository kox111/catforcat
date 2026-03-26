"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, Lock, Shield, X } from "lucide-react";
import { PRIVACY_CONFIGS, type PrivacyLevel } from "@/lib/privacy";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Globe,
  Lock,
  Shield,
};

const FEATURE_TAGS = [
  { key: "aiEnabled", on: "AI", off: "AI off" },
  { key: "myMemoryEnabled", on: "MyMemory", off: "MyMemory off" },
  { key: "smartReviewEnabled", on: "Smart Review", off: "Smart Review off" },
  { key: "cloudTmEnabled", on: "Cloud TM", off: "Cloud TM off" },
] as const;

interface PrivacySelectorProps {
  projectId: string;
  currentLevel: PrivacyLevel;
  onClose: () => void;
  onChanged: (newLevel: PrivacyLevel) => void;
}

export default function PrivacySelector({
  projectId,
  currentLevel,
  onClose,
  onChanged,
}: PrivacySelectorProps) {
  const [selected, setSelected] = useState<PrivacyLevel>(currentLevel);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSelect(level: PrivacyLevel) {
    if (level === currentLevel) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacyLevel: level }),
      });
      if (res.ok) {
        setSelected(level);
        onChanged(level);
        onClose();
      }
    } catch (err) {
      console.error("Failed to update privacy level:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "var(--bg-panel)",
          border: "0.5px solid var(--border)",
          borderRadius: 14,
          padding: "20px 24px",
          maxWidth: 420,
          width: "90%",
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            Privacy Level
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(Object.keys(PRIVACY_CONFIGS) as PrivacyLevel[]).map((level) => {
            const config = PRIVACY_CONFIGS[level];
            const Icon = ICONS[config.icon] || Globe;
            const isActive = selected === level;

            return (
              <button
                key={level}
                onClick={() => handleSelect(level)}
                disabled={saving}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "12px 14px",
                  borderRadius: "var(--radius)",
                  border: isActive
                    ? "1.5px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: isActive
                    ? "var(--accent-soft)"
                    : "var(--bg-card)",
                  cursor: saving ? "wait" : "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "border-color 150ms, background 150ms",
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {/* Icon + Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={14} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Description */}
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {config.description}
                </span>

                {/* Feature tags */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  {FEATURE_TAGS.map((tag) => {
                    const enabled = config[
                      tag.key as keyof PrivacyConfig
                    ] as boolean;
                    return (
                      <span
                        key={tag.key}
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: enabled
                            ? "var(--green-text)"
                            : "var(--red-text)",
                          background: enabled
                            ? "var(--green-soft)"
                            : "var(--red-soft)",
                        }}
                      >
                        {enabled ? tag.on : tag.off}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Small badge for use in project cards and editor header
interface PrivacyBadgeProps {
  level: PrivacyLevel;
  onClick?: (e: React.MouseEvent) => void;
}

export function PrivacyBadge({ level, onClick }: PrivacyBadgeProps) {
  const config = PRIVACY_CONFIGS[level];
  const Icon = ICONS[config.icon] || Globe;

  const isConfidential = level === "confidential";
  const isPrivate = level === "private";

  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 12,
        border: "none",
        background: isConfidential
          ? "var(--amber-soft)"
          : isPrivate
            ? "var(--bg-hover)"
            : "transparent",
        color: isConfidential
          ? "var(--amber-text)"
          : isPrivate
            ? "var(--text-primary)"
            : "var(--text-muted)",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "'Inter', system-ui, sans-serif",
        cursor: onClick ? "pointer" : "default",
        transition: "background 150ms",
      }}
    >
      <Icon size={10} />
      <span>{config.label}</span>
    </button>
  );
}

// Re-export for convenience
type PrivacyConfig = import("@/lib/privacy").PrivacyConfig;
