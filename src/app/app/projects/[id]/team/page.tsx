"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Users } from "lucide-react";
import TeamProgressDashboard from "@/components/TeamProgressDashboard";
import SegmentAssigner from "@/components/SegmentAssigner";

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

interface Assignment {
  id: string;
  userId: string;
  rangeStart: number | null;
  rangeEnd: number | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [tab, setTab] = useState<"progress" | "assignments">("progress");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [progressData, setProgressData] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [totalSegments, setTotalSegments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/team-progress`);
      if (res.ok) {
        const data = await res.json();
        setProgressData(data);
        setTotalSegments(data.overallProgress?.total ?? 0);
      }
    } catch {
      // silent
    }
  }, [projectId]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch {
      // silent
    }
  }, [projectId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // silent
    }
  }, [projectId]);

  const fetchProjectInfo = useCallback(async () => {
    try {
      // Use segments count from team-progress to avoid fetching all segments
      const res = await fetch(`/api/projects/${projectId}/team-progress`);
      if (!res.ok) {
        router.push("/app/projects");
        return;
      }
      const data = await res.json();
      setProgressData(data);
      setTotalSegments(data.overallProgress?.total ?? 0);
    } catch {
      router.push("/app/projects");
    }
  }, [projectId, router]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProjectInfo(), fetchAssignments(), fetchMembers()]);
      setLoading(false);
    };
    init();
  }, [fetchProjectInfo, fetchAssignments, fetchMembers]);

  // Poll progress every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProgress();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  const handleRefresh = () => {
    fetchAssignments();
    fetchProgress();
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto", height: "100%", overflow: "auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push(`/app/projects/${projectId}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 0,
            fontSize: 12,
            fontFamily: "var(--font-ui-family)",
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={14} />
          Back to Editor
        </button>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display-family)",
            marginBottom: 4,
          }}
        >
          {projectName || "Team Dashboard"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {totalSegments} segments · {members.length} members · {assignments.length} assignments
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        {(
          [
            { key: "progress" as const, label: "Progress", icon: <BarChart3 size={14} /> },
            { key: "assignments" as const, label: "Assignments", icon: <Users size={14} /> },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Progress Tab */}
      {tab === "progress" && progressData && (
        <TeamProgressDashboard data={progressData} />
      )}

      {/* Assignments Tab */}
      {tab === "assignments" && (
        <SegmentAssigner
          projectId={projectId}
          members={members}
          totalSegments={totalSegments}
          assignments={assignments}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
