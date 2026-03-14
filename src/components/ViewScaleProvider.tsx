"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import {
  type ScaleMode,
  SCALE_MODES,
  getStoredMode,
  getStoredFactor,
  setStoredMode,
  calcAutoZoom,
  cycleMode,
} from "@/lib/view-scale";

interface ViewScaleContextValue {
  mode: ScaleMode;
  zoom: number;
  setMode: (m: ScaleMode) => void;
  cycle: () => void;
}

const ViewScaleContext = createContext<ViewScaleContextValue>({
  mode: "default",
  zoom: 1,
  setMode: () => {},
  cycle: () => {},
});

export function useViewScale() {
  return useContext(ViewScaleContext);
}

export default function ViewScaleProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const [mode, setModeState] = useState<ScaleMode>("default");

  useEffect(() => {
    const storedMode = getStoredMode();
    setModeState(storedMode);

    function recalc() {
      const autoZoom = calcAutoZoom();
      const manualFactor = getStoredFactor();
      setZoom(manualFactor ? autoZoom * manualFactor : autoZoom);
    }

    recalc();

    const handleResize = () => {
      recalc();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setMode = useCallback((m: ScaleMode) => {
    setModeState(m);
    setStoredMode(m);
    // Recalculate zoom immediately
    const autoZoom = calcAutoZoom();
    const factor = SCALE_MODES[m].factor;
    setZoom(factor ? autoZoom * factor : autoZoom);
  }, []);

  const cycle = useCallback(() => {
    setModeState((prev) => {
      const next = cycleMode(prev);
      setStoredMode(next);
      const autoZoom = calcAutoZoom();
      const factor = SCALE_MODES[next].factor;
      setZoom(factor ? autoZoom * factor : autoZoom);
      return next;
    });
  }, []);

  return (
    <ViewScaleContext.Provider value={{ mode, zoom, setMode, cycle }}>
      {children}
    </ViewScaleContext.Provider>
  );
}

/** Wrapper that applies the CSS transform scale. Place around content that should zoom. */
export function ViewScaleContainer({ children }: { children: React.ReactNode }) {
  const { zoom } = useViewScale();
  return (
    <div
      style={{
        height: `${(100 / zoom).toFixed(4)}vh`,
        overflow: "hidden",
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: "top left",
        width: zoom !== 1 ? `${(100 / zoom).toFixed(4)}%` : undefined,
      }}
    >
      {children}
    </div>
  );
}
