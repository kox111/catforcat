"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewTeamModalProps {
  onClose: () => void;
}

export default function NewTeamModal({ onClose }: NewTeamModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create team");
        return;
      }
      const data = await res.json();
      onClose();
      router.push(`/app/teams/${data.team.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    outline: "none",
    background: "var(--bg-deep)",
    border: "1.5px solid var(--border)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-ui-family)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 24,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-float)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>New Team</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, fontSize: 13, background: "var(--red-soft)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Team Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Legal Translation Team"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--text-muted)" }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Team description..."
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 600,
              background: "var(--cta-bg-gradient)",
              color: "var(--cta-text)",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "var(--font-ui-family)",
            }}
          >
            {loading ? "Creating..." : "Create Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
