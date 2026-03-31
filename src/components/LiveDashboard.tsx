"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UserPreviewCard from "./UserPreviewCard";

interface LiveStudent {
  user: { id: string; name: string | null; username: string | null; avatarUrl: string | null; plan: string };
  color: string;
  projectId: string | null;
  progressPct: number;
  lastActiveAt: string | null;
  status: string;
}

interface LiveDashboardProps {
  sessionId: string;
  onEnd: () => void;
}

export default function LiveDashboard({ sessionId, onEnd }: LiveDashboardProps) {
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [active, setActive] = useState(true);
  const router = useRouter();

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/class-sessions/${sessionId}/live`);
      if (res.status === 410) {
        setActive(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {
      // silent
    }
  }, [sessionId]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [poll]);

  const handleEnd = async () => {
    await fetch(`/api/class-sessions/${sessionId}`, { method: "PATCH" });
    setActive(false);
    onEnd();
  };

  const timeSince = (date: string | null) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  return (
    <div
      style={{
        padding: 20,
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        border: "1px solid var(--live-indicator)",
        boxShadow: `0 0 20px var(--live-pulse)`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: active ? "var(--live-indicator)" : "var(--text-muted)",
              animation: active ? "pulse 2s infinite" : "none",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {active ? "Live Session" : "Session Ended"}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {students.length} students
          </span>
        </div>
        {active && (
          <button
            onClick={handleEnd}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: 600,
              background: "var(--red-soft)",
              color: "var(--red)",
              border: "1px solid var(--red)",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            End Session
          </button>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      {/* Student grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 10,
        }}
      >
        {students.map((s) => (
          <div
            key={s.user.id}
            onClick={() => {
              if (s.projectId) router.push(`/app/projects/${s.projectId}`);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-deep)",
              borderLeft: `3px solid ${s.color}`,
              cursor: "pointer",
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-deep)"; }}
          >
            <div style={{ marginBottom: 6 }}>
              <UserPreviewCard user={s.user} color={s.color} compact />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Progress bar */}
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${s.progressPct}%`,
                      background: s.progressPct === 100 ? "var(--green)" : "var(--accent)",
                      borderRadius: 2,
                      transition: "width 500ms",
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 30, textAlign: "right" }}>
                {s.progressPct}%
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {timeSince(s.lastActiveAt)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: s.status === "submitted" ? "var(--green)" : "var(--text-muted)",
                  textTransform: "capitalize",
                }}
              >
                {s.status.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
