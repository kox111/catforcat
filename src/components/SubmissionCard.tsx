"use client";

import { useRouter } from "next/navigation";

interface SubmissionCardProps {
  submission: {
    id: string;
    projectId: string;
    status: string;
    progressPct: number;
    submittedAt: string | null;
    gradeValue: number | null;
    student: {
      name: string | null;
      username: string | null;
    };
  };
  dueDate: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  in_progress: { bg: "var(--amber-soft)", color: "var(--amber-text)", label: "In Progress" },
  submitted: { bg: "var(--green-soft)", color: "var(--green-text)", label: "Submitted" },
  reviewing: { bg: "var(--purple-soft)", color: "var(--purple-text)", label: "Reviewing" },
  graded: { bg: "var(--accent-soft)", color: "var(--accent)", label: "Graded" },
};

export default function SubmissionCard({ submission, dueDate }: SubmissionCardProps) {
  const router = useRouter();
  const style = STATUS_STYLES[submission.status] || STATUS_STYLES.in_progress;
  const displayName = submission.student.username
    ? `@${submission.student.username}`
    : submission.student.name || "Unknown";

  const isOverdue = dueDate && !submission.submittedAt && new Date(dueDate) < new Date();

  return (
    <div
      onClick={() => router.push(`/app/projects/${submission.projectId}`)}
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        transition: "border-color 150ms, box-shadow 150ms",
        minWidth: 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-focus)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header: name + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)" }}>
          {displayName}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: style.bg,
            color: style.color,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontFamily: "var(--font-ui-family)",
          }}
        >
          {style.label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "var(--bg-deep)",
          overflow: "hidden",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${submission.progressPct}%`,
            borderRadius: 2,
            background: submission.progressPct >= 100 ? "var(--green)" : "var(--accent)",
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* Footer: progress % + grade or overdue */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-ui-family)" }}>
          {submission.progressPct}%
        </span>
        {submission.gradeValue != null ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-ui-family)" }}>
            {Number(submission.gradeValue)}/20
          </span>
        ) : isOverdue ? (
          <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 500 }}>Overdue</span>
        ) : null}
      </div>
    </div>
  );
}
