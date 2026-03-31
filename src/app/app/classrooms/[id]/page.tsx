"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, BookOpen, UserPlus, Copy, Check } from "lucide-react";
import MemberCard from "@/components/MemberCard";
import InviteModal from "@/components/InviteModal";
import NewAssignmentModal from "@/components/NewAssignmentModal";
import LiveDashboard from "@/components/LiveDashboard";
import SessionControls from "@/components/SessionControls";

interface ClassroomDetail {
  id: string;
  name: string;
  description: string | null;
  srcLang: string;
  tgtLang: string;
  inviteCode: string;
  status: string;
  professor: { id: string; name: string | null; username: string | null; avatarUrl: string | null; plan: string };
  members: Array<{
    id: string;
    role: string;
    color: string;
    user: { id: string; name: string | null; username: string | null; avatarUrl: string | null; plan: string };
  }>;
  assignments: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    gradingMode: string;
    _count: { submissions: number };
    createdAt: string;
  }>;
}

export default function ClassroomDashboard() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"members" | "assignments">("members");
  const [showInvite, setShowInvite] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const fetchClassroom = useCallback(async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      if (!res.ok) { router.push("/app/classrooms"); return; }
      const data = await res.json();
      setClassroom(data.classroom);
      setMyRole(data.myRole);
    } catch {
      router.push("/app/classrooms");
    } finally {
      setLoading(false);
    }
  }, [classroomId, router]);

  useEffect(() => { fetchClassroom(); }, [fetchClassroom]);

  const handleColorChange = async (userId: string, color: string) => {
    await fetch(`/api/classrooms/${classroomId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    fetchClassroom();
  };

  const handleRemove = async (userId: string) => {
    await fetch(`/api/classrooms/${classroomId}/members/${userId}`, { method: "DELETE" });
    fetchClassroom();
  };

  const copyCode = () => {
    if (classroom) {
      navigator.clipboard.writeText(classroom.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!classroom) return null;

  const isProfessor = myRole === "professor";

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto", height: "100%", overflow: "auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-display-family)", marginBottom: 4 }}>
          {classroom.name}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {classroom.srcLang.toUpperCase()} → {classroom.tgtLang.toUpperCase()}
          {classroom.description && ` · ${classroom.description}`}
        </p>
        {isProfessor && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Invite code:</span>
            <code
              style={{
                fontSize: 13,
                fontFamily: "var(--font-editor-family)",
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--bg-deep)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              {classroom.inviteCode}
            </code>
            <button
              onClick={copyCode}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
            >
              {codeCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        {(["members", "assignments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t === "members" ? <Users size={14} /> : <BookOpen size={14} />}
            {t === "members" ? `Members (${classroom.members.length})` : `Assignments (${classroom.assignments.length})`}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div>
          {isProfessor && (
            <button
              onClick={() => setShowInvite(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: 500,
                background: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
                border: "1px solid var(--btn-secondary-border)",
                cursor: "pointer",
                marginBottom: 16,
                fontFamily: "var(--font-ui-family)",
              }}
            >
              <UserPlus size={14} /> Invite Member
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {classroom.members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isProfessor={isProfessor}
                onColorChange={handleColorChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === "assignments" && (
        <div>
          {isProfessor && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setShowNewAssignment(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: 500,
                  background: "var(--btn-secondary-bg)",
                  color: "var(--btn-secondary-text)",
                  border: "1px solid var(--btn-secondary-border)",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui-family)",
                }}
              >
                <BookOpen size={14} /> New Assignment
              </button>
              <SessionControls
                classroomId={classroomId}
                onSessionStart={(id) => setActiveSessionId(id)}
                onSessionEnd={() => setActiveSessionId(null)}
                activeSessionId={activeSessionId}
              />
            </div>
          )}

          {/* Live Dashboard */}
          {activeSessionId && (
            <div style={{ marginBottom: 16 }}>
              <LiveDashboard
                sessionId={activeSessionId}
                onEnd={() => setActiveSessionId(null)}
              />
            </div>
          )}
          {classroom.assignments.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
              No assignments yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {classroom.assignments.map((a) => (
                <div
                  key={a.id}
                  onClick={() => router.push(`/app/classrooms/${classroomId}/assignments/${a.id}`)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>{a.title}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {a._count.submissions} submissions
                      {a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: a.status === "active" ? "var(--green-soft)" : a.status === "closed" ? "var(--red-soft)" : "var(--amber-soft)",
                      color: a.status === "active" ? "var(--green-text)" : a.status === "closed" ? "var(--red-text)" : "var(--amber-text)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showInvite && (
        <InviteModal
          classroomId={classroomId}
          onClose={() => { setShowInvite(false); fetchClassroom(); }}
        />
      )}

      {showNewAssignment && (
        <NewAssignmentModal
          classroomId={classroomId}
          onClose={() => setShowNewAssignment(false)}
          onCreated={() => fetchClassroom()}
        />
      )}
    </div>
  );
}
