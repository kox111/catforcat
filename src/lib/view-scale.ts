/**
 * View Scale — Auto-zoom based on viewport width + optional manual factor.
 *
 * Auto-zoom: Math.max(1.0, viewport / 1707) on desktop (≥1025px), 1.0 on mobile/tablet.
 * Manual factor stored in localStorage multiplies the auto-zoom:
 *   - "compact"  → base × 0.8
 *   - "default"  → base × 1.0 (clears localStorage)
 *   - "large"    → base × 1.25
 */

export type ScaleMode = "compact" | "default" | "large";

export const SCALE_MODES: Record<
  ScaleMode,
  { label: string; factor: number | null; description: string }
> = {
  compact: {
    label: "Compact",
    factor: 0.8,
    description: "More content, smaller text",
  },
  default: {
    label: "Default",
    factor: null,
    description: "Auto-fit to your screen",
  },
  large: {
    label: "Large",
    factor: 1.25,
    description: "Larger text, easier on the eyes",
  },
};

/** Cycle order: Default → Compact → Large → Default */
export const MODE_ORDER: ScaleMode[] = ["compact", "default", "large"];

const FACTOR_KEY = "catforcat-view-scale-factor";

/** Get the stored manual factor (0.8 or 1.25), or null if auto. */
export function getStoredFactor(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(FACTOR_KEY);
  if (stored) {
    const n = parseFloat(stored);
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

/** Get the ScaleMode that matches the stored factor. */
export function getStoredMode(): ScaleMode {
  const f = getStoredFactor();
  if (f === null) return "default";
  if (f === 0.8) return "compact";
  if (f === 1.25) return "large";
  return "default";
}

/** Store a manual factor, or clear it for "default" (auto). */
export function setStoredMode(mode: ScaleMode): void {
  const cfg = SCALE_MODES[mode];
  if (cfg.factor === null) {
    localStorage.removeItem(FACTOR_KEY);
  } else {
    localStorage.setItem(FACTOR_KEY, String(cfg.factor));
  }
}

/** Calculate auto-zoom based on viewport width. */
export function calcAutoZoom(): number {
  if (typeof window === "undefined") return 1;
  const width = window.innerWidth;
  if (width <= 1024) return 1;
  return Math.max(1.0, width / 1707);
}

/** Cycle through modes: default → compact → large → default */
export function cycleMode(current: ScaleMode): ScaleMode {
  if (current === "default") return "compact";
  if (current === "compact") return "large";
  return "default";
}
