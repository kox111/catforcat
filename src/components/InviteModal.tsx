"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Send } from "lucide-react";
import UserPreviewCard from "./UserPreviewCard";

interface InviteModalProps {
  projectId?: string;
  classroomId?: string;
  onClose: () => void;
}

interface SearchUser {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  plan: string;
}

const ROLE_OPTIONS = [
  { value: "translator", label: "Translator" },
  { value: "reviewer", label: "Reviewer" },
  { value: "student", label: "Student" },
];

const COLOR_OPTIONS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD",
  "#7986CB", "#64B5F6", "#4FC3F7", "#4DB6AC",
  "#81C784", "#AED581", "#FFD54F", "#FFB74D",
];

export default function InviteModal({ projectId, classroomId, onClose }: InviteModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(classroomId ? "student" : "translator");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.users || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  const handleInvite = async () => {
    setSending(true);
    setError("");
    setSuccess("");

    const endpoint = projectId
      ? `/api/projects/${projectId}/members`
      : `/api/classrooms/${classroomId}/invite`;

    const body: Record<string, string> = { role, color };
    if (selectedUser) {
      body.userId = selectedUser.id;
    } else if (emailMode && email) {
      body.email = email;
    } else {
      setError("Select a user or enter an email");
      setSending(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to invite");
      } else {
        setSuccess("Invitation sent!");
        setSelectedUser(null);
        setQuery("");
        setEmail("");
      }
    } catch {
      setError("Failed to send invitation");
    } finally {
      setSending(false);
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
          maxWidth: 460,
          padding: 24,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)" }}>
            Invite Member
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Search or Email toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => { setEmailMode(false); setSelectedUser(null); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500,
              background: !emailMode ? "var(--accent-soft)" : "transparent",
              color: !emailMode ? "var(--accent)" : "var(--text-muted)",
              border: !emailMode ? "1px solid var(--accent)" : "1px solid var(--border)",
              cursor: "pointer", fontFamily: "var(--font-ui-family)",
            }}
          >
            Search by alias
          </button>
          <button
            onClick={() => { setEmailMode(true); setSelectedUser(null); setResults([]); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500,
              background: emailMode ? "var(--accent-soft)" : "transparent",
              color: emailMode ? "var(--accent)" : "var(--text-muted)",
              border: emailMode ? "1px solid var(--accent)" : "1px solid var(--border)",
              cursor: "pointer", fontFamily: "var(--font-ui-family)",
            }}
          >
            Invite by email
          </button>
        </div>

        {/* Search / Email input */}
        {!emailMode ? (
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by @username (min 3 chars)"
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="user@email.com"
              style={inputStyle}
            />
          </div>
        )}

        {/* Search results */}
        {!emailMode && results.length > 0 && !selectedUser && (
          <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 12, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            {results.map((u) => (
              <UserPreviewCard key={u.id} user={u} compact onClick={() => { setSelectedUser(u); setResults([]); }} />
            ))}
          </div>
        )}

        {/* Selected user */}
        {selectedUser && (
          <div style={{ marginBottom: 12 }}>
            <UserPreviewCard user={selectedUser} />
          </div>
        )}

        {searching && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Searching...</p>
        )}

        {/* Role + Color */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Color</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 160 }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 20, height: 20, borderRadius: "50%", background: c,
                    border: color === c ? "2px solid var(--text-primary)" : "2px solid transparent",
                    cursor: "pointer", padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 8 }}>{error}</p>}
        {success && <p style={{ fontSize: 13, color: "var(--green)", marginBottom: 8 }}>{success}</p>}

        {/* Send button */}
        <button
          onClick={handleInvite}
          disabled={sending || (!selectedUser && !emailMode) || (emailMode && !email)}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 9999, fontSize: 14, fontWeight: 600,
            background: "var(--cta-bg-gradient)", color: "var(--cta-text)", border: "none",
            cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1,
            fontFamily: "var(--font-ui-family)", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
          }}
        >
          <Send size={14} />
          {sending ? "Sending..." : "Send Invitation"}
        </button>
      </div>
    </div>
  );
}
