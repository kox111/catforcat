"use client";

import { useState } from "react";
import {
  Languages,
  Zap,
  BarChart3,
  CopyCheck,
  ShieldCheck,
  Search,
  BookOpen,
  Download,
  Keyboard,
  Settings,
} from "lucide-react";
import TranslationProviderPopover, { type TranslationProvider } from "./TranslationProviderPopover";

interface ToolSidebarProps {
  onPreTranslate?: (mode: "tm-only" | "full") => void;
  onAnalysis?: () => void;
  onCopyAllSource?: () => void;
  onRunQA?: () => void;
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onExportOpen?: () => void;
  onShortcutsOpen?: () => void;
  onTranslationProvider?: () => void;
  qaRunning?: boolean;
  preTranslating?: boolean;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  shortcut?: string;
  accent?: boolean;
}

function ToolButton({ icon, label, onClick, disabled, active, shortcut, accent }: ToolButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          background: active
            ? "rgba(59,130,246,0.10)"
            : hovered
            ? "rgba(255,255,255,0.06)"
            : "transparent",
          color: active
            ? "var(--accent)"
            : accent
            ? "var(--accent)"
            : disabled
            ? "var(--text-muted)"
            : hovered
            ? "var(--text-primary)"
            : "var(--text-muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.35 : 1,
          transition: "all 150ms",
          border: "none",
        }}
        title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      >
        {icon}
      </button>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 8px)",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#252525",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-sm)",
            padding: "5px 10px",
            whiteSpace: "nowrap",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        >
          <span style={{ color: "var(--text-primary)", fontSize: "11px", fontWeight: 500 }}>
            {label}
          </span>
          {shortcut && (
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "10px",
                marginLeft: "8px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {shortcut}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 20,
        height: 1,
        background: "rgba(255,255,255,0.06)",
        margin: "6px auto",
      }}
    />
  );
}

export default function ToolSidebar({
  onPreTranslate,
  onAnalysis,
  onCopyAllSource,
  onRunQA,
  onSearchOpen,
  onConcordanceOpen,
  onExportOpen,
  onShortcutsOpen,
  qaRunning,
  preTranslating,
}: ToolSidebarProps) {
  const [providerOpen, setProviderOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<TranslationProvider>("google");

  return (
    <div
      style={{
        width: 56,
        minWidth: 56,
        background: "#1A1A1A",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 10,
        gap: 2,
        overflowY: "auto",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Translation Provider */}
      <div style={{ position: "relative" }}>
        <ToolButton
          icon={<Languages size={17} />}
          label="Translation Provider"
          onClick={() => setProviderOpen(!providerOpen)}
          active={providerOpen}
          accent
        />
        {providerOpen && (
          <TranslationProviderPopover
            currentProvider={currentProvider}
            onSelect={(p) => setCurrentProvider(p)}
            onClose={() => setProviderOpen(false)}
          />
        )}
      </div>

      <ToolButton
        icon={<Zap size={17} />}
        label="Pre-translate"
        onClick={() => onPreTranslate?.("full")}
        disabled={preTranslating}
        shortcut="Ctrl+Shift+P"
      />

      <Divider />

      <ToolButton
        icon={<BarChart3 size={17} />}
        label="Analysis"
        onClick={onAnalysis}
      />

      <ToolButton
        icon={<CopyCheck size={17} />}
        label="Copy Source to Target"
        onClick={onCopyAllSource}
      />

      <ToolButton
        icon={<ShieldCheck size={17} />}
        label="Run QA"
        onClick={onRunQA}
        disabled={qaRunning}
      />

      <Divider />

      <ToolButton
        icon={<Search size={17} />}
        label="Search & Replace"
        onClick={onSearchOpen}
        shortcut="Ctrl+F"
      />

      <ToolButton
        icon={<BookOpen size={17} />}
        label="Concordance"
        onClick={onConcordanceOpen}
        shortcut="Ctrl+K"
      />

      <Divider />

      <ToolButton
        icon={<Download size={17} />}
        label="Export"
        onClick={onExportOpen}
      />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <ToolButton
        icon={<Keyboard size={17} />}
        label="Shortcuts"
        onClick={onShortcutsOpen}
        shortcut="Ctrl+/"
      />

      <ToolButton
        icon={<Settings size={17} />}
        label="Editor Settings"
      />
    </div>
  );
}
