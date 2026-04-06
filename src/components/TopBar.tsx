"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Settings,
  LogOut,
  Sparkles,
  FileText,
  Type,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useUserPlan } from "@/components/UserPlanProvider";

/* ─── Theme gradient ring colors per theme ─── */
const AVATAR_RING: Record<Theme, { gradient: string; bg: string }> = {
  dark: {
    gradient: "linear-gradient(135deg, #BDB8B2, #8A8580)",
    bg: "var(--bg-deep)",
  },
  sakura: {
    gradient: "linear-gradient(135deg, #8B5A6B, #B08090)",
    bg: "var(--bg-deep)",
  },
  light: {
    gradient: "linear-gradient(135deg, #6B6B6B, #AAAAAA)",
    bg: "var(--bg-deep)",
  },
  linen: {
    gradient: "linear-gradient(135deg, #A47864, #C4A898)",
    bg: "var(--bg-deep)",
  },
  forest: {
    gradient: "linear-gradient(135deg, #8B7355, #6A8A58)",
    bg: "var(--bg-deep)",
  },
  midnight: {
    gradient: "linear-gradient(135deg, #8a8594, #6a6574)",
    bg: "var(--bg-deep)",
  },
};

const THEME_DOTS: {
  id: Theme;
  color: string;
  border: string;
  label: string;
}[] = [
  {
    id: "dark",
    color: "#121214",
    border: "0.5px solid #3a3a40",
    label: "Dark",
  },
  {
    id: "sakura",
    color: "#e4c8cc",
    border: "0.5px solid rgba(120,90,100,0.14)",
    label: "Sakura",
  },
  {
    id: "light",
    color: "#f5f5f2",
    border: "0.5px solid rgba(0,0,0,0.12)",
    label: "Light",
  },
  {
    id: "linen",
    color: "#C4AA90",
    border: "0.5px solid #B09878",
    label: "Linen",
  },
  {
    id: "forest",
    color: "#3A3028",
    border: "0.5px solid #4A3E32",
    label: "Forest",
  },
  {
    id: "midnight",
    color: "#0a0a0c",
    border: "0.5px solid #2a2a30",
    label: "Midnight",
  },
];

const FONT_SIZE_PRESETS = [
  { key: "compact", label: "Compact", size: 12 },
  { key: "default", label: "Default", size: 14 },
  { key: "large", label: "Large", size: 16 },
] as const;

const navItems = [
  { href: "/app/projects", label: "Projects" },
  { href: "/app/teams", label: "Teams" },
  { href: "/app/classrooms", label: "Classrooms" },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isEditor = /^\/app\/projects\/[^/]+$/.test(pathname);

  const { theme, setTheme } = useTheme();
  const { plan: userPlan, avatarUrl } = useUserPlan();
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tp-editor-font-size");
      if (stored) setFontSize(parseInt(stored, 10));
    } catch {}
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
      if (
        avatarOpen &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, avatarOpen]);

  // Editor has its own unified header
  if (isEditor) return null;

  const userName = session?.user?.name || "";
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || (session?.user?.email?.[0] || "U").toUpperCase();
  const ring = AVATAR_RING[theme] || AVATAR_RING.dark;
  const isPro = userPlan === "pro";

  const handleFontSize = (size: number) => {
    setFontSize(size);
    try { localStorage.setItem("tp-editor-font-size", String(size)); } catch {}
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <>
      <style>{`
        @keyframes topBarDropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes proShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <header
        style={{
          height: 44,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-deep)",
          borderBottom: "0.5px solid var(--border)",
          position: "relative",
          zIndex: 30,
        }}
      >
        {/* Left side: Wordmark + separator + nav tabs (desktop) or hamburger (mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {/* Wordmark */}
          <Link
            href={session ? "/app/projects" : "/"}
            style={{
              textDecoration: "none",
              fontFamily: "var(--font-display-family)",
              fontSize: 17,
              fontWeight: 400,
              color: "var(--brand-wordmark)",
              letterSpacing: "0.03em",
              cursor: "pointer",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            catforcat.
          </Link>

          <span
            style={{
              fontFamily: "var(--font-editor-family)",
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              background: "var(--glass-bg)",
              border: "0.5px solid var(--border)",
              borderRadius: 4,
              padding: "1px 4px",
              marginLeft: 6,
              flexShrink: 0,
              lineHeight: 1.4,
            }}
          >
            BETA
          </span>

          {/* Desktop: separator + persistent horizontal tabs */}
          {!isMobile && (
            <>
              {/* Vertical separator */}
              <div
                style={{
                  width: 1,
                  height: 18,
                  background: "var(--border)",
                  margin: "0 20px",
                  flexShrink: 0,
                }}
              />

              <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/app/projects" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontFamily: "var(--font-ui-family)",
                        fontWeight: isActive ? 500 : 400,
                        textDecoration: "none",
                        background: isActive ? "var(--bg-card)" : "transparent",
                        color: isActive
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                        transition: "background 150ms, color 150ms",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "var(--bg-hover)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}

          {/* Mobile: hamburger menu */}
          {isMobile && (
            <div ref={menuRef} style={{ position: "relative", marginLeft: 8 }}>
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setAvatarOpen(false);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  padding: 6,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Menu"
              >
                <span
                  style={{
                    width: 14,
                    height: 1.5,
                    background: "var(--text-primary)",
                    borderRadius: 1,
                  }}
                />
                <span
                  style={{
                    width: 14,
                    height: 1.5,
                    background: "var(--text-primary)",
                    borderRadius: 1,
                  }}
                />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 38,
                    left: -4,
                    width: 180,
                    background: "var(--bg-panel)",
                    border: "0.5px solid var(--glass-border)",
                    backdropFilter: "blur(16px) saturate(140%)",
                    borderRadius: 10,
                    padding: 8,
                    zIndex: 40,
                    boxShadow: "var(--shadow-md), var(--panel-glow)",
                    animation: "fadeSlideIn 150ms ease-out",
                  }}
                >
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          fontWeight: isActive ? 500 : 400,
                          textDecoration: "none",
                          background: isActive
                            ? "var(--accent-soft)"
                            : "transparent",
                          color: isActive
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          transition: "background 150ms",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background =
                              "var(--bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  <div
                    style={{
                      borderTop: "0.5px solid var(--border)",
                      margin: "4px 0",
                    }}
                  />

                  <Link
                    href="/app/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12,
                      textDecoration: "none",
                      color: "var(--text-secondary)",
                      background: "transparent",
                      transition: "background 150ms",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar with gradient ring */}
          <div ref={avatarRef} style={{ position: "relative" }} data-tour="avatar">
            <div
              onClick={() => {
                setAvatarOpen(!avatarOpen);
                setMenuOpen(false);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: ring.gradient,
                backgroundSize: isPro ? "200% 200%" : undefined,
                animation: isPro ? "proShimmer 3s ease infinite" : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: isPro ? 2.5 : 1.5,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: ring.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-ui-family)",
                  overflow: "hidden",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  userInitials
                )}
              </div>
            </div>

            {/* Avatar dropdown */}
            {avatarOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  right: -4,
                  width: 200,
                  background: "var(--bg-panel)",
                  backdropFilter: "blur(16px) saturate(140%)",
                  border: "0.5px solid var(--glass-border)",
                  borderRadius: "var(--radius)",
                  padding: 0,
                  zIndex: 40,
                  boxShadow: "var(--shadow-md), var(--panel-glow)",
                  animation: "fadeSlideIn 150ms ease-out",
                  overflow: "hidden",
                }}
              >
                {/* User info header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: ring.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isPro ? 2 : 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: ring.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-ui-family)",
                        overflow: "hidden",
                      }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        userInitials
                      )}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-ui-family)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userName || session?.user?.email || "User"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-ui-family)",
                      }}
                    >
                      {isPro ? "Pro plan" : "Free plan"}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "0.5px solid var(--border)" }} />

                {/* Settings */}
                <Link
                  href="/app/settings"
                  onClick={() => setAvatarOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    background: "transparent",
                    transition: "background 150ms",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui-family)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Settings
                    size={13}
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <span>Settings</span>
                </Link>

                {/* Changelog */}
                <Link
                  href="/changelog"
                  onClick={() => setAvatarOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    background: "transparent",
                    transition: "background 150ms",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui-family)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <FileText
                    size={13}
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <span>Changelog</span>
                </Link>

                {/* Theme picker inline */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    fontFamily: "var(--font-ui-family)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-secondary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span
                      style={{ fontSize: 13, color: "var(--text-primary)" }}
                    >
                      Theme
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    {THEME_DOTS.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        style={{
                          width: theme === t.id ? 16 : 14,
                          height: theme === t.id ? 16 : 14,
                          borderRadius: "50%",
                          background: t.color,
                          border:
                            theme === t.id
                              ? "1.5px solid var(--accent)"
                              : t.border,
                          cursor: "pointer",
                          transition: "all 150ms",
                        }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Font size picker inline */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    fontFamily: "var(--font-ui-family)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Type size={13} style={{ color: "var(--text-secondary)" }} />
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Font size</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {FONT_SIZE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => handleFontSize(p.size)}
                        style={{
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: fontSize === p.size ? 500 : 400,
                          fontFamily: "var(--font-ui-family)",
                          border: "none",
                          borderRadius: 4,
                          background: fontSize === p.size ? "var(--bg-hover)" : "transparent",
                          color: fontSize === p.size ? "var(--text-primary)" : "var(--text-muted)",
                          cursor: "pointer",
                          transition: "all 150ms",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = fontSize === p.size ? "var(--bg-hover)" : "transparent")}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: "0.5px solid var(--border)" }} />

                {/* Upgrade to Pro (only for free users) */}
                {!isPro && (
                  <>
                    <Link
                      href="/app/upgrade"
                      onClick={() => setAvatarOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        fontSize: 13,
                        textDecoration: "none",
                        color: "var(--accent)",
                        background: "transparent",
                        transition: "background 150ms",
                        cursor: "pointer",
                        fontFamily: "var(--font-ui-family)",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Sparkles size={13} style={{ color: "var(--accent)" }} />
                      <span>Upgrade to PRO</span>
                    </Link>
                    <div style={{ borderTop: "0.5px solid var(--border)" }} />
                  </>
                )}

                {/* Sign out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    fontSize: 13,
                    width: "100%",
                    textAlign: "left",
                    color: "var(--text-muted)",
                    background: "transparent",
                    border: "none",
                    fontFamily: "var(--font-ui-family)",
                    transition: "background 150ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut size={13} style={{ color: "var(--text-muted)" }} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
