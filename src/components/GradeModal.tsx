"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface GradeModalProps {
  submission: {
    id: string;
    gradeValue: number | null;
    gradeComment: string | null;
    rubricScores: string | null;
    student: { name: string | null; username: string | null };
  };
  gradingMode: string;
  gradingScale: string;
  rubricCriteria: string | null;
  onClose: () => void;
}

export default function GradeModal({
  submission,
  gradingMode,
  gradingScale,
  rubricCriteria,
  onClose,
}: GradeModalProps) {
  const maxGrade = gradingScale === "numeric-100" ? 100 : gradingScale === "numeric-20" ? 20 : 100;
  const criteria: string[] = rubricCriteria ? JSON.parse(rubricCriteria) : [];
  const existingRubric = submission.rubricScores ? JSON.parse(submission.rubricScores) : {};

  const [grade, setGrade] = useState(submission.gradeValue?.toString() || "");
  const [comment, setComment] = useState(submission.gradeComment || "");
  const [rubricValues, setRubricValues] = useState<Record<string, string>>(
    criteria.reduce((acc, c) => ({ ...acc, [c]: existingRubric[c]?.toString() || "" }), {} as Record<string, string>),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const endpoint = `/api/submissions/${submission.id}/grade`;
    const isUpdate = submission.gradeValue != null;

    const body: Record<string, unknown> = { gradeComment: comment };

    if (gradingMode === "rubric" && criteria.length > 0) {
      const scores: Record<string, number> = {};
      for (const c of criteria) {
        scores[c] = Number(rubricValues[c]) || 0;
      }
      body.rubricScores = scores;
      // Average as grade value
      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      body.gradeValue = Math.round(total / criteria.length);
    } else {
      body.gradeValue = Number(grade) || 0;
    }

    await fetch(endpoint, {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    onClose();
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
          boxShadow: "var(--shadow-float)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Grade — @{submission.student.username || submission.student.name}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {gradingMode === "rubric" && criteria.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            {criteria.map((c) => (
              <div key={c} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {c} (0-{maxGrade})
                </label>
                <input
                  type="number"
                  min={0}
                  max={maxGrade}
                  value={rubricValues[c]}
                  onChange={(e) => setRubricValues({ ...rubricValues, [c]: e.target.value })}
                  style={{ ...inputStyle, width: 100 }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Grade (0-{maxGrade})
            </label>
            <input
              type="number"
              min={0}
              max={maxGrade}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{ ...inputStyle, width: 100 }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="General feedback..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 600,
            background: "var(--cta-bg-gradient)",
            color: "var(--cta-text)",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            fontFamily: "var(--font-ui-family)",
          }}
        >
          {saving ? "Saving..." : "Save Grade"}
        </button>
      </div>
    </div>
  );
}
