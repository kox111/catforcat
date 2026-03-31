export default function EditorLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-deep)",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Loading project...
      </span>
    </div>
  );
}
