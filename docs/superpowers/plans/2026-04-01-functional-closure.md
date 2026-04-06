# Functional Closure — 6 Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 6 remaining functional gaps identified by the full audit so the product is 100% functional.

**Architecture:** Each block is independent — no shared state between fixes. All changes are backend/API + minimal UI wiring. No visual/CSS changes.

**Tech Stack:** Next.js 16 App Router, Prisma 6, TypeScript strict, React 19

**Gate Protocol:** Build + diff after each block. No block starts without prior block approved.

---

## Task 1: DELETE de proyectos

**Files:**
- Modify: `src/app/api/projects/[id]/route.ts` (add DELETE handler after existing PATCH)

- [ ] **Step 1: Add DELETE handler**

```typescript
// DELETE /api/projects/[id] — delete project and all related data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
```

Prisma schema has `onDelete: Cascade` on: Segment, QARule, ProjectMember, Invitation, Assignment (template), Submission (project). One `delete()` handles everything.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/projects/[id]/route.ts
git commit -m "feat: add DELETE handler for projects — cascade deletes all related data"
```

---

## Task 2: UI para editar assignment

**Discovery:** PATCH `/api/assignments/[id]` already exists (lines 56-87). Accepts: title, instructions, dueDate, status. Only professor can edit.

**Files:**
- Modify: `src/app/app/classrooms/[id]/assignments/[aid]/page.tsx` (add Edit button + inline edit modal)

- [ ] **Step 1: Add edit state and modal to assignment page**

Add state variables for edit mode:
```typescript
const [editing, setEditing] = useState(false);
const [editTitle, setEditTitle] = useState("");
const [editInstructions, setEditInstructions] = useState("");
const [editDueDate, setEditDueDate] = useState("");
const [saving, setSaving] = useState(false);
```

Add edit handler:
```typescript
const startEdit = () => {
  if (!assignment) return;
  setEditTitle(assignment.title);
  setEditInstructions(assignment.instructions || "");
  setEditDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "");
  setEditing(true);
};

const saveEdit = async () => {
  setSaving(true);
  try {
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        instructions: editInstructions || null,
        dueDate: editDueDate || null,
      }),
    });
    if (res.ok) {
      await fetchAssignment();
      setEditing(false);
    }
  } catch { /* silent */ }
  setSaving(false);
};
```

- [ ] **Step 2: Add Edit button in header (professor only)**

After the assignment title in the header, add edit button:
```tsx
{myRole === "professor" && !editing && (
  <button onClick={startEdit} style={{
    background: "none", border: "none", color: "var(--accent)",
    cursor: "pointer", padding: "4px 8px", fontSize: 13,
    fontFamily: "var(--font-ui-family)",
  }}>
    <Pencil size={14} /> Edit
  </button>
)}
```

- [ ] **Step 3: Add inline edit form (replaces header when editing)**

When `editing` is true, show form fields for title, instructions, dueDate with Save/Cancel buttons.

- [ ] **Step 4: Build check**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/app/app/classrooms/[id]/assignments/[aid]/page.tsx
git commit -m "feat: add edit assignment UI — title, instructions, due date"
```

---

## Task 3: Fix context menu del editor

**Discovery:** The wiring is complete: page.tsx → VirtualSegmentList → SegmentRow. SegmentRow calls `e.preventDefault()` on line 298. The SegmentContextMenu uses `createPortal`.

**Hypothesis:** The `onContextMenu` on the outer `<div>` (line 296) fires correctly, BUT there may be a textarea or input element inside SegmentRow that has its own context menu handler that doesn't propagate, OR the right-click lands on a child element that captures the event before the div.

**Files:**
- Investigate: `src/components/editor/SegmentRow.tsx` — find all child elements that could capture contextmenu
- Modify: `src/components/editor/SegmentRow.tsx` — ensure preventDefault on the right target

- [ ] **Step 1: Investigate — read SegmentRow textarea/input elements**

Check if the target textarea (where users type translations) has its own onContextMenu or if the event bubbles correctly to the parent div.

- [ ] **Step 2: Fix — add onContextMenu to the target textarea**

The most likely issue: the textarea element captures right-click natively. Add `onContextMenu` handler directly to the textarea that calls the parent handler:

```typescript
onContextMenu={(e) => {
  if (onContextMenu) {
    e.preventDefault();
    onContextMenu(e);
  }
}}
```

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/SegmentRow.tsx
git commit -m "fix: context menu fires on textarea right-click in editor"
```

---

## Task 4: Botón volver en assignment page

**Files:**
- Modify: `src/app/app/classrooms/[id]/assignments/[aid]/page.tsx`

- [ ] **Step 1: Add back link at top of page**

Import ArrowLeft from lucide-react. Add navigation link before the assignment header:

```tsx
<Link
  href={`/app/classrooms/${classroomId}`}
  style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    color: "var(--text-secondary)", fontSize: 13,
    fontFamily: "var(--font-ui-family)", textDecoration: "none",
    marginBottom: 12,
  }}
>
  <ArrowLeft size={14} />
  Back to classroom
</Link>
```

The `classroomId` comes from the route param `[id]`.

- [ ] **Step 2: Build check**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/app/classrooms/[id]/assignments/[aid]/page.tsx
git commit -m "feat: add back-to-classroom link on assignment page"
```

---

## Task 5: Regenerar invite code

**Files:**
- Create: `src/app/api/classrooms/[id]/regenerate-code/route.ts`
- Modify: `src/app/app/classrooms/[id]/page.tsx` (add Regenerate button)

- [ ] **Step 1: Create regenerate-code endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRAD-${code}`;
}

// POST /api/classrooms/[id]/regenerate-code
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom || classroom.professorId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let newCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.classroom.findUnique({ where: { inviteCode: newCode } });
      if (!existing) break;
      newCode = generateInviteCode();
      attempts++;
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: { inviteCode: newCode },
    });

    return NextResponse.json({ inviteCode: updated.inviteCode });
  } catch (err) {
    console.error("Regenerate code error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add Regenerate button in classroom dashboard**

After the copy button in the invite code section, add:

```tsx
<button
  onClick={regenerateCode}
  title="Generate new invite code"
  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
>
  <RefreshCw size={14} />
</button>
```

Handler:
```typescript
const regenerateCode = async () => {
  if (!confirm("Generate a new invite code? The old code will stop working.")) return;
  try {
    const res = await fetch(`/api/classrooms/${id}/regenerate-code`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setClassroom((prev: any) => prev ? { ...prev, inviteCode: data.inviteCode } : prev);
    }
  } catch { /* silent */ }
};
```

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/classrooms/[id]/regenerate-code/route.ts src/app/app/classrooms/[id]/page.tsx
git commit -m "feat: regenerate invite code for classrooms"
```

---

## Task 6: Investigar PDF segmenter

**Current state:** `src/app/api/files/parse/route.ts` lines 88-125 uses `unpdf` library.

**Current logic:**
1. Extract text via `unpdf.extractText()`
2. Split by newlines
3. Join lines heuristically: if line ends with `.!?:;` AND next starts with uppercase → new paragraph. Otherwise concatenate.

**Known problems:**
- Page numbers get merged into paragraphs
- Headers/footers repeated on every page get mixed in
- Table of contents entries become one giant paragraph
- Multi-column PDFs interleave columns
- Footnotes merge with body text

**This task is RESEARCH ONLY.** Investigate, propose fix, get approval before implementing.

- [ ] **Step 1: Research unpdf capabilities**

Check unpdf docs/API for structured extraction (pages, blocks, positions). Check if it provides layout info.

- [ ] **Step 2: Research alternative libraries**

Compare: unpdf, pdf-parse, pdfjs-dist, pdf2json. Focus on layout-aware extraction.

- [ ] **Step 3: Propose improved heuristics or library switch**

Document findings and present recommendation to user.
