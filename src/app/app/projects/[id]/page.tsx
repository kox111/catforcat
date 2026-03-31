"use client";

import { useEffect, useCallback, useRef, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/lib/store";
import EditorToolbar from "@/components/editor/EditorToolbar";
import EditorSidebar from "@/components/editor/EditorSidebar";
import StatusBar from "@/components/editor/StatusBar";
import VirtualSegmentList, {
  type VirtualSegmentListHandle,
} from "@/components/editor/VirtualSegmentList";
import TMPanel from "@/components/editor/TMPanel";
import GlossaryPanel from "@/components/editor/GlossaryPanel";
import QAPanel from "@/components/editor/QAPanel";
import SearchReplaceModal from "@/components/editor/SearchReplaceModal";
import GoToSegmentModal from "@/components/editor/GoToSegmentModal";
import ConcordanceModal from "@/components/editor/ConcordanceModal";
import AnalysisModal from "@/components/editor/AnalysisModal";
import GlossaryWarningModal from "@/components/editor/GlossaryWarningModal";
import SegmentContextMenu, {
  type ContextMenuItem,
  type ContextMenuEntry,
} from "@/components/editor/SegmentContextMenu";
import NoteModal from "@/components/editor/NoteModal";
import ShortcutsModal from "@/components/editor/ShortcutsModal";
import {
  detectFrequentTerms,
  type GlossarySuggestion,
} from "@/lib/auto-glossary";
import type { TMMatch } from "@/lib/fuzzy-match";
import {
  runQABatch,
  runQAChecksForSegment,
  type QAIssue,
} from "@/lib/qa-checks";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import {
  mirrorProject,
  mirrorSegments,
  enqueueSync,
  isOnline as checkOnline,
} from "@/lib/sync";
import {
  Sparkles,
  CopyCheck,
  CheckCircle2,
  TextSearch,
  BookOpen,
  Scissors,
  Merge,
  Trash2,
  BookPlus,
} from "lucide-react";
import { findPropagations } from "@/lib/auto-propagate";
import type {
  SegmentFilter,
  PreTranslateProgress,
} from "@/components/editor/EditorToolbar";

/* Maps lang codes to short display labels. Handles both old ("en") and new regional ("en-US") codes. */
function getLangLabel(code: string): string {
  // Regional codes: "en-US" → "EN-US", "es-PE" → "ES-PE"
  if (code.includes("-")) return code.toUpperCase();
  // Legacy short codes
  return code.toUpperCase();
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status: authStatus } = useSession();
  const router = useRouter();
  const {
    project,
    segments,
    activeSegmentId,
    setProject,
    setSegments,
    setActiveSegment,
    updateSegmentTarget,
    confirmSegment,
    copySourceToTarget,
    applyTranslation,
    getNextUnconfirmedId,
    getPrevSegmentId,
    getNextSegmentId,
    pendingSaves,
    markSaved,
    setSaving,
    saving,
  } = useEditorStore();

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const segmentRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const virtualListRef = useRef<VirtualSegmentListHandle>(null);
  const tmMatchesRef = useRef<TMMatch[]>([]);
  const [tmMatchesBySegment, setTmMatchesBySegment] = useState<
    Record<string, { score: number; targetText: string }[]>
  >({});
  const [glossaryMatchCountBySegment, setGlossaryMatchCountBySegment] = useState<
    Record<string, number>
  >({});
  const [tmPanelVisible, setTmPanelVisible] = useState(true);
  const [glossaryTerms, setGlossaryTerms] = useState<
    { sourceTerm: string; targetTerm: string }[]
  >([]);
  const [glossaryWarning, setGlossaryWarning] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [qaIssues, setQaIssues] = useState<QAIssue[]>([]);
  const [qaVisible, setQaVisible] = useState(false);
  const [qaRunning, setQaRunning] = useState(false);
  const online = useOnlineStatus();
  const [searchOpen, setSearchOpen] = useState(false);
  const [goToOpen, setGoToOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("all");
  const [propagatedCount, setPropagatedCount] = useState(0);
  const [preTranslateProgress, setPreTranslateProgress] =
    useState<PreTranslateProgress | null>(null);
  const [preTranslateToast, setPreTranslateToast] = useState<string | null>(
    null,
  );
  const [generalToast, setGeneralToast] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveRetryRef = useRef<number>(0);
  const [recoveryBanner, setRecoveryBanner] = useState(false);
  const [concordanceOpen, setConcordanceOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  // Review mode: suggestions + post-its per segment
  const [suggestionsBySegment, setSuggestionsBySegment] = useState<
    Record<string, Array<{
      id: string; originalText: string; suggestedText: string; status: string;
      author: { name: string | null; username: string | null };
    }>>
  >({});
  const [postItsBySegment, setPostItsBySegment] = useState<
    Record<string, Array<{
      id: string; charStart: number; charEnd: number; content: string;
      severity: string; resolved: boolean;
      author: { name: string | null; username: string | null };
    }>>
  >({});
  // B1: Auto-Glossary Detection
  const confirmCountRef = useRef<number>(0);
  const [autoGlossarySuggestions, setAutoGlossarySuggestions] = useState<
    GlossarySuggestion[]
  >([]);
  // B2: Glossary Enforcement — pending confirm data while modal is showing
  const [glossaryEnforcementData, setGlossaryEnforcementData] = useState<{
    segmentId: string;
    mismatches: { sourceTerm: string; expectedTarget: string }[];
  } | null>(null);
  // B3: All glossary terms for the current language pair (for highlighting all segments)
  const [allGlossarySourceTerms, setAllGlossarySourceTerms] = useState<
    string[]
  >([]);
  // D1: Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    segmentId: string;
  } | null>(null);
  // D2: Note modal
  const [noteModal, setNoteModal] = useState<{
    segmentId: string;
    position: number;
    note: string;
  } | null>(null);
  // F1: Shortcuts modal
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // Focus mode
  const [focusMode, setFocusMode] = useState(false);
  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Bottom panel tab state
  const [bottomTab, setBottomTab] = useState<"tm" | "glossary">("tm");
  // Add to glossary modal
  const [addGlossaryModal, setAddGlossaryModal] = useState<{
    sourceTerm: string;
  } | null>(null);
  // Fullscreen toggle + F11 listener
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleF11 = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleF11);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleF11);
    };
  }, [toggleFullscreen]);

  // Export dropdown (controlled from sidebar)
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  // Bottom panel collapse/resize
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(150);
  const [tmMatchCount, setTmMatchCount] = useState(0);
  const bottomDragRef = useRef<{ startY: number; startH: number } | null>(null);
  // F3: Font size (persisted in localStorage)
  const [editorFontSize, setEditorFontSize] = useState(13);
  // F4: Column width ratio (0.5 = equal, persisted in localStorage)
  const [columnRatio, setColumnRatio] = useState(0.5);
  const isDraggingRef = useRef(false);
  // D6: Undo/Redo history per segment
  const undoHistoryRef = useRef<
    Map<string, { history: string[]; index: number }>
  >(new Map());

  // F3+F4: Load persisted preferences from localStorage
  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem("tp-editor-font-size");
      if (savedFontSize) setEditorFontSize(Number(savedFontSize));
      const savedRatio = localStorage.getItem("tp-column-ratio");
      if (savedRatio) setColumnRatio(Number(savedRatio));
      const savedPanelH = localStorage.getItem("tp-bottom-panel-height");
      if (savedPanelH) setBottomPanelHeight(Number(savedPanelH));
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-collapse bottom panel on small viewports
  useEffect(() => {
    const check = () => {
      if (window.innerHeight < 900) {
        setBottomPanelCollapsed(true);
      }
    };
    check();
    // Only run on mount, not on resize (user might manually expand)
  }, []);

  // Keep TM matches in ref for keyboard shortcut access + auto-expand panel
  const handleTMMatchesUpdate = useCallback((matches: TMMatch[]) => {
    tmMatchesRef.current = matches;
    setTmMatchCount(matches.length);
    // Cache matches for inline badges
    if (activeSegmentId && matches.length > 0) {
      setTmMatchesBySegment((prev) => ({
        ...prev,
        [activeSegmentId]: matches.map((m) => ({
          score: m.score,
          targetText: m.targetText,
        })),
      }));
    }
    // Auto-expand when matches appear
    if (matches.length > 0) {
      setBottomPanelCollapsed(false);
    }
  }, [activeSegmentId]);

  // Track glossary terms found in active segment
  const handleGlossaryTermsFound = useCallback(
    (terms: { sourceTerm: string; targetTerm: string }[]) => {
      setGlossaryTerms(terms);
      if (activeSegmentId) {
        setGlossaryMatchCountBySegment((prev) => ({
          ...prev,
          [activeSegmentId]: terms.length,
        }));
      }
    },
    [activeSegmentId],
  );

  // Auto-dismiss glossary warning
  useEffect(() => {
    if (glossaryWarning) {
      const timer = setTimeout(() => setGlossaryWarning(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [glossaryWarning]);

  // Auto-dismiss AI error
  useEffect(() => {
    if (aiError) {
      const timer = setTimeout(() => setAiError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [aiError]);

  // Auto-dismiss pre-translate toast
  useEffect(() => {
    if (preTranslateToast) {
      const timer = setTimeout(() => setPreTranslateToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [preTranslateToast]);

  // Auto-dismiss general toast
  useEffect(() => {
    if (generalToast) {
      const timer = setTimeout(() => setGeneralToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [generalToast]);

  // Auto-dismiss auto-glossary suggestions
  useEffect(() => {
    if (autoGlossarySuggestions.length > 0) {
      const timer = setTimeout(() => setAutoGlossarySuggestions([]), 10000);
      return () => clearTimeout(timer);
    }
  }, [autoGlossarySuggestions]);

  // B3: Fetch all glossary source terms for this language pair
  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    async function fetchGlossaryTerms() {
      try {
        const res = await fetch(
          `/api/glossary?srcLang=${project!.srcLang}&tgtLang=${project!.tgtLang}`,
        );
        if (res.ok && !cancelled) {
          const terms = await res.json();
          setAllGlossarySourceTerms(
            terms.map((t: { sourceTerm: string }) => t.sourceTerm),
          );
        }
      } catch {
        /* ignore */
      }
    }
    fetchGlossaryTerms();
    return () => {
      cancelled = true;
    };
  }, [project]);

  // Pre-translate: TM pass first, then API for remaining
  const handlePreTranslate = useCallback(
    async (mode: "tm-only" | "full") => {
      if (!project || preTranslateProgress?.running) return;

      const emptyCount = segments.filter(
        (s) => s.targetText.trim() === "" || s.status === "empty",
      ).length;

      if (emptyCount === 0) {
        setPreTranslateToast("No empty segments to pre-translate");
        return;
      }

      setPreTranslateProgress({
        running: true,
        done: 0,
        total: emptyCount,
        tmFilled: 0,
        apiFilled: 0,
      });

      try {
        const res = await fetch(`/api/projects/${project.id}/pre-translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });

        if (!res.ok) {
          const data = await res.json();
          setAiError(data.error || "Pre-translation failed");
          setPreTranslateProgress(null);
          return;
        }

        const data = await res.json();

        // Apply results to local state
        if (data.results && Array.isArray(data.results)) {
          for (const result of data.results) {
            applyTranslation(result.segmentId, result.targetText);
          }
        }

        const tmCount = data.tmFilled || 0;
        const apiCount = data.apiFilled || 0;
        const errorCount = data.errors || 0;
        const skipped = data.skippedDueToQuota || 0;

        let msg = data.message
          ? data.message
          : `Pre-translated: ${tmCount} from TM, ${apiCount} via API`;
        if (!data.message && errorCount > 0) msg += `, ${errorCount} errors`;
        if (!data.message && skipped > 0) msg += `, ${skipped} skipped (quota limit)`;

        setPreTranslateToast(msg);
        setPreTranslateProgress({
          running: false,
          done: tmCount + apiCount,
          total: emptyCount,
          tmFilled: tmCount,
          apiFilled: apiCount,
        });

        // Clear progress after a bit
        setTimeout(() => setPreTranslateProgress(null), 3000);
      } catch {
        setAiError("Pre-translation failed — network error");
        setPreTranslateProgress(null);
      }
    },
    [project, segments, preTranslateProgress, applyTranslation],
  );

  // Request AI translation suggestion
  const requestAISuggestion = useCallback(async () => {
    if (!activeSegmentId || !project || aiLoading) return;

    const seg = segments.find((s) => s.id === activeSegmentId);
    if (!seg) return;

    setAiLoading(true);
    setAiError(null);

    try {
      // Build context: prev/next segments
      const segIndex = segments.findIndex((s) => s.id === activeSegmentId);
      const prevSeg = segIndex > 0 ? segments[segIndex - 1] : null;
      const nextSeg =
        segIndex < segments.length - 1 ? segments[segIndex + 1] : null;

      // Build glossary terms for the request
      const glossaryForRequest = glossaryTerms.map((t) => ({
        source: t.sourceTerm,
        target: t.targetTerm,
      }));

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: seg.sourceText,
          srcLang: project.srcLang,
          tgtLang: project.tgtLang,
          projectId: project.id,
          glossaryTerms: glossaryForRequest,
          context: {
            previousSegment: prevSeg?.sourceText || "",
            nextSegment: nextSeg?.sourceText || "",
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAiError(data.error || "AI suggestion failed");
        return;
      }

      const data = await res.json();
      if (data.translation) {
        // Apply suggestion but do NOT confirm — human reviews first
        applyTranslation(activeSegmentId, data.translation);
      }
    } catch {
      setAiError("Failed to connect to AI service");
    } finally {
      setAiLoading(false);
    }
  }, [
    activeSegmentId,
    project,
    segments,
    glossaryTerms,
    aiLoading,
    applyTranslation,
  ]);

  // Run QA batch — fetches glossary terms from API for full check
  const handleRunQA = useCallback(async () => {
    if (!project || qaRunning) return;
    setQaRunning(true);

    try {
      // Fetch all glossary terms for this language pair
      const glossRes = await fetch(
        `/api/glossary?srcLang=${project.srcLang}&tgtLang=${project.tgtLang}`,
      );
      const allGlossaryTerms = glossRes.ok ? await glossRes.json() : [];

      const termsForQA = allGlossaryTerms.map(
        (t: { sourceTerm: string; targetTerm: string }) => ({
          sourceTerm: t.sourceTerm,
          targetTerm: t.targetTerm,
        }),
      );

      const issues = runQABatch(segments, termsForQA);
      setQaIssues(issues);
      setQaVisible(true);
    } catch {
      // If glossary fetch fails, run QA without glossary
      const issues = runQABatch(segments, []);
      setQaIssues(issues);
      setQaVisible(true);
    } finally {
      setQaRunning(false);
    }
  }, [project, segments, qaRunning]);

  // Fetch project data
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (authStatus !== "authenticated") return;

    async function fetchProject() {
      let data;

      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) {
          throw new Error("API fetch failed");
        }
        data = await res.json();
      } catch {
        // Offline fallback: load from IndexedDB
        const { db } = await import("@/lib/db");
        const localProject = await db.projects.get(id);
        if (!localProject) {
          router.push("/app/projects");
          return;
        }
        const localSegments = await db.segments
          .where("projectId")
          .equals(id)
          .sortBy("position");

        data = {
          ...localProject,
          segments: localSegments,
        };
      }
      setProject({
        id: data.id,
        name: data.name,
        srcLang: data.srcLang,
        tgtLang: data.tgtLang,
        sourceFile: data.sourceFile,
        fileFormat: data.fileFormat,
        status: data.status,
      });
      setSegments(data.segments);

      // Mirror to IndexedDB for offline access
      mirrorProject({
        id: data.id,
        name: data.name,
        srcLang: data.srcLang,
        tgtLang: data.tgtLang,
        sourceFile: data.sourceFile,
        fileFormat: data.fileFormat,
        status: data.status,
      }).catch(() => {});
      mirrorSegments(
        data.id,
        data.segments.map(
          (s: {
            id: string;
            position: number;
            sourceText: string;
            targetText: string;
            status: string;
            metadata?: unknown;
          }) => ({
            id: s.id,
            position: s.position,
            sourceText: s.sourceText,
            targetText: s.targetText,
            status: s.status,
            metadata: s.metadata ? JSON.stringify(s.metadata) : undefined,
          }),
        ),
      ).catch(() => {});
    }
    fetchProject();
  }, [id, authStatus, router, setProject, setSegments]);

  // Fetch review data (suggestions + post-its) for the project
  const fetchReviewData = useCallback(async () => {
    if (!id) return;
    try {
      const [sugRes, piRes] = await Promise.all([
        fetch(`/api/projects/${id}/suggestions`),
        fetch(`/api/projects/${id}/post-its`),
      ]);
      if (sugRes.ok) {
        const data = await sugRes.json();
        const grouped: Record<string, typeof suggestionsBySegment[string]> = {};
        for (const s of data.suggestions || []) {
          const segId = s.segment?.id || s.segmentId;
          if (segId) (grouped[segId] ||= []).push(s);
        }
        setSuggestionsBySegment(grouped);
      }
      if (piRes.ok) {
        const data = await piRes.json();
        const grouped: Record<string, typeof postItsBySegment[string]> = {};
        for (const p of data.postIts || []) {
          const segId = p.segment?.id || p.segmentId;
          if (segId) (grouped[segId] ||= []).push(p);
        }
        setPostItsBySegment(grouped);
      }
    } catch { /* review data is optional */ }
  }, [id]);

  // Load review data after segments are available
  useEffect(() => {
    if (segments.length > 0) fetchReviewData();
  }, [segments.length > 0, fetchReviewData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Review mode callbacks
  const handleAcceptSuggestion = useCallback(async (suggestionId: string) => {
    const res = await fetch(`/api/suggestions/${suggestionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    if (res.ok) fetchReviewData();
  }, [fetchReviewData]);

  const handleRejectSuggestion = useCallback(async (suggestionId: string) => {
    const res = await fetch(`/api/suggestions/${suggestionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (res.ok) fetchReviewData();
  }, [fetchReviewData]);

  const handleResolvePostIt = useCallback(async (postItId: string) => {
    const res = await fetch(`/api/post-its/${postItId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });
    if (res.ok) fetchReviewData();
  }, [fetchReviewData]);

  const handleDeletePostIt = useCallback(async (postItId: string) => {
    const res = await fetch(`/api/post-its/${postItId}`, { method: "DELETE" });
    if (res.ok) fetchReviewData();
  }, [fetchReviewData]);

  // Session recovery: restore drafts from localStorage
  useEffect(() => {
    if (segments.length === 0) return;
    let recovered = false;
    segments.forEach((segment) => {
      try {
        const draftKey = `catforcat-draft-${segment.id}`;
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const { text, timestamp } = JSON.parse(raw);
          // If draft is newer than what's in DB, restore it
          if (text && text !== segment.targetText) {
            updateSegmentTarget(segment.id, text);
            recovered = true;
          }
          localStorage.removeItem(draftKey);
        }
      } catch {
        /* ignore parse errors */
      }
    });
    if (recovered) {
      setRecoveryBanner(true);
    }
    // Only run once on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length > 0]);

  // Auto-propagation: pre-fill targets for repeated source texts
  useEffect(() => {
    if (segments.length === 0) return;
    const propagations = findPropagations(segments);
    if (propagations.length > 0) {
      for (const p of propagations) {
        applyTranslation(p.segmentId, p.targetText);
      }
      setPropagatedCount(propagations.length);
      // Auto-dismiss after 4s
      setTimeout(() => setPropagatedCount(0), 4000);
    }
    // Only run when segments first load (length changes significantly)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length]);

  // Add confirmed segment to TM (online → API + mirror, offline → IndexedDB + queue)
  const addToTM = useCallback(
    async (sourceText: string, targetText: string) => {
      if (!project) return;

      const tmData = {
        sourceText,
        targetText,
        srcLang: project.srcLang,
        tgtLang: project.tgtLang,
      };

      try {
        if (checkOnline()) {
          await fetch("/api/tm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tmData),
          });
        } else {
          // Offline: save to IndexedDB + enqueue
          const { db } = await import("@/lib/db");
          const tmId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          await db.tm.put({
            id: tmId,
            srcLang: project.srcLang,
            tgtLang: project.tgtLang,
            sourceText,
            targetText,
            useCount: 1,
          });
          await enqueueSync("create", "tm", tmId, tmData);
        }
      } catch {
        // TM save failure is non-blocking
      }
    },
    [project],
  );

  // Auto-save with 2s debounce — works online and offline, with retry
  const saveSegments = useCallback(async () => {
    const state = useEditorStore.getState();
    const toSave = Array.from(state.pendingSaves);
    if (toSave.length === 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const segmentUpdates = toSave
        .map((segId) => {
          const seg = state.segments.find((s) => s.id === segId);
          return seg
            ? { id: seg.id, targetText: seg.targetText, status: seg.status }
            : null;
        })
        .filter(Boolean) as {
        id: string;
        targetText: string;
        status: string;
      }[];

      if (checkOnline()) {
        // Online: save to server + mirror to IndexedDB
        const res = await fetch(`/api/projects/${id}/segments`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segments: segmentUpdates }),
        });

        if (res.ok) {
          markSaved(toSave);
          saveRetryRef.current = 0;
          setLastSavedAt(Date.now());
        } else {
          throw new Error(`Save failed: ${res.status}`);
        }
      } else {
        // Offline: save to IndexedDB + enqueue for sync
        const { db } = await import("@/lib/db");
        for (const update of segmentUpdates) {
          await db.segments.update(update.id, {
            targetText: update.targetText,
            status: update.status,
          });
          await enqueueSync("update", "segments", update.id, {
            projectId: id,
            targetText: update.targetText,
            status: update.status,
          });
        }
        markSaved(toSave);
        setLastSavedAt(Date.now());
      }

      // Always mirror segments to IndexedDB
      const { db } = await import("@/lib/db");
      for (const update of segmentUpdates) {
        await db.segments
          .update(update.id, {
            targetText: update.targetText,
            status: update.status,
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
      // Save drafts to localStorage as fallback
      const state2 = useEditorStore.getState();
      for (const segId of toSave) {
        const seg = state2.segments.find((s) => s.id === segId);
        if (seg) {
          try {
            localStorage.setItem(
              `catforcat-draft-${segId}`,
              JSON.stringify({
                text: seg.targetText,
                timestamp: Date.now(),
                projectId: id,
              }),
            );
          } catch {
            /* localStorage full */
          }
        }
      }
      saveRetryRef.current += 1;
      if (saveRetryRef.current <= 3) {
        setSaveError(`Save failed — retrying... (${saveRetryRef.current}/3)`);
        setTimeout(() => saveSegments(), 2000);
      } else {
        setSaveError("Save failed — changes cached locally");
        saveRetryRef.current = 0;
      }
    } finally {
      setSaving(false);
    }
  }, [id, markSaved, setSaving]);

  // B2: Execute confirm after glossary enforcement passes or user says "Confirm anyway"
  const executeConfirm = useCallback(
    (segId: string) => {
      const seg = segments.find((s) => s.id === segId);
      if (!seg) return;
      confirmSegment(segId);
      // Add to TM in background
      addToTM(seg.sourceText, seg.targetText);
      // Auto-propagate: fill identical source texts in other segments
      const identicalEmpty = segments.filter(
        (s) =>
          s.id !== segId &&
          s.sourceText === seg.sourceText &&
          s.status !== "confirmed" &&
          s.targetText.trim() === "",
      );
      if (identicalEmpty.length > 0) {
        for (const s of identicalEmpty) {
          applyTranslation(s.id, seg.targetText);
        }
        setPropagatedCount(identicalEmpty.length);
        setTimeout(() => setPropagatedCount(0), 4000);
      }
      // Immediate save (flush debounce)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setTimeout(() => saveSegments(), 50);
      // Advance to next unconfirmed
      const nextId = getNextUnconfirmedId(segId);
      if (nextId) {
        scrollOnActivateRef.current = true;
        setActiveSegment(nextId);
      }
      // B1: Auto-Glossary Detection — every 5 confirms, suggest frequent terms
      confirmCountRef.current += 1;
      if (confirmCountRef.current % 5 === 0) {
        const existingTerms = glossaryTerms.map((t) => t.sourceTerm);
        const suggestions = detectFrequentTerms(segments, existingTerms);
        if (suggestions.length > 0) {
          setAutoGlossarySuggestions(suggestions);
        }
      }
      // Refresh all glossary source terms after confirming (in case new terms were added)
      if (project) {
        fetch(
          `/api/glossary?srcLang=${project.srcLang}&tgtLang=${project.tgtLang}`,
        )
          .then((r) => (r.ok ? r.json() : []))
          .then((terms: { sourceTerm: string }[]) =>
            setAllGlossarySourceTerms(terms.map((t) => t.sourceTerm)),
          )
          .catch(() => {});
      }
    },
    [
      segments,
      confirmSegment,
      addToTM,
      applyTranslation,
      getNextUnconfirmedId,
      setActiveSegment,
      saveSegments,
      glossaryTerms,
      project,
    ],
  );

  // D1: Split segment at cursor position
  const handleSplitSegment = useCallback(
    async (segmentId: string) => {
      if (!project) return;
      const seg = segments.find((s) => s.id === segmentId);
      if (!seg) return;

      // Default split: at the middle of the source text (nearest space)
      const mid = Math.floor(seg.sourceText.length / 2);
      let splitPos = seg.sourceText.lastIndexOf(" ", mid);
      if (splitPos <= 0) splitPos = seg.sourceText.indexOf(" ", mid);
      if (splitPos <= 0) return; // Can't split single-word segment

      try {
        const res = await fetch(`/api/projects/${project.id}/segments/split`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segmentId, splitPosition: splitPos }),
        });
        if (res.ok) {
          const data = await res.json();
          setSegments(data.segments);
        }
      } catch {
        /* ignore */
      }
    },
    [project, segments, setSegments],
  );

  // D1: Merge with next segment
  const handleMergeSegment = useCallback(
    async (segmentId: string) => {
      if (!project) return;
      const seg = segments.find((s) => s.id === segmentId);
      if (!seg) return;
      const nextSeg = segments.find((s) => s.position === seg.position + 1);
      if (!nextSeg) return;

      try {
        const res = await fetch(`/api/projects/${project.id}/segments/merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segmentId, nextSegmentId: nextSeg.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setSegments(data.segments);
          setActiveSegment(segmentId);
        }
      } catch {
        /* ignore */
      }
    },
    [project, segments, setSegments, setActiveSegment],
  );

  // D2: Save note to segment metadata
  const handleSaveNote = useCallback(
    async (segmentId: string, note: string) => {
      if (!project) return;
      const seg = segments.find((s) => s.id === segmentId);
      if (!seg) return;

      // Parse existing metadata, add comment
      let meta: Record<string, unknown> = {};
      try {
        meta = JSON.parse(seg.metadata || "{}");
      } catch {
        /* ignore */
      }
      meta.comment = note || undefined;
      const newMetadata = JSON.stringify(meta);

      // Update local state
      const updated = segments.map((s) =>
        s.id === segmentId ? { ...s, metadata: newMetadata } : s,
      );
      setSegments(updated);

      // Save to server
      try {
        await fetch(`/api/projects/${project.id}/segments`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: [{ id: segmentId, metadata: newMetadata }],
          }),
        });
      } catch {
        /* ignore */
      }
      setNoteModal(null);
    },
    [project, segments, setSegments],
  );

  // D5: Copy all source to target
  const handleCopyAllSource = useCallback(() => {
    for (const seg of segments) {
      if (seg.targetText.trim() === "" && seg.status !== "confirmed") {
        applyTranslation(seg.id, seg.sourceText);
      }
    }
  }, [segments, applyTranslation]);

  // D6: Track undo history when target changes
  const trackUndoHistory = useCallback((segId: string, text: string) => {
    const entry = undoHistoryRef.current.get(segId) || {
      history: [""],
      index: 0,
    };
    // Only track if text actually changed from current position
    if (entry.history[entry.index] === text) return;
    // Truncate any redo history
    const newHistory = entry.history.slice(0, entry.index + 1);
    newHistory.push(text);
    // Keep max 10 entries
    if (newHistory.length > 10) newHistory.shift();
    undoHistoryRef.current.set(segId, {
      history: newHistory,
      index: newHistory.length - 1,
    });
  }, []);

  // D6: Undo
  const handleUndo = useCallback(() => {
    if (!activeSegmentId) return;
    const entry = undoHistoryRef.current.get(activeSegmentId);
    if (!entry || entry.index <= 0) return;
    entry.index--;
    const text = entry.history[entry.index];
    updateSegmentTarget(activeSegmentId, text);
  }, [activeSegmentId, updateSegmentTarget]);

  // D6: Redo
  const handleRedo = useCallback(() => {
    if (!activeSegmentId) return;
    const entry = undoHistoryRef.current.get(activeSegmentId);
    if (!entry || entry.index >= entry.history.length - 1) return;
    entry.index++;
    const text = entry.history[entry.index];
    updateSegmentTarget(activeSegmentId, text);
  }, [activeSegmentId, updateSegmentTarget]);

  // Reset and start the 15-second autosave interval
  const resetSaveTimer = useCallback(() => {
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    saveIntervalRef.current = setInterval(() => {
      const state = useEditorStore.getState();
      if (state.pendingSaves.size > 0) {
        saveSegments();
      }
    }, 15000);
  }, [saveSegments]);

  // Autosave: 15-second fixed interval (skip silently if no changes)
  useEffect(() => {
    resetSaveTimer();
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [resetSaveTimer]);

  // Track whether navigation was via keyboard (should scroll) or mouse (should not)
  const scrollOnActivateRef = useRef(false);

  // Scroll to active segment only when triggered by keyboard navigation
  useEffect(() => {
    if (activeSegmentId && scrollOnActivateRef.current) {
      virtualListRef.current?.scrollToSegment(activeSegmentId);
      scrollOnActivateRef.current = false;
    }
    // Focus the textarea
    if (activeSegmentId) {
      requestAnimationFrame(() => {
        const el = segmentRefs.current.get(activeSegmentId);
        if (el) el.focus();
      });
    }
  }, [activeSegmentId]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Global shortcuts (don't need active segment)

      // Ctrl+F — open search/replace
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Ctrl+G — go to segment
      if (e.ctrlKey && e.key === "g") {
        e.preventDefault();
        setGoToOpen(true);
        return;
      }

      // Ctrl+K — concordance search
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setConcordanceOpen(true);
        return;
      }

      // Ctrl+Shift+F — toggle focus mode
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setFocusMode((v) => !v);
        return;
      }

      // Ctrl+/ — keyboard shortcuts panel (F1)
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      // Ctrl+S — force save immediately + reset 15s timer
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveSegments();
        resetSaveTimer();
        return;
      }

      // Escape — close modals or deselect
      if (e.key === "Escape") {
        e.preventDefault();
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (concordanceOpen) {
          setConcordanceOpen(false);
          return;
        }
        if (searchOpen) {
          setSearchOpen(false);
          return;
        }
        if (goToOpen) {
          setGoToOpen(false);
          return;
        }
        setActiveSegment(null);
        return;
      }

      if (!activeSegmentId) return;

      // Ctrl+Shift+Enter — request AI suggestion
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        requestAISuggestion();
        return;
      }

      // Ctrl+Enter — confirm with glossary enforcement (B2), inline QA, add to TM, advance
      if (e.ctrlKey && !e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        const seg = segments.find((s) => s.id === activeSegmentId);
        if (seg && seg.targetText.trim() !== "") {
          // Inline QA: run all checks on this segment before confirming
          const inlineIssues = runQAChecksForSegment(seg, glossaryTerms);
          const warnings = inlineIssues.filter((i) => i.severity !== "info");
          if (warnings.length > 0) {
            const msgs = warnings.map((i) => i.message).join(" | ");
            setGlossaryWarning(msgs);
          }
          // B2: Glossary enforcement — check if glossary terms are reflected in target
          if (glossaryTerms.length > 0) {
            const mismatches = glossaryTerms
              .filter((t) => {
                const srcLower = seg.sourceText.toLowerCase();
                const tgtLower = seg.targetText.toLowerCase();
                return (
                  srcLower.includes(t.sourceTerm.toLowerCase()) &&
                  !tgtLower.includes(t.targetTerm.toLowerCase())
                );
              })
              .map((t) => ({
                sourceTerm: t.sourceTerm,
                expectedTarget: t.targetTerm,
              }));

            if (mismatches.length > 0) {
              // Show modal — block confirm until user decides
              setGlossaryEnforcementData({
                segmentId: activeSegmentId,
                mismatches,
              });
              return;
            }
          }
          // No mismatches — confirm directly
          executeConfirm(activeSegmentId);
        }
        return;
      }

      // Ctrl+1/2/3 — apply TM match
      if (e.ctrlKey && ["1", "2", "3"].includes(e.key)) {
        e.preventDefault();
        const matchIdx = parseInt(e.key) - 1;
        const match = tmMatchesRef.current[matchIdx];
        if (match) {
          applyTranslation(activeSegmentId, match.targetText);
        }
        return;
      }

      // Ctrl+Up — previous segment
      if (e.ctrlKey && e.key === "ArrowUp") {
        e.preventDefault();
        const prevId = getPrevSegmentId(activeSegmentId);
        if (prevId) {
          scrollOnActivateRef.current = true;
          setActiveSegment(prevId);
        }
        return;
      }

      // Ctrl+Down — next segment
      if (e.ctrlKey && e.key === "ArrowDown") {
        e.preventDefault();
        const nextId = getNextSegmentId(activeSegmentId);
        if (nextId) {
          scrollOnActivateRef.current = true;
          setActiveSegment(nextId);
        }
        return;
      }

      // Ctrl+D — copy source to target (D = Duplicate)
      if (e.ctrlKey && !e.shiftKey && e.key === "d") {
        e.preventDefault();
        copySourceToTarget(activeSegmentId);
        return;
      }

      // Ctrl+G — go to segment
      if (e.ctrlKey && !e.shiftKey && e.key === "g") {
        e.preventDefault();
        setGoToOpen(true);
        return;
      }

      // Ctrl+E — add to glossary
      if (e.ctrlKey && !e.shiftKey && e.key === "e") {
        e.preventDefault();
        const seg = segments.find((s) => s.id === activeSegmentId);
        if (seg) {
          const selection = window.getSelection()?.toString().trim();
          setAddGlossaryModal({
            sourceTerm: selection || seg.sourceText.slice(0, 100),
          });
        }
        return;
      }

      // D6: Ctrl+Z — undo (per segment)
      if (e.ctrlKey && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // D6: Ctrl+Shift+Z — redo (per segment)
      if (e.ctrlKey && e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleRedo();
        return;
      }
    },
    [
      activeSegmentId,
      segments,
      applyTranslation,
      getPrevSegmentId,
      getNextSegmentId,
      setActiveSegment,
      copySourceToTarget,
      saveSegments,
      resetSaveTimer,
      glossaryTerms,
      requestAISuggestion,
      searchOpen,
      goToOpen,
      concordanceOpen,
      shortcutsOpen,
      executeConfirm,
      handleUndo,
      handleRedo,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Register textarea ref
  const registerRef = useCallback(
    (id: string, el: HTMLTextAreaElement | null) => {
      if (el) {
        segmentRefs.current.set(id, el);
      } else {
        segmentRefs.current.delete(id);
      }
    },
    [],
  );

  // Get active segment for TM panel
  const activeSegment = activeSegmentId
    ? segments.find((s) => s.id === activeSegmentId)
    : null;

  if (!project || segments.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          color: "var(--text-muted)",
        }}
      >
        Loading editor...
      </div>
    );
  }

  const totalSegments = segments.length;
  const confirmedSegments = segments.filter(
    (s) => s.status === "confirmed",
  ).length;
  const progress = Math.round((confirmedSegments / totalSegments) * 100);

  // Filtered segments based on toolbar filter
  const filteredSegments =
    segmentFilter === "all"
      ? segments
      : segments.filter((s) => {
          if (segmentFilter === "empty")
            return s.targetText.trim() === "" && s.status !== "confirmed";
          if (segmentFilter === "draft") return s.status === "draft";
          if (segmentFilter === "confirmed") return s.status === "confirmed";
          return true;
        });

  // GoTo handler: find segment by position number (1-based)
  const handleGoToSegment = (position: number) => {
    const seg = segments.find((s) => s.position === position);
    if (seg) {
      scrollOnActivateRef.current = true;
      setActiveSegment(seg.id);
    }
  };

  // Computed word counts for StatusBar
  const totalWordCount = segments.reduce(
    (sum, s) => sum + s.sourceText.split(/\s+/).filter(Boolean).length,
    0,
  );
  const activeSegmentWordCount = activeSegment
    ? activeSegment.sourceText.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        background: "var(--bg-deep)",
      }}
    >
      {/* ─── Minimal Toolbar ─── */}
      <EditorToolbar
        projectName={project.name}
        projectId={project.id}
        srcLang={getLangLabel(project.srcLang)}
        tgtLang={getLangLabel(project.tgtLang)}
        saving={saving}
        hasPendingChanges={pendingSaves.size > 0}
        isOnline={online}
        segmentFilter={segmentFilter}
        onFilterChange={setSegmentFilter}
        preTranslateProgress={preTranslateProgress}
        lastSavedAt={lastSavedAt}
        saveError={saveError}
        progress={progress}
        confirmedCount={confirmedSegments}
        totalCount={totalSegments}
        onToast={setGeneralToast}
        exportOpen={exportDropdownOpen}
        onExportOpenChange={setExportDropdownOpen}
        onPreTranslate={handlePreTranslate}
        preTranslating={!!preTranslateProgress?.running}
        editorFontSize={editorFontSize}
        onFontSizeChange={(size) => {
          setEditorFontSize(size);
          try {
            localStorage.setItem("tp-editor-font-size", String(size));
          } catch {
            /* ignore */
          }
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* ─── Session recovery banner ─── */}
      {recoveryBanner && (
        <div
          style={{
            padding: "8px 16px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--amber-soft)",
            color: "var(--amber-text)",
          }}
        >
          <span>Recovered unsaved changes from your last session.</span>
          <button
            onClick={() => setRecoveryBanner(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--amber-text)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              textDecoration: "underline",
              padding: "0 4px",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Toast notifications ─── */}
      {glossaryWarning && (
        <div
          style={{
            padding: "6px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--amber-soft)",
            color: "var(--amber)",
            borderBottom: "1px solid var(--bg-hover)",
          }}
        >
          <span>{glossaryWarning}</span>
          <button
            onClick={() => setGlossaryWarning(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {aiError && (
        <div
          style={{
            padding: "6px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--red-soft)",
            color: "var(--red)",
            borderBottom: "1px solid var(--bg-hover)",
          }}
        >
          <span>{aiError}</span>
          <button
            onClick={() => setAiError(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {preTranslateToast && (
        <div
          style={{
            padding: "6px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--green-soft)",
            color: "var(--green)",
            borderBottom: "1px solid var(--bg-hover)",
          }}
        >
          <span>{preTranslateToast}</span>
          <button
            onClick={() => setPreTranslateToast(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {generalToast && (
        <div
          style={{
            padding: "6px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--amber-soft)",
            color: "var(--amber-text)",
            borderBottom: "1px solid var(--bg-hover)",
          }}
        >
          <span>{generalToast}</span>
          <button
            onClick={() => setGeneralToast(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {propagatedCount > 0 && (
        <div
          style={{
            padding: "6px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent-soft)",
            color: "var(--accent)",
            borderBottom: "1px solid var(--bg-hover)",
          }}
        >
          <span>
            {propagatedCount} identical segment{propagatedCount > 1 ? "s" : ""}{" "}
            auto-filled
          </span>
          <button
            onClick={() => setPropagatedCount(0)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {autoGlossarySuggestions.length > 0 && (
        <div
          style={{
            padding: "6px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            background: "var(--purple-soft)",
            color: "var(--purple)",
            borderBottom: "1px solid var(--bg-hover)",
          }}
        >
          <span style={{ fontWeight: 500 }}>Frequent terms detected:</span>
          {autoGlossarySuggestions.map((s, i) => (
            <button
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 500,
                background: "var(--purple)",
                color: "var(--text-primary)",
                border: "none",
                cursor: "pointer",
              }}
              onClick={async () => {
                if (!project) return;
                try {
                  await fetch("/api/glossary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      sourceTerm: s.term,
                      targetTerm: s.suggestedTarget || s.term,
                      srcLang: project.srcLang,
                      tgtLang: project.tgtLang,
                    }),
                  });
                  setAutoGlossarySuggestions((prev) =>
                    prev.filter((_, idx) => idx !== i),
                  );
                  fetch(
                    `/api/glossary?srcLang=${project.srcLang}&tgtLang=${project.tgtLang}`,
                  )
                    .then((r) => (r.ok ? r.json() : []))
                    .then((terms: { sourceTerm: string }[]) =>
                      setAllGlossarySourceTerms(terms.map((t) => t.sourceTerm)),
                    )
                    .catch(() => {});
                } catch {
                  /* ignore */
                }
              }}
              title={`Add "${s.term}" to glossary (seen ${s.count}× in source)`}
            >
              + {s.term} ({s.count}×)
            </button>
          ))}
          <button
            onClick={() => setAutoGlossarySuggestions([])}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter info bar */}
      {segmentFilter !== "all" && (
        <div
          style={{
            padding: "5px 20px",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-hover)",
            borderBottom: "1px solid var(--bg-hover)",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            Showing: {segmentFilter} ({filteredSegments.length}/{totalSegments})
          </span>
          <button
            onClick={() => setSegmentFilter("all")}
            style={{
              textDecoration: "underline",
              fontSize: 12,
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Show all
          </button>
        </div>
      )}

      {/* ─── Modals ─── */}
      {searchOpen && (
        <SearchReplaceModal
          segments={segments}
          onClose={() => setSearchOpen(false)}
          onNavigateToSegment={(segId) => {
            scrollOnActivateRef.current = true;
            setActiveSegment(segId);
          }}
          onReplaceInTarget={(segId, newText) =>
            applyTranslation(segId, newText)
          }
        />
      )}
      {goToOpen && (
        <GoToSegmentModal
          totalSegments={totalSegments}
          onGoTo={handleGoToSegment}
          onClose={() => setGoToOpen(false)}
        />
      )}
      {analysisOpen && project && (
        <AnalysisModal
          segments={segments}
          srcLang={project.srcLang}
          tgtLang={project.tgtLang}
          onClose={() => setAnalysisOpen(false)}
        />
      )}
      {concordanceOpen && project && (
        <ConcordanceModal
          srcLang={project.srcLang}
          tgtLang={project.tgtLang}
          onClose={() => setConcordanceOpen(false)}
          onApply={(targetText) => {
            if (activeSegmentId) {
              applyTranslation(activeSegmentId, targetText);
            }
            setConcordanceOpen(false);
          }}
        />
      )}
      {shortcutsOpen && (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
      {glossaryEnforcementData && (
        <GlossaryWarningModal
          mismatches={glossaryEnforcementData.mismatches}
          onFix={() => setGlossaryEnforcementData(null)}
          onConfirmAnyway={() => {
            executeConfirm(glossaryEnforcementData.segmentId);
            setGlossaryEnforcementData(null);
          }}
        />
      )}
      {noteModal && (
        <NoteModal
          segmentPosition={noteModal.position}
          initialNote={noteModal.note}
          onSave={(note) => handleSaveNote(noteModal.segmentId, note)}
          onClose={() => setNoteModal(null)}
        />
      )}

      {/* ─── Add to Glossary Modal ─── */}
      {addGlossaryModal && project && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--overlay)",
          }}
          onClick={() => setAddGlossaryModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 360,
              background: "var(--bg-panel)",
              border: "0.5px solid var(--glass-border)",
              borderRadius: "var(--radius)",
              padding: 20,
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-ui-family)",
                marginBottom: 14,
              }}
            >
              Add to Glossary
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const sourceTerm = (form.elements.namedItem("sourceTerm") as HTMLInputElement).value.trim();
                const targetTerm = (form.elements.namedItem("targetTerm") as HTMLInputElement).value.trim();
                if (!sourceTerm || !targetTerm) return;
                try {
                  await fetch("/api/glossary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      sourceTerm,
                      targetTerm,
                      srcLang: project.srcLang,
                      tgtLang: project.tgtLang,
                    }),
                  });
                  setAddGlossaryModal(null);
                  // Refresh glossary
                  const res = await fetch(
                    `/api/glossary?srcLang=${project.srcLang}&tgtLang=${project.tgtLang}`
                  );
                  if (res.ok) {
                    const terms = await res.json();
                    setAllGlossarySourceTerms(terms.map((t: { sourceTerm: string }) => t.sourceTerm.toLowerCase()));
                  }
                } catch {
                  /* ignore */
                }
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-ui-family)",
                    marginBottom: 4,
                  }}
                >
                  Source term ({project.srcLang})
                </label>
                <input
                  name="sourceTerm"
                  defaultValue={addGlossaryModal.sourceTerm}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: 13,
                    fontFamily: "var(--font-ui-family)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-ui-family)",
                    marginBottom: 4,
                  }}
                >
                  Target term ({project.tgtLang})
                </label>
                <input
                  name="targetTerm"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: 13,
                    fontFamily: "var(--font-ui-family)",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setAddGlossaryModal(null)}
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    fontFamily: "var(--font-ui-family)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    fontFamily: "var(--font-ui-family)",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Add term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Context Menu ─── */}
      {contextMenu &&
        (() => {
          const seg = segments.find((s) => s.id === contextMenu.segmentId);
          const hasNext = seg
            ? segments.some((s) => s.position === seg.position + 1)
            : false;
          const isConfirmedSeg = seg?.status === "confirmed";
          const entries: ContextMenuEntry[] = [
            {
              label: "Translate with AI",
              icon: Sparkles,
              action: () => {
                if (seg) {
                  setActiveSegment(seg.id);
                  // Delay to let state update propagate before requesting AI
                  setTimeout(() => {
                    if (typeof requestAISuggestion === "function")
                      requestAISuggestion();
                  }, 50);
                }
              },
            },
            {
              label: "Copy source",
              icon: CopyCheck,
              action: () => {
                if (seg) copySourceToTarget(seg.id);
              },
            },
            {
              label: isConfirmedSeg ? "Confirmed" : "Confirm segment",
              icon: CheckCircle2,
              action: () => {
                if (seg) confirmSegment(seg.id);
              },
              disabled: isConfirmedSeg || !seg,
            },
            { type: "separator" },
            {
              label: "Search in TM",
              icon: TextSearch,
              action: () => {
                if (seg) {
                  setActiveSegment(seg.id);
                  setConcordanceOpen(true);
                }
              },
            },
            {
              label: "Search in Glossary",
              icon: BookOpen,
              action: () => {
                if (seg) {
                  setActiveSegment(seg.id);
                  setBottomTab("glossary");
                  setBottomPanelCollapsed(false);
                }
              },
            },
            {
              label: "Add to Glossary",
              icon: BookPlus,
              action: () => {
                if (seg) {
                  const selection = window.getSelection()?.toString().trim();
                  setAddGlossaryModal({
                    sourceTerm: selection || seg.sourceText.slice(0, 100),
                  });
                }
              },
            },
            { type: "separator" },
            {
              label: "Split segment",
              icon: Scissors,
              action: () => handleSplitSegment(contextMenu.segmentId),
              disabled: !seg || seg.sourceText.split(" ").length < 2,
            },
            {
              label: "Merge with next",
              icon: Merge,
              action: () => handleMergeSegment(contextMenu.segmentId),
              disabled: !hasNext,
            },
            { type: "separator" },
            {
              label: "Clear target",
              icon: Trash2,
              action: () => {
                if (seg) applyTranslation(seg.id, "");
              },
              danger: true,
              disabled: !seg || seg.targetText.trim() === "",
            },
          ];
          return (
            <SegmentContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              items={entries}
              onClose={() => setContextMenu(null)}
            />
          );
        })()}

      {/* ═══ MAIN LAYOUT: Sidebar + Content ═══ */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <EditorSidebar
          onAnalysis={() => setAnalysisOpen(true)}
          onRunQA={handleRunQA}
          qaRunning={qaRunning}
          onSearchOpen={() => setSearchOpen(true)}
          onConcordanceOpen={() => setConcordanceOpen(true)}
          onNotesOpen={() => {
            const seg = segments.find((s) => s.id === activeSegmentId);
            if (seg) {
              let comment = "";
              try {
                comment = JSON.parse(seg.metadata || "{}").comment || "";
              } catch {
                /* ignore */
              }
              setNoteModal({
                segmentId: seg.id,
                position: seg.position,
                note: comment,
              });
            }
          }}
          activePanel={bottomPanelCollapsed ? null : bottomTab}
          onPanelToggle={(panel) => {
            if (bottomTab === panel && !bottomPanelCollapsed) {
              setBottomPanelCollapsed(true);
            } else {
              setBottomTab(panel as "tm" | "glossary");
              setBottomPanelCollapsed(false);
            }
          }}
        />

        {/* Content area */}
        <div
          data-editor-content
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Document header — language labels */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 16px 4px 52px",
              fontSize: 9,
              fontFamily: "var(--font-ui-family)",
              color: "var(--text-muted)",
              userSelect: "none",
              background: "transparent",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            <div style={{ flex: columnRatio, paddingRight: 8 }}>
              Source — {getLangLabel(project.srcLang)}
            </div>
            {/* Drag handle */}
            <div
              style={{
                width: 2,
                height: 12,
                borderRadius: 1,
                background: "var(--border)",
                cursor: "col-resize",
                flexShrink: 0,
                margin: "0 8px",
              }}
              title="Drag to resize columns"
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingRef.current = true;
                const contentEl = e.currentTarget.closest(
                  "[data-editor-content]",
                );
                const handleMove = (ev: MouseEvent) => {
                  if (!isDraggingRef.current || !contentEl) return;
                  const rect = contentEl.getBoundingClientRect();
                  const relX = ev.clientX - rect.left - 56;
                  const availW = rect.width - 56;
                  const ratio = Math.max(0.25, Math.min(0.75, relX / availW));
                  setColumnRatio(ratio);
                };
                const handleUp = () => {
                  isDraggingRef.current = false;
                  try {
                    localStorage.setItem(
                      "tp-column-ratio",
                      String(columnRatio),
                    );
                  } catch {
                    /* ignore */
                  }
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };
                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            />
            <div style={{ flex: 1 - columnRatio, paddingLeft: 8 }}>
              Target — {getLangLabel(project.tgtLang)}
            </div>
          </div>

          {/* Virtualized segment list */}
          <VirtualSegmentList
            ref={virtualListRef}
            segments={filteredSegments}
            activeSegmentId={activeSegmentId}
            glossaryTerms={glossaryTerms}
            allGlossarySourceTerms={allGlossarySourceTerms}
            online={online}
            aiLoading={aiLoading}
            tgtLang={project.tgtLang}
            fontSize={editorFontSize}
            columnRatio={columnRatio}
            focusMode={focusMode}
            tmMatchesBySegment={tmMatchesBySegment}
            glossaryMatchCountBySegment={glossaryMatchCountBySegment}
            suggestionsBySegment={suggestionsBySegment}
            postItsBySegment={postItsBySegment}
            onAcceptSuggestion={handleAcceptSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
            onResolvePostIt={handleResolvePostIt}
            onDeletePostIt={handleDeletePostIt}
            onActivate={(segmentId) => setActiveSegment(segmentId)}
            onTargetChange={(segmentId, text) => {
              trackUndoHistory(segmentId, text);
              updateSegmentTarget(segmentId, text);
            }}
            registerRef={registerRef}
            requestAISuggestion={requestAISuggestion}
            onNoteClick={(segment, comment) =>
              setNoteModal({
                segmentId: segment.id,
                position: segment.position,
                note: comment,
              })
            }
            onContextMenu={(e, segmentId) =>
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                segmentId,
              })
            }
          />

          {/* QA Panel */}
          {qaVisible && qaIssues !== undefined && (
            <QAPanel
              issues={qaIssues}
              onClose={() => setQaVisible(false)}
              onNavigateToSegment={(segmentId) => {
                scrollOnActivateRef.current = true;
                setActiveSegment(segmentId);
              }}
              translatedCount={
                segments.filter(
                  (s) => s.targetText && s.targetText.trim() !== "",
                ).length
              }
            />
          )}

          {/* Context Preview — prev/next segments */}
          {activeSegment &&
            (() => {
              const idx = segments.findIndex((s) => s.id === activeSegmentId);
              const prev = idx > 0 ? segments[idx - 1] : null;
              const next = idx < segments.length - 1 ? segments[idx + 1] : null;
              if (!prev && !next) return null;
              return (
                <div
                  style={{
                    display: "flex",
                    fontSize: 12,
                    borderTop: "1px solid var(--bg-hover)",
                    background: "var(--bg-hover)",
                    maxHeight: 48,
                    overflowY: "auto",
                    margin: "0 20px",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 4,
                  }}
                >
                  {prev && (
                    <div
                      style={{
                        flex: 1,
                        padding: "5px 12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                        }}
                      >
                        ← {prev.position}:{" "}
                      </span>
                      {prev.sourceText.slice(0, 80)}
                      {prev.sourceText.length > 80 ? "…" : ""}
                    </div>
                  )}
                  {next && (
                    <div
                      style={{
                        flex: 1,
                        padding: "5px 12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text-muted)",
                        borderLeft: "1px solid var(--bg-hover)",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {next.position} →:{" "}
                      </span>
                      {next.sourceText.slice(0, 80)}
                      {next.sourceText.length > 80 ? "…" : ""}
                    </div>
                  )}
                </div>
              );
            })()}

          {/* Bottom Panels: Collapsible TM + Glossary */}
          <div
            style={{
              background: "var(--bg-sidebar)",
              height: bottomPanelCollapsed ? 28 : bottomPanelHeight,
              minHeight: 28,
              maxHeight: 300,
              display: "flex",
              flexDirection: "column",
              margin: "0 20px 8px 20px",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              flexShrink: 0,
              transition: bottomDragRef.current ? "none" : "height 150ms ease",
            }}
          >
            {/* Drag handle */}
            <div
              style={{
                height: 8,
                cursor: "ns-resize",
                background: "transparent",
                flexShrink: 0,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onDoubleClick={() => {
                setBottomPanelCollapsed((prev) => !prev);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                bottomDragRef.current = {
                  startY: e.clientY,
                  startH: bottomPanelCollapsed ? 200 : bottomPanelHeight,
                };
                if (bottomPanelCollapsed) {
                  setBottomPanelCollapsed(false);
                  setBottomPanelHeight(200);
                }
                const grip = e.currentTarget.querySelector(
                  "[data-grip]",
                ) as HTMLElement;
                if (grip) {
                  grip.style.background = "var(--accent)";
                  grip.style.width = "48px";
                }
                const onMove = (ev: MouseEvent) => {
                  if (!bottomDragRef.current) return;
                  const delta = bottomDragRef.current.startY - ev.clientY;
                  const newH = Math.max(
                    40,
                    Math.min(300, bottomDragRef.current.startH + delta),
                  );
                  if (newH < 40) {
                    setBottomPanelCollapsed(true);
                  } else {
                    setBottomPanelCollapsed(false);
                    setBottomPanelHeight(newH);
                  }
                };
                const onUp = () => {
                  if (grip) {
                    grip.style.background = "var(--border)";
                    grip.style.width = "32px";
                  }
                  if (bottomDragRef.current) {
                    try {
                      localStorage.setItem(
                        "tp-bottom-panel-height",
                        String(bottomPanelHeight),
                      );
                    } catch {
                      /* */
                    }
                  }
                  bottomDragRef.current = null;
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
              onMouseEnter={(e) => {
                const grip = e.currentTarget.querySelector(
                  "[data-grip]",
                ) as HTMLElement;
                if (grip) {
                  grip.style.background = "var(--text-muted)";
                  grip.style.width = "48px";
                }
              }}
              onMouseLeave={(e) => {
                const grip = e.currentTarget.querySelector(
                  "[data-grip]",
                ) as HTMLElement;
                if (grip && !bottomDragRef.current) {
                  grip.style.background = "var(--border)";
                  grip.style.width = "32px";
                }
              }}
            >
              {/* Visual grip line */}
              <div
                data-grip
                style={{
                  width: 32,
                  height: 3,
                  borderRadius: 2,
                  background: "var(--border)",
                  transition: "background 150ms, width 150ms",
                }}
              />
            </div>

            {/* Tab bar (always visible — acts as collapsed header) */}
            <div
              onClick={() => {
                if (bottomPanelCollapsed) setBottomPanelCollapsed(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: bottomPanelCollapsed
                  ? "none"
                  : "1px solid var(--bg-hover)",
                padding: "0 12px",
                gap: 0,
                cursor: bottomPanelCollapsed ? "pointer" : "default",
                flexShrink: 0,
                minHeight: 24,
              }}
            >
              {[
                { id: "tm" as const, label: "TM Matches" },
                { id: "glossary" as const, label: "Glossary" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBottomTab(tab.id);
                    if (bottomPanelCollapsed) setBottomPanelCollapsed(false);
                  }}
                  style={{
                    padding: "4px 14px",
                    fontSize: 10,
                    fontWeight: bottomTab === tab.id ? 600 : 400,
                    color:
                      bottomTab === tab.id
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    background: "transparent",
                    border: "none",
                    borderBottom: bottomPanelCollapsed
                      ? "none"
                      : bottomTab === tab.id
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    transition: "color 150ms, border-color 150ms",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    if (bottomTab !== tab.id)
                      e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    if (bottomTab !== tab.id)
                      e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {tab.label}
                </button>
              ))}

              {/* Match count summary + collapse toggle */}
              <div style={{ flex: 1 }} />
              {bottomPanelCollapsed && tmMatchCount > 0 && (
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    marginRight: 8,
                  }}
                >
                  {tmMatchCount} match{tmMatchCount !== 1 ? "es" : ""} — click
                  to expand
                </span>
              )}
              {bottomPanelCollapsed && tmMatchCount === 0 && (
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--text-muted)",
                    marginRight: 8,
                  }}
                >
                  No matches
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBottomPanelCollapsed(!bottomPanelCollapsed);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "2px 4px",
                  lineHeight: 1,
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
                title={bottomPanelCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {bottomPanelCollapsed ? "↑" : "↓"}
              </button>
            </div>

            {/* Tab content (hidden when collapsed) */}
            {!bottomPanelCollapsed && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                {bottomTab === "tm" && (
                  <TMPanel
                    sourceText={activeSegment?.sourceText || ""}
                    srcLang={project.srcLang}
                    tgtLang={project.tgtLang}
                    isActive={!!activeSegment}
                    onApplyMatch={(targetText) => {
                      if (activeSegmentId) {
                        applyTranslation(activeSegmentId, targetText);
                      }
                    }}
                    onMatchesUpdate={handleTMMatchesUpdate}
                  />
                )}
                {bottomTab === "glossary" && (
                  <GlossaryPanel
                    sourceText={activeSegment?.sourceText || ""}
                    srcLang={project.srcLang}
                    tgtLang={project.tgtLang}
                    isActive={!!activeSegment}
                    onTermsFound={handleGlossaryTermsFound}
                    onInsertTerm={(targetTerm) => {
                      if (activeSegmentId) {
                        const seg = segments.find(
                          (s) => s.id === activeSegmentId,
                        );
                        if (seg) {
                          const newText = seg.targetText
                            ? seg.targetText + " " + targetTerm
                            : targetTerm;
                          applyTranslation(activeSegmentId, newText);
                        }
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        {/* end content area */}
      </div>
      {/* end row wrapper (sidebar + content) */}

      {/* Status Bar */}
      <StatusBar
        activeSegmentPosition={activeSegment?.position}
        totalSegments={totalSegments}
        activeSegmentWordCount={activeSegmentWordCount}
        totalWordCount={totalWordCount}
        translationProvider="Google"
        focusMode={focusMode}
        onGoToClick={() => setGoToOpen(true)}
        onProviderClick={() => {}}
        onShortcutsClick={() => setShortcutsOpen(true)}
      />
    </div>
  );
}
