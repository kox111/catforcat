"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useViewScale } from "@/components/ViewScaleProvider";
import { SCALE_MODES, type ScaleMode } from "@/lib/view-scale";

const MODE_LIST: ScaleMode[] = ["compact", "default", "large"];
const STORAGE_KEY = "tp-zoom-fab-pos";
const FAB_SIZE = 44;

function clampPos(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const maxX = window.innerWidth - FAB_SIZE - 8;
  const maxY = window.innerHeight - FAB_SIZE - 8;
  return {
    x: Math.max(8, Math.min(x, maxX)),
    y: Math.max(8, Math.min(y, maxY)),
  };
}

function loadPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        return clampPos(parsed.x, parsed.y);
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function ZoomFAB() {
  const { mode, setMode } = useViewScale();
  const [open, setOpen] = useState(false);
  const [fabHover, setFabHover] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Position state: null = use default (bottom-right)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, fx: 0, fy: 0 });

  // Load saved position on mount
  useEffect(() => {
    const saved = loadPos();
    if (saved) {
      setPos(saved);
    } else {
      // Default position: bottom-right
      setPos(
        clampPos(
          window.innerWidth - FAB_SIZE - 32,
          window.innerHeight - FAB_SIZE - 56,
        ),
      );
    }
  }, []);

  // Clamp on resize
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        if (!prev) return prev;
        return clampPos(prev.x, prev.y);
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popup on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        fabRef.current &&
        !fabRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Drag handlers
  const onDragStart = useCallback(
    (clientX: number, clientY: number) => {
      draggingRef.current = true;
      didDragRef.current = false;
      const currentPos = pos ?? {
        x: window.innerWidth - FAB_SIZE - 32,
        y: window.innerHeight - FAB_SIZE - 56,
      };
      dragStartRef.current = {
        mx: clientX,
        my: clientY,
        fx: currentPos.x,
        fy: currentPos.y,
      };
    },
    [pos],
  );

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - dragStartRef.current.mx;
    const dy = clientY - dragStartRef.current.my;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didDragRef.current = true;
    }
    const newPos = clampPos(
      dragStartRef.current.fx + dx,
      dragStartRef.current.fy + dy,
    );
    setPos(newPos);
  }, []);

  const onDragEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // Save position
    setPos((current) => {
      if (current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch {
          /* ignore */
        }
      }
      return current;
    });
  }, []);

  // Mouse drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      e.preventDefault();
      onDragStart(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) =>
        onDragMove(ev.clientX, ev.clientY);
      const onMouseUp = () => {
        onDragEnd();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [onDragStart, onDragMove, onDragEnd],
  );

  // Touch drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      onDragStart(touch.clientX, touch.clientY);

      const onTouchMove = (ev: TouchEvent) => {
        if (ev.touches.length !== 1) return;
        ev.preventDefault();
        onDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
      };
      const onTouchEnd = () => {
        onDragEnd();
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    },
    [onDragStart, onDragMove, onDragEnd],
  );

  const handleFabClick = useCallback(() => {
    // If we dragged, don't toggle the menu
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setOpen((v) => !v);
  }, []);

  // Compute popup position: prefer above the FAB, fallback below
  const popupStyle: React.CSSProperties =
    pos && pos.y > 200
      ? { position: "absolute", bottom: FAB_SIZE + 8, right: 0 }
      : { position: "absolute", top: FAB_SIZE + 8, right: 0 };

  if (!pos) return null; // SSR / before hydration

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 50,
        touchAction: "none",
      }}
    >
      {open && (
        <div
          ref={popupRef}
          style={{
            ...popupStyle,
            background: "var(--bg-panel)",
            border: "0.5px solid var(--border)",
            backdropFilter: "blur(12px)",
            borderRadius: 10,
            padding: 6,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {MODE_LIST.map((key) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setMode(key);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "5px 14px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: "var(--font-ui-family)",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  background: isActive ? "var(--bg-hover)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {SCALE_MODES[key].label}
              </button>
            );
          })}
        </div>
      )}

      <button
        ref={fabRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleFabClick}
        onMouseEnter={() => setFabHover(true)}
        onMouseLeave={() => setFabHover(false)}
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: open ? "var(--accent-soft)" : "var(--bg-hover)",
          border: `0.5px solid ${fabHover ? "var(--accent)" : "var(--border)"}`,
          cursor: draggingRef.current ? "grabbing" : "grab",
          transition: draggingRef.current
            ? "none"
            : "background 150ms, border-color 150ms",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {open ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        )}
      </button>
    </div>
  );
}
