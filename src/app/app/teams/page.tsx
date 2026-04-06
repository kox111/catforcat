"use client";

import { useState, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import TeamCard from "@/components/TeamCard";
import NewTeamModal from "@/components/NewTeamModal";

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number; projects: number };
  owner: { id: string; name: string | null; username: string | null };
  myRole: string;
  myColor: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => setTeams(data.teams || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1000, margin: "0 auto", height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-display-family)" }}>
          Teams
        </h1>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            fontWeight: 600,
            background: "var(--cta-bg-gradient)",
            color: "var(--cta-text)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-ui-family)",
          }}
        >
          <Plus size={16} /> New Team
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading...</div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Users size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No teams yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Create a team to collaborate on translation projects.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} myRole={t.myRole} />
          ))}
        </div>
      )}

      {showNew && <NewTeamModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
