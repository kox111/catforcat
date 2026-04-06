"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

interface AssignmentMember {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface Assignment {
  id: string;
  userId: string;
  rangeStart: number | null;
  rangeEnd: number | null;
  user: AssignmentMember;
}

interface ProjectMember {
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
}

interface SegmentAssignerProps {
  projectId: string;
  members: ProjectMember[];
  totalSegments: number;
  assignments: Assignment[];
  onRefresh: () => void;
}

export default function SegmentAssigner({
  projectId,
  members,
  totalSegments,
  assignments,
  onRefresh,
}: SegmentAssignerProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map userId to member color
  const colorMap = new Map<string, string>();
  for (const m of members) {
    colorMap.set(m.user.id, m.color);
  }

  // Members without an existing assignment
  const assignedUserIds = new Set(assignments.map((a) => a.userId));
  const availableMembers = members.filter((m) => !assignedUserIds.has(m.user.id));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setSubmitting(true);
    setError(null);

    const body: { userId: string; rangeStart?: number | null; rangeEnd?: number | null } = {
      userId: selectedUserId,
    };

    const start = rangeStart.trim() ? parseInt(rangeStart, 10) : null;
    const end = rangeEnd.trim() ? parseInt(rangeEnd, 10) : null;

    if (start != null && !isNaN(start)) body.rangeStart = start;
    if (end != null && !isNaN(end)) body.rangeEnd = end;

    try {
      const res = await fetch(`/api/projects/${projectId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create assignment");
        setSubmitting(false);
        return;
      }
      setSelectedUserId("");
      setRangeStart("");
      setRangeEnd("");
      onRefresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (res.ok) onRefresh();
    } catch {
      // silent
    }
  };

  // Build visual bar segments
  const sortedAssignments = [...assignments]
    .filter((a) => a.rangeStart != null && a.rangeEnd != null)
    .sort((a, b) => a.rangeStart! - b.rangeStart!);

  const barSegments: Array<{
    start: number;
    end: number;
    color: string;
    label: string;
    assigned: boolean;
  }> = [];

  if (totalSegments > 0) {
    let cursor = 1;
    for (const a of sortedAssignments) {
      const aStart = a.rangeStart!;
      const aEnd = a.rangeEnd!;
      // Gap before this assignment
      if (aStart > cursor) {
        barSegments.push({
          start: cursor,
          end: aStart - 1,
          color: "var(--bg-deep)",
          label: "Unassigned",
          assigned: false,
        });
      }
      const memberName = a.user.name || a.user.username || "Unknown";
      barSegments.push({
        start: aStart,
        end: aEnd,
        color: colorMap.get(a.userId) || "var(--text-muted)",
        label: memberName,
        assigned: true,
      });
      cursor = aEnd + 1;
    }
    // Trailing gap
    if (cursor <= totalSegments) {
      barSegments.push({
        start: cursor,
        end: totalSegments,
        color: "var(--bg-deep)",
        label: "Unassigned",
        assigned: false,
      });
    }
  }

  // If no ranged assignments, show a single unassigned bar
  if (sortedAssignments.length === 0 && totalSegments > 0) {
    barSegments.length = 0;
    barSegments.push({
      start: 1,
      end: totalSegments,
      color: "var(--bg-deep)",
      label: "Unassigned",
      assigned: false,
    });
  }

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg-deep)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: "var(--font-ui-family)",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Visual bar */}
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
          Segment Map ({totalSegments} segments)
        </h3>

        <div
          style={{
            display: "flex",
            height: 32,
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          {barSegments.map((seg, i) => {
            const width = ((seg.end - seg.start + 1) / totalSegments) * 100;
            return (
              <div
                key={i}
                title={`${seg.label}: ${seg.start}-${seg.end}`}
                style={{
                  width: `${width}%`,
                  background: seg.assigned ? seg.color : "var(--bg-deep)",
                  opacity: seg.assigned ? 0.8 : 0.4,
                  minWidth: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRight:
                    i < barSegments.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  transition: "width 300ms",
                }}
              >
                {width > 8 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: seg.assigned ? "var(--bg-card)" : "var(--text-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      padding: "0 4px",
                    }}
                  >
                    {seg.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current assignments list */}
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
          Assignments ({assignments.length})
        </h3>

        {assignments.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16 }}>
            No assignments yet. Add one below.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {assignments.map((a) => {
            const color = colorMap.get(a.userId) || "var(--text-muted)";
            const name = a.user.name || a.user.username || "Unknown";
            const range =
              a.rangeStart != null && a.rangeEnd != null
                ? `${a.rangeStart}-${a.rangeEnd}`
                : "All segments";

            return (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-deep)",
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    flex: 1,
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-editor-family)",
                  }}
                >
                  {range}
                </span>
                <button
                  onClick={() => handleDelete(a.id)}
                  title="Remove assignment"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add assignment form */}
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
          Add Assignment
        </h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Member select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                ...inputStyle,
                minWidth: 180,
                cursor: "pointer",
              }}
            >
              <option value="">Select member...</option>
              {availableMembers.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name || m.user.username || m.user.id} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Range Start */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Start
            </label>
            <input
              type="number"
              min={1}
              max={totalSegments}
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              placeholder="1"
              style={{ ...inputStyle, width: 80 }}
            />
          </div>

          {/* Range End */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              End
            </label>
            <input
              type="number"
              min={1}
              max={totalSegments}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              placeholder={String(totalSegments)}
              style={{ ...inputStyle, width: 80 }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleAdd}
            disabled={!selectedUserId || submitting}
            style={{
              padding: "6px 18px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 500,
              background: selectedUserId ? "var(--accent)" : "var(--bg-deep)",
              color: selectedUserId ? "var(--bg-card)" : "var(--text-muted)",
              border: "1px solid var(--border)",
              cursor: selectedUserId ? "pointer" : "not-allowed",
              fontFamily: "var(--font-ui-family)",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>

        {error && (
          <p
            style={{
              fontSize: 12,
              color: "var(--red)",
              marginTop: 8,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
