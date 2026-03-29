"use client";

import {
  type QAIssue,
  groupIssuesBySeverity,
  exportQAReportCSV,
} from "@/lib/qa-checks";

interface QAPanelProps {
  issues: QAIssue[];
  onNavigateToSegment: (segmentId: string) => void;
  onClose: () => void;
  translatedCount?: number;
}

const SEVERITY_CONFIG = {
  error: { color: "var(--red)", icon: "✕", label: "Errors" },
  warning: { color: "var(--amber)", icon: "⚠", label: "Warnings" },
  info: { color: "var(--accent)", icon: "ℹ", label: "Info" },
};

export default function QAPanel({
  issues,
  onNavigateToSegment,
  onClose,
  translatedCount = -1,
}: QAPanelProps) {
  const grouped = groupIssuesBySeverity(issues);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: "0.5px solid var(--border)",
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
          padding: "8px 16px",
          flexShrink: 0,
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            QA Results
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-ui-family)" }}>
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </span>
          {/* Summary badges */}
          {grouped.errors.length > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 5,
                fontWeight: 500,
                background: SEVERITY_CONFIG.error.color,
                color: "var(--bg-deep)",
                fontFamily: "var(--font-editor-family)",
              }}
            >
              {grouped.errors.length} error
              {grouped.errors.length > 1 ? "s" : ""}
            </span>
          )}
          {grouped.warnings.length > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 5,
                fontWeight: 500,
                background: SEVERITY_CONFIG.warning.color,
                color: "var(--text-primary)",
                fontFamily: "var(--font-editor-family)",
              }}
            >
              {grouped.warnings.length} warning
              {grouped.warnings.length > 1 ? "s" : ""}
            </span>
          )}
          {grouped.infos.length > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 5,
                fontWeight: 500,
                background: SEVERITY_CONFIG.info.color,
                color: "var(--text-primary)",
                fontFamily: "var(--font-editor-family)",
              }}
            >
              {grouped.infos.length} info
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {issues.length > 0 && (
            <button
              onClick={() => {
                const csv = exportQAReportCSV(issues);
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "qa-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 6,
                color: "var(--accent)",
                border: "0.5px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-ui-family)",
                transition: "background 150ms",
              }}
            >
              Export CSV
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 6,
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "4px 8px",
        }}
      >
        {issues.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              padding: "16px 0",
              textAlign: "center",
              fontFamily: "var(--font-ui-family)",
              color:
                translatedCount === 0 ? "var(--text-muted)" : "var(--green)",
            }}
          >
            {translatedCount === 0
              ? "No translations to check yet. Start translating to enable QA."
              : "✓ No issues found. All segments look good!"}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
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
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      transition: "background 150ms",
                      color: "var(--text-primary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-ui-family)",
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
                        marginTop: 2,
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
                          fontFamily: "var(--font-editor-family)",
                        }}
                      >
                        #{issue.segmentPosition}
                      </span>{" "}
                      {issue.message}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
