"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface SettingsData {
  plan: string;
  translationProvider: string;
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  hasSubscription: boolean;
  subscriptionEndsAt: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data: SettingsData = await res.json();
          setSettings(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch {
      // silent
    } finally {
      setUpgrading(false);
    }
  };

  const handleManage = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch {
      // silent
    }
  };

  const isPro = settings?.plan === "pro";
  const aiPct = settings
    ? Math.min(100, Math.round((settings.aiRequestsUsed / settings.aiRequestsLimit) * 100))
    : 0;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
        Settings
      </h1>

      {loading ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading settings...
        </div>
      ) : (
        <>
          {/* Plan Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Your Plan
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: isPro ? "var(--accent)" : "var(--bg-deep)",
                  color: isPro ? "#fff" : "var(--text-secondary)",
                }}
              >
                {isPro ? "Pro" : "Free"}
              </span>
            </div>

            {isPro ? (
              <div>
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  You&apos;re on the <strong style={{ color: "var(--text-primary)" }}>Pro plan</strong> ($10/month).
                  Translations powered by <strong style={{ color: "var(--text-primary)" }}>DeepL Pro</strong>.
                </p>
                {settings?.subscriptionEndsAt && (
                  <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    Current period ends: {new Date(settings.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={handleManage}
                  className="px-4 py-1.5 rounded text-sm"
                  style={{
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Free plan — translations powered by <strong style={{ color: "var(--text-primary)" }}>Google Translate</strong>.
                  Upgrade to Pro for DeepL Pro quality and higher limits.
                </p>

                {/* Feature comparison */}
                <div
                  style={{
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div style={{ color: "var(--text-muted)" }}>Feature</div>
                    <div style={{ color: "var(--text-muted)" }}>Free</div>
                    <div style={{ color: "var(--accent)" }}>Pro ($10/mo)</div>
                  </div>
                  {[
                    ["Translation engine", "Google", "DeepL Pro"],
                    ["Projects", "3 active", "Unlimited"],
                    ["Segments/project", "500", "Unlimited"],
                    ["AI suggestions", "50/month", "1,000/month"],
                    ["TM entries", "1,000", "Unlimited"],
                    ["Import formats", "TXT", "TXT, DOCX, PDF, XLIFF"],
                    ["Export formats", "TXT", "TXT, DOCX, XLIFF, TMX"],
                  ].map(([feature, free, pro]) => (
                    <div key={feature} className="grid grid-cols-3 gap-2 text-xs py-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                      <div style={{ color: "var(--text-secondary)" }}>{feature}</div>
                      <div style={{ color: "var(--text-muted)" }}>{free}</div>
                      <div style={{ color: "var(--text-primary)" }}>{pro}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="px-5 py-2 rounded text-sm font-medium"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    opacity: upgrading ? 0.6 : 1,
                  }}
                >
                  {upgrading ? "Redirecting..." : "Upgrade to Pro — $10/month"}
                </button>
              </div>
            )}
          </section>

          {/* Usage Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Usage This Month
            </h2>

            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--text-secondary)" }}>AI Translation Requests</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {settings?.aiRequestsUsed || 0} / {settings?.aiRequestsLimit || 0}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-deep)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${aiPct}%`,
                    background: aiPct > 90 ? "var(--red)" : aiPct > 70 ? "var(--amber)" : "var(--accent)",
                  }}
                />
              </div>
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Translation provider: {settings?.translationProvider}
            </p>
          </section>

          {/* Appearance Section (F2 + F3) */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Appearance
            </h2>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Theme</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Switch between dark and light mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-1.5 rounded text-sm font-medium transition-colors"
                style={{
                  background: "var(--bg-deep)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              >
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </button>
            </div>

            {/* Font Size (F3) */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Editor Font Size</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Adjust text size in the translation editor (12–20px)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={12}
                  max={20}
                  step={1}
                  defaultValue={
                    typeof window !== "undefined"
                      ? Number(localStorage.getItem("tp-editor-font-size") || "13")
                      : 13
                  }
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    try { localStorage.setItem("tp-editor-font-size", String(v)); } catch { /* ignore */ }
                  }}
                  className="w-24"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--text-secondary)" }}>
                  {typeof window !== "undefined"
                    ? localStorage.getItem("tp-editor-font-size") || "13"
                    : "13"}px
                </span>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Account
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              More account settings coming soon.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
