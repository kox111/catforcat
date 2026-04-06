"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, FolderOpen, UserPlus } from "lucide-react";
import MemberCard from "@/components/MemberCard";

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string | null; username: string | null; avatarUrl: string | null; plan: string };
  members: Array<{
    id: string;
    role: string;
    color: string;
    user: { id: string; name: string | null; username: string | null; avatarUrl: string | null; plan: string };
  }>;
  projects: Array<{
    id: string;
    name: string;
    srcLang: string;
    tgtLang: string;
    status: string;
    createdAt: string;
  }>;
  _count: { projects: number };
}

export default function TeamDashboard() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"members" | "projects">("members");

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) { router.push("/app/teams"); return; }
      const data = await res.json();
      setTeam(data.team);
      setMyRole(data.myRole);
    } catch {
      router.push("/app/teams");
    } finally {
      setLoading(false);
    }
  }, [teamId, router]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleColorChange = async (userId: string, color: string) => {
    await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    fetchTeam();
  };

  const handleRemove = async (userId: string) => {
    await fetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
    fetchTeam();
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!team) return null;

  const isOwner = team.owner.id === team.ownerId;
  const isPm = myRole === "pm";

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto", height: "100%", overflow: "auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-display-family)", marginBottom: 4 }}>
          {team.name}
        </h1>
        {team.description && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {team.description}
          </p>
        )}
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          Owner: {team.owner.name || team.owner.username || "Unknown"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        {(["members", "projects"] as const).map((t) => (
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
            {t === "members" ? <Users size={14} /> : <FolderOpen size={14} />}
            {t === "members" ? `Members (${team.members.length})` : `Projects (${team._count.projects})`}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div>
          {isPm && (
            <button
              onClick={() => {
                const username = prompt("Enter the username to invite:");
                if (!username) return;
                const role = prompt("Enter role (pm, translator, reviewer, proofreader, terminologist, dtp):");
                if (!role) return;
                const color = prompt("Enter color (rojo, rosa, morado, azul, celeste, teal, verde, amarillo):");
                if (!color) return;
                fetch(`/api/teams/${teamId}/members`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username, role, color }),
                })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.error) alert(data.error);
                    else fetchTeam();
                  });
              }}
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
            {team.members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isProfessor={isPm}
                onColorChange={handleColorChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {tab === "projects" && (
        <div>
          {team.projects.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
              No projects linked to this team yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {team.projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/app/projects/${p.id}`)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-card)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 150ms, box-shadow 150ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-focus)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
                >
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>{p.name}</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {p.srcLang.toUpperCase()} → {p.tgtLang.toUpperCase()}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: p.status === "active" ? "var(--green-soft)" : "var(--amber-soft)",
                      color: p.status === "active" ? "var(--green-text)" : "var(--amber-text)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
