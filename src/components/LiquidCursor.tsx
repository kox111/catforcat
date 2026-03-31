"use client";

import { useRef, useEffect, useState } from "react";

interface LiquidCursorProps {
  size?: number;
}

export default function LiquidCursor({ size = 36 }: LiquidCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const prevPos = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const angle = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    const handleClick = () => {
      const el = cursorRef.current;
      if (!el) return;
      el.style.transform = `translate(${pos.current.x - size / 2}px, ${pos.current.y - size / 2}px) scale(1.3)`;
      setTimeout(() => {
        if (el) el.style.transform = `translate(${pos.current.x - size / 2}px, ${pos.current.y - size / 2}px) scale(1)`;
      }, 150);
    };

    const animate = () => {
      const ease = 0.15;
      pos.current.x += (target.current.x - pos.current.x) * ease;
      pos.current.y += (target.current.y - pos.current.y) * ease;

      const dx = pos.current.x - prevPos.current.x;
      const dy = pos.current.y - prevPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Liquid deformation based on velocity
      const maxStretch = 0.25;
      const stretch = Math.min(distance / 40, maxStretch);
      const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Smooth angle
      let delta = newAngle - angle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      angle.current += delta * 0.15;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const total = absDx + absDy || 1;
      const xRatio = absDx / total;

      const scaleX = 1 + xRatio * stretch;
      const scaleY = 1 - xRatio * stretch * 0.3;

      const el = cursorRef.current;
      if (el) {
        el.style.left = "0px";
        el.style.top = "0px";
        el.style.transform = `translate(${pos.current.x - size / 2}px, ${pos.current.y - size / 2}px) rotate(${angle.current}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
      }

      prevPos.current = { x: pos.current.x, y: pos.current.y };
      animRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    window.addEventListener("mouseenter", handleEnter);
    window.addEventListener("click", handleClick);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("mouseenter", handleEnter);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animRef.current);
    };
  }, [size, visible]);

  // Don't show on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) return null;

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        zIndex: 9999,
        width: size,
        height: size,
        borderRadius: "50%",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
        willChange: "transform",
        background: `radial-gradient(circle,
          rgba(255, 255, 255, 0.30) 0%,
          rgba(255, 255, 255, 0.12) 50%,
          transparent 100%
        )`,
        border: "1px solid rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(6px) saturate(180%)",
        WebkitBackdropFilter: "blur(6px) saturate(180%)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 3px rgba(255, 255, 255, 0.25), 0 0 8px rgba(255, 255, 255, 0.06)",
      }}
    />
  );
}
