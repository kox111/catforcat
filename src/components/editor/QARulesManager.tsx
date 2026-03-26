"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus } from "lucide-react";

interface QARule {
  id: string;
  type: "wordlist" | "regex";
  wrong: string;
  correct: string;
  severity: "warning" | "error";
  enabled: boolean;
}

interface QARulesManagerProps {
  projectId: string;
  onClose: () => void;
}

export default function QARulesManager({
  projectId,
  onClose,
}: QARulesManagerProps) {
  const [rules, setRules] = useState<QARule[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"wordlist" | "regex">("wordlist");

  // New rule form
  const [newWrong, setNewWrong] = useState("");
  const [newCorrect, setNewCorrect] = useState("");
  const [newSeverity, setNewSeverity] = useState<"warning" | "error">(
    "warning",
  );

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/qa-rules`);
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error("Failed to fetch QA rules:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = async () => {
    if (!newWrong.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/qa-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab,
          wrong: newWrong.trim(),
          correct: newCorrect.trim(),
          severity: newSeverity,
        }),
      });
      if (res.ok) {
        const rule = await res.json();
        setRules((prev) => [...prev, rule]);
        setNewWrong("");
        setNewCorrect("");
        setNewSeverity("warning");
      }
    } catch (err) {
      console.error("Failed to add rule:", err);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/qa-rules/${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const filteredRules = rules.filter((r) => r.type === tab);

  const inputStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    outline: "none",
    fontFamily: tab === "regex" ? "'JetBrains Mono', monospace" : "inherit",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        background: "var(--overlay)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "80vh",
          borderRadius: "var(--radius)",
          padding: 24,
          overflow: "auto",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            QA Rules
          </h2>
          <button
            onClick={onClose}
            style={{
              fontSize: 16,
              padding: "2px 8px",
              borderRadius: 4,
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["wordlist", "regex"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                background: tab === t ? "var(--accent-soft)" : "var(--bg-card)",
                color:
                  tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                border:
                  tab === t
                    ? "0.5px solid var(--accent)"
                    : "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 150ms",
              }}
            >
              {t === "wordlist" ? "Word List" : "Regex Patterns"}
            </button>
          ))}
        </div>

        {tab === "regex" && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 12,
              padding: "6px 10px",
              borderRadius: 6,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            Use standard JavaScript regex syntax. Pattern is tested against
            target text.
          </div>
        )}

        {/* Rules table */}
        {loading ? (
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              padding: 16,
              textAlign: "center",
            }}
          >
            Loading rules...
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {filteredRules.length === 0 ? (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                No {tab === "wordlist" ? "word list" : "regex"} rules yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Header row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 80px 36px",
                    gap: 8,
                    padding: "4px 8px",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  <span>{tab === "wordlist" ? "Wrong" : "Pattern"}</span>
                  <span>{tab === "wordlist" ? "Correct" : "Description"}</span>
                  <span>Severity</span>
                  <span />
                </div>

                {filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 80px 36px",
                      gap: 8,
                      padding: "8px",
                      borderRadius: 6,
                      background: "var(--bg-card)",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-primary)",
                        fontFamily:
                          tab === "regex"
                            ? "'JetBrains Mono', monospace"
                            : "inherit",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rule.wrong}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rule.correct}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "2px 6px",
                        borderRadius: 4,
                        textAlign: "center",
                        background:
                          rule.severity === "error"
                            ? "var(--red-soft)"
                            : "var(--amber-soft)",
                        color:
                          rule.severity === "error"
                            ? "var(--red)"
                            : "var(--amber)",
                      }}
                    >
                      {rule.severity}
                    </span>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 4,
                        borderRadius: 4,
                        color: "var(--text-muted)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "color 150ms",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--red)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-muted)")
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add new rule form */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 80px auto",
            gap: 8,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              {tab === "wordlist" ? "Wrong term" : "Regex pattern"}
            </label>
            <input
              value={newWrong}
              onChange={(e) => setNewWrong(e.target.value)}
              placeholder={
                tab === "wordlist" ? "e.g., teh" : "e.g., \\d{3}-\\d{4}"
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              {tab === "wordlist" ? "Correct term" : "Description"}
            </label>
            <input
              value={newCorrect}
              onChange={(e) => setNewCorrect(e.target.value)}
              placeholder={
                tab === "wordlist" ? "e.g., the" : "e.g., Phone number format"
              }
              style={{ ...inputStyle, fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Severity
            </label>
            <select
              value={newSeverity}
              onChange={(e) =>
                setNewSeverity(e.target.value as "warning" | "error")
              }
              style={{ ...inputStyle, width: "100%", fontFamily: "inherit" }}
            >
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <button
            onClick={addRule}
            disabled={!newWrong.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--accent-soft)",
              color: "var(--text-primary)",
              border: "0.5px solid var(--border)",
              backdropFilter: "blur(4px)",
              fontSize: 12,
              fontWeight: 500,
              cursor: newWrong.trim() ? "pointer" : "default",
              opacity: newWrong.trim() ? 1 : 0.5,
              fontFamily: "inherit",
              transition: "background 150ms",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
