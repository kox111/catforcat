"use client";

import { useState } from "react";
import { Radio, Square } from "lucide-react";

interface SessionControlsProps {
  classroomId: string;
  assignmentId?: string;
  onSessionStart: (sessionId: string) => void;
  onSessionEnd: () => void;
  activeSessionId: string | null;
}

export default function SessionControls({
  classroomId,
  assignmentId,
  onSessionStart,
  onSessionEnd,
  activeSessionId,
}: SessionControlsProps) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      if (res.ok) {
        const data = await res.json();
        onSessionStart(data.session.id);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      await fetch(`/api/class-sessions/${activeSessionId}`, { method: "PATCH" });
      onSessionEnd();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (activeSessionId) {
    return (
      <button
        onClick={handleEnd}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: "var(--radius-sm)",
          fontSize: 13,
          fontWeight: 600,
          background: "var(--red-soft)",
          color: "var(--red)",
          border: "1px solid var(--red)",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-ui-family)",
        }}
      >
        <Square size={14} /> End Session
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: "var(--radius-sm)",
        fontSize: 13,
        fontWeight: 600,
        background: "var(--green-soft)",
        color: "var(--green-text)",
        border: "1px solid var(--green)",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-ui-family)",
      }}
    >
      <Radio size={14} /> Start Session
    </button>
  );
}
