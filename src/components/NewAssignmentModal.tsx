"use client";

import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";

interface NewAssignmentModalProps {
  classroomId: string;
  onClose: () => void;
  onCreated: () => void;
}

interface ProjectOption {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
}

const RUBRIC_PRESETS = ["accuracy", "fluency", "terminology", "consistency", "style"];

export default function NewAssignmentModal({ classroomId, onClose, onCreated }: NewAssignmentModalProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gradingMode, setGradingMode] = useState("simple");
  const [gradingScale, setGradingScale] = useState("numeric-20");
  const [rubricCriteria, setRubricCriteria] = useState<string[]>(["accuracy", "fluency"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/classrooms/${classroomId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          instructions: instructions.trim() || undefined,
          dueDate: dueDate || undefined,
          gradingMode,
          gradingScale,
          rubricCriteria: gradingMode === "rubric" ? rubricCriteria : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create assignment");
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleCriterion = (c: string) => {
    setRubricCriteria((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
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
          maxWidth: 500,
          maxHeight: "85vh",
          overflow: "auto",
          padding: 24,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>New Assignment</h2>
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
          {/* Source project */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Source Project (template)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.srcLang}→{p.tgtLang})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Assignment Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Practice 3 — Medical text"
              style={inputStyle}
            />
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Translate the medical text using formal register..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Due date */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Due Date (optional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Grading mode */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Grading Mode
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["simple", "rubric"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGradingMode(m)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 13,
                    fontWeight: 500,
                    background: gradingMode === m ? "var(--accent-soft)" : "transparent",
                    color: gradingMode === m ? "var(--accent)" : "var(--text-muted)",
                    border: gradingMode === m ? "1px solid var(--accent)" : "1px solid var(--border)",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui-family)",
                    textTransform: "capitalize",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Grading scale */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Scale
            </label>
            <select value={gradingScale} onChange={(e) => setGradingScale(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="numeric-20">0-20</option>
              <option value="numeric-100">0-100</option>
              <option value="letter">Letter (A-F)</option>
            </select>
          </div>

          {/* Rubric criteria */}
          {gradingMode === "rubric" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6, color: "var(--text-muted)" }}>
                Rubric Criteria
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {RUBRIC_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCriterion(c)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      background: rubricCriteria.includes(c) ? "var(--accent-soft)" : "transparent",
                      color: rubricCriteria.includes(c) ? "var(--accent)" : "var(--text-muted)",
                      border: rubricCriteria.includes(c) ? "1px solid var(--accent)" : "1px solid var(--border)",
                      cursor: "pointer",
                      fontFamily: "var(--font-ui-family)",
                      textTransform: "capitalize",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !projectId || !title.trim()}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 600,
              background: "var(--cta-bg-gradient)",
              color: "var(--cta-text)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "var(--font-ui-family)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Upload size={14} />
            {loading ? "Creating..." : "Create & Publish"}
          </button>
        </form>
      </div>
    </div>
  );
}
