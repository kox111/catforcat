"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Search, ArrowRight, Upload, Type, Zap } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";

/* ─── Language data with regional variants (Bloque 7) ─── */

interface LangEntry {
  code: string;
  name: string;
  region: string;
  group: string;
}

const LANGUAGES: LangEntry[] = [
  { code: "en-US", name: "English", region: "United States", group: "english" },
  { code: "en-GB", name: "English", region: "United Kingdom", group: "english" },
  { code: "en-AU", name: "English", region: "Australia", group: "english" },
  { code: "en-CA", name: "English", region: "Canada", group: "english" },
  { code: "es-ES", name: "Español", region: "Spain", group: "español" },
  { code: "es-419", name: "Español", region: "Latin America", group: "español" },
  { code: "es-MX", name: "Español", region: "Mexico", group: "español" },
  { code: "es-PE", name: "Español", region: "Peru", group: "español" },
  { code: "es-AR", name: "Español", region: "Argentina", group: "español" },
  { code: "es-CO", name: "Español", region: "Colombia", group: "español" },
  { code: "es-CL", name: "Español", region: "Chile", group: "español" },
  { code: "pt-BR", name: "Português", region: "Brazil", group: "português" },
  { code: "pt-PT", name: "Português", region: "Portugal", group: "português" },
  { code: "fr-FR", name: "Français", region: "France", group: "français" },
  { code: "fr-CA", name: "Français", region: "Canada", group: "français" },
  { code: "fr-BE", name: "Français", region: "Belgium", group: "français" },
  { code: "de-DE", name: "Deutsch", region: "Germany", group: "deutsch" },
  { code: "de-AT", name: "Deutsch", region: "Austria", group: "deutsch" },
  { code: "de-CH", name: "Deutsch", region: "Switzerland", group: "deutsch" },
  { code: "it-IT", name: "Italiano", region: "Italy", group: "italiano" },
  { code: "it-CH", name: "Italiano", region: "Switzerland", group: "italiano" },
  { code: "zh-CN", name: "中文", region: "Simplified", group: "chinese" },
  { code: "zh-TW", name: "中文", region: "Traditional", group: "chinese" },
  { code: "ja-JP", name: "日本語", region: "Japan", group: "japanese" },
  { code: "ko-KR", name: "한국어", region: "Korea", group: "korean" },
  { code: "ar-EG", name: "العربية", region: "Egypt", group: "arabic" },
  { code: "ar-SA", name: "العربية", region: "Saudi Arabia", group: "arabic" },
  { code: "ru-RU", name: "Русский", region: "Russia", group: "russian" },
  { code: "nl-NL", name: "Nederlands", region: "Netherlands", group: "dutch" },
  { code: "nl-BE", name: "Nederlands", region: "Belgium", group: "dutch" },
  { code: "pl-PL", name: "Polski", region: "Poland", group: "polish" },
  { code: "tr-TR", name: "Türkçe", region: "Turkey", group: "turkish" },
];

const DEFAULT_FREQUENT = ["en-US", "en-GB", "es-ES", "es-PE", "pt-BR"];

function getRecentLangs(): string[] {
  if (typeof window === "undefined") return DEFAULT_FREQUENT;
  try {
    const stored = localStorage.getItem("catforcat-recent-langs");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
    }
  } catch { /* ignore */ }
  return DEFAULT_FREQUENT;
}

function saveRecentLang(code: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentLangs();
    const updated = [code, ...current.filter((c) => c !== code)].slice(0, 5);
    localStorage.setItem("catforcat-recent-langs", JSON.stringify(updated));
  } catch { /* ignore */ }
}

/* ─── Accent colors per theme ─── */
const ACCENT_CODE_COLOR: Record<Theme, string> = {
  dark: "#D4BA8C",
  sakura: "#8B5A6B",
  light: "var(--accent)",
  linen: "#A47864",
};

const GRADIENT_COLORS: Record<Theme, [string, string]> = {
  dark:   ["#BDB8B2", "#8A8580"],
  sakura: ["#8B5A6B", "#B08090"],
  light:  ["#6B6B6B", "#AAAAAA"],
  linen:  ["#A47864", "#C4A898"],
};

const ACCEPTED_EXTENSIONS = [".txt", ".docx", ".pdf", ".xlf", ".xliff", ".json", ".srt", ".po", ".md"];

interface ParsedSegment {
  text: string;
  targetText?: string;
  metadata: Record<string, unknown>;
}

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

type InputMode = "text" | "file";

/* ─── Language Picker Overlay ─── */

function LanguagePicker({
  selected,
  onSelect,
  onClose,
  accentColor,
  gradientColors,
}: {
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  accentColor: string;
  gradientColors: [string, string];
}) {
  const [filter, setFilter] = useState("");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const frequent = getRecentLangs();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    inputRef.current?.focus();
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = filter.trim()
    ? LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(filter.toLowerCase()) ||
          l.region.toLowerCase().includes(filter.toLowerCase()) ||
          l.code.toLowerCase().includes(filter.toLowerCase())
      )
    : LANGUAGES;

  const groups = Array.from(new Set(filtered.map((l) => l.group)));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: visible ? "var(--overlay)" : "transparent",
        transition: "background 0.25s ease",
      }}
    >
      <div
        ref={ref}
        style={{
          width: 300,
          maxHeight: 420,
          borderRadius: 14,
          border: "0.5px solid var(--border)",
          background: "var(--bg-sidebar)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: visible ? "scale(1)" : "scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.25s ease, opacity 0.25s ease",
        }}
      >
        {/* Search bar */}
        <div style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px",
              borderRadius: 8,
              background: "var(--bg-card)",
              border: "0.5px solid var(--border)",
            }}
          >
            <Search size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Type to filter..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 12,
                color: "var(--text-primary)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            />
          </div>
        </div>

        {/* Frequent pills */}
        {!filter.trim() && (
          <div style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 4, borderBottom: "0.5px solid var(--border)" }}>
            {frequent.map((code) => {
              const lang = LANGUAGES.find((l) => l.code === code);
              if (!lang) return null;
              const isSelected = code === selected;
              return (
                <button
                  key={code}
                  onClick={() => {
                    saveRecentLang(code);
                    onSelect(code);
                    close();
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 500,
                    border: isSelected
                      ? `0.5px solid rgba(${gradientColors[0]}, 0.15)`
                      : "0.5px solid var(--border)",
                    background: isSelected
                      ? `linear-gradient(135deg, rgba(${hexToRgb(gradientColors[0])}, 0.08), rgba(${hexToRgb(gradientColors[1])}, 0.08))`
                      : "transparent",
                    color: isSelected ? accentColor : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  {code}
                </button>
              );
            })}
          </div>
        )}

        {/* Language list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {groups.map((group) => {
            const groupLangs = filtered.filter((l) => l.group === group);
            return (
              <div key={group}>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 9,
                    fontStyle: "italic",
                    color: "var(--text-muted)",
                    padding: "8px 14px 2px",
                    letterSpacing: "0.06em",
                  }}
                >
                  {group}
                </div>
                {groupLangs.map((lang) => {
                  const isSelected = lang.code === selected;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        saveRecentLang(lang.code);
                        onSelect(lang.code);
                        close();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 14px",
                        borderRadius: 0,
                        background: isSelected
                          ? `linear-gradient(135deg, rgba(${hexToRgb(gradientColors[0])}, 0.06), rgba(${hexToRgb(gradientColors[1])}, 0.06))`
                          : "transparent",
                        border: "none",
                        borderLeft: isSelected
                          ? `2px solid ${accentColor}`
                          : "2px solid transparent",
                        cursor: "pointer",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        transition: "background 150ms",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--text-primary)" }}>
                        {lang.region}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isSelected ? accentColor : "var(--text-muted)",
                        }}
                      >
                        {lang.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* hex to rgb helper */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

/* ─── Main Modal ─── */

export default function NewProjectModal({ onClose, onCreated }: NewProjectModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [srcLang, setSrcLang] = useState("en-US");
  const [tgtLang, setTgtLang] = useState("es-ES");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [pickerFor, setPickerFor] = useState<"src" | "tgt" | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedSegments, setParsedSegments] = useState<ParsedSegment[] | null>(null);
  const [fileFormat, setFileFormat] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const accentColor = ACCENT_CODE_COLOR[theme] || ACCENT_CODE_COLOR.dark;
  const gradientColors = GRADIENT_COLORS[theme] || GRADIENT_COLORS.dark;

  const srcEntry = LANGUAGES.find((l) => l.code === srcLang);
  const tgtEntry = LANGUAGES.find((l) => l.code === tgtLang);

  const handleFileParse = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setError("");
    setParsedSegments(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/files/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to parse file"); setParsing(false); return; }
      setParsedSegments(data.segments);
      setFileFormat(data.fileFormat);
      if (data.isXliff && data.srcLang) {
        setSrcLang(data.srcLang);
        if (data.tgtLang) setTgtLang(data.tgtLang);
      }
      if (!name.trim()) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      setError("Failed to parse file.");
    } finally {
      setParsing(false);
    }
  }, [name]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    const ext = "." + droppedFile.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported format: ${ext}`);
      return;
    }
    handleFileParse(droppedFile);
  }, [handleFileParse]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileParse(selectedFile);
  }, [handleFileParse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Project name is required"); return; }
    if (srcLang === tgtLang) { setError("Source and target languages must be different"); return; }
    if (inputMode === "text" && !text.trim()) { setError("Please paste some text to translate"); return; }
    if (inputMode === "file" && (!parsedSegments || parsedSegments.length === 0)) { setError("Please upload a file first"); return; }

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = { name: name.trim(), srcLang, tgtLang };
      if (inputMode === "file" && parsedSegments) {
        body.parsedSegments = parsedSegments;
        body.sourceFile = file?.name || null;
        body.fileFormat = fileFormat;
        body.isXliff = fileFormat === "xliff";
      } else {
        body.text = text;
      }
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create project"); return; }
      onCreated(data.id);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--overlay)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal card */}
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            borderRadius: 14,
            padding: "28px 24px",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "var(--bg-panel)",
            border: "0.5px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              transition: "color 150ms",
              padding: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <X size={14} />
          </button>

          {/* Title */}
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--text-primary)",
              margin: 0,
              marginBottom: 4,
            }}
          >
            new project.
          </h2>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 9,
              color: "var(--text-muted)",
              margin: 0,
              marginBottom: 20,
            }}
          >
            give your project a name and choose your languages.
          </p>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                background: "var(--red-soft)",
                color: "var(--red-text)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* NAME */}
            <label
              style={{
                display: "block",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Contract Translation EN-ES"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontFamily: "'Inter', system-ui, sans-serif",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border)",
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color 150ms",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />

            {/* LANGUAGES */}
            <label
              style={{
                display: "block",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              LANGUAGES
            </label>

            <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", alignItems: "center", gap: 10 }}>
              {/* Source card */}
              <div
                onClick={() => setPickerFor("src")}
                style={{
                  flex: 1,
                  width: isNarrow ? "100%" : undefined,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "0.5px solid var(--border)",
                  background: "var(--bg-sidebar)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--text-muted)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px rgba(var(--text-primary), 0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Gradient bar top */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                    borderRadius: "12px 12px 0 0",
                  }}
                />
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 2 }}>
                  SOURCE
                </div>
                <div style={{ fontSize: 14, color: "var(--text-primary)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {srcEntry?.name || "Select"}
                </div>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: accentColor, marginTop: 2 }}>
                  {srcLang}
                </div>
              </div>

              {/* Arrow circle */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "0.5px solid var(--border)",
                  background: "var(--bg-sidebar)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: isNarrow ? "rotate(90deg)" : "none",
                  transition: "transform 200ms",
                }}
              >
                <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
              </div>

              {/* Target card */}
              <div
                onClick={() => setPickerFor("tgt")}
                style={{
                  flex: 1,
                  width: isNarrow ? "100%" : undefined,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "0.5px solid var(--border)",
                  background: "var(--bg-sidebar)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 150ms, box-shadow 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--text-muted)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px rgba(var(--text-primary), 0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                    borderRadius: "12px 12px 0 0",
                  }}
                />
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'Inter', system-ui, sans-serif", marginBottom: 2 }}>
                  TARGET
                </div>
                <div style={{ fontSize: 14, color: "var(--text-primary)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {tgtEntry?.name || "Select"}
                </div>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: accentColor, marginTop: 2 }}>
                  {tgtLang}
                </div>
              </div>
            </div>

            {/* Content toggle pills */}
            <div style={{ display: "flex", gap: 6, marginTop: 20, marginBottom: 12 }}>
              {(["text", "file"] as const).map((mode) => {
                const active = inputMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInputMode(mode)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 22,
                      fontSize: 12,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: 500,
                      border: active
                        ? `0.5px solid rgba(${hexToRgb(gradientColors[0])}, 0.25)`
                        : "0.5px solid var(--border)",
                      background: active
                        ? `linear-gradient(135deg, rgba(${hexToRgb(gradientColors[0])}, 0.06), rgba(${hexToRgb(gradientColors[1])}, 0.02))`
                        : "transparent",
                      boxShadow: active
                        ? `0 0 12px rgba(${hexToRgb(gradientColors[0])}, 0.04)`
                        : "none",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {mode === "text" ? <Type size={11} /> : <Upload size={11} />}
                    {mode === "text" ? "Paste text" : "Upload file"}
                  </button>
                );
              })}
            </div>

            {/* Text input */}
            {inputMode === "text" && (
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  placeholder="Paste the source text here..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.6,
                    background: "var(--bg-sidebar)",
                    border: "0.5px dashed var(--border)",
                    color: "var(--text-primary)",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
                {text.trim().length > 0 && (
                  <p style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>
                    ~{text.trim().split(/[.!?]+\s+/).length} segments estimated
                  </p>
                )}
              </div>
            )}

            {/* File upload */}
            {inputMode === "file" && (
              <div>
                <div
                  style={{
                    borderRadius: 12,
                    textAlign: "center",
                    cursor: "pointer",
                    padding: 32,
                    border: `0.5px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                    background: dragOver ? "var(--accent-soft)" : "var(--bg-sidebar)",
                    transition: "all 150ms",
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.docx,.pdf,.xlf,.xliff,.json,.srt,.po,.md"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  {parsing ? (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4 }}>Parsing file...</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Extracting text and segmenting</div>
                    </div>
                  ) : file ? (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4 }}>{file.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {(file.size / 1024).toFixed(1)} KB — Click or drag to replace
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                        Drag & drop a file here, or click to browse
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        Supported: .txt, .docx, .pdf, .xlf, .json, .srt, .po, .md
                      </div>
                    </div>
                  )}
                </div>

                {parsedSegments && parsedSegments.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, marginBottom: 6, color: "var(--text-muted)" }}>
                      Preview ({parsedSegments.length} segments):
                    </div>
                    <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", border: "0.5px solid var(--border)" }}>
                      {parsedSegments.slice(0, 5).map((seg, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 12px",
                            fontSize: 11,
                            display: "flex",
                            gap: 8,
                            background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-deep)",
                            borderBottom: i < 4 ? "0.5px solid var(--border)" : "none",
                          }}
                        >
                          <span style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, width: 20, textAlign: "right" }}>
                            {i + 1}
                          </span>
                          <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {seg.text}
                          </span>
                        </div>
                      ))}
                      {parsedSegments.length > 5 && (
                        <div style={{ padding: "8px 12px", fontSize: 10, textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)" }}>
                          ... and {parsedSegments.length - 5} more segments
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create button */}
            <button
              type="submit"
              disabled={loading || parsing}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "13px 0",
                borderRadius: 24,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'Inter', system-ui, sans-serif",
                background: `linear-gradient(135deg, rgba(${hexToRgb(gradientColors[0])}, 0.08), rgba(${hexToRgb(gradientColors[1])}, 0.08))`,
                border: `0.5px solid rgba(${hexToRgb(gradientColors[0])}, 0.2)`,
                color: "var(--text-primary)",
                cursor: loading || parsing ? "default" : "pointer",
                opacity: loading || parsing ? 0.6 : 1,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading && !parsing) {
                  e.currentTarget.style.background = `linear-gradient(135deg, rgba(${hexToRgb(gradientColors[0])}, 0.14), rgba(${hexToRgb(gradientColors[1])}, 0.14))`;
                  e.currentTarget.style.borderColor = `rgba(${hexToRgb(gradientColors[0])}, 0.35)`;
                  e.currentTarget.style.boxShadow = `0 0 20px rgba(${hexToRgb(gradientColors[0])}, 0.06)`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, rgba(${hexToRgb(gradientColors[0])}, 0.08), rgba(${hexToRgb(gradientColors[1])}, 0.08))`;
                e.currentTarget.style.borderColor = `rgba(${hexToRgb(gradientColors[0])}, 0.2)`;
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "Creating..." : "Create project"}
            </button>
          </form>
        </div>
      </div>

      {/* Language picker overlay */}
      {pickerFor && (
        <LanguagePicker
          selected={pickerFor === "src" ? srcLang : tgtLang}
          onSelect={(code) => {
            if (pickerFor === "src") setSrcLang(code);
            else setTgtLang(code);
          }}
          onClose={() => setPickerFor(null)}
          accentColor={accentColor}
          gradientColors={gradientColors}
        />
      )}
    </>
  );
}
