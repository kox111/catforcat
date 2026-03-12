"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FolderOpen, Database, BookOpen, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/app/projects", label: "Projects", icon: FolderOpen },
  { href: "/app/tm", label: "Translation Memory", icon: Database },
  { href: "/app/glossary", label: "Glossary", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: 220,
        display: "flex",
        flexDirection: "column",
        background: "#1E1E1E",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "20px 20px 16px" }}>
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          TranslatePro
        </h1>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const IconComp = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                marginBottom: 2,
                textDecoration: "none",
                background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "background 150ms, color 150ms",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <IconComp size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings + Logout */}
      <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Link
          href="/app/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            marginBottom: 2,
            textDecoration: "none",
            color: "var(--text-secondary)",
            transition: "background 150ms",
            cursor: "pointer",
            background: "transparent",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            width: "100%",
            textAlign: "left",
            color: "var(--text-muted)",
            transition: "background 150ms",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
