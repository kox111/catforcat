"use client";

import { useState, useRef, useCallback } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];

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

export default function NewProjectModal({ onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("es");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedSegments, setParsedSegments] = useState<ParsedSegment[] | null>(null);
  const [fileFormat, setFileFormat] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileParse = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setError("");
    setParsedSegments(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/files/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to parse file");
        setParsing(false);
        return;
      }

      setParsedSegments(data.segments);
      setFileFormat(data.fileFormat);

      // XLIFF: auto-detect languages from file
      if (data.isXliff && data.srcLang) {
        setSrcLang(data.srcLang);
        if (data.tgtLang) setTgtLang(data.tgtLang);
      }

      // Auto-fill project name from file name if empty
      if (!name.trim()) {
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setName(baseName);
      }
    } catch {
      setError("Failed to parse file. Please try a different format.");
    } finally {
      setParsing(false);
    }
  }, [name]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      const ext = "." + droppedFile.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError(`Unsupported format: ${ext}. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
        return;
      }

      handleFileParse(droppedFile);
    },
    [handleFileParse]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFileParse(selectedFile);
    },
    [handleFileParse]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    if (srcLang === tgtLang) {
      setError("Source and target languages must be different");
      return;
    }

    if (inputMode === "text" && !text.trim()) {
      setError("Please paste some text to translate");
      return;
    }
    if (inputMode === "file" && (!parsedSegments || parsedSegments.length === 0)) {
      setError("Please upload and parse a file first");
      return;
    }

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = { name: name.trim(), srcLang, tgtLang };

      if (inputMode === "file" && parsedSegments) {
        body.parsedSegments = parsedSegments;
        body.sourceFile = file?.name || null;
        body.fileFormat = fileFormat;
        // XLIFF: segments may have pre-populated targetText
        body.isXliff = fileFormat === "xliff";
      } else {
        body.text = text;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create project");
        return;
      }

      onCreated(data.id);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "var(--overlay)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            New Project
          </h2>
          <button
            onClick={onClose}
            className="text-lg px-2 py-1 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "14px",
              background: "var(--red-soft)",
              color: "var(--red)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={inputStyle}
              placeholder="e.g., Contract Translation EN-ES"
            />
          </div>

          {/* Language Pair */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Source Language
              </label>
              <select
                value={srcLang}
                onChange={(e) => setSrcLang(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={inputStyle}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2" style={{ color: "var(--text-muted)" }}>→</div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Target Language
              </label>
              <select
                value={tgtLang}
                onChange={(e) => setTgtLang(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={inputStyle}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Input Mode Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: inputMode === "text" ? "var(--accent-soft)" : "var(--bg-card)",
                color: inputMode === "text" ? "var(--text-primary)" : "var(--text-secondary)",
                border: inputMode === "text" ? "0.5px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: inputMode === "file" ? "var(--accent-soft)" : "var(--bg-card)",
                color: inputMode === "file" ? "var(--text-primary)" : "var(--text-secondary)",
                border: inputMode === "file" ? "0.5px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              Upload File
            </button>
          </div>

          {/* Text Input Mode */}
          {inputMode === "text" && (
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Source Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                style={{
                  width: "100%",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: "1.6",
                  background: inputStyle.background,
                  border: inputStyle.border,
                  color: inputStyle.color,
                }}
                placeholder="Paste the source text here. It will be automatically segmented into translatable units."
              />
              {text.trim().length > 0 && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  ~{text.trim().split(/[.!?]+\s+/).length} segments estimated
                </p>
              )}
            </div>
          )}

          {/* File Upload Mode */}
          {inputMode === "file" && (
            <div>
              {/* Drag & Drop Zone */}
              <div
                style={{
                  borderRadius: "8px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "colors 0.2s ease",
                  padding: "32px",
                  border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                  background: dragOver ? "var(--accent-soft)" : "var(--bg-card)",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.pdf,.xlf,.xliff,.json,.srt,.po,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {parsing ? (
                  <div>
                    <div className="text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                      Parsing file...
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Extracting text and segmenting
                    </div>
                  </div>
                ) : file ? (
                  <div>
                    <div className="text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                      {file.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {(file.size / 1024).toFixed(1)} KB — Click or drag to replace
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                      Drag & drop a file here, or click to browse
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Supported: .txt, .docx, .pdf, .xlf, .json, .srt, .po, .md
                    </div>
                  </div>
                )}
              </div>

              {/* Preview of parsed segments */}
              {parsedSegments && parsedSegments.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "12px", marginBottom: "8px", color: "var(--text-muted)" }}>
                    Preview ({parsedSegments.length} segments detected):
                  </div>
                  <div
                    style={{
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {parsedSegments.slice(0, 5).map((seg, i) => (
                      <div
                        key={i}
                        style={{
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          paddingTop: "8px",
                          paddingBottom: "8px",
                          fontSize: "12px",
                          display: "flex",
                          gap: "8px",
                          background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-deep)",
                          borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <span
                          className="shrink-0 w-6 text-right"
                          style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {seg.text}
                        </span>
                      </div>
                    ))}
                    {parsedSegments.length > 5 && (
                      <div
                        style={{
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          paddingTop: "8px",
                          paddingBottom: "8px",
                          fontSize: "12px",
                          textAlign: "center",
                          color: "var(--text-muted)",
                          background: "var(--bg-card)",
                        }}
                      >
                        ... and {parsedSegments.length - 5} more segments
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                background: "transparent",
                color: "var(--text-secondary)",
                border: "0.5px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || parsing}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: "var(--accent-soft)",
                color: "var(--text-primary)",
                border: "0.5px solid var(--border)",
                backdropFilter: "blur(4px)",
                cursor: loading || parsing ? "default" : "pointer",
                opacity: loading || parsing ? 0.6 : 1,
                fontFamily: "inherit",
                transition: "background 150ms, border-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!loading && !parsing) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-soft)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
