import { db, type SyncQueueEntry } from "./db";

// ────────────────────────────────────────────
// Sync Layer — spec section 5.2
// Online:  API + mirror to IndexedDB
// Offline: IndexedDB only + enqueue to syncQueue
// Reconnection: process syncQueue in order → API
// Conflict resolution: last-write-wins (timestamp)
// ────────────────────────────────────────────

type OnlineCallback = (isOnline: boolean) => void;

let _isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
const _listeners: OnlineCallback[] = [];

/** Current online status */
export function isOnline(): boolean {
  return _isOnline;
}

/** Subscribe to online/offline changes. Returns unsubscribe function. */
export function onOnlineChange(cb: OnlineCallback): () => void {
  _listeners.push(cb);
  return () => {
    const idx = _listeners.indexOf(cb);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

function _notify(online: boolean) {
  _isOnline = online;
  for (const cb of _listeners) {
    try {
      cb(online);
    } catch {
      /* ignore */
    }
  }
}

/** Initialize online/offline detection. Call once at app startup. */
export function initSyncListener(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    _notify(true);
    // On reconnection, flush the sync queue
    processSyncQueue().catch(console.error);
  };

  const handleOffline = () => {
    _notify(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Also do a fetch-based ping to confirm real connectivity
  // (navigator.onLine can be unreliable on some browsers)
  checkConnectivity().then((online) => {
    if (online !== _isOnline) _notify(online);
  });

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/** Fetch-based connectivity check */
async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    // Any HTTP response means server is reachable
    return res.ok || res.status === 401 || res.status === 403 || res.status === 405;
  } catch {
    // Network error or abort — assume online if navigator says so
    // (navigator.onLine is more reliable for initial state)
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }
}

// ── Sync Queue Operations ──

/** Enqueue an operation for later sync */
export async function enqueueSync(
  action: SyncQueueEntry["action"],
  table: string,
  recordId: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await db.syncQueue.add({
    action,
    table,
    recordId,
    data: data ? JSON.stringify(data) : undefined,
    timestamp: Date.now(),
  });
}

/** Process all pending sync entries (FIFO). Called on reconnection. */
export async function processSyncQueue(): Promise<{
  processed: number;
  errors: number;
}> {
  const entries = await db.syncQueue.orderBy("timestamp").toArray();
  let processed = 0;
  let errors = 0;

  for (const entry of entries) {
    try {
      await syncEntryToServer(entry);
      // Remove from queue on success
      if (entry.id !== undefined) {
        await db.syncQueue.delete(entry.id);
      }
      processed++;
    } catch (err) {
      console.error(`Sync failed for ${entry.table}/${entry.recordId}:`, err);
      errors++;
      // Stop processing on failure to maintain order
      break;
    }
  }

  return { processed, errors };
}

/** Send a single sync entry to the server API */
async function syncEntryToServer(entry: SyncQueueEntry): Promise<void> {
  const payload = entry.data ? JSON.parse(entry.data) : {};

  switch (entry.table) {
    case "segments": {
      // Batch segment update
      const res = await fetch(`/api/projects/${payload.projectId}/segments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: [
            {
              id: entry.recordId,
              targetText: payload.targetText,
              status: payload.status,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Segment sync failed: ${res.status}`);
      break;
    }
    case "tm": {
      if (entry.action === "create" || entry.action === "update") {
        const res = await fetch("/api/tm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`TM sync failed: ${res.status}`);
      } else if (entry.action === "delete") {
        const res = await fetch(`/api/tm?id=${entry.recordId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`TM delete sync failed: ${res.status}`);
      }
      break;
    }
    case "glossary": {
      if (entry.action === "create" || entry.action === "update") {
        const res = await fetch("/api/glossary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Glossary sync failed: ${res.status}`);
      } else if (entry.action === "delete") {
        const res = await fetch(`/api/glossary?id=${entry.recordId}`, {
          method: "DELETE",
        });
        if (!res.ok)
          throw new Error(`Glossary delete sync failed: ${res.status}`);
      }
      break;
    }
    default:
      console.warn(`Unknown sync table: ${entry.table}`);
  }
}

// ── Mirror helpers (save to IndexedDB alongside API calls) ──

/** Mirror project data to IndexedDB */
export async function mirrorProject(project: {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  sourceFile: string;
  fileFormat: string;
  status: string;
}): Promise<void> {
  await db.projects.put({
    ...project,
    createdAt: new Date().toISOString(),
  });
}

/** Mirror segments to IndexedDB */
export async function mirrorSegments(
  projectId: string,
  segments: Array<{
    id: string;
    position: number;
    sourceText: string;
    targetText: string;
    status: string;
    metadata?: string;
  }>,
): Promise<void> {
  await db.segments.bulkPut(segments.map((s) => ({ ...s, projectId })));
}

/** Mirror a TM entry to IndexedDB */
export async function mirrorTMEntry(entry: {
  id: string;
  srcLang: string;
  tgtLang: string;
  sourceText: string;
  targetText: string;
  useCount: number;
}): Promise<void> {
  await db.tm.put(entry);
}

/** Mirror a glossary term to IndexedDB */
export async function mirrorGlossaryTerm(term: {
  id: string;
  srcLang: string;
  tgtLang: string;
  sourceTerm: string;
  targetTerm: string;
  note?: string;
}): Promise<void> {
  await db.glossary.put(term);
}

/** Get pending sync queue count */
export async function getSyncQueueCount(): Promise<number> {
  return db.syncQueue.count();
}
