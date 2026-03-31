"use client";

import UserPreviewCard from "./UserPreviewCard";

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

const COLOR_OPTIONS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD",
  "#7986CB", "#64B5F6", "#4FC3F7", "#4DB6AC",
  "#81C784", "#AED581", "#FFD54F", "#FFB74D",
];

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
        borderLeft: `3px solid ${member.color}`,
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
            {COLOR_OPTIONS.slice(0, 6).map((c) => (
              <button
                key={c}
                onClick={() => onColorChange?.(member.user.id, c)}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: c,
                  border: member.color === c ? "2px solid var(--text-primary)" : "1px solid transparent",
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
