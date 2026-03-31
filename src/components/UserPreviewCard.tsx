"use client";

interface UserPreviewCardProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    plan: string;
  };
  color?: string;
  compact?: boolean;
  onClick?: () => void;
}

export default function UserPreviewCard({
  user,
  color,
  compact = false,
  onClick,
}: UserPreviewCardProps) {
  const isPro = user.plan === "pro";
  const initials = (user.name || user.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 8 : 12,
        padding: compact ? "6px 8px" : "10px 12px",
        borderRadius: "var(--radius-sm)",
        background: onClick ? "transparent" : "var(--bg-card)",
        border: onClick ? "none" : "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 150ms",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Avatar with optional PRO gradient ring */}
      <div
        style={{
          position: "relative",
          width: compact ? 28 : 36,
          height: compact ? 28 : 36,
          borderRadius: "50%",
          background: isPro
            ? "linear-gradient(135deg, var(--pro-gradient-start), var(--pro-gradient-end))"
            : color || "var(--border)",
          padding: isPro ? 2 : 1.5,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "var(--bg-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: compact ? 11 : 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-ui-family)",
              }}
            >
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: compact ? 13 : 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name || user.username}
          </span>
          {isPro && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 4,
                background: "var(--cta-bg-gradient)",
                color: "var(--cta-text)",
                letterSpacing: "0.05em",
                lineHeight: "16px",
              }}
            >
              PRO
            </span>
          )}
        </div>
        {user.username && (
          <span
            style={{
              fontSize: compact ? 11 : 12,
              color: "var(--text-muted)",
            }}
          >
            @{user.username}
          </span>
        )}
      </div>
    </div>
  );
}
