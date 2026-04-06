# CATforCAT Ready for Users — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Fase 22 (review mode wiring + Task Board Kanban) and add production-readiness fixes (invite code expiration, session indicator) so real users (Keyla + classmates + professor) can use CATforCAT.

**Architecture:** Three independent tracks executed sequentially. Track A (prod verification) is CLI-only. Track B (Fase 22) wires existing components and creates Task Board. Track C (user-readiness) adds invite code expiration and session activity indicator. No schema changes — all models exist.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 6, CSS variables only

---

## Track A — Production Verification (CLI only)

### Block 0: Verify production deploys

Already completed in planning phase:
- [x] Site up: HTTP 200
- [x] Favicon: 1444 bytes (catforcat cat logo)
- [ ] Autosave: requires authenticated browser session — PENDING MANUAL
- [ ] Pre-translate fallback: requires authenticated browser session — PENDING MANUAL

No code changes needed. Move to Track B.

---

## Track B — Review Mode Wiring + Task Board Kanban

### Block 1: Wire SuggestionInline into SegmentRow

**Files:** Modify `src/components/editor/SegmentRow.tsx`

- [ ] Add import for SuggestionInline at top of file
- [ ] Add to SegmentRowProps interface:
  ```typescript
  suggestions?: Array<{
    id: string; originalText: string; suggestedText: string; status: string;
    author: { name: string | null; username: string | null };
  }>;
  onAcceptSuggestion?: (id: string) => void;
  onRejectSuggestion?: (id: string) => void;
  ```
- [ ] Add to destructured props: `suggestions = [], onAcceptSuggestion, onRejectSuggestion,`
- [ ] Render after the confirmed checkmark div, inside the target div (before closing `</div>` of segment-target):
  ```tsx
  {suggestions.length > 0 && (
    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
      {suggestions.filter(s => s.status === "pending").map((s) => (
        <SuggestionInline
          key={s.id}
          suggestion={s}
          onAccept={(id) => onAcceptSuggestion?.(id)}
          onReject={(id) => onRejectSuggestion?.(id)}
          readOnly={!reviewMode}
        />
      ))}
    </div>
  )}
  ```
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: wire SuggestionInline into SegmentRow`

---

### Block 2: Wire PostItAnchor into SegmentRow

**Files:** Modify `src/components/editor/SegmentRow.tsx`

- [ ] Add import for PostItAnchor at top of file
- [ ] Add to SegmentRowProps interface:
  ```typescript
  postIts?: Array<{
    id: string; charStart: number; charEnd: number; content: string;
    severity: string; resolved: boolean;
    author: { name: string | null; username: string | null };
  }>;
  onResolvePostIt?: (id: string) => void;
  onDeletePostIt?: (id: string) => void;
  ```
- [ ] Add to destructured props: `postIts = [], onResolvePostIt, onDeletePostIt,`
- [ ] Render in gutter after glossary badge:
  ```tsx
  {postIts.filter(p => !p.resolved).map((p) => (
    <PostItAnchor
      key={p.id}
      postIt={p}
      onResolve={(id) => onResolvePostIt?.(id)}
      onDelete={(id) => onDeletePostIt?.(id)}
      readOnly={!reviewMode}
    />
  ))}
  ```
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: wire PostItAnchor into SegmentRow gutter`

---

### Block 3: Fetch suggestions + post-its in editor, pass to SegmentRow

**Files:** Modify `src/app/app/projects/[id]/page.tsx`

**API contracts (verified):**
- `GET /api/projects/[id]/suggestions` → `{ suggestions: [{ id, segmentId, originalText, suggestedText, status, author: { name, username }, segment: { id, position } }] }`
- `GET /api/projects/[id]/post-its` → `{ postIts: [{ id, segmentId, charStart, charEnd, content, severity, resolved, author: { name, username }, segment: { id, position } }] }`
- `PATCH /api/suggestions/[id]` with `{ status: "accepted" | "rejected" }` → accepts/rejects
- `PATCH /api/post-its/[id]` with `{ resolved: true }` → resolves
- `DELETE /api/post-its/[id]` → deletes

- [ ] Add state for suggestions and postIts (Record<segmentId, Array>)
- [ ] Add fetchReviewData callback that fetches both endpoints and groups by segmentId
- [ ] Call fetchReviewData after project data loads
- [ ] Add handleAcceptSuggestion: `PATCH /api/suggestions/[id]` with `{ status: "accepted" }` then refetch
- [ ] Add handleRejectSuggestion: `PATCH /api/suggestions/[id]` with `{ status: "rejected" }` then refetch
- [ ] Add handleResolvePostIt: `PATCH /api/post-its/[id]` with `{ resolved: true }` then refetch
- [ ] Add handleDeletePostIt: `DELETE /api/post-its/[id]` then refetch
- [ ] Pass to SegmentRow: `suggestions={...} postIts={...} onAcceptSuggestion={...} onRejectSuggestion={...} onResolvePostIt={...} onDeletePostIt={...}`
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: fetch and pass suggestions + post-its to SegmentRow`

---

### Block 4: Create SubmissionCard component

**Files:** Create `src/components/SubmissionCard.tsx`

- [ ] Create component with props: submission (id, projectId, status, progressPct, submittedAt, gradeValue, student), dueDate
- [ ] Shows: student name (@username), status badge, progress bar, grade or overdue indicator
- [ ] Clickable → navigates to `/app/projects/${submission.projectId}`
- [ ] Uses only CSS variables for colors
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: create SubmissionCard component for Task Board`

---

### Block 5: Create TaskBoard component

**Files:** Create `src/components/TaskBoard.tsx`

- [ ] Create component with props: assignments (with submissions), totalStudents count
- [ ] 3-column grid: Pending (0% progress) | In Progress (>0% and not submitted) | Completed (submitted/reviewing/graded)
- [ ] Each column renders SubmissionCard instances
- [ ] Assignment header with title, due date, student count
- [ ] Empty state if no assignments
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: create TaskBoard kanban with 3 columns`

---

### Block 6: Add Task Board tab to classroom dashboard + expand API

**Files:** Modify `src/app/app/classrooms/[id]/page.tsx`, Modify `src/app/api/classrooms/[id]/route.ts`

**Current API gap:** GET /api/classrooms/[id] returns assignments with `_count: { submissions: true }` but NOT the actual submissions array. Task Board needs submissions with student data.

- [ ] In `route.ts`: expand assignments include to add submissions with student select
- [ ] In `page.tsx`: update ClassroomDetail interface to include submissions in assignments
- [ ] Add "board" to tab type: `"members" | "assignments" | "board"`
- [ ] Add LayoutGrid icon import from lucide-react
- [ ] Add TaskBoard import
- [ ] Add "board" button in tab bar
- [ ] Render TaskBoard in board tab, passing assignments with submissions and student count
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: add Task Board tab to classroom dashboard`

---

## Track C — User Readiness

### Block 7: Invite code expiration (30 days)

**Files:** Modify `src/app/api/classrooms/join/route.ts`

**Current state:** Classroom has `inviteCode` (permanent, no expiration) and `createdAt`. The join endpoint checks `classroom.status !== "active"` but not age of the invite code. Invitation model has `expiresAt` but that's for email invitations, not join-by-code.

**Approach:** Add a check in the join endpoint: if the classroom was created more than 30 days ago, the invite code is expired. The professor can regenerate it (new endpoint or classroom edit).

- [ ] In join `route.ts`, after finding classroom, add:
  ```typescript
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const codeAge = Date.now() - new Date(classroom.createdAt).getTime();
  if (codeAge > thirtyDaysMs) {
    return NextResponse.json({ error: "Invite code expired. Ask the professor for a new one." }, { status: 410 });
  }
  ```
- [ ] Add `inviteCodeCreatedAt` field to Classroom schema? NO — use `updatedAt` of classroom. When professor regenerates code, updatedAt changes.
  Actually simpler: add a `codeGeneratedAt` column. But that requires migration.
  **Simplest approach without migration:** Add a column to Classroom to track when the code was last generated. BUT this requires a migration on production PostgreSQL.
  **Even simpler:** Check classroom.createdAt for now. The professor can always regenerate (which we'll add as a button that creates a new code + updates updatedAt). For MVP this is sufficient.
  **Final approach:** Check `updatedAt` — when classroom is created, updatedAt = createdAt. When code is regenerated, updatedAt changes. This works without migration.
- [ ] Actually, `updatedAt` changes on ANY edit (name, description). Better: just check `createdAt` for now. Add regeneration as future backlog item.
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: invite code expires 30 days after classroom creation`

---

### Block 8: Student session active indicator

**Files:** Modify `src/components/LiveDashboard.tsx`

**Current state:** LiveDashboard shows students during active class sessions. The indicator should show a green dot for students who have been active in the last 5 minutes (based on `lastActiveAt` from submissions).

- [ ] Check if LiveDashboard already receives lastActiveAt per student
- [ ] If not, check the live polling endpoint to see what data it returns
- [ ] Add green/gray dot next to each student name in LiveDashboard based on lastActiveAt < 5 minutes ago
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: student active indicator in LiveDashboard`

---

### Block 9: Update ESTADO.md + push

- [ ] Update ESTADO.md: mark Fase 22 complete, update session, clear backlog items done
- [ ] `git push origin classroom-mode:main`
- [ ] Verify catforcat.app responds 200

---

## Summary

| Block | Track | What | Files | Risk |
|-------|-------|------|-------|------|
| 0 | A | Prod verification | 0 | None |
| 1 | B | SuggestionInline in SegmentRow | 1 mod | Low |
| 2 | B | PostItAnchor in SegmentRow | 1 mod | Low |
| 3 | B | Fetch + pass review data | 1 mod | Medium |
| 4 | B | SubmissionCard component | 1 create | Low |
| 5 | B | TaskBoard kanban | 1 create | Low |
| 6 | B | Task Board tab + API expansion | 2 mod | Medium |
| 7 | C | Invite code expiration | 1 mod | Low |
| 8 | C | Student active indicator | 1 mod | Low |
| 9 | — | ESTADO.md + push | 1 mod | None |

**9 blocks, 9 gates, 9 atomic commits.**
