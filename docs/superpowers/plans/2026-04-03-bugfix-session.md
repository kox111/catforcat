# Bugfix Session 2026-04-03

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 verified production bugs. Annotate Settings redesign for future session.

**Architecture:** All bugs are independent except crop→propagation dependency. Execute sequentially with build gates.

---

## Block 1: Avatar Crop Fix (Bug 1)

**Root cause hypothesis:** `react-easy-crop` with `objectFit: "contain"` + `minZoom: 0.5` reports `croppedAreaPixels` in image-space coordinates, but when zoom < 1, the reported area can exceed actual image boundaries. Also, if user clicks Save without touching crop, `croppedAreaPixels` may be null (initial state).

**Files:** `src/app/app/settings/page.tsx`

**Fix:** Replace custom `getCroppedImage` with the official react-easy-crop helper pattern that handles all edge cases. Remove `objectFit: "contain"` (which causes coordinate confusion) and use `objectFit: "horizontal-cover"` with `minZoom: 1` instead. The trick: let the Cropper handle fit internally.

- [ ] Remove `objectFit="contain"` and `minZoom={0.5}` from Cropper props
- [ ] Set initial zoom to 1, slider min to 1
- [ ] Rewrite `getCroppedImage` to use createImageBitmap + canvas pattern for reliability:
```typescript
const getCroppedImage = async (): Promise<string | null> => {
  if (!cropImage || !croppedAreaPixels) return null;
  const response = await fetch(cropImage);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    imageBitmap,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, 128, 128,
  );
  imageBitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
};
```
- [ ] Build check

---

## Block 2: Avatar Propagation Verification (Bug 2)

**Root cause hypothesis:** UserPlanProvider fetches avatarUrl on mount. If Settings saves and updates provider state, TopBar/EditorToolbar should re-render. If they don't, the issue is stale context or missing re-render trigger.

**Files:** `src/components/UserPlanProvider.tsx`

**Fix:** Verify the provider value includes avatarUrl and is not memoized away. Add a log or test. If the fetch works but components don't update, ensure the provider value is a new object on state change (not memoized with useMemo that misses avatarUrl dep).

- [ ] Read UserPlanProvider and verify value object includes avatarUrl
- [ ] Verify no stale memoization
- [ ] If found broken, fix

---

## Block 3: TopBar PRO Badge (Bug 3)

**Root cause:** Audit shows TopBar already has shimmer gradient ring and no separate pill. The "Pro plan"/"Free plan" text inside the dropdown is intentional informational text, not a pill. **May already be fixed.** User needs to verify in browser. But I'll double-check there's no standalone PRO badge outside the dropdown.

**Files:** `src/components/TopBar.tsx`

- [ ] Grep for any PRO/Pro badge/pill outside the dropdown
- [ ] If found, remove
- [ ] If not found, mark as already fixed

---

## Block 4: Arrow Direction (Bug 4)

**Root cause:** Currently `expanded ? "rotate(0deg)" : "rotate(180deg)"` which means:
- Collapsed = 180° = ← (wrong)
- Expanded = 0° = → (wrong)

User wants:
- Collapsed = → (indicating "click to expand")
- Expanded = ← (indicating "click to collapse")

**Files:** `src/components/editor/EditorToolbar.tsx`

- [ ] Change to `expanded ? "rotate(180deg)" : "rotate(0deg)"`
- [ ] Build check

---

## Block 5: SaveDot Visibility (Bug 5)

**Root cause:** Audit confirms `mode="full"` (dot+text) exists and is used for collapsed state, `mode="dot"` for expanded. If not visible, the issue may be CSS (opacity, display) or the phase being "idle" too often.

**Files:** `src/components/editor/SaveDot.tsx`

- [ ] Check "idle" phase behavior in "full" mode — if idle, nothing renders. The dot should ALWAYS show (even when idle)
- [ ] Fix: in "full" mode, always render the dot (not conditional on phase), only the text is conditional
- [ ] In "dot" mode, always render the dot (opacity 1 when active, 0.3 when idle instead of 0)
- [ ] Build check

---

## Block 6: Split/Merge Frontend (Bug 6)

**Root cause:** Audit shows handlers are wired to context menu. API routes fixed in 152fa7b. If still not working, the issue is likely the disabled condition or the state refresh after API call.

**Files:** `src/app/app/projects/[id]/page.tsx`

- [ ] Check if disabled conditions are too strict (e.g., always true)
- [ ] Check if API response format matches what setSegments expects
- [ ] Add console.log temporarily to trace the flow
- [ ] Fix any broken connection found
- [ ] Build check

---

## Block 7: Recent Pills (Bug 7)

**Status:** Already removed in commit 63e04e3. User now wants: show only when +6 projects, or convert to quick search.

**Files:** `src/app/app/projects/page.tsx`

- [ ] Add quick search filter input at top of projects grid
- [ ] Filter projects by name as user types
- [ ] Build check

---

## Block 8: Settings Redesign Annotation (Bug 8)

**Files:** `ESTADO.md`

- [ ] Add "Settings UX redesign" to backlog with description
- [ ] NOT implementing now — just documenting for future session
