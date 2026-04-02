"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, AlertCircle, FileText, ArrowLeft, Pencil, X, Check } from "lucide-react";
import UserPreviewCard from "@/components/UserPreviewCard";
import GradeModal from "@/components/GradeModal";
import DatePicker from "@/components/DatePicker";

interface SubmissionData {
  id: string;
  status: string;
  submittedAt: string | null;
  gradeValue: number | null;
  gradeComment: string | null;
  rubricScores: string | null;
  gradedAt: string | null;
  progressPct: number;
  student: { id: string; name: string | null; username: string | null; avatarUrl: string | null; plan: string };
  project: { id: string; name: string };
}

interface AssignmentData {
  id: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  gradingMode: string;
  gradingScale: string;
  rubricCriteria: string | null;
  status: string;
  classroom: { id: string; name: string; professorId: string };
  submissions: SubmissionData[];
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;
  const assignmentId = params.aid as string;

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [gradeTarget, setGradeTarget] = useState<SubmissionData | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      if (!res.ok) return;
      const data = await res.json();
      setAssignment(data.assignment);
      setMyRole(data.myRole);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { fetchAssignment(); }, [fetchAssignment]);

  const startEdit = () => {
    if (!assignment) return;
    setEditTitle(assignment.title);
    setEditInstructions(assignment.instructions || "");
    setEditDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "");
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          instructions: editInstructions.trim() || null,
          dueDate: editDueDate || null,
        }),
      });
      if (res.ok) {
        await fetchAssignment();
        setEditing(false);
      }
    } catch { /* silent */ }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!assignment) return null;

  const isProfessor = myRole === "professor";

  const statusIcon = (status: string) => {
    switch (status) {
      case "submitted": return <CheckCircle2 size={14} style={{ color: "var(--green)" }} />;
      case "graded": return <CheckCircle2 size={14} style={{ color: "var(--purple)" }} />;
      case "in_progress": return <Clock size={14} style={{ color: "var(--amber)" }} />;
      default: return <AlertCircle size={14} style={{ color: "var(--text-muted)" }} />;
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto", height: "100%", overflow: "auto" }}>
      {/* Back link */}
      <Link
        href={`/app/classrooms/${classroomId}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "var(--text-secondary)", fontSize: 13,
          fontFamily: "var(--font-ui-family)", textDecoration: "none",
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={14} />
        Back to classroom
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        {editing ? (
          /* Edit form */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Assignment title"
              style={{
                fontSize: 18, fontWeight: 400, padding: "6px 10px",
                borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                background: "var(--bg-card)", color: "var(--text-primary)",
                fontFamily: "var(--font-display-family)", width: "100%",
              }}
            />
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              placeholder="Instructions (optional)"
              rows={3}
              style={{
                fontSize: 13, padding: "6px 10px", resize: "vertical",
                borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                background: "var(--bg-card)", color: "var(--text-primary)",
                fontFamily: "var(--font-ui-family)", width: "100%",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>Due date:</label>
              <div style={{ flex: 1, maxWidth: 260 }}>
                <DatePicker
                  value={editDueDate}
                  onChange={(v) => setEditDueDate(v)}
                  minDate={new Date().toISOString()}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={saveEdit}
                disabled={saving || !editTitle.trim()}
                style={{
                  padding: "5px 14px", fontSize: 12, borderRadius: "var(--radius-sm)",
                  background: "var(--accent)", color: "#fff", border: "none",
                  cursor: saving ? "wait" : "pointer", fontFamily: "var(--font-ui-family)",
                  display: "flex", alignItems: "center", gap: 4, opacity: saving ? 0.6 : 1,
                }}
              >
                <Check size={12} /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: "5px 14px", fontSize: 12, borderRadius: "var(--radius-sm)",
                  background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", cursor: "pointer",
                  fontFamily: "var(--font-ui-family)", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Normal view */
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-display-family)" }}>
                {assignment.title}
              </h1>
              {isProfessor && (
                <button
                  onClick={startEdit}
                  title="Edit assignment"
                  style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
                  }}
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              <span>{assignment.classroom.name}</span>
              {assignment.dueDate && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} /> Due {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              )}
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: assignment.status === "active" ? "var(--green-soft)" : "var(--red-soft)",
                  color: assignment.status === "active" ? "var(--green-text)" : "var(--red-text)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: 10,
                }}
              >
                {assignment.status}
              </span>
            </div>
            {assignment.instructions && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
                {assignment.instructions}
              </p>
            )}
          </>
        )}
      </div>

      {/* Submissions */}
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
        Submissions ({assignment.submissions.length})
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assignment.submissions.map((sub) => (
          <div
            key={sub.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ flex: 1 }}>
              <UserPreviewCard user={sub.student} compact />
            </div>

            {/* Progress bar */}
            <div style={{ width: 80 }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "var(--bg-deep)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${sub.progressPct}%`,
                    background: sub.progressPct === 100 ? "var(--green)" : "var(--accent)",
                    borderRadius: 2,
                    transition: "width 300ms",
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub.progressPct}%</span>
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 90 }}>
              {statusIcon(sub.status)}
              <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                {sub.status.replace("_", " ")}
              </span>
            </div>

            {/* Grade */}
            {sub.gradeValue != null && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", minWidth: 30, textAlign: "right" }}>
                {Number(sub.gradeValue)}
              </span>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => router.push(`/app/projects/${sub.project.id}`)}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--btn-secondary-bg)",
                  color: "var(--btn-secondary-text)",
                  border: "1px solid var(--btn-secondary-border)",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui-family)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FileText size={12} /> View
              </button>
              {isProfessor && (sub.status === "submitted" || sub.status === "graded") && (
                <button
                  onClick={() => setGradeTarget(sub)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--purple-soft)",
                    color: "var(--purple-text)",
                    border: "1px solid transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui-family)",
                  }}
                >
                  Grade
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {gradeTarget && assignment && (
        <GradeModal
          submission={gradeTarget}
          gradingMode={assignment.gradingMode}
          gradingScale={assignment.gradingScale}
          rubricCriteria={assignment.rubricCriteria}
          onClose={() => { setGradeTarget(null); fetchAssignment(); }}
        />
      )}
    </div>
  );
}
