"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderOpen,
  Database,
  BookOpen,
  Settings,
  Check,
  AlertTriangle,
  Sparkles,
  GitCompare,
  Zap,
  Download,
  Copy,
  Palette,
  Shield,
  Plus,
  Search,
  Eye,
  X,
  Maximize2,
} from "lucide-react";
import { setStoredMode } from "@/lib/view-scale";

interface Command {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  shortcut?: string;
  category: "navigation" | "editor" | "theme" | "project";
  editorOnly?: boolean;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  // Editor action callbacks (optional — only available when in editor)
  editorActions?: {
    confirmSegment?: () => void;
    runQA?: () => void;
    runSmartReview?: () => void;
    startReview?: () => void;
    preTranslateAll?: () => void;
    exportProject?: () => void;
    copySourceToTarget?: () => void;
    toggleFocusMode?: () => void;
    openPrivacySelector?: () => void;
  };
  onNewProject?: () => void;
}

const RECENT_KEY = "catforcat-recent-commands";
const MAX_RECENT = 3;

export default function CommandPalette({
  isOpen,
  onClose,
  editorActions,
  onNewProject,
}: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isEditor = /^\/app\/projects\/[^/]+$/.test(pathname);

  // Build commands list
  const commands: Command[] = [
    // Navigation
    {
      id: "nav-projects",
      label: "Go to Projects",
      icon: FolderOpen,
      category: "navigation",
      action: () => router.push("/app/projects"),
    },
    {
      id: "nav-tm",
      label: "Go to Translation Memory",
      icon: Database,
      category: "navigation",
      action: () => router.push("/app/tm"),
    },
    {
      id: "nav-glossary",
      label: "Go to Glossary",
      icon: BookOpen,
      category: "navigation",
      action: () => router.push("/app/glossary"),
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: Settings,
      category: "navigation",
      action: () => router.push("/app/settings"),
    },

    // Editor actions
    ...(isEditor
      ? [
          {
            id: "ed-confirm",
            label: "Confirm segment",
            icon: Check,
            shortcut: "Ctrl+Enter",
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.confirmSegment?.(),
          },
          {
            id: "ed-qa",
            label: "Run QA check",
            icon: AlertTriangle,
            shortcut: "Ctrl+Shift+Q",
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.runQA?.(),
          },
          {
            id: "ed-smart-review",
            label: "Run Smart Review",
            icon: Sparkles,
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.runSmartReview?.(),
          },
          {
            id: "ed-review",
            label: "Start Review mode",
            icon: GitCompare,
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.startReview?.(),
          },
          {
            id: "ed-pretranslate",
            label: "Pre-translate all",
            icon: Zap,
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.preTranslateAll?.(),
          },
          {
            id: "ed-export",
            label: "Export project",
            icon: Download,
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.exportProject?.(),
          },
          {
            id: "ed-copy-source",
            label: "Copy source to target",
            icon: Copy,
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.copySourceToTarget?.(),
          },
          {
            id: "ed-focus",
            label: "Toggle focus mode",
            icon: Eye,
            shortcut: "Ctrl+Shift+F",
            category: "editor" as const,
            editorOnly: true,
            action: () => editorActions?.toggleFocusMode?.(),
          },
        ]
      : []),

    // Themes
    {
      id: "theme-sakura",
      label: "Switch to Sakura theme",
      icon: Palette,
      category: "theme",
      action: () => {
        document.documentElement.setAttribute("data-theme", "sakura");
        localStorage.setItem("catforcat-theme", "sakura");
      },
    },
    {
      id: "theme-dark",
      label: "Switch to Dark theme",
      icon: Palette,
      category: "theme",
      action: () => {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("catforcat-theme", "dark");
      },
    },
    {
      id: "theme-light",
      label: "Switch to Light theme",
      icon: Palette,
      category: "theme",
      action: () => {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("catforcat-theme", "light");
      },
    },
    {
      id: "theme-linen",
      label: "Switch to Linen theme",
      icon: Palette,
      category: "theme",
      action: () => {
        document.documentElement.setAttribute("data-theme", "linen");
        localStorage.setItem("catforcat-theme", "linen");
      },
    },

    // View Scale
    {
      id: "scale-compact",
      label: "Set view: Compact",
      icon: Maximize2,
      category: "theme",
      action: () => {
        setStoredMode("compact");
        window.location.reload();
      },
    },
    {
      id: "scale-default",
      label: "Set view: Default",
      icon: Maximize2,
      category: "theme",
      action: () => {
        setStoredMode("default");
        window.location.reload();
      },
    },
    {
      id: "scale-large",
      label: "Set view: Large",
      icon: Maximize2,
      category: "theme",
      action: () => {
        setStoredMode("large");
        window.location.reload();
      },
    },

    // Project
    ...(isEditor
      ? [
          {
            id: "proj-privacy",
            label: "Change privacy level",
            icon: Shield,
            category: "project" as const,
            action: () => editorActions?.openPrivacySelector?.(),
          },
        ]
      : []),
    {
      id: "proj-new",
      label: "New project",
      icon: Plus,
      category: "project",
      action: () => onNewProject?.() || router.push("/app/projects?new=true"),
    },
  ];

  // Fuzzy search
  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const words = query.toLowerCase().split(/\s+/);
        const label = cmd.label.toLowerCase();
        return words.every((w) => label.includes(w));
      })
    : commands;

  // Recent commands
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentIds(JSON.parse(stored));
    } catch {}
  }, [isOpen]);

  const recentCommands = recentIds
    .map((id) => commands.find((c) => c.id === id))
    .filter(Boolean) as Command[];

  const displayCommands = query.trim()
    ? filteredCommands
    : [
        ...recentCommands,
        ...filteredCommands.filter((c) => !recentIds.includes(c.id)),
      ];

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll("[data-cmd-item]");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (cmd: Command) => {
      // Save to recent
      const updated = [
        cmd.id,
        ...recentIds.filter((id) => id !== cmd.id),
      ].slice(0, MAX_RECENT);
      setRecentIds(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));

      onClose();
      cmd.action();
    },
    [recentIds, onClose],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, displayCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = displayCommands[selectedIndex];
      if (cmd) executeCommand(cmd);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 120,
        zIndex: 200,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "90%",
          background: "var(--bg-panel)",
          border: "0.5px solid var(--border)",
          borderRadius: 12,
          backdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Search
              size={14}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              style={{
                width: "100%",
                fontSize: 16,
                fontFamily: "'Inter', system-ui, sans-serif",
                padding: "14px 0",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div style={{ borderTop: "0.5px solid var(--border)" }} />

        {/* Results */}
        <div
          ref={listRef}
          style={{ maxHeight: 320, overflowY: "auto", padding: "4px 0" }}
        >
          {!query.trim() && recentCommands.length > 0 && (
            <div
              style={{
                padding: "6px 16px 2px",
                fontSize: 10,
                fontWeight: 500,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Recent
            </div>
          )}

          {displayCommands.length === 0 && (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              No commands found
            </div>
          )}

          {displayCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            // Show separator between recent and rest
            const showSeparator =
              !query.trim() &&
              recentCommands.length > 0 &&
              idx === recentCommands.length;

            return (
              <div key={cmd.id}>
                {showSeparator && (
                  <div
                    style={{
                      borderTop: "0.5px solid var(--border)",
                      margin: "4px 0",
                    }}
                  />
                )}
                <button
                  data-cmd-item
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 16px",
                    background: isSelected
                      ? "var(--accent-soft)"
                      : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "background 100ms",
                  }}
                >
                  <Icon
                    size={14}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-primary)",
                      flex: 1,
                    }}
                  >
                    {cmd.label}
                  </span>
                  {cmd.shortcut && (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        background: "var(--bg-hover)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
