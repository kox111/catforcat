"use client";

interface GlossaryMismatch {
  sourceTerm: string;
  expectedTarget: string;
}

interface GlossaryWarningModalProps {
  mismatches: GlossaryMismatch[];
  onFix: () => void; // Go back to editing
  onConfirmAnyway: () => void; // Confirm despite mismatch
}

export default function GlossaryWarningModal({
  mismatches,
  onFix,
  onConfirmAnyway,
}: GlossaryWarningModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          borderRadius: "0.5rem",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--amber-soft)",
            color: "var(--amber-text)",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            ⚠ Glossary Mismatch
          </span>
        </div>

        <div
          style={{
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              marginBottom: "0.75rem",
              color: "var(--text-secondary)",
            }}
          >
            The following glossary terms were not found in your translation:
          </p>
          {mismatches.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
                paddingTop: "0.375rem",
                paddingBottom: "0.375rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                borderRadius: "0.25rem",
                marginBottom: "0.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{m.sourceTerm}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                →
              </span>
              <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                {m.expectedTarget}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onFix}
            style={{
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              background: "var(--accent-soft)",
              color: "var(--text-primary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Fix
          </button>
          <button
            onClick={onConfirmAnyway}
            style={{
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            Confirm anyway
          </button>
        </div>
      </div>
    </div>
  );
}
