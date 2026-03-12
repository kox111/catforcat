import Dexie, { type Table } from "dexie";

// ────────────────────────────────────────────
// Local IndexedDB schema — spec section 3.2
// Database: "translatepro_local", version 1
// ────────────────────────────────────────────

export interface LocalProject {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  sourceFile: string;
  fileFormat: string;
  status: string;
  createdAt: string; // ISO string
}

export interface LocalSegment {
  id: string;
  projectId: string;
  position: number;
  sourceText: string;
  targetText: string;
  status: string; // empty | draft | confirmed
  metadata?: string; // JSON string
}

export interface LocalTMEntry {
  id: string;
  srcLang: string;
  tgtLang: string;
  sourceText: string;
  targetText: string;
  useCount: number;
}

export interface LocalGlossaryTerm {
  id: string;
  srcLang: string;
  tgtLang: string;
  sourceTerm: string;
  targetTerm: string;
  note?: string;
}

export interface SyncQueueEntry {
  id?: number; // auto-incremented
  action: "create" | "update" | "delete";
  table: string; // projects | segments | tm | glossary
  recordId: string;
  data?: string; // JSON string of the payload
  timestamp: number; // Date.now()
}

class TranslateProDB extends Dexie {
  projects!: Table<LocalProject, string>;
  segments!: Table<LocalSegment, string>;
  tm!: Table<LocalTMEntry, string>;
  glossary!: Table<LocalGlossaryTerm, string>;
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super("translatepro_local");

    this.version(1).stores({
      projects: "id, name, srcLang, tgtLang, status, createdAt",
      segments: "id, projectId, position, [projectId+position]",
      tm: "id, srcLang, tgtLang, sourceText",
      glossary: "id, srcLang, tgtLang, sourceTerm",
      syncQueue: "++id, action, table, recordId, timestamp",
    });
  }
}

export const db = new TranslateProDB();
