/**
 * Auto-propagation: if a source text is identical to another segment
 * that's already confirmed, pre-fill its target text.
 *
 * Returns array of { segmentId, targetText } for segments that should be updated.
 */
export interface PropagationResult {
  segmentId: string;
  targetText: string;
}

export function findPropagations(
  segments: Array<{
    id: string;
    sourceText: string;
    targetText: string;
    status: string;
  }>,
): PropagationResult[] {
  // Build map: sourceText → confirmed targetText
  const confirmedMap = new Map<string, string>();
  for (const seg of segments) {
    if (seg.status === "confirmed" && seg.targetText.trim() !== "") {
      // First confirmed wins (keeps earliest translation)
      if (!confirmedMap.has(seg.sourceText)) {
        confirmedMap.set(seg.sourceText, seg.targetText);
      }
    }
  }

  // Find unconfirmed segments with matching source that have empty target
  const results: PropagationResult[] = [];
  for (const seg of segments) {
    if (seg.status !== "confirmed" && seg.targetText.trim() === "") {
      const existingTarget = confirmedMap.get(seg.sourceText);
      if (existingTarget) {
        results.push({
          segmentId: seg.id,
          targetText: existingTarget,
        });
      }
    }
  }

  return results;
}
