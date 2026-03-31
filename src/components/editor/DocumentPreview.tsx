"use client";

import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface Segment {
  id: string;
  position: number;
  sourceText: string;
  targetText: string;
  status: string;
}

interface DocumentPreviewProps {
  projectName: string;
  srcLang: string;
  tgtLang: string;
  segments: Segment[];
  onClose: () => void;
}

export default function DocumentPreview({
  projectName,
  srcLang,
  tgtLang,
  segments,
  onClose,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [showSource, setShowSource] = useState(false);

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
          width: "90vw",
          maxWidth: 800,
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Document Preview
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {projectName} · {srcLang.toUpperCase()} → {tgtLang.toUpperCase()}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Source toggle */}
            <button
              onClick={() => setShowSource(!showSource)}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: 11,
                fontWeight: 500,
                background: showSource ? "var(--accent-soft)" : "var(--btn-secondary-bg)",
                color: showSource ? "var(--accent)" : "var(--text-muted)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "var(--font-ui-family)",
              }}
            >
              {showSource ? "Target only" : "Show source"}
            </button>
            {/* Zoom */}
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 36, textAlign: "center" }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, marginLeft: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document body */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px 48px",
            background: "var(--bg-paper, var(--bg-deep))",
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              fontSize: `${14 * (zoom / 100)}px`,
              lineHeight: 1.7,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui-family)",
            }}
          >
            {segments.map((seg) => {
              const text = seg.targetText || (showSource ? seg.sourceText : "");
              if (!text) return null;

              return (
                <p
                  key={seg.id}
                  style={{
                    marginBottom: `${12 * (zoom / 100)}px`,
                    opacity: seg.status === "empty" ? 0.4 : 1,
                  }}
                >
                  {showSource && seg.targetText && (
                    <span
                      style={{
                        display: "block",
                        fontSize: `${12 * (zoom / 100)}px`,
                        color: "var(--text-muted)",
                        marginBottom: 2,
                        fontStyle: "italic",
                      }}
                    >
                      {seg.sourceText}
                    </span>
                  )}
                  {text}
                </p>
              );
            })}
          </div>
        </div>

        {/* Footer stats */}
        <div
          style={{
            padding: "8px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 16,
            fontSize: 11,
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          <span>{segments.length} segments</span>
          <span>{segments.filter((s) => s.status === "confirmed").length} confirmed</span>
          <span>
            {segments.reduce((acc, s) => acc + (s.targetText || s.sourceText || "").split(/\s+/).length, 0)} words
          </span>
        </div>
      </div>
    </div>
  );
}
