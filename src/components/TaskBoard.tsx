"use client";

import SubmissionCard from "@/components/SubmissionCard";

interface TaskBoardSubmission {
  id: string;
  projectId: string;
  status: string;
  progressPct: number;
  submittedAt: string | null;
  gradeValue: number | null;
  student: { name: string | null; username: string | null };
}

interface TaskBoardAssignment {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  submissions: TaskBoardSubmission[];
}

interface TaskBoardProps {
  assignments: TaskBoardAssignment[];
  totalStudents: number;
}

interface Column {
  key: string;
  label: string;
  color: string;
  filter: (s: TaskBoardSubmission) => boolean;
}

const COLUMNS: Column[] = [
  {
    key: "pending",
    label: "Pending",
    color: "var(--text-muted)",
    filter: (s) => s.status === "in_progress" && s.progressPct === 0,
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "var(--amber)",
    filter: (s) => s.status === "in_progress" && s.progressPct > 0,
  },
  {
    key: "completed",
    label: "Completed",
    color: "var(--green)",
    filter: (s) => ["submitted", "reviewing", "graded"].includes(s.status),
  },
];

export default function TaskBoard({ assignments, totalStudents }: TaskBoardProps) {
  if (assignments.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
        No assignments yet. Create one to see the Task Board.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {assignments.map((assignment) => (
        <div key={assignment.id}>
          {/* Assignment header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui-family)",
              margin: 0,
            }}>
              {assignment.title}
            </h3>
            {assignment.dueDate && (
              <span style={{
                fontSize: 11,
                color: new Date(assignment.dueDate) < new Date() ? "var(--red)" : "var(--text-muted)",
                fontFamily: "var(--font-ui-family)",
              }}>
                Due {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
            <span style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginLeft: "auto",
              fontFamily: "var(--font-ui-family)",
            }}>
              {assignment.submissions.length}/{totalStudents} students
            </span>
          </div>

          {/* Kanban columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {COLUMNS.map((col) => {
              const items = assignment.submissions.filter(col.filter);
              return (
                <div
                  key={col.key}
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    padding: 10,
                    minHeight: 80,
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: col.color,
                      opacity: 0.7,
                    }} />
                    <span style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-ui-family)",
                    }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginLeft: "auto",
                      fontFamily: "var(--font-ui-family)",
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((s) => (
                      <SubmissionCard
                        key={s.id}
                        submission={s}
                        dueDate={assignment.dueDate}
                      />
                    ))}
                    {items.length === 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                        No students
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
