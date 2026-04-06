# CATforCAT Master Mission — 7 Tracks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan. Each track can run as an independent agent where dependencies allow.

**Goal:** Complete functional + visual closure of CATforCAT: migrate sidebar to toolbar, add Midnight theme, Trados import, OAuth, redesign auth pages, fix date picker, and security audit.

**Architecture:** 7 independent tracks with minimal cross-dependencies. Tracks A/B/C/F run in parallel (wave 1), D runs after auth investigation (wave 2), E depends on D (wave 3), G runs last.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Prisma 6, PostgreSQL, NextAuth v4, Stripe, lucide-react

---

## Dependency Graph

```
Wave 1 (parallel):  A (toolbar)  |  B (midnight)  |  C (trados)  |  F (date picker)
Wave 2 (parallel):  D (OAuth)    |  (A/B/C/F continuing)
Wave 3 (sequential): E (auth pages) — depends on D for OAuth buttons, B for Midnight theme
Wave 4 (sequential): G (security audit) — runs after ALL tracks complete
```

## Skills & MCPs per Track

| Track | Skills                         | MCPs                                        | Research                                 |
| ----- | ------------------------------ | ------------------------------------------- | ---------------------------------------- |
| A     | ui-ux-pro-max, executing-plans | 21st.dev (component inspiration)            | —                                        |
| B     | ui-ux-pro-max                  | —                                           | —                                        |
| C     | —                              | —                                           | deep-research (sdltm schema, TBX format) |
| D     | —                              | —                                           | deep-research (NextAuth OAuth 2026)      |
| E     | ui-ux-pro-max                  | 21st.dev (OAuth buttons, subscription card) | —                                        |
| F     | —                              | 21st.dev (date picker component)            | —                                        |
| G     | —                              | —                                           | deep-research (OWASP, security patterns) |

## Files per Track (estimated)

| Track | Create                 | Modify                                          | Delete                | Total  |
| ----- | ---------------------- | ----------------------------------------------- | --------------------- | ------ |
| A     | 1 (SaveDot.tsx)        | 3 (EditorToolbar, page.tsx, globals.css)        | 1 (EditorSidebar.tsx) | 5      |
| B     | 0                      | 2 (globals.css, ThemeProvider.tsx)              | 0                     | 2      |
| C     | 3 (route.ts x2, UI)    | 2 (tm/page.tsx, glossary/page.tsx)              | 0                     | 5      |
| D     | 0                      | 3 (auth.ts, login, register)                    | 0                     | 3      |
| E     | 1 (subscription page)  | 5 (login, register, dropdown, schema, settings) | 0                     | 6      |
| F     | 1 (DatePicker.tsx)     | 2 (NewAssignmentModal, assignment page)         | 0                     | 3      |
| G     | 1 (security-report.md) | N (fixes)                                       | 0                     | varies |

---

## TRACK A — Sidebar Migration to Expandable Top Bar

### A.1: Add sidebar icon callbacks to EditorToolbar props

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx` (props interface, lines 27-54)

- [ ] Add new props to EditorToolbarProps interface:
  ```typescript
  // Sidebar migration props
  onSearchOpen?: () => void;
  onConcordanceOpen?: () => void;
  onNotesOpen?: () => void;
  onRunQA?: () => void;
  onAnalysis?: () => void;
  qaRunning?: boolean;
  activePanel?: string | null;
  onPanelToggle?: (panel: string) => void;
  ```
- [ ] Destructure new props in component function signature
- [ ] Build check: `npx next build`
- [ ] Commit: `feat: add sidebar callback props to EditorToolbar`

### A.2: Implement compact state — 3 primary icons + expand arrow

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx` (right section, after line 373)

- [ ] Add state: `const [expanded, setExpanded] = useState(() => { try { return localStorage.getItem('catforcat-toolbar-expanded') === 'true' } catch { return false } })`
- [ ] Add imports: `Languages, Book, FileCheck, ChevronRight` from lucide-react
- [ ] In right section, BEFORE export button, add 3 primary icon buttons: TM (Languages), Glossary (Book), QA (FileCheck)
  - Each 30x30px, borderRadius 6px, same glass hover style as sidebar icons
  - TM and Glossary use `onPanelToggle`, QA uses `onRunQA`
  - Active state for TM/Glossary when `activePanel` matches
- [ ] Add expand/collapse arrow button (ChevronRight icon, rotates 180deg when expanded)
- [ ] Persist expanded state to localStorage on toggle
- [ ] Build check
- [ ] Commit: `feat: add primary tool icons and expand arrow to toolbar`

### A.3: Implement expanded state — secondary icons appear, avatar hides

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx`

- [ ] Add imports: `TextSearch, Search, StickyNote, BarChart3` from lucide-react
- [ ] When `expanded === true`, render secondary icons AFTER the 3 primary: Pre-translate (existing, move here), Search, Concordance, Notes, Analysis, Export (existing icon-only), Fullscreen (existing)
- [ ] When `expanded === true`, hide avatar + PRO badge section (conditional render)
- [ ] Convert Export button to icon-only (remove text label, keep Download icon)
- [ ] Build check
- [ ] Commit: `feat: implement expanded toolbar state with secondary icons`

### A.4: Redesign center zone — book page counter

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx` (center section, lines 278-371)

- [ ] Replace entire center section with minimal book-page counter:
  ```tsx
  {
    /* Center: segment position */
  }
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 0,
      flex: "0 0 auto",
    }}
  >
    <span
      style={{
        fontFamily: "var(--font-editor-family)",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--text-primary)",
      }}
    >
      {activeSegment}
    </span>
    <span
      style={{
        fontFamily: "var(--font-editor-family)",
        fontSize: 14,
        color: "var(--text-primary)",
        opacity: 0.25,
      }}
    >
      /
    </span>
    <span
      style={{
        fontFamily: "var(--font-editor-family)",
        fontSize: 14,
        color: "var(--text-primary)",
        opacity: 0.35,
      }}
    >
      {totalCount}
    </span>
  </div>;
  ```
- [ ] Add new prop `activeSegment?: number` to interface and pass from page.tsx
- [ ] Move Pre-translate button to expanded section (done in A.3)
- [ ] Build check
- [ ] Commit: `feat: redesign toolbar center as minimal segment counter`

### A.5: Create SaveDot component with dual mode

**Files:**

- Create: `src/components/editor/SaveDot.tsx`
- Modify: `src/components/editor/EditorToolbar.tsx` (replace SaveIndicator usage)

- [ ] Create SaveDot with props: `{ isSaving: boolean; lastSavedAt: number | null; saveError: string | null; compact?: boolean }`
- [ ] Full mode (compact=false): colored dot (8px) + text ("Saved"/"Saving..."/"Error") with typewriter animation
- [ ] Compact mode (compact=true): colored dot only (8px), no text
- [ ] Dot colors via CSS variables: `var(--green)` = saved, `var(--amber)` = saving (pulse animation), `var(--red)` = error
- [ ] CSS keyframe for saving pulse: `@keyframes savePulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`
- [ ] Typewriter: on state change to "Saved", write char-by-char at 80ms. "Saving..." writes at 60ms. "Error" appears instantly.
- [ ] Respect `prefers-reduced-motion`: skip typewriter, instant text
- [ ] In EditorToolbar: replace `<SaveIndicator>` with `<SaveDot compact={expanded} />`
- [ ] Build check
- [ ] Commit: `feat: create SaveDot component with dual mode and typewriter`

### A.6: Implement PRO avatar with gradient border

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx` (avatar section, lines 524-669)

- [ ] For PRO users: avatar gets animated gradient border (shimmer) using theme's gradient colors
  ```css
  @keyframes shimmer {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  ```
- [ ] Gradient uses existing `AVATAR_RING[theme].gradient` with `background-size: 200% 200%` + shimmer animation
- [ ] Free users: plain avatar with subtle border `1px solid var(--border)`
- [ ] Remove separate PRO pill badge — PRO status is communicated through the shimmer border
- [ ] Build check
- [ ] Commit: `feat: PRO avatar with shimmer gradient border`

### A.7: Expand/collapse animations

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx`

- [ ] Secondary icons: wrap in container with `transition: max-width 250ms ease, opacity 200ms ease`
  - Collapsed: `maxWidth: 0, opacity: 0, overflow: hidden`
  - Expanded: `maxWidth: 400px, opacity: 1`
- [ ] Avatar section: same inverse transition (visible when collapsed, hidden when expanded)
- [ ] SaveDot: transitions between full/compact mode via CSS opacity on text
- [ ] Expand arrow: `transform: rotate(${expanded ? 180 : 0}deg)` with `transition: transform 200ms ease`
- [ ] Build check
- [ ] Commit: `feat: smooth expand/collapse toolbar animations`

### A.8: Eliminate EditorSidebar and reclaim width

**Files:**

- Delete: `src/components/editor/EditorSidebar.tsx`
- Modify: `src/app/app/projects/[id]/page.tsx` (remove import line 8, remove usage lines 2098-2129)

- [ ] Remove `import EditorSidebar` from page.tsx
- [ ] Remove `<EditorSidebar ... />` block (lines 2098-2129)
- [ ] Pass all sidebar callbacks to EditorToolbar instead (onSearchOpen, onConcordanceOpen, etc.)
- [ ] The content area div (line 2132) now has no sibling sidebar — it fills 100% width
- [ ] Delete `src/components/editor/EditorSidebar.tsx`
- [ ] Grep for any other imports of EditorSidebar: `grep -rn "EditorSidebar" src/`
- [ ] Build check
- [ ] Commit: `feat: remove EditorSidebar, editor uses full width`

### A.9: Responsive behavior

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx`

- [ ] Mobile (<768px): hide all tool icons, show only logo + center counter + hamburger menu
- [ ] Hamburger opens dropdown with ALL icons (primary + secondary) listed vertically with labels
- [ ] Desktop narrow (768-1280px): always show compact state, expand works normally
- [ ] Desktop wide (>1280px): everything works, expanded shows all icons comfortably
- [ ] Build check
- [ ] Commit: `feat: responsive toolbar for mobile and narrow desktop`

### A.10: Verify shortcuts and cleanup

- [ ] Test keyboard shortcuts still work: Ctrl+K (concordance), Ctrl+H (search), Ctrl+Q (QA), Ctrl+D, Ctrl+G, Ctrl+E, Ctrl+Z
- [ ] Shortcuts are handled in page.tsx useEffect (not in sidebar), so they should work without changes
- [ ] Remove old SaveIndicator.tsx if no longer imported anywhere
- [ ] Final build check
- [ ] Commit: `chore: cleanup orphaned imports and verify shortcuts`

---

## TRACK B — Midnight Theme

### B.1: Add Midnight theme variables to globals.css

**Files:**

- Modify: `src/app/globals.css` (after [data-theme="forest"] block)

- [ ] Add complete `[data-theme="midnight"]` block with ALL variables matching other themes:
  ```css
  [data-theme="midnight"] {
    --bg-deep: #0a0a0c;
    --bg-panel: rgba(255, 255, 255, 0.03);
    --bg-card: rgba(255, 255, 255, 0.05);
    --bg-paper: rgba(255, 255, 255, 0.04);
    --bg-hover: rgba(255, 255, 255, 0.06);
    --bg-active: rgba(255, 255, 255, 0.08);
    --text-primary: #b0adb5;
    --text-secondary: #706e78;
    --text-muted: #48464e;
    --border: rgba(255, 255, 255, 0.08);
    --border-focus: rgba(255, 255, 255, 0.2);
    --accent: #8a8594;
    --accent-soft: rgba(138, 133, 148, 0.12);
    /* ... complete set: green, amber, red, purple, shadows, buttons, glass, pro, etc. */
  }
  ```
- [ ] Every variable from Dark theme must have a Midnight equivalent
- [ ] Build check
- [ ] Commit: `feat: add Midnight theme CSS variables`

### B.2: Register Midnight in ThemeProvider and UI

**Files:**

- Modify: `src/components/ThemeProvider.tsx` (Theme type, line ~3)
- Modify: `src/components/editor/EditorToolbar.tsx` (THEME_DOTS array, AVATAR_RING)
- Modify: `src/components/TopBar.tsx` (THEME_DOTS array, AVATAR_RING)
- Modify: `src/app/app/settings/page.tsx` (theme picker section)

- [ ] Add `"midnight"` to Theme union type: `export type Theme = "sakura" | "dark" | "light" | "linen" | "forest" | "midnight"`
- [ ] Add midnight dot to THEME_DOTS in EditorToolbar: `{ id: "midnight", color: "#0a0a0c", border: "0.5px solid #2a2a30", label: "Midnight" }`
- [ ] Add midnight to AVATAR_RING in EditorToolbar
- [ ] Repeat for TopBar.tsx (same arrays)
- [ ] Add midnight to settings page theme picker
- [ ] Build check
- [ ] Commit: `feat: register Midnight theme in ThemeProvider and all switchers`

### B.3: Verify contrast and visual integrity

- [ ] Manually verify text contrast: `--text-primary` (#b0adb5) on `--bg-deep` (#0a0a0c) should be >4.5:1
- [ ] Verify panel/card layers are distinguishable (rgba transparency creates depth)
- [ ] Verify all 5 existing themes still work (no regressions)
- [ ] Build check
- [ ] Commit: `fix: adjust Midnight contrast if needed`

---

## TRACK C — Trados Importer

### C.1: Research .sdltm format

- [ ] Use web search / deep-research to investigate .sdltm file structure
- [ ] Document: SQLite tables, column names, how TUs are stored
- [ ] Document: language pair encoding, metadata fields
- [ ] Save findings to working notes (not committed)

### C.2: Create SDLTM import endpoint

**Files:**

- Create: `src/app/api/tm/import-sdltm/route.ts`

- [ ] POST handler accepting FormData with .sdltm file
- [ ] Auth check (session required)
- [ ] File size limit (50MB max)
- [ ] Open file as SQLite database (use `better-sqlite3` or `sql.js` — investigate best option for Next.js)
- [ ] Read ONLY known tables (translation_units or equivalent) — NO arbitrary SQL
- [ ] Extract: source text, target text, source lang, target lang, creation date
- [ ] Map to CATforCAT TM format: `prisma.translationMemory.createMany()`
- [ ] Skip duplicates (same source+target+langs)
- [ ] Return: `{ imported: number, skipped: number, errors: string[] }`
- [ ] Build check
- [ ] Commit: `feat: POST /api/tm/import-sdltm endpoint`

### C.3: Add SDLTM import button to TM page

**Files:**

- Modify: `src/app/app/tm/page.tsx` (import section, near line 215)

- [ ] Add hidden file input accepting `.sdltm`
- [ ] Add "Import Trados" button next to existing Import TMX button
- [ ] Handler: FormData upload to `/api/tm/import-sdltm`
- [ ] Progress feedback via toast: "Importing..." → "Imported X entries (Y skipped)" or error
- [ ] Follow exact same pattern as existing TMX import (useRef + hidden input)
- [ ] Build check
- [ ] Commit: `feat: add Trados .sdltm import button to TM page`

### C.4: Research and implement TBX glossary import

**Files:**

- Create: `src/app/api/glossary/import-tbx/route.ts`
- Modify: `src/app/app/glossary/page.tsx`

- [ ] Research TBX format (XML-based terminology exchange)
- [ ] Parse TBX XML safely (use DOMParser or xml2js — NO eval, NO innerHTML)
- [ ] Extract: source term, target term, language pairs, definition/notes
- [ ] Map to GlossaryTerm model
- [ ] Add "Import TBX" button to glossary page
- [ ] Build check
- [ ] Commit: `feat: TBX glossary import endpoint and UI`

---

## TRACK D — OAuth Google + Apple

### D.1: Research and configure NextAuth OAuth

**Files:**

- Modify: `src/lib/auth.ts`

- [ ] Research NextAuth v4 GoogleProvider + AppleProvider configuration for 2026
- [ ] Add PrismaAdapter import (required for OAuth — currently using JWT only)
- [ ] Add GoogleProvider with env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Add AppleProvider with env vars: `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY`, `APPLE_KEY_ID`
- [ ] Keep existing CredentialsProvider alongside OAuth providers
- [ ] Handle account linking: if OAuth email matches existing credentials user, link accounts
- [ ] Add Account and Session models to Prisma schema if not present (required by PrismaAdapter)
- [ ] `npx prisma generate` + `npx prisma db push`
- [ ] Build check
- [ ] Commit: `feat: add Google and Apple OAuth providers to NextAuth`

### D.2: Add env var placeholders

- [ ] Add to `.env.example` (or document for Coolify):
  ```
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  APPLE_ID=
  APPLE_TEAM_ID=
  APPLE_PRIVATE_KEY=
  APPLE_KEY_ID=
  ```
- [ ] Providers should gracefully skip if env vars are missing (conditional inclusion)
- [ ] Commit: `docs: add OAuth env var placeholders`

---

## TRACK E — Auth Pages Redesign + Subscription

### E.1: Redesign login page

**Files:**

- Modify: `src/app/login/page.tsx`

- [ ] Redesign with CATforCAT identity: Cormorant Garamond logo, DM Sans UI, CSS variables
- [ ] Clean centered card layout on `var(--bg-deep)` background
- [ ] Logo "catforcat." at top
- [ ] Email + password fields with Design System styling (radius-sm, bg-panel border, focus accent)
- [ ] Password show/hide toggle (already exists — keep)
- [ ] 2FA section (already exists — keep, restyle)
- [ ] OAuth buttons if Track D complete: "Continue with Google" / "Continue with Apple"
  - If Track D not done: leave prepared div with `{/* OAuth buttons placeholder */}`
- [ ] "Don't have an account? Register" link at bottom
- [ ] Works on all 6 themes (including Midnight if Track B done)
- [ ] Build check
- [ ] Commit: `feat: redesign login page with CATforCAT identity`

### E.2: Redesign register page

**Files:**

- Modify: `src/app/register/page.tsx`

- [ ] Same aesthetic as login — consistent
- [ ] Fields: Name, @username (already exists), Email, Password with show/hide
- [ ] Username validation already works — keep existing logic
- [ ] OAuth buttons or placeholder
- [ ] "Already have an account? Log in" link
- [ ] Build check
- [ ] Commit: `feat: redesign register page with CATforCAT identity`

### E.3: Create dedicated subscription/upgrade page

**Files:**

- Create: `src/app/app/upgrade/page.tsx`

- [ ] Premium landing-style page for upgrade to PRO
- [ ] Visual comparison: Free vs PRO (NOT a boring table — use cards side by side)
- [ ] Free card: subtle, shows limits (3 projects, 2000 segments, etc.)
- [ ] PRO card: elevated with accent border/glow, shows "Unlimited" for each
- [ ] Price prominently: "$10/month"
- [ ] CTA button: "Upgrade to PRO" connecting to existing `/api/stripe/checkout`
- [ ] Current plan indicator if already PRO
- [ ] Use plan data from `src/lib/stripe.ts` PLANS object
- [ ] Build check
- [ ] Commit: `feat: create dedicated PRO upgrade page`

### E.4: Redesign avatar dropdown

**Files:**

- Modify: `src/components/editor/EditorToolbar.tsx` (avatar dropdown, lines 524-669)
- Modify: `src/components/TopBar.tsx` (avatar dropdown)

- [ ] Avatar shows larger (36px) with PRO gradient shimmer border (from Track A.6)
- [ ] Dropdown shows: full name, @username (NOT email), plan status
- [ ] PRO users: "Miembro PRO" text with subtle shimmer animation
- [ ] Free users: "Upgrade to PRO" button linking to `/app/upgrade`
- [ ] Links: Settings, Theme dots, Sign out
- [ ] Apply same dropdown redesign to TopBar.tsx (non-editor pages)
- [ ] Build check
- [ ] Commit: `feat: redesign avatar dropdown with @username and PRO status`

---

## TRACK F — Date Picker + Cleanup

### F.1: Create custom DatePicker component

**Files:**

- Create: `src/components/DatePicker.tsx`

- [ ] Search 21st.dev for date picker component inspiration
- [ ] Build inline calendar-style picker (or popover calendar)
- [ ] Props: `value: Date | null`, `onChange: (date: Date | null) => void`, `minDate?: Date`
- [ ] Styled with CSS variables (--bg-card, --border, --accent, --text-primary)
- [ ] Works on all themes
- [ ] Build check
- [ ] Commit: `feat: create custom DatePicker component`

### F.2: Replace native date inputs

**Files:**

- Modify: `src/components/NewAssignmentModal.tsx` (lines 187-192)
- Modify: `src/app/app/classrooms/[id]/assignments/[aid]/page.tsx` (line 74)

- [ ] Replace `<input type="datetime-local">` with `<DatePicker>`
- [ ] Verify date format conversion works correctly
- [ ] Build check
- [ ] Commit: `feat: replace native date picker with custom component`

---

## TRACK G — Security Audit

Runs AFTER all tracks are complete.

### G.1: OAuth security review

- [ ] Verify token validation is server-side
- [ ] Check CSRF protection on auth routes
- [ ] Verify account linking logic can't be exploited
- [ ] Check session handling with multiple providers

### G.2: File import security review

- [ ] SDLTM: verify no arbitrary SQL execution, only known table reads
- [ ] TBX: verify XML parsing is safe (no XXE, no DTD injection)
- [ ] File size limits enforced on all upload endpoints
- [ ] Timeout on processing

### G.3: Auth pages security review

- [ ] Rate limiting on login/register endpoints (already exists — verify still works)
- [ ] Input validation and sanitization
- [ ] Username XSS prevention
- [ ] Password requirements enforced

### G.4: General audit

- [ ] `npm audit` — list vulnerabilities
- [ ] Grep for dangerous patterns: `eval(`, `innerHTML`, `dangerouslySetInnerHTML`
- [ ] Verify all new endpoints have auth middleware
- [ ] Verify CORS not relaxed
- [ ] Stripe webhook signature verification

### G.5: Produce security report

**Files:**

- Create: `docs/security-audit-2026-04-02.md`

- [ ] Classification: CRITICAL / IMPORTANT / MINOR per finding
- [ ] Fix all CRITICAL before push
- [ ] Commit: `docs: security audit report`

---

## Execution Order (Optimized)

```
WAVE 1 — Parallel (independent tracks):
  Agent 1: Track A (A.1 → A.10) — toolbar migration
  Agent 2: Track B (B.1 → B.3) — Midnight theme
  Agent 3: Track C (C.1 → C.4) — Trados importer
  Agent 4: Track F (F.1 → F.2) — date picker

WAVE 2 — After C.1 research completes:
  Agent 5: Track D (D.1 → D.2) — OAuth

WAVE 3 — After D completes + A/B done:
  Agent 6: Track E (E.1 → E.4) — auth pages redesign

WAVE 4 — After ALL tracks:
  Agent 7: Track G (G.1 → G.5) — security audit

FINAL: Integration check across all tracks, push to GitHub
```

## Cross-Track Verification Points

After each wave, verify:

1. `npx next build` succeeds
2. No new TypeScript errors
3. All themes render (Dark, Sakura, Light, Linen, Forest, Midnight)
4. Editor opens and all tools accessible
5. Login/register flow works
6. No console errors in dev mode
