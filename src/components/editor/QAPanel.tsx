"use client";

import { type QAIssue, groupIssuesBySeverity, exportQAReportCSV } from "@/lib/qa-checks";

interface QAPanelProps {
  issues: QAIssue[];
  onNavigateToSegment: (segmentId: string) => void;
  onClose: () => void;
}

const SEVERITY_CONFIG = {
  error: { color: "var(--red, #ef4444)", icon: "✕", label: "Errors" },
  warning: { color: "var(--amber)", icon: "⚠", label: "Warnings" },
  info: { color: "var(--accent)", icon: "ℹ", label: "Info" },
};

export default function QAPanel({
  issues,
  onNavigateToSegment,
  onClose,
}: QAPanelProps) {
  const grouped = groupIssuesBySeverity(issues);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-panel)",
        maxHeight: "300px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            QA Results
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </span>
          {/* Summary badges */}
          {grouped.errors.length > 0 && (
            <span
              style={{
                fontSize: "0.75rem",
                paddingLeft: "0.375rem",
                paddingRight: "0.375rem",
                paddingTop: "0.125rem",
                paddingBottom: "0.125rem",
                borderRadius: "0.25rem",
                fontWeight: 500,
                background: SEVERITY_CONFIG.error.color,
                color: "#fff",
              }}
            >
              {grouped.errors.length} error{grouped.errors.length > 1 ? "s" : ""}
            </span>
          )}
          {grouped.warnings.length > 0 && (
            <span
              style={{
                fontSize: "0.75rem",
                paddingLeft: "0.375rem",
                paddingRight: "0.375rem",
                paddingTop: "0.125rem",
                paddingBottom: "0.125rem",
                borderRadius: "0.25rem",
                fontWeight: 500,
                background: SEVERITY_CONFIG.warning.color,
                color: "#000",
              }}
            >
              {grouped.warnings.length} warning{grouped.warnings.length > 1 ? "s" : ""}
            </span>
          )}
          {grouped.infos.length > 0 && (
            <span
              style={{
                fontSize: "0.75rem",
                paddingLeft: "0.375rem",
                paddingRight: "0.375rem",
                paddingTop: "0.125rem",
                paddingBottom: "0.125rem",
                borderRadius: "0.25rem",
                fontWeight: 500,
                background: SEVERITY_CONFIG.info.color,
                color: "#fff",
              }}
            >
              {grouped.infos.length} info
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {issues.length > 0 && (
            <button
              onClick={() => {
                const csv = exportQAReportCSV(issues);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "qa-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontSize: "0.75rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
                borderRadius: "0.25rem",
                color: "var(--accent)",
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Export CSV
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              fontSize: "0.75rem",
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              paddingTop: "0.25rem",
              paddingBottom: "0.25rem",
              borderRadius: "0.25rem",
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div style={{ overflowY: "auto", flex: 1, paddingLeft: "0.5rem", paddingRight: "0.5rem", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
        {issues.length === 0 ? (
          <div
            style={{
              fontSize: "0.75rem",
              paddingTop: "1rem",
              paddingBottom: "1rem",
              textAlign: "center",
              color: "var(--green)",
            }}
          >
            ✓ No issues found. All segments look good!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
            {/* Render errors first, then warnings, then info */}
            {[...grouped.errors, ...grouped.warnings, ...grouped.infos].map(
              (issue, idx) => {
                const config = SEVERITY_CONFIG[issue.severity];
                return (
                  <button
                    key={`${issue.segmentId}-${issue.check}-${idx}`}
                    onClick={() => onNavigateToSegment(issue.segmentId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      paddingLeft: "0.75rem",
                      paddingRight: "0.75rem",
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      transition: "background-color 0.2s",
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-card)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        marginTop: "0.125rem",
                        color: config.color,
                      }}
                    >
                      {config.icon}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "var(--text-muted)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        #{issue.segmentPosition}
                      </span>{" "}
                      {issue.message}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
