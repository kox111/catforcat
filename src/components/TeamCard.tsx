"use client";

import { useRouter } from "next/navigation";
import { Users, FolderOpen } from "lucide-react";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    _count: { members: number; projects: number };
    owner: { id: string; name: string | null; username: string | null };
  };
  myRole: string;
}

export default function TeamCard({ team, myRole }: TeamCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/app/teams/${team.id}`)}
      style={{
        padding: 20,
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        cursor: "pointer",
        transition: "border-color 150ms, box-shadow 150ms, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-focus)";
        e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          {team.name}
        </h3>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: myRole === "pm" ? "var(--purple-soft)" : "var(--accent-soft)",
            color: myRole === "pm" ? "var(--purple-text)" : "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {myRole}
        </span>
      </div>

      {team.description && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {team.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={13} /> {team._count.members}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <FolderOpen size={13} /> {team._count.projects}
        </span>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
        Owner: {team.owner.name || team.owner.username || "Unknown"}
      </p>
    </div>
  );
}
