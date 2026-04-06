"use client";

import UserPreviewCard from "./UserPreviewCard";
import { TEAM_COLORS, teamColorVar } from "@/lib/team-colors";

interface MemberCardProps {
  member: {
    id: string;
    role: string;
    color: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
      plan: string;
    };
  };
  isProfessor?: boolean;
  onColorChange?: (userId: string, color: string) => void;
  onRemove?: (userId: string) => void;
}

export default function MemberCard({
  member,
  isProfessor = false,
  onColorChange,
  onRemove,
}: MemberCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${member.color.startsWith("#") ? member.color : teamColorVar(member.color)}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <UserPreviewCard user={member.user} color={member.color} compact />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: 4,
          background: "var(--accent-soft)",
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {member.role}
      </span>
      {isProfessor && (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {/* Inline color picker */}
          <div style={{ display: "flex", gap: 2 }}>
            {TEAM_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onColorChange?.(member.user.id, c.value)}
                title={c.label}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: teamColorVar(c.value),
                  border: member.color === c.value ? "2px solid var(--text-primary)" : "1px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
          {member.role !== "professor" && (
            <button
              onClick={() => onRemove?.(member.user.id)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 14,
                padding: 2,
                lineHeight: 1,
              }}
              title="Remove member"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
