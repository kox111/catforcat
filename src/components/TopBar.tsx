"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FolderOpen, Database, BookOpen, Settings, ArrowLeft, Search, LogOut } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const THEME_DOTS: { id: Theme; color: string; border: string }[] = [
  { id: "dark", color: "#202124", border: "0.5px solid #3C3C3F" },
  { id: "sakura", color: "#EFC4CC", border: "0.5px solid rgba(255,255,255,0.3)" },
  { id: "light", color: "#F7F6F3", border: "0.5px solid #ECEAE5" },
  { id: "linen", color: "#C4AA90", border: "0.5px solid #B09878" },
];

const navItems = [
  { href: "/app/projects", label: "Projects", icon: FolderOpen },
  { href: "/app/tm", label: "Translation Memory", icon: Database },
  { href: "/app/glossary", label: "Glossary", icon: BookOpen },
];

function getPageLabel(pathname: string): string {
  if (pathname.startsWith("/app/projects/")) return "Editor";
  if (pathname === "/app/projects") return "Projects";
  if (pathname.startsWith("/app/tm/align")) return "Align TM";
  if (pathname.startsWith("/app/tm")) return "Translation Memory";
  if (pathname.startsWith("/app/glossary")) return "Glossary";
  if (pathname.startsWith("/app/settings")) return "Settings";
  return "";
}

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isEditor = /^\/app\/projects\/[^/]+$/.test(pathname);
  const pageLabel = getPageLabel(pathname);
  const isProjectsPage = pathname === "/app/projects";

  const { theme, setTheme } = useTheme();
  const [userPlan, setUserPlan] = useState<string>("free");

  // ALL hooks MUST be above the early return — React requires stable hook order
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch user plan from settings API
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.plan) setUserPlan(data.plan); })
      .catch(() => {});
  }, [session?.user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (avatarOpen && avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, avatarOpen]);

  // Editor has its own unified header — hide TopBar entirely
  if (isEditor) return null;

  const userName = session?.user?.name || "";
  const userInitials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || (session?.user?.email?.[0] || "U").toUpperCase();

  return (
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
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {isEditor ? (
          /* Editor mode: ← Back + project name */
          <Link
            href="/app/projects"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: 12,
              transition: "color 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
        ) : (
          /* Normal pages: Hamburger + wordmark + breadcrumb */
          <>
            {/* Hamburger */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setMenuOpen(!menuOpen); setAvatarOpen(false); }}
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
                <span style={{ width: 14, height: 1.5, background: "var(--text-primary)", borderRadius: 1 }} />
                <span style={{ width: 14, height: 1.5, background: "var(--text-primary)", borderRadius: 1 }} />
              </button>

              {/* Hamburger dropdown */}
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 38,
                    left: -4,
                    width: 180,
                    background: "var(--bg-panel)",
                    border: "0.5px solid var(--border)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 10,
                    padding: 8,
                    zIndex: 40,
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
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
                          background: isActive ? "var(--accent-soft)" : "transparent",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          transition: "background 150ms",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Separator */}
                  <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />

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
                      color: pathname.startsWith("/app/settings") ? "var(--text-primary)" : "var(--text-secondary)",
                      background: pathname.startsWith("/app/settings") ? "var(--accent-soft)" : "transparent",
                      fontWeight: pathname.startsWith("/app/settings") ? 500 : 400,
                      transition: "background 150ms",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!pathname.startsWith("/app/settings")) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!pathname.startsWith("/app/settings")) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>

                  {/* + New Project inside dropdown on mobile */}
                  {isMobile && (
                    <>
                      <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />
                      <Link
                        href="/app/projects?new=true"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          textDecoration: "none",
                          color: "var(--text-primary)",
                          background: "var(--accent-soft)",
                          fontWeight: 500,
                          transition: "background 150ms",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 14 }}>+</span>
                        <span>New Project</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wordmark */}
            <Link
              href="/"
              style={{
                textDecoration: "none",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 17,
                fontWeight: 400,
                color: "var(--brand-wordmark)",
                letterSpacing: "0.03em",
                marginLeft: 10,
                cursor: "pointer",
                transition: "opacity 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              catforcat.
            </Link>

            {/* Breadcrumb */}
            {pageLabel && (
              <>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 11,
                    margin: "0 8px",
                    userSelect: "none",
                  }}
                >
                  ›
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {pageLabel}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search / Command Palette button */}
        <button
          onClick={() => {
            // Dispatch Ctrl+K to open command palette
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isMobile ? 20 : 24,
            height: isMobile ? 20 : 24,
            borderRadius: "50%",
            background: "var(--bg-hover)",
            border: "0.5px solid var(--border)",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "border-color 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          aria-label="Search commands"
        >
          <Search size={isMobile ? 10 : 12} />
        </button>

        {/* Theme dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {THEME_DOTS.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: t.color,
                border: t.border,
                cursor: "pointer",
                boxShadow: theme === t.id
                  ? "0 0 0 1.5px var(--bg-deep), 0 0 0 3px var(--accent)"
                  : "none",
                transition: "box-shadow 150ms",
              }}
              title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
            />
          ))}
        </div>

        {/* + New Project button (only on projects page, not mobile) */}
        {isProjectsPage && !isMobile && (
          <Link
            href="/app/projects?new=true"
            style={{
              fontSize: 10,
              padding: "4px 12px",
              borderRadius: 16,
              background: "var(--btn-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--btn-border)",
              textDecoration: "none",
              fontWeight: 500,
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--btn-bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--btn-bg)";
            }}
          >
            + New Project
          </Link>
        )}

        {/* Avatar */}
        <div ref={avatarRef} style={{ position: "relative" }}>
          <div
            onClick={() => { setAvatarOpen(!avatarOpen); setMenuOpen(false); }}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--accent-soft)",
              border: "1.5px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--text-primary)",
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: "-0.5px",
            }}
          >
            {userInitials}
          </div>

          {/* Avatar dropdown */}
          {avatarOpen && (
            <div
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                width: 180,
                background: "var(--bg-panel)",
                border: "0.5px solid var(--border)",
                backdropFilter: "blur(12px)",
                borderRadius: 10,
                padding: 8,
                zIndex: 40,
                boxShadow: "var(--shadow-md)",
              }}
            >
              {/* User info header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--accent-soft)",
                    border: "1.5px solid var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    letterSpacing: "-0.5px",
                    flexShrink: 0,
                  }}
                >
                  {userInitials}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {userName || session?.user?.email || "User"}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {userPlan === "pro" ? "Pro plan" : "Free plan"}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />

              <Link
                href="/app/settings"
                onClick={() => setAvatarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 11,
                  textDecoration: "none",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  transition: "background 150ms",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Settings size={12} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 11,
                  width: "100%",
                  textAlign: "left",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  fontFamily: "inherit",
                  transition: "background 150ms",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={12} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
