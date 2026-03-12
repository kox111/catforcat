"use client";

import { useState, useEffect } from "react";
import { isOnline, onOnlineChange, initSyncListener } from "./sync";

/**
 * React hook for online/offline status.
 * Initializes the sync listener on first mount.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initialize sync listener (only runs once per app lifecycle)
    const cleanup = initSyncListener();

    // Set initial state
    setOnline(isOnline());

    // Subscribe to changes
    const unsub = onOnlineChange((status) => {
      setOnline(status);
    });

    return () => {
      unsub();
      cleanup();
    };
  }, []);

  return online;
}
