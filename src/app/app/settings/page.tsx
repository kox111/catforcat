"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { useViewScale } from "@/components/ViewScaleProvider";
import { type ScaleMode, SCALE_MODES, MODE_ORDER } from "@/lib/view-scale";
import TwoFactorSetup from "@/components/TwoFactorSetup";

interface SettingsData {
  plan: string;
  translationProvider: string;
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  hasSubscription: boolean;
  subscriptionEndsAt: string | null;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useViewScale();
  const [breakEnabled, setBreakEnabled] = useState(true);

  // Load break reminder preference
  useEffect(() => {
    try {
      const v = localStorage.getItem("catforcat-break-interval");
      if (v !== null) setBreakEnabled(parseInt(v, 10) !== 0);
    } catch {
      /* ignore */
    }
  }, []);

  const userName = session?.user?.name || "";
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || (session?.user?.email?.[0] || "U").toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      // Resize to max 200KB
      const canvas = document.createElement("canvas");
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = async () => {
          const MAX = 128;
          let w = img.width,
            h = img.height;
          if (w > MAX || h > MAX) {
            const scale = MAX / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          try {
            const res = await fetch("/api/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatarUrl: dataUrl }),
            });
            if (res.ok) setAvatarUrl(dataUrl);
          } catch {
            /* silent */
          }
          setUploadingAvatar(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (res.ok) setAvatarUrl(null);
    } catch {
      /* silent */
    }
  };

  const fetchSettings = async () => {
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
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ? Math.min(
        100,
        Math.round((settings.aiRequestsUsed / settings.aiRequestsLimit) * 100),
      )
    : 0;

  return (
    <div
      className="p-6 max-w-2xl mx-auto"
      style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
    >
      <h1
        className="text-xl font-semibold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Settings
      </h1>

      {loading ? (
        <div
          className="text-sm py-8 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Loading settings...
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Profile
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: "1.5px solid var(--accent)",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "var(--accent-soft)",
                    border: "1.5px solid var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-ui-family)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {userInitials}
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {userName || session?.user?.email || "User"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "var(--btn-bg)",
                      border: "1px solid var(--btn-border)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 150ms",
                    }}
                  >
                    {uploadingAvatar ? "Uploading..." : "Upload photo"}
                  </button>
                  {avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "background 150ms",
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </section>

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
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Your Plan
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: isPro ? "var(--accent-soft)" : "var(--bg-deep)",
                  color: isPro
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  border: "0.5px solid var(--border)",
                }}
              >
                {isPro ? "Pro" : "Free"}
              </span>
            </div>

            {isPro ? (
              <div>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  You&apos;re on the{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    Pro plan
                  </strong>{" "}
                  ($10/month). Translations powered by{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    Google Translate
                  </strong>
                  .
                </p>
                {settings?.subscriptionEndsAt && (
                  <p
                    className="text-xs mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Current period ends:{" "}
                    {new Date(settings.subscriptionEndsAt).toLocaleDateString()}
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
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Free plan — translations powered by{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    Google Translate
                  </strong>
                  . Upgrade to Pro for unlimited translations and more.
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
                    ["Translation engine", "Google Translate", "Google Translate"],
                    ["Projects", "3 active", "Unlimited"],
                    ["Segments/project", "500", "Unlimited"],
                    ["AI suggestions", "5,000/month", "Unlimited"],
                    ["TM entries", "1,000", "Unlimited"],
                    ["Import formats", "All formats", "All formats"],
                    ["Export formats", "All formats", "All formats"],
                  ].map(([feature, free, pro]) => (
                    <div
                      key={feature}
                      className="grid grid-cols-3 gap-2 text-xs py-1.5"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <div style={{ color: "var(--text-secondary)" }}>
                        {feature}
                      </div>
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
                    background: "var(--accent-soft)",
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--border)",
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
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Usage This Month
            </h2>

            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--text-secondary)" }}>
                  AI Translation Requests
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  {settings?.aiRequestsUsed || 0} /{" "}
                  {(settings?.aiRequestsLimit || 0) >= 999999
                    ? "Unlimited"
                    : settings?.aiRequestsLimit?.toLocaleString() || 0}
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
                    background:
                      aiPct > 90
                        ? "var(--red)"
                        : aiPct > 70
                          ? "var(--amber)"
                          : "var(--accent)",
                  }}
                />
              </div>
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Translation provider: {settings?.translationProvider}
            </p>
          </section>

          {/* Appearance Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Appearance
            </h2>

            {/* Theme Picker */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Theme
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {[
                  {
                    id: "dark" as const,
                    color: "#202124",
                    border: "0.5px solid #3C3C3F",
                  },
                  {
                    id: "sakura" as const,
                    color: "#EFC4CC",
                    border: "0.5px solid rgba(255,255,255,0.2)",
                  },
                  {
                    id: "light" as const,
                    color: "#F7F6F3",
                    border: "0.5px solid #ECEAE5",
                  },
                  {
                    id: "linen" as const,
                    color: "#C4AA90",
                    border: "0.5px solid #B09878",
                  },
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    style={{
                      width: theme === t.id ? 20 : 16,
                      height: theme === t.id ? 20 : 16,
                      borderRadius: "50%",
                      background: t.color,
                      border:
                        theme === t.id ? "1.5px solid var(--accent)" : t.border,
                      cursor: "pointer",
                      transition: "all 150ms",
                      boxShadow:
                        theme === t.id
                          ? "0 0 0 2px var(--bg-deep), 0 0 0 4px var(--accent)"
                          : "none",
                    }}
                    title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Editor Font Size
                </p>
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
                      ? Number(
                          localStorage.getItem("tp-editor-font-size") || "13",
                        )
                      : 13
                  }
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    try {
                      localStorage.setItem("tp-editor-font-size", String(v));
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="w-24"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span
                  className="text-xs font-mono w-8 text-right"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {typeof window !== "undefined"
                    ? localStorage.getItem("tp-editor-font-size") || "13"
                    : "13"}
                  px
                </span>
              </div>
            </div>
          </section>

          {/* Break Reminder Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Break Reminder
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Break reminder (20-20-20 rule)
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Reminds you to look at something 20ft away for 20 seconds
                  every 20 minutes while in the editor.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !breakEnabled;
                  setBreakEnabled(next);
                  try {
                    localStorage.setItem(
                      "catforcat-break-interval",
                      next ? "20" : "0",
                    );
                  } catch {
                    /* ignore */
                  }
                }}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  border: "1px solid var(--border)",
                  background: breakEnabled
                    ? "var(--accent)"
                    : "var(--bg-hover)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 200ms",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 2,
                    left: breakEnabled ? 20 : 2,
                    transition: "left 200ms",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </button>
            </div>
          </section>

          {/* Display Scale Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Display Scale
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Auto-scales to fit your monitor. You can also cycle with the
              button in the top bar.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              {MODE_ORDER.map((key) => {
                const cfg = SCALE_MODES[key];
                const isActive = mode === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    style={{
                      flex: 1,
                      padding: "12px 10px",
                      borderRadius: 10,
                      background: isActive
                        ? "var(--accent-soft)"
                        : "var(--bg-deep)",
                      border: isActive
                        ? "1.5px solid var(--accent)"
                        : "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "border-color 150ms, background 150ms",
                      textAlign: "center",
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
                    <div
                      style={{
                        fontFamily: "var(--font-ui-family)",
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                        color: isActive
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      {cfg.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-ui-family)",
                        fontSize: 9,
                        color: "var(--text-muted)",
                      }}
                    >
                      {cfg.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Security Section */}
          <section
            style={{
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Security
            </h2>
            <TwoFactorSetup
              isEnabled={settings?.twoFactorEnabled ?? false}
              onStatusChange={fetchSettings}
            />
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

      <p
        style={{
          fontFamily: "var(--font-display-family)",
          fontSize: 10,
          fontStyle: "italic",
          fontWeight: 400,
          color: "var(--text-muted)",
          opacity: 0.4,
          textAlign: "center",
          marginTop: 40,
        }}
      >
        made with love, for KL.
      </p>
    </div>
  );
}
