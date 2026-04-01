"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FolderOpen, Pencil, Copy, Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectContextMenuProps {
  projectId: string;
  projectName: string;
  x: number;
  y: number;
  onClose: () => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export default function ProjectContextMenu({
  projectId,
  projectName,
  x,
  y,
  onClose,
  onRename,
  onDelete,
}: ProjectContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(projectName);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 1000,
    minWidth: 180,
    padding: "6px 0",
    borderRadius: "var(--radius-sm)",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-float)",
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 14px",
    fontSize: 13,
    color: "var(--text-primary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-ui-family)",
    textAlign: "left",
  };

  const handleOpen = () => {
    router.push(`/app/projects/${projectId}`);
    onClose();
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        onRename?.(projectId, newName.trim());
      }
    } catch {
      // silent
    }
    onClose();
  };

  const handleDuplicate = async () => {
    try {
      await fetch(`/api/projects/${projectId}/duplicate`, { method: "POST" });
    } catch {
      // silent
    }
    onClose();
    router.refresh();
  };

  const handleExport = () => {
    router.push(`/app/projects/${projectId}?export=true`);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      onDelete?.(projectId);
    } catch {
      // silent
    }
    onClose();
  };

  // Portal to document.body to escape ViewScaleContainer CSS transform
  // which breaks position:fixed coordinates
  const menu = (
    <div ref={ref} style={menuStyle}>
      {renaming ? (
        <div style={{ padding: "8px 14px" }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") onClose();
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: 13,
              borderRadius: 4,
              border: "1px solid var(--border-focus)",
              background: "var(--bg-deep)",
              color: "var(--text-primary)",
              outline: "none",
              fontFamily: "var(--font-ui-family)",
            }}
          />
        </div>
      ) : (
        <>
          <button style={itemStyle} onClick={handleOpen}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <FolderOpen size={14} /> Open
          </button>
          <button style={itemStyle} onClick={() => setRenaming(true)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <Pencil size={14} /> Rename
          </button>
          <button style={itemStyle} onClick={handleDuplicate}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <Copy size={14} /> Duplicate
          </button>
          <button style={itemStyle} onClick={handleExport}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <Download size={14} /> Export
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <button
            style={{ ...itemStyle, color: confirmDelete ? "var(--red)" : "var(--text-primary)" }}
            onClick={handleDelete}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <Trash2 size={14} /> {confirmDelete ? "Confirm delete?" : "Delete"}
          </button>
        </>
      )}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(menu, document.body);
  }
  return menu;
}
