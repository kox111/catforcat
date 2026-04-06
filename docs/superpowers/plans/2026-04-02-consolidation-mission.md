# Consolidation Mission — Bugs + Editor UX Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 production bugs and redesign TM/Glossary as floating resizable windows with notification system.

**Architecture:** 6 blocks organized by dependency. Block A (avatar system) is foundational — TopBar and EditorToolbar both depend on UserPlanProvider exposing avatarUrl. Block B (toolbar fixes) and Block C (editor layout) are independent. Block D (split/merge) is independent. Block E (projects page) is independent. Block F (floating panels) is the major redesign — depends on Block C being done first since it replaces the bottom panel.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, CSS variables (6 themes), Lucide icons, Zustand-compatible patterns.

**Skills/MCPs per block:**
- Block A, B, C, E: ui-ux-pro-max (visual consistency)
- Block F: ui-ux-pro-max + 21st.dev Magic MCP (floating panel component reference)
- All blocks: prefers-reduced-motion, aria-labels, 0 hardcoded colors

---

## Dependency Graph

```
Block A (Avatar System) ──────────────────── independent
Block B (Toolbar Fixes) ──────────────────── independent
Block C (Editor Layout + Source/Target tabs)─┐
Block D (Split/Merge) ───────────────────── independent
Block E (Projects Page) ─────────────────── independent
Block F (Floating TM/Glossary) ──────────── depends on C
```

**Parallelizable:** A + B + C + D + E can all run in parallel. F runs after C.

---

## File Map

| File | Block | Action | Responsibility |
|------|-------|--------|---------------|
| `src/components/UserPlanProvider.tsx` | A | Modify | Add `avatarUrl` to context, fetch from `/api/settings` |
| `src/components/TopBar.tsx` | A | Modify | Use avatarUrl from provider, gradient ring PRO (no pill), add font size to dropdown |
| `src/components/editor/EditorToolbar.tsx` | A, B | Modify | Use avatarUrl from provider, fix arrow direction, fix SaveDot mode |
| `src/app/app/settings/page.tsx` | A | Modify | Add center-crop to avatar upload |
| `src/components/editor/SaveDot.tsx` | B | Modify | Add mode "full" (dot + text) for collapsed state |
| `src/app/app/projects/page.tsx` | E | Modify | Remove Recent pills section |
| `src/app/app/projects/[id]/page.tsx` | C, D, F | Modify | Fix editor gap, source/target tabs, wire split/merge, replace bottom panel with floating panels |
| `src/components/editor/FloatingPanel.tsx` | F | Create | Reusable floating resizable panel (left or right anchor) |
| `src/components/editor/TMPanel.tsx` | F | Modify | Adapt to work inside FloatingPanel |
| `src/components/editor/GlossaryPanel.tsx` | F | Modify | Adapt to work inside FloatingPanel |

---

## Block A: Avatar System (Bugs 1, 2, 3)

### Task A.1: UserPlanProvider — expose avatarUrl

**Files:**
- Modify: `src/components/UserPlanProvider.tsx`

- [ ] **Step 1: Add avatarUrl to context type and state**

Change the context type from `{ plan: string; loading: boolean }` to include avatarUrl:

```typescript
interface UserPlanContextType {
  plan: string;
  avatarUrl: string | null;
  loading: boolean;
}
```

Default context value: `{ plan: "free", avatarUrl: null, loading: true }`.

Add `avatarUrl` state alongside plan state. In the fetch from `/api/settings`, extract `data.avatarUrl` and set it.

- [ ] **Step 2: Expose avatarUrl in the provider value**

The provider value becomes `{ plan, avatarUrl, loading }`.

- [ ] **Step 3: Export a refreshUserPlan function or add avatarUrl setter**

Add a `setAvatarUrl` function to the context so Settings page can update it after upload without full page reload:

```typescript
interface UserPlanContextType {
  plan: string;
  avatarUrl: string | null;
  loading: boolean;
  setAvatarUrl: (url: string | null) => void;
}
```

- [ ] **Step 4: Build check**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds (TS errors in TopBar/EditorToolbar are expected — they don't use avatarUrl yet).

---

### Task A.2: TopBar — gradient ring PRO + user photo + dropdown redesign

**Files:**
- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Remove PRO pill, use gradient ring shimmer instead**

Find the PRO pill element (conditional `{isPro && (...)}` block showing "PRO" text). Delete the entire pill. The PRO status is now communicated solely through the avatar's animated gradient ring (same as EditorToolbar).

- [ ] **Step 2: Use avatarUrl from UserPlanProvider**

Destructure `avatarUrl` from `useUserPlan()`. In the avatar circle, if `avatarUrl` exists, render an `<img>` instead of initials:

```tsx
{avatarUrl ? (
  <img src={avatarUrl} alt="" style={{
    width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover",
  }} />
) : (
  <div style={{/* existing initials styles */}}>
    {userInitials}
  </div>
)}
```

- [ ] **Step 3: Add shimmer animation for PRO users**

The avatar outer ring div should use the same proShimmer animation as EditorToolbar:
- `backgroundSize: isPro ? "200% 200%" : undefined`
- `animation: isPro ? "proShimmer 3s ease infinite" : undefined`
- Add `@keyframes proShimmer` to the component's style block if not already present.

- [ ] **Step 4: Add font size picker to dropdown**

Add `Type` to Lucide imports. Add FONT_SIZE_PRESETS constant. The dropdown should include font size picker between Theme and Settings, matching EditorToolbar's dropdown layout:

```
User info (name + @username + plan)
---
Theme picker (6 dots)
Font size (Compact/Default/Large)
---
Settings
Changelog
---
Upgrade to Pro (if free)
---
Sign out
```

Note: TopBar needs `editorFontSize` and `onFontSizeChange` props passed down from the layout or stored in localStorage.

- [ ] **Step 5: Show @username in dropdown**

In the user info section of the dropdown, add the @username below the name. Fetch it from session or add it to the settings API response. Display as `fontSize: 11, color: "var(--text-muted)"`.

- [ ] **Step 6: Build check**

Run: `npx next build 2>&1 | tail -5`

---

### Task A.3: EditorToolbar — use avatarUrl

**Files:**
- Modify: `src/components/editor/EditorToolbar.tsx`

- [ ] **Step 1: Use avatarUrl from UserPlanProvider**

Destructure `avatarUrl` from `useUserPlan()`. In the avatar div, render `<img>` when avatarUrl exists, same pattern as TopBar.

- [ ] **Step 2: Build check**

---

### Task A.4: Settings — center-crop avatar upload

**Files:**
- Modify: `src/app/app/settings/page.tsx`

- [ ] **Step 1: Change resize logic to center-crop square**

In `handleAvatarUpload`, after loading the image into a canvas, instead of just scaling:

```typescript
const MAX = 128;
const img = new Image();
img.onload = () => {
  const canvas = document.createElement("canvas");
  canvas.width = MAX;
  canvas.height = MAX;
  const ctx = canvas.getContext("2d")!;
  // Center-crop: take the largest square from the center
  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;
  ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX, MAX);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  // ... save
};
```

- [ ] **Step 2: Update UserPlanProvider after upload**

After successful PATCH, call `setAvatarUrl(dataUrl)` from the UserPlanProvider context so all components update immediately.

- [ ] **Step 3: Build check**

---

### Task A.5: Commit Block A

```bash
git add src/components/UserPlanProvider.tsx src/components/TopBar.tsx src/components/editor/EditorToolbar.tsx src/app/app/settings/page.tsx
git commit -m "fix: avatar system — photo propagation, PRO gradient ring, center-crop

- UserPlanProvider: expose avatarUrl + setAvatarUrl in context
- TopBar: remove PRO pill, use gradient ring shimmer, show user photo, add font size + @username to dropdown
- EditorToolbar: show user photo from provider
- Settings: center-crop to 128x128 on upload, update provider immediately"
```

---

## Block B: Toolbar Fixes (Bugs 5, 6)

### Task B.1: Invert arrow directions

**Files:**
- Modify: `src/components/editor/EditorToolbar.tsx`

- [ ] **Step 1: Swap the rotation**

The chevron currently rotates 180deg when expanded. The user reports this is inverted: collapsed should point LEFT (because expanding pushes icons left), expanded should point RIGHT (because collapsing goes right).

Find the ChevronRight transform:
```tsx
// CURRENT (wrong):
transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
// FIX:
transform: expanded ? "rotate(0deg)" : "rotate(180deg)"
```

This makes ChevronRight point RIGHT when expanded (indicating "click to collapse right") and point LEFT when collapsed (indicating "click to expand left").

- [ ] **Step 2: Build check**

---

### Task B.2: Fix SaveDot — collapsed shows dot + text

**Files:**
- Modify: `src/components/editor/SaveDot.tsx`
- Modify: `src/components/editor/EditorToolbar.tsx`

- [ ] **Step 1: Add "full" mode to SaveDot**

The current SaveDot has `mode: "text" | "dot"`. The spec now requires:
- **Collapsed:** dot + text (both visible)
- **Expanded:** dot only

Add a third mode `"full"` that renders BOTH the dot and the typewriter text (the original behavior before the redesign, but without the dot being a separate element — just the dot inline with text):

```typescript
mode: "text" | "dot" | "full";
```

For `mode === "full"`: render the 7px dot followed by the typewriter text with `gap: 5` between them. This is essentially the old "non-compact" render but with the updated colors (saving = accent, saved = text-muted, error = red-text).

- [ ] **Step 2: Update EditorToolbar to use "full" when collapsed**

```tsx
<SaveDot
  isSaving={saving}
  lastSavedAt={lastSavedAt ?? null}
  saveError={saveError ?? null}
  mode={expanded ? "dot" : "full"}
/>
```

- [ ] **Step 3: Build check**

---

### Task B.3: Commit Block B

```bash
git add src/components/editor/EditorToolbar.tsx src/components/editor/SaveDot.tsx
git commit -m "fix: toolbar arrow direction inverted + save indicator shows dot+text when collapsed"
```

---

## Block C: Editor Layout (Bugs 8, 9, 10)

### Task C.1: Reduce gap between editor and bottom panel

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`

- [ ] **Step 1: Reduce bottom panel margin**

Find the bottom panel container (around line 2347): `margin: "0 20px 8px 20px"`. Change to `margin: "0 0 0 0"` — remove all margins. The panel should feel connected to the editor above it, not floating separately.

- [ ] **Step 2: Remove or reduce gap above panel**

Check if there's padding/margin on the segment list container that creates space before the panel. If the editor area and panel are in a flex column, ensure `gap` is 0 or at most 1px (a subtle divider line).

- [ ] **Step 3: Build check**

---

### Task C.2: Visually integrate bottom panel

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`

- [ ] **Step 1: Match panel background to editor**

The panel should use `background: var(--bg-deep)` (same as the editor area) instead of `var(--bg-panel)` or any different shade. Remove `border`, `borderRadius`, and `boxShadow` from the panel container — it's part of the editor, not a separate card.

- [ ] **Step 2: Add subtle top divider only**

Replace the full border with a single top border: `borderTop: "1px solid var(--border)"`. This creates a clean separation without making it look like a separate component.

- [ ] **Step 3: Build check**

---

### Task C.3: Source/Target as notebook tab separators

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx` (or the component that renders the column headers)

- [ ] **Step 1: Identify current source/target labels**

Find where "SOURCE — EN-US" and "TARGET — ES-ES" are rendered. These are likely in the editor page or in a header component above the segment columns.

- [ ] **Step 2: Restyle as notebook tabs**

Replace plain text with tab-like elements:

```tsx
<div style={{
  display: "flex",
  alignItems: "center",
  gap: 0,
  borderBottom: "2px solid var(--border)",
}}>
  <div style={{
    padding: "8px 16px",
    fontFamily: "var(--font-ui-family)",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    borderBottom: "2px solid var(--accent)",
    marginBottom: -2,
    background: "var(--bg-panel)",
    borderRadius: "6px 6px 0 0",
    borderTop: "1px solid var(--border)",
    borderLeft: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
  }}>
    SOURCE — {srcLang.toUpperCase()}
  </div>
  {/* ... same for TARGET */}
</div>
```

The tabs should look like physical folder tabs — with a bottom edge that blends into the content below. The active column's tab has a colored underline.

- [ ] **Step 3: Build check**

---

### Task C.4: Commit Block C

```bash
git add src/app/app/projects/[id]/page.tsx
git commit -m "fix: editor layout — remove panel gap, integrate visually, notebook tab headers"
```

---

## Block D: Split/Merge (Bug 7)

### Task D.1: Verify and fix split/merge wiring

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx` (if handlers are broken)
- Possibly: `src/components/editor/SegmentContextMenu.tsx`

- [ ] **Step 1: Trace the data flow**

Read `handleSplitSegment` (lines 925-949) and `handleMergeSegment` (lines 951-977) in the editor page. Verify:
1. The function is defined and not empty
2. The API call uses the correct endpoint and body format
3. The local state update after success is correct
4. The function is passed to SegmentContextMenu correctly

- [ ] **Step 2: Check context menu item wiring**

In the editor page, find where context menu items are defined (around lines 2080-2100). Verify that the `action` callback for split and merge actually calls the handler functions. Look for:
- Correct `segmentId` being passed
- `disabled` logic that might always be true (blocking the action)

- [ ] **Step 3: Test the API endpoints directly**

Check that the API routes exist and handle the request:
- `src/app/api/projects/[id]/segments/split/route.ts` — POST handler exists?
- `src/app/api/projects/[id]/segments/merge/route.ts` — POST handler exists?

- [ ] **Step 4: Fix any broken connections found**

Apply minimal fixes to connect the handlers. Common issues:
- Handler not passed as prop
- Wrong parameter name (segmentId vs id)
- API expecting different body format
- Missing state refresh after mutation

- [ ] **Step 5: Build check**

---

### Task D.2: Commit Block D

```bash
git add src/app/app/projects/[id]/page.tsx src/components/editor/SegmentContextMenu.tsx
git commit -m "fix: wire split/merge segment handlers to context menu"
```

---

## Block E: Projects Page (Bug 4)

### Task E.1: Remove Recent pills

**Files:**
- Modify: `src/app/app/projects/page.tsx`

- [ ] **Step 1: Remove the Recent Projects section**

Find the "Recent Projects Widget" section (lines 265-336). Delete the entire block — the container div with the pills and the heading. The project cards below already show all projects with enough context.

- [ ] **Step 2: Ensure no broken references**

Check if any state or variable was only used by the Recent section. Clean up unused variables.

- [ ] **Step 3: Build check**

---

### Task E.2: Commit Block E

```bash
git add src/app/app/projects/page.tsx
git commit -m "fix: remove redundant Recent pills from projects page"
```

---

## Block F: Floating TM/Glossary Panels (Major Redesign)

**Gate:** ui-ux-pro-max consulted + 21st.dev Magic MCP queried for floating panel reference.

### Task F.1: Create FloatingPanel component

**Files:**
- Create: `src/components/editor/FloatingPanel.tsx`

- [ ] **Step 1: Define the component interface**

```typescript
interface FloatingPanelProps {
  /** Which side the panel anchors to */
  anchor: "left" | "right";
  /** Current display mode */
  mode: "maximized" | "preview" | "minimized";
  /** Callback when mode changes */
  onModeChange: (mode: "maximized" | "preview" | "minimized") => void;
  /** Panel title for header */
  title: string;
  /** Icon for header */
  icon: React.ReactNode;
  /** Whether the panel has active matches/content to show */
  hasNotification: boolean;
  /** Panel content */
  children: React.ReactNode;
  /** Initial width (resizable) */
  defaultWidth?: number;
  /** Initial height (resizable) */
  defaultHeight?: number;
}
```

- [ ] **Step 2: Implement the 3 modes**

**Minimized:** Panel is invisible — only the toolbar icon represents it. Return `null`.

**Preview:** Small floating card (240px wide, 200px tall) anchored to the left or right edge of the editor. Shows a summary of matches. Position: `position: absolute`, bottom: 80px, left: 0 (or right: 0 for right-anchored). Subtle shadow, rounded corners, header with title + mode toggles.

**Maximized:** Larger panel (400px wide default, height follows editor). Same absolute positioning but taller. Fully resizable via drag handle on the inner edge (right edge for left-anchored, left edge for right-anchored) and bottom edge.

- [ ] **Step 3: Implement resize drag**

Add a 4px drag handle on the inner vertical edge. On mousedown, track mouse movement and update width. Clamp between 200px and 60% of viewport width. Use `cursor: col-resize` on the handle.

Add a 4px drag handle on the bottom edge for height resize. Clamp between 150px and 80% of editor height.

- [ ] **Step 4: Add header with mode toggles**

Header contains: icon + title on left, 3 small buttons on right:
- Preview (small card icon) — sets mode to "preview"
- Maximize (expand icon) — sets mode to "maximized"  
- Close (X icon) — sets mode to "minimized"

Active mode button gets `background: var(--bg-hover)`.

- [ ] **Step 5: Add slide-in animation**

Panel enters with transform animation:
- Left-anchored: `translateX(-100%) → translateX(0)` over 250ms ease
- Right-anchored: `translateX(100%) → translateX(0)` over 250ms ease
- Respect `prefers-reduced-motion`

- [ ] **Step 6: Build check**

---

### Task F.2: Integrate TM in FloatingPanel (left side)

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`
- Modify: `src/components/editor/TMPanel.tsx`

- [ ] **Step 1: Add TM panel mode state**

In the editor page, add state:
```typescript
const [tmPanelMode, setTmPanelMode] = useState<"maximized" | "preview" | "minimized">("minimized");
```

- [ ] **Step 2: Add TM match notification state**

Track whether TM has matches for the current segment:
```typescript
const [tmHasMatches, setTmHasMatches] = useState(false);
```

Wire `TMPanel.onMatchesUpdate` to set this: `setTmHasMatches(matches.length > 0)`.

- [ ] **Step 3: Wire toolbar TM button to notification + toggle**

In EditorToolbar, the TM button should:
- Show accent color when `tmHasMatches` is true (notification glow)
- On click: cycle through modes (minimized → preview → maximized → minimized) or toggle between minimized and last used mode

Pass `tmHasMatches` as a prop to EditorToolbar. In the TM button styling:
```tsx
color: tmHasMatches ? "var(--accent)" : toolIconStyle.color
```

- [ ] **Step 4: Render TMPanel inside FloatingPanel**

In the editor page, after the segment list and before the old bottom panel:

```tsx
{tmPanelMode !== "minimized" && (
  <FloatingPanel
    anchor="left"
    mode={tmPanelMode}
    onModeChange={setTmPanelMode}
    title="TM Matches"
    icon={<Languages size={14} />}
    hasNotification={tmHasMatches}
  >
    <TMPanel
      sourceText={activeSourceText}
      srcLang={srcLang}
      tgtLang={tgtLang}
      isActive={true}
      onApplyMatch={handleApplyTMMatch}
      onMatchesUpdate={(m) => setTmHasMatches(m.length > 0)}
    />
  </FloatingPanel>
)}
```

- [ ] **Step 5: Build check**

---

### Task F.3: Integrate Glossary in FloatingPanel (right side)

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`
- Modify: `src/components/editor/GlossaryPanel.tsx`

- [ ] **Step 1: Add Glossary panel mode and notification state**

Same pattern as TM:
```typescript
const [glossaryPanelMode, setGlossaryPanelMode] = useState<"maximized" | "preview" | "minimized">("minimized");
const [glossaryHasTerms, setGlossaryHasTerms] = useState(false);
```

- [ ] **Step 2: Wire toolbar Glossary button to notification + toggle**

Same pattern as TM: Glossary button glows with accent color when terms found.

- [ ] **Step 3: Render GlossaryPanel inside FloatingPanel**

```tsx
{glossaryPanelMode !== "minimized" && (
  <FloatingPanel
    anchor="right"
    mode={glossaryPanelMode}
    onModeChange={setGlossaryPanelMode}
    title="Glossary"
    icon={<Book size={14} />}
    hasNotification={glossaryHasTerms}
  >
    <GlossaryPanel
      sourceText={activeSourceText}
      srcLang={srcLang}
      tgtLang={tgtLang}
      isActive={true}
      onInsertTerm={handleInsertGlossaryTerm}
      onTermsFound={(t) => setGlossaryHasTerms(t.length > 0)}
    />
  </FloatingPanel>
)}
```

- [ ] **Step 4: Build check**

---

### Task F.4: Remove old bottom panel

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`

- [ ] **Step 1: Remove the entire bottom panel section**

Delete the bottom panel container, drag handle, tab bar, and all related state:
- `bottomPanelHeight` state
- `bottomPanelCollapsed` state
- `bottomTab` state
- The entire bottom panel JSX block (lines ~2340-2590)
- The drag handler logic

The TM and Glossary are now in floating panels. The bottom of the editor should be clean — just the segment list ending at the bottom edge.

- [ ] **Step 2: Clean up unused imports and state**

Remove any state variables, refs, and handler functions that were only used by the bottom panel.

- [ ] **Step 3: Update EditorToolbar props**

Remove `activePanel` and `onPanelToggle` props if they were only used for the bottom panel tabs. Replace with the new props:
- `tmHasMatches: boolean`
- `glossaryHasTerms: boolean`
- `onTmToggle: () => void`
- `onGlossaryToggle: () => void`

- [ ] **Step 4: Build check**

---

### Task F.5: Commit Block F

```bash
git add src/components/editor/FloatingPanel.tsx src/components/editor/TMPanel.tsx src/components/editor/GlossaryPanel.tsx src/components/editor/EditorToolbar.tsx src/app/app/projects/[id]/page.tsx
git commit -m "feat: floating TM/Glossary panels with notification system

- FloatingPanel: reusable component with 3 modes (maximized/preview/minimized)
- Resizable via drag handles (width + height)
- TM anchored left, Glossary anchored right
- Toolbar icons glow when matches/terms found
- Removed fixed bottom panel — tools come to the translator
- Slide-in animation 250ms, prefers-reduced-motion respected"
```

---

## Final: Build + Push

- [ ] **Final build check:** `npx next build`
- [ ] **Git diff --stat:** verify only expected files changed
- [ ] **Push:** `git push`

---

## Self-Review Checklist

| Bug # | Description | Task | Covered? |
|-------|-------------|------|----------|
| 1 | TopBar PRO as pill → gradient ring | A.2 | YES |
| 2 | Avatar photo not propagating | A.1, A.2, A.3 | YES |
| 3 | Avatar no crop | A.4 | YES |
| 4 | Recent pills redundant | E.1 | YES |
| 5 | Arrow directions inverted | B.1 | YES |
| 6 | Save indicator incomplete | B.2 | YES |
| 7 | Split/Merge not working | D.1 | YES |
| 8 | Absurd gap editor↔panel | C.1 | YES |
| 9 | Panel visually disconnected | C.2 | YES |
| 10 | Source/Target generic labels | C.3 | YES |
| Major | Floating TM/Glossary | F.1-F.4 | YES |
