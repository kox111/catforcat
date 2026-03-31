"use client";

import {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import SegmentRow from "./SegmentRow";
import type { Segment } from "@/lib/store";

/** Extended segment type matching what the editor page passes to SegmentRow */
type EditorSegment = Segment & {
  previousTargetText?: string;
  reviewStatus?: string;
  aiScore?: number | null;
  aiScoreReason?: string | null;
  terminologyUsed?: boolean;
};

export interface VirtualSegmentListHandle {
  scrollToSegment: (segmentId: string) => void;
}

interface VirtualSegmentListProps {
  segments: EditorSegment[];
  activeSegmentId: string | null;
  glossaryTerms: { sourceTerm: string; targetTerm: string }[];
  allGlossarySourceTerms: string[];
  online: boolean;
  aiLoading: boolean;
  tgtLang: string;
  fontSize: number;
  columnRatio: number;
  focusMode: boolean;
  onActivate: (segmentId: string) => void;
  onTargetChange: (segmentId: string, text: string) => void;
  registerRef: (segmentId: string, el: HTMLTextAreaElement | null) => void;
  requestAISuggestion: () => void;
  onNoteClick: (segment: EditorSegment, comment: string) => void;
  onContextMenu: (e: React.MouseEvent, segmentId: string) => void;
  tmMatchesBySegment?: Record<string, { score: number; targetText: string }[]>;
  glossaryMatchCountBySegment?: Record<string, number>;
}

function getSegmentComment(segment: EditorSegment): string {
  try {
    const meta = JSON.parse(segment.metadata || "{}");
    return meta.comment || "";
  } catch {
    return "";
  }
}

const VirtualSegmentList = forwardRef<
  VirtualSegmentListHandle,
  VirtualSegmentListProps
>(function VirtualSegmentList(props, ref) {
  const {
    segments,
    activeSegmentId,
    glossaryTerms,
    allGlossarySourceTerms,
    online,
    aiLoading,
    tgtLang,
    fontSize,
    columnRatio,
    focusMode,
    onActivate,
    onTargetChange,
    registerRef,
    requestAISuggestion,
    onNoteClick,
    onContextMenu,
    tmMatchesBySegment = {},
    glossaryMatchCountBySegment = {},
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: segments.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 72,
    overscan: 10,
    measureElement: (el) => {
      // measureElement uses the actual rendered height
      return el.getBoundingClientRect().height;
    },
  });

  // Build a segmentId->index map for fast lookup
  const segmentIndexMap = useRef<Map<string, number>>(new Map());
  // Update map whenever segments change
  useEffect(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < segments.length; i++) {
      map.set(segments[i].id, i);
    }
    segmentIndexMap.current = map;
  }, [segments]);

  const scrollToSegment = useCallback(
    (segmentId: string) => {
      const index = segmentIndexMap.current.get(segmentId);
      if (index != null) {
        virtualizer.scrollToIndex(index, { align: "center", behavior: "auto" });
      }
    },
    [virtualizer],
  );

  useImperativeHandle(ref, () => ({ scrollToSegment }), [scrollToSegment]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        margin: "0 12px 12px 12px",
        contain: "strict",
        background: "var(--bg-paper)",
        borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
        boxShadow: "var(--paper-shadow)",
        border: "1px solid var(--border)",
        borderTop: "none",
      }}
    >
      <div
        style={{
          height: totalSize,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const segment = segments[virtualRow.index];
          const segComment = getSegmentComment(segment);
          const isActive = segment.id === activeSegmentId;

          return (
            <div
              key={segment.id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <SegmentRow
                segment={segment}
                isActive={isActive}
                onActivate={() => onActivate(segment.id)}
                onTargetChange={(text) => onTargetChange(segment.id, text)}
                registerRef={(el) => registerRef(segment.id, el)}
                highlightTerms={
                  isActive
                    ? glossaryTerms.map((t) => t.sourceTerm)
                    : allGlossarySourceTerms
                }
                onRequestAI={
                  isActive && online ? requestAISuggestion : undefined
                }
                aiLoading={isActive ? aiLoading : false}
                tgtLang={tgtLang}
                comment={segComment}
                onNoteClick={() => onNoteClick(segment, segComment)}
                onContextMenu={(e) => onContextMenu(e, segment.id)}
                fontSize={fontSize}
                columnRatio={columnRatio}
                dimmed={focusMode && !isActive}
                tmMatches={tmMatchesBySegment[segment.id] || []}
                glossaryMatchCount={glossaryMatchCountBySegment[segment.id] || 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default VirtualSegmentList;
