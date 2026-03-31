"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import UserPreviewCard from "@/components/UserPreviewCard";
import GradeModal from "@/components/GradeModal";

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
  const assignmentId = params.aid as string;

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [gradeTarget, setGradeTarget] = useState<SubmissionData | null>(null);

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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-display-family)" }}>
          {assignment.title}
        </h1>
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
