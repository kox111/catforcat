# Fase 22 Completion — Classroom Mode Wiring + Task Board Kanban

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Fase 22 by wiring existing SuggestionInline/PostItAnchor into SegmentRow, and building a Task Board (Kanban) view for classrooms.

**Architecture:** Two independent tracks: (A) Wire existing components into the editor for review mode, (B) Build a Kanban board as a new tab in the classroom dashboard. Both use existing Prisma models (Submission, Assignment) — no schema changes needed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 6, CSS variables (no Tailwind classes), Zustand

---

## File Structure

### Track A — Suggestion/PostIt Wiring (3 files modified)

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/editor/SegmentRow.tsx` | MODIFY | Add props for suggestions/post-its, render SuggestionInline + PostItAnchor below textarea |
| `src/app/app/projects/[id]/page.tsx` | MODIFY | Fetch suggestions + post-its per segment, pass to SegmentRow, handle accept/reject/resolve callbacks |
| `src/app/api/projects/[id]/suggestions/route.ts` | VERIFY | Confirm GET returns suggestions grouped by segmentId with author info |

### Track B — Task Board Kanban (2 files created, 1 modified)

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/TaskBoard.tsx` | CREATE | Kanban board with 3 columns: Pending / In Progress / Submitted. Renders SubmissionCard per student. |
| `src/components/SubmissionCard.tsx` | CREATE | Card showing student name, progress bar, due date, status badge. Clickable → opens project. |
| `src/app/app/classrooms/[id]/page.tsx` | MODIFY | Add "Task Board" as third tab, fetch submission data, render TaskBoard |

---

## Task 1: Wire SuggestionInline into SegmentRow

**Files:**
- Modify: `src/components/editor/SegmentRow.tsx`

### What this does
Add optional `suggestions` prop to SegmentRow. When present, render SuggestionInline components below the textarea for each pending suggestion on that segment.

- [ ] **Step 1: Add suggestions prop and import**

Add to SegmentRowProps interface:

```typescript
// Add import at top
import SuggestionInline from "@/components/editor/SuggestionInline";

// Add to interface SegmentRowProps:
suggestions?: Array<{
  id: string;
  originalText: string;
  suggestedText: string;
  status: string;
  author: { name: string | null; username: string | null };
}>;
onAcceptSuggestion?: (id: string) => void;
onRejectSuggestion?: (id: string) => void;
```

Add to destructured props with defaults:

```typescript
suggestions = [],
onAcceptSuggestion,
onRejectSuggestion,
```

- [ ] **Step 2: Render SuggestionInline below textarea**

After the confirmed checkmark div (line ~691), inside the target div, add:

```tsx
{/* Suggestions (review mode) */}
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

- [ ] **Step 3: Verify build**

Run: `npx next build`
Expected: Clean build (no type errors)

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/SegmentRow.tsx
git commit -m "feat: wire SuggestionInline into SegmentRow"
```

---

## Task 2: Wire PostItAnchor into SegmentRow

**Files:**
- Modify: `src/components/editor/SegmentRow.tsx`

### What this does
Add optional `postIts` prop to SegmentRow. Render PostItAnchor icons in the gutter (below existing badges) for each post-it on the segment.

- [ ] **Step 1: Add postIts prop and import**

```typescript
// Add import at top
import PostItAnchor from "@/components/editor/PostItAnchor";

// Add to interface SegmentRowProps:
postIts?: Array<{
  id: string;
  charStart: number;
  charEnd: number;
  content: string;
  severity: string;
  resolved: boolean;
  author: { name: string | null; username: string | null };
}>;
onResolvePostIt?: (id: string) => void;
onDeletePostIt?: (id: string) => void;
```

Add to destructured props with defaults:

```typescript
postIts = [],
onResolvePostIt,
onDeletePostIt,
```

- [ ] **Step 2: Render PostItAnchor in the gutter**

After the glossary match badge in the gutter div (after `G·{glossaryMatchCount}`), add:

```tsx
{/* Post-it indicators */}
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

- [ ] **Step 3: Verify build**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/SegmentRow.tsx
git commit -m "feat: wire PostItAnchor into SegmentRow gutter"
```

---

## Task 3: Fetch suggestions + post-its in editor page and pass to SegmentRow

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`

### What this does
After segments load, fetch suggestions and post-its for the project. Group them by segmentId. Pass to each SegmentRow. Handle accept/reject/resolve callbacks with API calls.

- [ ] **Step 1: Verify API endpoints exist and return correct shape**

Check these endpoints return data:
- `GET /api/projects/[id]/suggestions` → `{ suggestions: [...] }`
- `GET /api/projects/[id]/post-its` → `{ postIts: [...] }`
- `POST /api/suggestions/[id]` with `{ action: "accept" | "reject" }` → updates suggestion
- `PATCH /api/post-its/[id]` with `{ resolved: true }` → resolves post-it
- `DELETE /api/post-its/[id]` → deletes post-it

Read each route file to confirm the shape. If any endpoint is missing or returns different shape, fix it first.

- [ ] **Step 2: Add state and fetch for suggestions + post-its**

In the editor page component, after existing state declarations, add:

```typescript
const [suggestions, setSuggestions] = useState<Record<string, Array<{
  id: string; originalText: string; suggestedText: string; status: string;
  author: { name: string | null; username: string | null };
}>>>({});
const [postIts, setPostIts] = useState<Record<string, Array<{
  id: string; charStart: number; charEnd: number; content: string;
  severity: string; resolved: boolean;
  author: { name: string | null; username: string | null };
}>>>({});
```

Add fetch function (call after segments load):

```typescript
const fetchReviewData = useCallback(async () => {
  if (!project) return;
  try {
    const [sugRes, piRes] = await Promise.all([
      fetch(`/api/projects/${project.id}/suggestions`),
      fetch(`/api/projects/${project.id}/post-its`),
    ]);
    if (sugRes.ok) {
      const data = await sugRes.json();
      const grouped: typeof suggestions = {};
      for (const s of data.suggestions || []) {
        (grouped[s.segmentId] ||= []).push(s);
      }
      setSuggestions(grouped);
    }
    if (piRes.ok) {
      const data = await piRes.json();
      const grouped: typeof postIts = {};
      for (const p of data.postIts || []) {
        (grouped[p.segmentId] ||= []).push(p);
      }
      setPostIts(grouped);
    }
  } catch { /* silent — review data is optional */ }
}, [project]);
```

Call `fetchReviewData()` in the useEffect that loads project data, after segments are set.

- [ ] **Step 3: Add callback handlers**

```typescript
const handleAcceptSuggestion = useCallback(async (suggestionId: string) => {
  const res = await fetch(`/api/suggestions/${suggestionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept" }),
  });
  if (res.ok) fetchReviewData();
}, [fetchReviewData]);

const handleRejectSuggestion = useCallback(async (suggestionId: string) => {
  const res = await fetch(`/api/suggestions/${suggestionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reject" }),
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
```

- [ ] **Step 4: Pass to SegmentRow**

Find where SegmentRow is rendered (inside VirtualSegmentList or direct mapping). Add these props:

```tsx
suggestions={suggestions[segment.id] || []}
postIts={postIts[segment.id] || []}
onAcceptSuggestion={handleAcceptSuggestion}
onRejectSuggestion={handleRejectSuggestion}
onResolvePostIt={handleResolvePostIt}
onDeletePostIt={handleDeletePostIt}
```

- [ ] **Step 5: Verify build**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 6: Commit**

```bash
git add src/app/app/projects/[id]/page.tsx
git commit -m "feat: fetch and pass suggestions + post-its to SegmentRow"
```

---

## Task 4: Create SubmissionCard component

**Files:**
- Create: `src/components/SubmissionCard.tsx`

### What this does
A card showing one student's submission status for an assignment. Shows: student name, progress bar, due date, status badge. Clickable → navigates to the project.

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useRouter } from "next/navigation";

interface SubmissionCardProps {
  submission: {
    id: string;
    projectId: string;
    status: string;
    progressPct: number;
    submittedAt: string | null;
    gradeValue: number | null;
    student: {
      name: string | null;
      username: string | null;
    };
  };
  dueDate: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  in_progress: { bg: "var(--amber-soft)", color: "var(--amber-text)", label: "In Progress" },
  submitted: { bg: "var(--green-soft)", color: "var(--green-text)", label: "Submitted" },
  reviewing: { bg: "var(--purple-soft)", color: "var(--purple-text)", label: "Reviewing" },
  graded: { bg: "var(--accent-soft)", color: "var(--accent)", label: "Graded" },
};

export default function SubmissionCard({ submission, dueDate }: SubmissionCardProps) {
  const router = useRouter();
  const style = STATUS_STYLES[submission.status] || STATUS_STYLES.in_progress;
  const displayName = submission.student.username
    ? `@${submission.student.username}`
    : submission.student.name || "Unknown";

  const isOverdue = dueDate && !submission.submittedAt && new Date(dueDate) < new Date();

  return (
    <div
      onClick={() => router.push(`/app/projects/${submission.projectId}`)}
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        transition: "border-color 150ms, box-shadow 150ms",
        minWidth: 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-focus)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header: name + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)" }}>
          {displayName}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: style.bg,
            color: style.color,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontFamily: "var(--font-ui-family)",
          }}
        >
          {style.label}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "var(--bg-deep)",
          overflow: "hidden",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${submission.progressPct}%`,
            borderRadius: 2,
            background: submission.progressPct >= 100 ? "var(--green)" : "var(--accent)",
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* Footer: progress % + grade or overdue */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-ui-family)" }}>
          {submission.progressPct}%
        </span>
        {submission.gradeValue != null ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-ui-family)" }}>
            {Number(submission.gradeValue)}/20
          </span>
        ) : isOverdue ? (
          <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 500 }}>Overdue</span>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Clean build (component created but not imported anywhere yet)

- [ ] **Step 3: Commit**

```bash
git add src/components/SubmissionCard.tsx
git commit -m "feat: create SubmissionCard component for Task Board"
```

---

## Task 5: Create TaskBoard component

**Files:**
- Create: `src/components/TaskBoard.tsx`

### What this does
A 3-column Kanban board: Pending (no submission yet), In Progress (working), Completed (submitted/graded). Each column renders SubmissionCard instances. Assignment header shows title + due date.

- [ ] **Step 1: Create the component**

```typescript
"use client";

import SubmissionCard from "@/components/SubmissionCard";

interface TaskBoardSubmission {
  id: string;
  projectId: string;
  status: string;
  progressPct: number;
  submittedAt: string | null;
  gradeValue: number | null;
  student: { name: string | null; username: string | null };
}

interface TaskBoardAssignment {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  submissions: TaskBoardSubmission[];
}

interface TaskBoardProps {
  assignments: TaskBoardAssignment[];
  totalStudents: number;
}

interface Column {
  key: string;
  label: string;
  color: string;
  filter: (s: TaskBoardSubmission) => boolean;
}

const COLUMNS: Column[] = [
  {
    key: "pending",
    label: "Pending",
    color: "var(--text-muted)",
    filter: (s) => s.status === "in_progress" && s.progressPct === 0,
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "var(--amber)",
    filter: (s) => s.status === "in_progress" && s.progressPct > 0,
  },
  {
    key: "completed",
    label: "Completed",
    color: "var(--green)",
    filter: (s) => ["submitted", "reviewing", "graded"].includes(s.status),
  },
];

export default function TaskBoard({ assignments, totalStudents }: TaskBoardProps) {
  if (assignments.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
        No assignments yet. Create one to see the Task Board.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {assignments.map((assignment) => (
        <div key={assignment.id}>
          {/* Assignment header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui-family)",
              margin: 0,
            }}>
              {assignment.title}
            </h3>
            {assignment.dueDate && (
              <span style={{
                fontSize: 11,
                color: new Date(assignment.dueDate) < new Date() ? "var(--red)" : "var(--text-muted)",
                fontFamily: "var(--font-ui-family)",
              }}>
                Due {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
            <span style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginLeft: "auto",
              fontFamily: "var(--font-ui-family)",
            }}>
              {assignment.submissions.length}/{totalStudents} students
            </span>
          </div>

          {/* Kanban columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {COLUMNS.map((col) => {
              const items = assignment.submissions.filter(col.filter);
              return (
                <div
                  key={col.key}
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    padding: 10,
                    minHeight: 80,
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: col.color,
                      opacity: 0.7,
                    }} />
                    <span style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-ui-family)",
                    }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginLeft: "auto",
                      fontFamily: "var(--font-ui-family)",
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((s) => (
                      <SubmissionCard
                        key={s.id}
                        submission={s}
                        dueDate={assignment.dueDate}
                      />
                    ))}
                    {items.length === 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>
                        No students
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add src/components/TaskBoard.tsx
git commit -m "feat: create TaskBoard kanban component with 3 columns"
```

---

## Task 6: Add Task Board tab to classroom dashboard

**Files:**
- Modify: `src/app/app/classrooms/[id]/page.tsx`

### What this does
Add a third tab "Task Board" next to Members and Assignments. Needs an API call to get submissions per assignment with student info.

- [ ] **Step 1: Add API endpoint for task board data**

Check if `/api/classrooms/[id]` already returns submissions inside assignments. If not, create a lightweight endpoint or expand the existing one.

The classroom GET endpoint needs to include submissions with student data in each assignment. Check the current response shape and add if missing:

```typescript
// In the assignments include of the GET handler:
assignments: {
  include: {
    submissions: {
      include: {
        student: { select: { name: true, username: true } }
      }
    }
  }
}
```

- [ ] **Step 2: Add TaskBoard tab and state**

In `src/app/app/classrooms/[id]/page.tsx`:

Update the `ClassroomDetail` interface to include submissions in assignments:

```typescript
assignments: Array<{
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  gradingMode: string;
  _count: { submissions: number };
  createdAt: string;
  submissions?: Array<{
    id: string;
    projectId: string;
    status: string;
    progressPct: number;
    submittedAt: string | null;
    gradeValue: number | null;
    student: { name: string | null; username: string | null };
  }>;
}>;
```

Change the tab type:

```typescript
const [tab, setTab] = useState<"members" | "assignments" | "board">("members");
```

Add import:

```typescript
import TaskBoard from "@/components/TaskBoard";
import { LayoutGrid } from "lucide-react";
```

Add "board" to the tab buttons array:

```typescript
{(["members", "assignments", "board"] as const).map((t) => (
  // ... existing button code, add icon/label for "board":
  {t === "board" ? <LayoutGrid size={14} /> : t === "members" ? <Users size={14} /> : <BookOpen size={14} />}
  {t === "board" ? "Task Board" : t === "members" ? `Members (${classroom.members.length})` : `Assignments (${classroom.assignments.length})`}
```

- [ ] **Step 3: Render TaskBoard in the board tab**

After the assignments tab section, add:

```tsx
{/* Task Board Tab */}
{tab === "board" && (
  <TaskBoard
    assignments={classroom.assignments.map(a => ({
      id: a.id,
      title: a.title,
      status: a.status,
      dueDate: a.dueDate,
      submissions: a.submissions || [],
    }))}
    totalStudents={classroom.members.filter(m => m.role === "student").length}
  />
)}
```

- [ ] **Step 4: Verify the classroom GET endpoint includes submissions**

Read `src/app/api/classrooms/[id]/route.ts` and check the Prisma query. If assignments don't include submissions with student data, add the include. Example:

```typescript
assignments: {
  orderBy: { createdAt: "desc" },
  include: {
    _count: { select: { submissions: true } },
    submissions: {
      select: {
        id: true,
        projectId: true,
        status: true,
        progressPct: true,
        submittedAt: true,
        gradeValue: true,
        student: { select: { name: true, username: true } },
      },
    },
  },
},
```

- [ ] **Step 5: Verify build**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 6: Commit**

```bash
git add src/app/app/classrooms/[id]/page.tsx src/app/api/classrooms/[id]/route.ts
git commit -m "feat: add Task Board tab to classroom dashboard"
```

---

## Task 7: Update ESTADO.md

**Files:**
- Modify: `ESTADO.md`

- [ ] **Step 1: Update ESTADO.md**

Update the Fase 22 section to reflect completion. Move completed items from backlog. Update session scope.

- [ ] **Step 2: Commit**

```bash
git add ESTADO.md
git commit -m "docs: update ESTADO.md — Fase 22 complete"
```

---

## Summary

| Task | Track | What | Files | Commit |
|------|-------|------|-------|--------|
| 1 | A | SuggestionInline in SegmentRow | 1 modified | atomic |
| 2 | A | PostItAnchor in SegmentRow | 1 modified | atomic |
| 3 | A | Fetch + pass review data in editor | 1 modified | atomic |
| 4 | B | SubmissionCard component | 1 created | atomic |
| 5 | B | TaskBoard kanban component | 1 created | atomic |
| 6 | B | Task Board tab in classroom | 1-2 modified | atomic |
| 7 | — | Update ESTADO.md | 1 modified | atomic |

**Gate between each task:** `npx next build` + `git diff --stat` + director approval.
**3-strike rule applies to each task independently.**
