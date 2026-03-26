"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  CheckCircle2,
  CopyCheck,
  Zap,
  Scissors,
  Merge,
  MessageSquare,
  Search,
  Lock,
  Unlock,
  Trash2,
  Info,
  type LucideIcon,
} from "lucide-react";

export interface ContextMenuItem {
  label: string;
  icon: string | LucideIcon;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
}

export interface ContextMenuSeparator {
  type: "separator";
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

function isSeparator(entry: ContextMenuEntry): entry is ContextMenuSeparator {
  return "type" in entry && entry.type === "separator";
}

interface SegmentContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onClose: () => void;
}

/** Map old emoji icons to Lucide components as fallback */
const EMOJI_TO_LUCIDE: Record<string, LucideIcon> = {
  "✏": Pencil,
  "✏️": Pencil,
  "✅": CheckCircle2,
  "📋": CopyCheck,
  "🔄": Zap,
  "✂": Scissors,
  "✂️": Scissors,
  "🔗": Merge,
  "⊕": Merge,
  "💬": MessageSquare,
  "📝": MessageSquare,
  "🔍": Search,
  "📌": Lock,
  "🔓": Unlock,
  "🗑": Trash2,
  "🗑️": Trash2,
  "📊": Info,
};

function renderIcon(icon: string | LucideIcon, danger?: boolean) {
  if (typeof icon !== "string") {
    const IconComponent = icon;
    return <IconComponent size={14} />;
  }
  // Map emoji to Lucide
  const LucideComp = EMOJI_TO_LUCIDE[icon];
  if (LucideComp) {
    return <LucideComp size={14} />;
  }
  // fallback: render text
  return <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>;
}

export default function SegmentContextMenu({
  x,
  y,
  items,
  onClose,
}: SegmentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Fade-in + scale animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Adjust position to stay within viewport
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw - 8) {
      el.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > vh - 8) {
      el.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  // Click outside + Esc
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Keyboard navigation
      const actionItems = items
        .map((item, i) => ({ item, i }))
        .filter(
          ({ item }) =>
            !isSeparator(item) && !(item as ContextMenuItem).disabled,
        );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIdx = actionItems.findIndex(({ i }) => i === focusedIndex);
        const next = actionItems[(currentIdx + 1) % actionItems.length];
        if (next) setFocusedIndex(next.i);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIdx = actionItems.findIndex(({ i }) => i === focusedIndex);
        const prev =
          actionItems[
            (currentIdx - 1 + actionItems.length) % actionItems.length
          ];
        if (prev) setFocusedIndex(prev.i);
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const item = items[focusedIndex];
        if (item && !isSeparator(item) && !item.disabled) {
          item.action();
          onClose();
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, items, focusedIndex]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 200,
        minWidth: 240,
        padding: "6px 0",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-md)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.95)",
        transformOrigin: "top left",
        transition: "opacity 100ms ease-out, transform 100ms ease-out",
      }}
    >
      {items.map((entry, i) => {
        if (isSeparator(entry)) {
          return (
            <div
              key={`sep-${i}`}
              style={{
                height: 1,
                margin: "4px 10px",
                background: "var(--border)",
              }}
            />
          );
        }

        const item = entry as ContextMenuItem;
        const isFocused = focusedIndex === i;

        return (
          <button
            key={i}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            onMouseEnter={() => setFocusedIndex(i)}
            onMouseLeave={() => {
              if (focusedIndex === i) setFocusedIndex(-1);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "7px 12px 7px 10px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: isFocused ? "var(--bg-hover)" : "transparent",
              color: item.disabled
                ? "var(--text-muted)"
                : item.danger
                  ? "var(--red)"
                  : "var(--text-primary)",
              opacity: item.disabled ? 0.45 : 1,
              cursor: item.disabled ? "not-allowed" : "pointer",
              border: "none",
              fontFamily: "inherit",
              transition: "background 80ms ease",
            }}
          >
            {/* Icon */}
            <span
              style={{
                width: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: item.disabled
                  ? "var(--text-muted)"
                  : item.danger
                    ? "var(--red)"
                    : isFocused
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                transition: "color 80ms",
              }}
            >
              {renderIcon(item.icon, item.danger)}
            </span>

            {/* Label */}
            <span style={{ flex: 1, fontWeight: 450 }}>{item.label}</span>

            {/* Keyboard shortcut */}
            {item.shortcut && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--text-muted)",
                  marginLeft: 16,
                  flexShrink: 0,
                }}
              >
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
