import { create } from "zustand";

export interface Segment {
  id: string;
  projectId: string;
  position: number;
  sourceText: string;
  targetText: string;
  status: "empty" | "draft" | "confirmed";
  tmMatchPct: number;
  metadata: string;
}

export interface Project {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  sourceFile: string | null;
  fileFormat: string | null;
  status: string;
}

interface EditorState {
  project: Project | null;
  segments: Segment[];
  activeSegmentId: string | null;
  pendingSaves: Set<string>; // segment IDs with unsaved changes
  saving: boolean;

  // Actions
  setProject: (project: Project) => void;
  setSegments: (segments: Segment[]) => void;
  setActiveSegment: (id: string | null) => void;
  updateSegmentTarget: (id: string, targetText: string) => void;
  confirmSegment: (id: string) => void;
  copySourceToTarget: (id: string) => void;
  applyTranslation: (id: string, targetText: string) => void;
  getNextUnconfirmedId: (afterId?: string) => string | null;
  getPrevSegmentId: (currentId: string) => string | null;
  getNextSegmentId: (currentId: string) => string | null;
  markSaved: (ids: string[]) => void;
  setSaving: (saving: boolean) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  segments: [],
  activeSegmentId: null,
  pendingSaves: new Set(),
  saving: false,

  setProject: (project) => set({ project }),

  setSegments: (segments) => set({ segments }),

  setActiveSegment: (id) => set({ activeSegmentId: id }),

  updateSegmentTarget: (id, targetText) => {
    set((state) => {
      const segments = state.segments.map((s) => {
        if (s.id !== id) return s;
        const newStatus: Segment["status"] = targetText.trim() === "" ? "empty" : "draft";
        // Don't downgrade from confirmed to draft while typing
        const status: Segment["status"] = s.status === "confirmed" ? "confirmed" : newStatus;
        return { ...s, targetText, status };
      });
      const pendingSaves = new Set(state.pendingSaves);
      pendingSaves.add(id);
      return { segments, pendingSaves };
    });
  },

  confirmSegment: (id) => {
    set((state) => {
      const segments = state.segments.map((s) =>
        s.id === id ? { ...s, status: "confirmed" as const } : s
      );
      const pendingSaves = new Set(state.pendingSaves);
      pendingSaves.add(id);
      return { segments, pendingSaves };
    });
  },

  copySourceToTarget: (id) => {
    const segment = get().segments.find((s) => s.id === id);
    if (segment) {
      get().updateSegmentTarget(id, segment.sourceText);
    }
  },

  applyTranslation: (id, targetText) => {
    get().updateSegmentTarget(id, targetText);
  },

  getNextUnconfirmedId: (afterId) => {
    const { segments } = get();
    const startIdx = afterId
      ? segments.findIndex((s) => s.id === afterId) + 1
      : 0;

    // Search from startIdx to end
    for (let i = startIdx; i < segments.length; i++) {
      if (segments[i].status !== "confirmed") return segments[i].id;
    }
    // Wrap around from beginning
    for (let i = 0; i < startIdx; i++) {
      if (segments[i].status !== "confirmed") return segments[i].id;
    }
    return null;
  },

  getPrevSegmentId: (currentId) => {
    const { segments } = get();
    const idx = segments.findIndex((s) => s.id === currentId);
    return idx > 0 ? segments[idx - 1].id : null;
  },

  getNextSegmentId: (currentId) => {
    const { segments } = get();
    const idx = segments.findIndex((s) => s.id === currentId);
    return idx < segments.length - 1 ? segments[idx + 1].id : null;
  },

  markSaved: (ids) => {
    set((state) => {
      const pendingSaves = new Set(state.pendingSaves);
      ids.forEach((id) => pendingSaves.delete(id));
      return { pendingSaves };
    });
  },

  setSaving: (saving) => set({ saving }),
}));
