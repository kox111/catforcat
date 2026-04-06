# EditorToolbar Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite EditorToolbar as a single unified bar with collapsed/expanded states, animated save text/dot, and avatar dropdown with theme + font size picker.

**Architecture:** Complete rewrite of EditorToolbar.tsx (single file, ~800 lines → ~750 lines). Refactor SaveDot.tsx to support `mode: "text" | "dot"` instead of `compact: boolean`. Remove QA from primary icons, move to expanded set. Export and Fullscreen move to expanded set. Font size selector added to avatar dropdown.

**Tech Stack:** React 19, TypeScript strict, Lucide icons, CSS variables (6 themes), inline styles with CSS-in-JS transitions.

**Spec:** `docs/superpowers/specs/2026-04-02-editor-toolbar-redesign.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/editor/SaveDot.tsx` | Modify | Change prop from `compact` to `mode: "text" \| "dot"`. Text mode = word only (no dot). Dot mode = dot only (no text). |
| `src/components/editor/EditorToolbar.tsx` | Rewrite | Single unified bar: collapsed (essentials + save text + avatar) / expanded (secondary icons + save dot, no avatar) |

---

## Task 1: Refactor SaveDot — `mode` prop replaces `compact`

**Files:**
- Modify: `src/components/editor/SaveDot.tsx`

The current SaveDot has `compact: boolean` where `compact=true` shows dot-only and `compact=false` shows dot+text. The new design needs:
- `mode="text"`: **text only** ("Saved"/"Saving"/"Error"), NO dot, typewriter animation
- `mode="dot"`: **dot only**, pulse animation when saving

- [ ] **Step 1: Change interface and prop**

In `SaveDot.tsx`, replace the `SaveDotProps` interface:

```typescript
interface SaveDotProps {
  isSaving: boolean;
  lastSavedAt: number | null;
  saveError: string | null;
  /** "text" = word only (Saved/Saving/Error), "dot" = colored dot only */
  mode: "text" | "dot";
}
```

Change the function signature default from `compact = false` to `mode`:

```typescript
export default function SaveDot({
  isSaving,
  lastSavedAt,
  saveError,
  mode,
}: SaveDotProps) {
```

- [ ] **Step 2: Rewrite the dot-only render (mode="dot")**

Replace the old `if (compact)` block. The dot-only mode renders a 7px circle with color based on phase, pulse when saving, fade-in transition:

```tsx
if (mode === "dot") {
  return (
    <>
      <style>{`
        @keyframes saveDotPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        aria-label={
          phase === "saving" ? "Saving" : phase === "saved" ? "Saved" : phase === "error" ? "Save error" : "Ready"
        }
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dotColor,
          transition: "background 400ms ease, opacity 200ms ease",
          animation: dotAnimation,
          flexShrink: 0,
          opacity: phase === "idle" ? 0 : 1,
        }}
      />
    </>
  );
}
```

- [ ] **Step 3: Rewrite the text-only render (mode="text")**

Replace the old full render block. Text mode renders ONLY the word — no dot circle. Keep all existing typewriter logic (savingChars, savedChars, phase transitions, reduced motion). Remove the dot `<div>` from the JSX. The text container should have `minWidth: 50` to prevent layout shift.

Key changes from old full mode:
- Remove the 7px dot div entirely
- Remove the wrapper `gap: 5` (no dot to space from)
- Keep the typewriter overlay system (Saving slides up, Saved slides in)
- Colors: saving = `var(--accent)`, saved = `var(--text-muted)`, error = `var(--red-text)`

```tsx
/* Text-only mode */
return (
  <>
    <style>{`
      @keyframes saveDotPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `}</style>
    <div style={{ display: "flex", alignItems: "center", height: 20 }}>
      {phase === "error" ? (
        <span style={{
          fontFamily: "var(--font-ui-family)", fontSize: 11, fontWeight: 400,
          color: "var(--red-text)", whiteSpace: "nowrap",
        }}>
          Error
        </span>
      ) : reduceMotion ? (
        phase === "saving" ? (
          <span style={{
            fontFamily: "var(--font-ui-family)", fontSize: 11, fontWeight: 400,
            color: "var(--accent)", whiteSpace: "nowrap",
          }}>
            Saving
          </span>
        ) : phase === "saved" ? (
          <span style={{
            fontFamily: "var(--font-ui-family)", fontSize: 11, fontWeight: 400,
            color: "var(--text-muted)", whiteSpace: "nowrap",
          }}>
            Saved
          </span>
        ) : null
      ) : phase === "idle" ? null : (
        <div style={{ position: "relative", overflow: "hidden", height: 16, minWidth: 50 }}>
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            display: "flex", alignItems: "center",
            transform: `translateY(${phase === "saving" ? 0 : -14}px)`,
            opacity: phase === "saving" ? 1 : 0,
            transition: "transform 200ms ease, opacity 200ms ease",
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontFamily: "var(--font-ui-family)", fontSize: 11, fontWeight: 400, color: "var(--accent)" }}>
              {SAVING_TEXT.split("").map((ch, i) => (
                <span key={i} style={{ display: "inline-block", opacity: i < savingChars ? 1 : 0, transition: "opacity 0.3s ease" }}>
                  {ch}
                </span>
              ))}
            </span>
          </div>
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            display: "flex", alignItems: "center",
            transform: `translateY(${phase === "saved" ? 0 : 14}px)`,
            opacity: phase === "saved" ? 1 : 0,
            transition: "transform 200ms ease, opacity 200ms ease",
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontFamily: "var(--font-ui-family)", fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>
              {SAVED_TEXT.split("").map((ch, i) => (
                <span key={i} style={{ display: "inline-block", opacity: i < savedChars ? 1 : 0, transition: "opacity 0.25s ease" }}>
                  {ch}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  </>
);
```

Note: Change SAVING_TEXT from `"Saving..."` to `"Saving"` and SAVED_TEXT stays `"Saved"`. The spec says NO dots, NO ellipsis — just the word.

- [ ] **Step 4: Update typewriter effects for compact=false references**

All internal `useEffect` hooks that check `compact` must now check `mode === "dot"` instead. The typewriter only runs in text mode. Find every `compact` reference and replace:
- `compact || reduceMotion` → `mode === "dot" || reduceMotion`
- `if (phase !== "saving" || compact || reduceMotion)` → `if (phase !== "saving" || mode === "dot" || reduceMotion)`

There are 6 occurrences of `compact` in the useEffect hooks (lines 61, 65, 71, 77, 81, 93, 97, 105, 109, 121). Replace all.

- [ ] **Step 5: Build check**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds (0 errors). There will be a TS error in EditorToolbar.tsx because it still passes `compact={expanded}` — that's expected and fixed in Task 2.

---

## Task 2: Rewrite EditorToolbar — Single Unified Bar

**Files:**
- Rewrite: `src/components/editor/EditorToolbar.tsx`

This is the core task. Complete rewrite of the render output. Keep all existing state, hooks, handlers, constants (AVATAR_RING, THEME_DOTS, EXPORT_FORMATS, handleExport). Only the JSX return changes.

- [ ] **Step 1: Update imports — add Type icon for font size**

Add `Type` to the Lucide imports (for font size picker icon in dropdown).

```typescript
import {
  Settings,
  LogOut,
  Star,
  FileText,
  Sparkles,
  Download,
  Maximize,
  Minimize,
  Languages,
  Book,
  FileCheck,
  ChevronRight,
  Search,
  TextSearch,
  StickyNote,
  BarChart3,
  Type,
} from "lucide-react";
```

- [ ] **Step 2: Add font size presets constant**

After the EXPORT_FORMATS constant, add:

```typescript
const FONT_SIZE_PRESETS = [
  { key: "compact", label: "Compact", size: 12 },
  { key: "default", label: "Default", size: 14 },
  { key: "large", label: "Large", size: 16 },
] as const;
```

- [ ] **Step 3: Update editorFontSize default**

Change the default from 13 to 14 in the destructured props:

```typescript
editorFontSize = 14,
```

- [ ] **Step 4: Update toolIconStyle — add hover scale**

The spec requires `scale(1.05)` on hover for all icons. Update the helper:

```typescript
const toolIconStyle = (active: boolean): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: 6,
  border: "none",
  background: active ? "var(--bg-hover)" : "transparent",
  color: active ? "var(--text-primary)" : "var(--text-secondary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 150ms ease",
  flexShrink: 0,
});
```

Add a shared hover handler pair that every icon button uses:

```typescript
const iconHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.background = "var(--bg-hover)";
  e.currentTarget.style.color = "var(--text-primary)";
  e.currentTarget.style.transform = "scale(1.05)";
};
const iconHoverOut = (active: boolean) => (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.background = active ? "var(--bg-hover)" : "transparent";
  e.currentTarget.style.color = active ? "var(--text-primary)" : "var(--text-secondary)";
  e.currentTarget.style.transform = "scale(1)";
};
```

- [ ] **Step 5: Rewrite the JSX — complete single-bar layout**

Replace the entire `return (...)` block. The new structure:

```
<style> (keyframes)
<div class="editor-header"> (single bar, height 52, flex row)
  ├── LEFT: logo + project name (flex: 1)
  ├── CENTER: segment counter (flex: 0 0 auto)
  └── RIGHT: (flex: 1, justify-end)
       ├── Pre-translate icon (always, AI accent)
       ├── Pre-translate progress (conditional)
       ├── TM icon (primary)
       ├── Glossary icon (primary)
       ├── Separator "|"
       ├── Expand/Collapse arrow
       ├── Secondary icons container (max-width animated)
       │    ├── Search
       │    ├── Concordance
       │    ├── Notes
       │    ├── Analysis
       │    ├── QA
       │    ├── Export (with dropdown)
       │    └── Fullscreen
       ├── Separator "|"
       ├── SaveDot (mode switches: text when collapsed, dot when expanded)
       └── Avatar (opacity animated: visible when collapsed, hidden when expanded)
```

The complete JSX (this replaces everything from `return (` to the closing `);`):

```tsx
return (
  <>
    <style>{`
      @keyframes proShimmer {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes saveDotPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      @keyframes avatarDropdownIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>

    <div
      className="editor-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 52,
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* ── LEFT: Logo + Project name ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        <Link
          href="/app/projects"
          style={{
            textDecoration: "none",
            fontFamily: "var(--font-display-family)",
            fontSize: 14,
            fontWeight: 400,
            color: "var(--brand-wordmark)",
            letterSpacing: "0.03em",
            cursor: "pointer",
            transition: "opacity 150ms",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          title="Back to projects"
        >
          catforcat.
        </Link>
        <span style={{
          fontFamily: "var(--font-ui-family)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-primary)",
          maxWidth: 280,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {projectName}
        </span>
      </div>

      {/* ── CENTER: Book page counter ── */}
      {!isCompact && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 0, flex: "0 0 auto" }}>
          <span style={{ fontFamily: "var(--font-editor-family)", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            {activeSegment ?? 1}
          </span>
          <span style={{ fontFamily: "var(--font-editor-family)", fontSize: 14, color: "var(--text-primary)", opacity: 0.25 }}>/</span>
          <span style={{ fontFamily: "var(--font-editor-family)", fontSize: 14, color: "var(--text-primary)", opacity: 0.35 }}>
            {totalCount}
          </span>
        </div>
      )}

      {/* ── RIGHT: Unified icon flow ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flex: 1,
        justifyContent: "flex-end",
        overflow: "visible",
      }}>
        {/* Pre-translate (AI accent) */}
        {!isCompact && (
          <button
            onClick={() => onPreTranslate?.("full")}
            disabled={preTranslating}
            style={{
              ...toolIconStyle(false),
              color: "var(--ai-accent)",
              opacity: preTranslating ? 0.4 : 1,
              cursor: preTranslating ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!preTranslating) iconHoverIn(e); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ai-accent)"; e.currentTarget.style.transform = "scale(1)"; }}
            title="Pre-translate"
            aria-label="Pre-translate"
          >
            <Sparkles size={15} />
          </button>
        )}

        {/* Pre-translate progress */}
        {preTranslateProgress?.running && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, color: "var(--accent)", fontFamily: "var(--font-editor-family)",
          }}>
            <span style={{
              width: 8, height: 8,
              border: "1.5px solid var(--accent)", borderTopColor: "transparent",
              borderRadius: "50%", display: "inline-block",
              animation: "spin 1s linear infinite",
            }} />
            {preTranslateProgress.done}/{preTranslateProgress.total}
          </span>
        )}

        {/* TM (primary) */}
        <button
          onClick={() => onPanelToggle?.("tm")}
          style={toolIconStyle(activePanel === "tm")}
          onMouseEnter={iconHoverIn}
          onMouseLeave={iconHoverOut(activePanel === "tm")}
          title="TM Matches"
          aria-label="TM Matches"
        >
          <Languages size={15} />
        </button>

        {/* Glossary (primary) */}
        <button
          onClick={() => onPanelToggle?.("glossary")}
          style={toolIconStyle(activePanel === "glossary")}
          onMouseEnter={iconHoverIn}
          onMouseLeave={iconHoverOut(activePanel === "glossary")}
          title="Glossary"
          aria-label="Glossary"
        >
          <Book size={15} />
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "var(--border)", opacity: 0.4, margin: "0 4px", flexShrink: 0 }} />

        {/* Expand/Collapse arrow */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ ...toolIconStyle(false), width: 24, height: 24 }}
          onMouseEnter={iconHoverIn}
          onMouseLeave={iconHoverOut(false)}
          title={expanded ? "Collapse toolbar" : "Expand toolbar"}
          aria-label={expanded ? "Collapse toolbar" : "Expand toolbar"}
        >
          <ChevronRight
            size={13}
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 250ms ease",
            }}
          />
        </button>

        {/* ── Secondary icons (animated container) ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          overflow: "hidden",
          maxWidth: expanded ? 300 : 0,
          opacity: expanded ? 1 : 0,
          transition: "max-width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease",
          flexShrink: 0,
        }}>
          <button onClick={onSearchOpen} style={toolIconStyle(false)}
            onMouseEnter={iconHoverIn} onMouseLeave={iconHoverOut(false)}
            title="Find & Replace" aria-label="Find & Replace">
            <Search size={15} />
          </button>

          <button onClick={onConcordanceOpen} style={toolIconStyle(false)}
            onMouseEnter={iconHoverIn} onMouseLeave={iconHoverOut(false)}
            title="Concordance Search" aria-label="Concordance Search">
            <TextSearch size={15} />
          </button>

          <button onClick={onNotesOpen} style={toolIconStyle(false)}
            onMouseEnter={iconHoverIn} onMouseLeave={iconHoverOut(false)}
            title="Notes" aria-label="Notes">
            <StickyNote size={15} />
          </button>

          <button onClick={onAnalysis} style={toolIconStyle(false)}
            onMouseEnter={iconHoverIn} onMouseLeave={iconHoverOut(false)}
            title="Analysis" aria-label="Analysis">
            <BarChart3 size={15} />
          </button>

          <button onClick={onRunQA} disabled={qaRunning}
            style={{ ...toolIconStyle(false), opacity: qaRunning ? 0.4 : 1, cursor: qaRunning ? "not-allowed" : "pointer" }}
            onMouseEnter={(e) => { if (!qaRunning) iconHoverIn(e); }}
            onMouseLeave={iconHoverOut(false)}
            title="QA Check" aria-label="QA Check">
            <FileCheck size={15} />
          </button>

          {/* Export (with dropdown) */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setExportOpen(!exportOpen)}
              style={toolIconStyle(exportOpen)}
              onMouseEnter={iconHoverIn} onMouseLeave={iconHoverOut(exportOpen)}
              title="Export" aria-label="Export">
              <Download size={15} />
            </button>
            {exportOpen && (
              <div className="glass-panel" style={{
                position: "absolute", top: 36, right: 0, width: 220,
                background: "var(--bg-panel)", borderRadius: "var(--radius)",
                padding: "6px 0", zIndex: 40, animation: "avatarDropdownIn 200ms ease",
              }}>
                {EXPORT_FORMATS.map((fmt) => (
                  <button key={fmt.key} onClick={() => handleExport(fmt.key)} disabled={!!exporting}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "7px 14px", fontSize: 12,
                      color: "var(--text-primary)", background: "transparent", border: "none",
                      cursor: exporting ? "wait" : "pointer", fontFamily: "var(--font-ui-family)",
                      transition: "background 120ms", textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontWeight: 450 }}>{fmt.label}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{fmt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          {onToggleFullscreen && (
            <button onClick={onToggleFullscreen}
              style={{ ...toolIconStyle(false), width: 28, height: 28 }}
              onMouseEnter={iconHoverIn} onMouseLeave={iconHoverOut(false)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "var(--border)", opacity: 0.4, margin: "0 4px", flexShrink: 0 }} />

        {/* Save indicator — text when collapsed, dot when expanded */}
        <SaveDot
          isSaving={saving}
          lastSavedAt={lastSavedAt ?? null}
          saveError={saveError ?? null}
          mode={expanded ? "dot" : "text"}
        />

        {/* Avatar — visible when collapsed, hidden when expanded */}
        <div ref={avatarRef} style={{
          position: "relative", flexShrink: 0,
          opacity: expanded ? 0 : 1,
          transform: expanded ? "scale(0.9)" : "scale(1)",
          transition: "opacity 200ms ease, transform 200ms ease",
          pointerEvents: expanded ? "none" : "auto",
          width: expanded ? 0 : 30,
          overflow: expanded ? "hidden" : "visible",
        }}>
          <div
            role="button" tabIndex={expanded ? -1 : 0}
            aria-label="User menu" aria-expanded={avatarOpen}
            onClick={() => { if (!expanded) setAvatarOpen(!avatarOpen); }}
            onKeyDown={(e) => { if (!expanded && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setAvatarOpen(!avatarOpen); } }}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: ring.gradient,
              backgroundSize: isPro ? "200% 200%" : undefined,
              animation: isPro ? "proShimmer 3s ease infinite" : undefined,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: isPro ? 2 : 1.5,
              border: isPro ? "none" : "1px solid var(--border)",
              boxSizing: "border-box",
              transition: "transform 150ms ease",
            }}
          >
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: ring.bg, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)",
            }}>
              {userInitials}
            </div>
          </div>

          {/* Avatar dropdown */}
          {avatarOpen && !expanded && (
            <div className="glass-panel" style={{
              position: "absolute", top: 38, right: 0, width: 230,
              background: "var(--bg-panel)", borderRadius: "var(--radius)",
              zIndex: 40, animation: "avatarDropdownIn 200ms ease", overflow: "hidden",
            }}>
              {/* User info */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: ring.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: isPro ? 2 : 1.5, flexShrink: 0,
                }}>
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "50%", background: ring.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-ui-family)",
                  }}>
                    {userInitials}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: "var(--text-primary)",
                    fontFamily: "var(--font-ui-family)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {userName || session?.user?.email || "User"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-ui-family)" }}>
                    {isPro ? "Pro plan" : "Free plan"}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "0.5px solid var(--border)" }} />

              {/* Theme picker */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", fontFamily: "var(--font-ui-family)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Theme</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {THEME_DOTS.map((t) => (
                    <div key={t.id} onClick={() => setTheme(t.id)}
                      style={{
                        width: theme === t.id ? 16 : 14, height: theme === t.id ? 16 : 14,
                        borderRadius: "50%", background: t.color,
                        border: theme === t.id ? "1.5px solid var(--accent)" : t.border,
                        cursor: "pointer", transition: "all 150ms",
                      }}
                      title={t.label}
                    />
                  ))}
                </div>
              </div>

              {/* Font size picker */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", fontFamily: "var(--font-ui-family)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Type size={13} style={{ color: "var(--text-secondary)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Font size</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {FONT_SIZE_PRESETS.map((p) => (
                    <button key={p.key}
                      onClick={() => onFontSizeChange?.(p.size)}
                      style={{
                        padding: "2px 8px", fontSize: 11, fontWeight: editorFontSize === p.size ? 500 : 400,
                        fontFamily: "var(--font-ui-family)", border: "none", borderRadius: 4,
                        background: editorFontSize === p.size ? "var(--bg-hover)" : "transparent",
                        color: editorFontSize === p.size ? "var(--text-primary)" : "var(--text-muted)",
                        cursor: "pointer", transition: "all 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = editorFontSize === p.size ? "var(--bg-hover)" : "transparent")}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "0.5px solid var(--border)" }} />

              {/* Settings */}
              <Link href="/app/settings" onClick={() => setAvatarOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, textDecoration: "none", color: "var(--text-primary)", background: "transparent", transition: "background 150ms", cursor: "pointer", fontFamily: "var(--font-ui-family)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Settings size={13} style={{ color: "var(--text-secondary)" }} />
                <span>Settings</span>
              </Link>

              {/* Changelog */}
              <Link href="/changelog" onClick={() => setAvatarOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, textDecoration: "none", color: "var(--text-primary)", background: "transparent", transition: "background 150ms", cursor: "pointer", fontFamily: "var(--font-ui-family)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <FileText size={13} style={{ color: "var(--text-secondary)" }} />
                <span>Changelog</span>
              </Link>

              <div style={{ borderTop: "0.5px solid var(--border)" }} />

              {/* Upgrade to Pro */}
              {!isPro && (
                <>
                  <button onClick={() => { setAvatarOpen(false); router.push("/app/upgrade"); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, color: "var(--accent)", background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-ui-family)", transition: "background 150ms" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Star size={13} style={{ color: "var(--accent)" }} />
                    <span>Upgrade to Pro</span>
                  </button>
                  <div style={{ borderTop: "0.5px solid var(--border)" }} />
                </>
              )}

              {/* Sign out */}
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", fontSize: 13, width: "100%", textAlign: "left", color: "var(--text-muted)", background: "transparent", border: "none", fontFamily: "var(--font-ui-family)", transition: "background 150ms", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={13} style={{ color: "var(--text-muted)" }} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
```

- [ ] **Step 6: Close avatar when expanding toolbar**

Add a useEffect after the existing expand persist effect to close the avatar dropdown when the toolbar expands:

```typescript
/* Close avatar dropdown when expanding */
useEffect(() => {
  if (expanded) setAvatarOpen(false);
}, [expanded]);
```

- [ ] **Step 7: Build check**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds, 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/editor/SaveDot.tsx src/components/editor/EditorToolbar.tsx
git commit -m "feat: redesign EditorToolbar as unified bar with animated states

- Single bar layout: collapsed (essentials + save text + avatar) / expanded (7 secondary icons + save dot)
- SaveDot refactored: mode='text' (word only) vs mode='dot' (dot only)
- Avatar dropdown: theme picker + font size (Compact/Default/Large) + settings + sign out
- QA moved from primary to expanded set
- All animations: expand 300ms, avatar fade 200ms, save crossfade 200ms, arrow rotate 250ms, hover scale(1.05)
- prefers-reduced-motion respected globally
- aria-labels on all icon-only buttons"
```

---

## Task 3: Update parent page — font size default

**Files:**
- Modify: `src/app/app/projects/[id]/page.tsx`

- [ ] **Step 1: Update default font size**

Find line `const [editorFontSize, setEditorFontSize] = useState(13);` and change to `useState(14)`.

- [ ] **Step 2: Build check**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit + push**

```bash
git add src/app/app/projects/[id]/page.tsx
git commit -m "fix: update default editor font size from 13 to 14"
git push
```
