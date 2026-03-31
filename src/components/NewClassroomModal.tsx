"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewClassroomModalProps {
  onClose: () => void;
}

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "tr", label: "Turkish" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "fi", label: "Finnish" },
  { value: "nb", label: "Norwegian" },
  { value: "cs", label: "Czech" },
  { value: "ro", label: "Romanian" },
  { value: "hu", label: "Hungarian" },
  { value: "el", label: "Greek" },
  { value: "he", label: "Hebrew" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "uk", label: "Ukrainian" },
  { value: "ca", label: "Catalan" },
  { value: "hr", label: "Croatian" },
];

export default function NewClassroomModal({ onClose }: NewClassroomModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("es");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, srcLang, tgtLang }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create classroom");
        return;
      }
      const data = await res.json();
      onClose();
      router.push(`/app/classrooms/${data.classroom.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    outline: "none",
    background: "var(--bg-deep)",
    border: "1.5px solid var(--border)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-ui-family)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 24,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>New Classroom</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, fontSize: 13, background: "var(--red-soft)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Classroom Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Medical Translation 2026-I"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description..."
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Source</label>
              <select value={srcLang} onChange={(e) => setSrcLang(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {LANG_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Target</label>
              <select value={tgtLang} onChange={(e) => setTgtLang(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {LANG_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              background: "var(--cta-bg-gradient)",
              color: "var(--cta-text)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "var(--font-ui-family)",
            }}
          >
            {loading ? "Creating..." : "Create Classroom"}
          </button>
        </form>
      </div>
    </div>
  );
}
