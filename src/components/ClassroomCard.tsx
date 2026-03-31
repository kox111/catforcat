"use client";

import { useRouter } from "next/navigation";
import { Users, BookOpen } from "lucide-react";

interface ClassroomCardProps {
  classroom: {
    id: string;
    name: string;
    srcLang: string;
    tgtLang: string;
    status: string;
    inviteCode: string;
    _count: { members: number; assignments: number };
    professor: { name: string | null; username: string | null };
  };
  myRole: string;
}

export default function ClassroomCard({ classroom, myRole }: ClassroomCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/app/classrooms/${classroom.id}`)}
      style={{
        padding: 20,
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        transition: "border-color 150ms, box-shadow 150ms",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          {classroom.name}
        </h3>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: myRole === "professor" ? "var(--purple-soft)" : "var(--accent-soft)",
            color: myRole === "professor" ? "var(--purple-text)" : "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {myRole}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
        {classroom.srcLang.toUpperCase()} → {classroom.tgtLang.toUpperCase()}
      </p>

      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={13} /> {classroom._count.members}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <BookOpen size={13} /> {classroom._count.assignments}
        </span>
      </div>

      {myRole === "professor" && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontFamily: "var(--font-editor-family)" }}>
          {classroom.inviteCode}
        </p>
      )}
    </div>
  );
}
