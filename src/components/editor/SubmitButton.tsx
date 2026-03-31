"use client";

import { useState, useEffect } from "react";
import { Send, Undo2 } from "lucide-react";

interface SubmitButtonProps {
  projectId: string;
}

interface SubmissionInfo {
  id: string;
  status: string;
  assignmentId: string;
}

export default function SubmitButton({ projectId }: SubmitButtonProps) {
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if this project has a submission (student assignment)
    fetch(`/api/projects/${projectId}/submission`)
      .then((r) => r.json())
      .then((data) => {
        if (data.submission) {
          setSubmission(data.submission);
        }
      })
      .catch(() => {});
  }, [projectId]);

  if (!submission) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/submit`, { method: "POST" });
      if (res.ok) {
        setSubmission({ ...submission, status: "submitted" });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}/unsubmit`, { method: "POST" });
      if (res.ok) {
        setSubmission({ ...submission, status: "in_progress" });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (submission.status === "graded") {
    return (
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: "var(--radius-sm)",
          background: "var(--purple-soft)",
          color: "var(--purple-text)",
        }}
      >
        Graded
      </span>
    );
  }

  if (submission.status === "submitted") {
    return (
      <button
        onClick={handleUnsubmit}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 14px",
          borderRadius: "var(--radius-sm)",
          fontSize: 12,
          fontWeight: 600,
          background: "var(--amber-soft)",
          color: "var(--amber-text)",
          border: "1px solid transparent",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-ui-family)",
        }}
      >
        <Undo2 size={13} /> Unsubmit
      </button>
    );
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        fontWeight: 600,
        background: "var(--green-soft)",
        color: "var(--green-text)",
        border: "1px solid var(--green)",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-ui-family)",
      }}
    >
      <Send size={13} /> Submit
    </button>
  );
}
