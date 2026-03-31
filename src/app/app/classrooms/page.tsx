"use client";

import { useState, useEffect } from "react";
import { Plus, GraduationCap } from "lucide-react";
import ClassroomCard from "@/components/ClassroomCard";
import NewClassroomModal from "@/components/NewClassroomModal";

interface ClassroomData {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  status: string;
  inviteCode: string;
  _count: { members: number; assignments: number };
  professor: { name: string | null; username: string | null };
  myRole: string;
  myColor: string;
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((data) => setClassrooms(data.classrooms || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1000, margin: "0 auto", height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-display-family)" }}>
          Classrooms
        </h1>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            background: "var(--cta-bg-gradient)",
            color: "var(--cta-text)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-ui-family)",
          }}
        >
          <Plus size={16} /> New Classroom
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading...</div>
      ) : classrooms.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <GraduationCap size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No classrooms yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Create a classroom to start teaching, or join one with an invite code.
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
          {classrooms.map((c) => (
            <ClassroomCard key={c.id} classroom={c} myRole={c.myRole} />
          ))}
        </div>
      )}

      {showNew && <NewClassroomModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
