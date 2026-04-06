"use client";

interface StageBreakdown {
  translating: number;
  reviewing: number;
  proofreading: number;
  completed: number;
  awaiting_approval: number;
}

interface MemberProgress {
  userId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  color: string;
  role: string;
  rangeStart: number | null;
  rangeEnd: number | null;
  completedCount: number;
  confirmedCount: number;
  totalInRange: number;
  percentDone: number;
}

interface OnlineMember {
  userId: string;
  currentSegmentPosition: number | null;
}

interface TeamProgressData {
  overallProgress: {
    total: number;
    byStage: StageBreakdown;
    needsRecheck: number;
  };
  memberProgress: MemberProgress[];
  onlineMembers: OnlineMember[];
  pendingCheckpoints: number;
  pendingReviews: number;
}

interface TeamProgressDashboardProps {
  data: TeamProgressData;
}

const STAGE_COLORS: Record<string, string> = {
  translating: "var(--blue, #3b82f6)",
  reviewing: "var(--amber, #f59e0b)",
  proofreading: "var(--purple, #a855f7)",
  completed: "var(--green, #22c55e)",
  awaiting_approval: "var(--red, #ef4444)",
};

const STAGE_LABELS: Record<string, string> = {
  translating: "Translating",
  reviewing: "Reviewing",
  proofreading: "Proofreading",
  completed: "Completed",
  awaiting_approval: "Awaiting Approval",
};

function timeSince(lastActive: string | null): string {
  if (!lastActive) return "---";
  const diff = Date.now() - new Date(lastActive).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TeamProgressDashboard({ data }: TeamProgressDashboardProps) {
  const { overallProgress, memberProgress, onlineMembers, pendingCheckpoints, pendingReviews } = data;
  const onlineIds = new Set(onlineMembers.map((m) => m.userId));
  const total = overallProgress.total;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Overall Progress */}
      <div
        style={{
          padding: 20,
          borderRadius: "var(--radius)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 12,
            fontFamily: "var(--font-ui-family)",
          }}
        >
          Overall Progress
        </h3>

        {/* Segmented bar */}
        <div
          style={{
            display: "flex",
            height: 24,
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "var(--bg-deep)",
            border: "1px solid var(--border)",
          }}
        >
          {total > 0 &&
            (Object.keys(STAGE_COLORS) as Array<keyof StageBreakdown>).map((stage) => {
              const count = overallProgress.byStage[stage];
              if (count === 0) return null;
              const pct = (count / total) * 100;
              return (
                <div
                  key={stage}
                  title={`${STAGE_LABELS[stage]}: ${count} (${Math.round(pct)}%)`}
                  style={{
                    width: `${pct}%`,
                    background: STAGE_COLORS[stage],
                    minWidth: count > 0 ? 4 : 0,
                    transition: "width 300ms",
                  }}
                />
              );
            })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
          {(Object.keys(STAGE_COLORS) as Array<keyof StageBreakdown>).map((stage) => {
            const count = overallProgress.byStage[stage];
            return (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: STAGE_COLORS[stage],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {STAGE_LABELS[stage]}: {count}
                </span>
              </div>
            );
          })}
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
            Total: {total}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {(pendingCheckpoints > 0 || overallProgress.needsRecheck > 0 || pendingReviews > 0) && (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {pendingCheckpoints > 0 && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--amber-soft, rgba(245, 158, 11, 0.1))",
                border: "1px solid var(--amber, #f59e0b)",
                fontSize: 12,
                color: "var(--amber-text, var(--amber, #f59e0b))",
                fontWeight: 500,
              }}
            >
              {pendingCheckpoints} pending checkpoint{pendingCheckpoints !== 1 ? "s" : ""}
            </div>
          )}
          {overallProgress.needsRecheck > 0 && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--red-soft, rgba(239, 68, 68, 0.1))",
                border: "1px solid var(--red, #ef4444)",
                fontSize: 12,
                color: "var(--red-text, var(--red, #ef4444))",
                fontWeight: 500,
              }}
            >
              {overallProgress.needsRecheck} need{overallProgress.needsRecheck !== 1 ? "" : "s"} recheck
            </div>
          )}
          {pendingReviews > 0 && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--purple-soft, rgba(168, 85, 247, 0.1))",
                border: "1px solid var(--purple, #a855f7)",
                fontSize: 12,
                color: "var(--purple-text, var(--purple, #a855f7))",
                fontWeight: 500,
              }}
            >
              {pendingReviews} pending review{pendingReviews !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      {/* Per-member rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 4,
            fontFamily: "var(--font-ui-family)",
          }}
        >
          Team Members
        </h3>
        {memberProgress.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
            No assignments yet
          </p>
        )}
        {memberProgress.map((member) => {
          const isOnline = onlineIds.has(member.userId);
          const rangeLabel =
            member.rangeStart != null && member.rangeEnd != null
              ? `${member.rangeStart}-${member.rangeEnd}`
              : "All";

          return (
            <div
              key={member.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${member.color}`,
              }}
            >
              {/* Online indicator */}
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isOnline ? "var(--green, #22c55e)" : "var(--text-muted)",
                  opacity: isOnline ? 1 : 0.3,
                  flexShrink: 0,
                }}
                title={isOnline ? "Online" : "Offline"}
              />

              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: member.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--bg-card)",
                      flexShrink: 0,
                    }}
                  >
                    {(member.name || member.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.name || member.username || "Unknown"}
                </span>
              </div>

              {/* Color swatch */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: member.color,
                  flexShrink: 0,
                }}
              />

              {/* Role badge */}
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
                  flexShrink: 0,
                }}
              >
                {member.role}
              </span>

              {/* Range badge */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--bg-deep)",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-editor-family)",
                  flexShrink: 0,
                }}
              >
                {rangeLabel}
              </span>

              {/* Progress bar */}
              <div style={{ flex: 1, minWidth: 80 }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${member.percentDone}%`,
                      background:
                        member.percentDone === 100
                          ? "var(--green, #22c55e)"
                          : "var(--accent)",
                      borderRadius: 3,
                      transition: "width 500ms",
                    }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    member.percentDone === 100
                      ? "var(--green, #22c55e)"
                      : "var(--text-primary)",
                  minWidth: 36,
                  textAlign: "right",
                  fontFamily: "var(--font-editor-family)",
                }}
              >
                {member.percentDone}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
