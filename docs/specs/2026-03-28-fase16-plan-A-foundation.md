# Fase 16 Sub-Plan A: Design Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CSS design tokens (colors, fonts, spacing, shadows, radius) across all 4 themes to match the new premium identity, and swap Playfair Display for Cormorant Garamond.

**Architecture:** All changes are in globals.css (theme variables), layout.tsx (font imports), and adding DM Sans as an explicit import. No component changes in this sub-plan — those come in Sub-Plans B and C. This sub-plan establishes the visual foundation that everything else builds on.

**Tech Stack:** CSS custom properties, next/font/google (Cormorant_Garamond, DM_Sans, JetBrains_Mono)

---

## File Map

```
MODIFY: catforcat/src/app/globals.css
        - Replace all 4 theme variable blocks with new values
        - Update spacing, radius, shadow tokens
        - Add new typography scale tokens

MODIFY: catforcat/src/app/layout.tsx
        - Replace Playfair_Display import with Cormorant_Garamond
        - Replace Inter import with DM_Sans
        - Update CSS variable names
```

---

### Task 1: Update font imports in layout.tsx

**Files:**
- Modify: `catforcat/src/app/layout.tsx`

- [ ] **Step 1: Replace font imports**

In `catforcat/src/app/layout.tsx`, replace the font imports:

```typescript
// OLD:
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400"],
});

// NEW:
import { DM_Sans, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});
```

- [ ] **Step 2: Update body className**

Replace the body className:

```typescript
// OLD:
className={`${inter.variable} ${jetbrains.variable} ${playfair.variable} antialiased`}

// NEW:
className={`${dmSans.variable} ${jetbrains.variable} ${cormorant.variable} antialiased`}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd catforcat && npx tsc --noEmit`
Expected: No errors (some components may still reference old font names via CSS but we update those in the next task).

- [ ] **Step 4: Commit**

```bash
cd catforcat && git add src/app/layout.tsx
git commit -m "feat: replace fonts — Cormorant Garamond (display) + DM Sans (UI)"
```

---

### Task 2: Update Linen theme to Mocha Soft palette

**Files:**
- Modify: `catforcat/src/app/globals.css`

- [ ] **Step 1: Replace the Linen theme block**

In `catforcat/src/app/globals.css`, find the `[data-theme="linen"]` block and replace ALL its variables with:

```css
[data-theme="linen"] {
  --bg-deep: #FAF0E6;
  --bg-panel: #F0E0D6;
  --bg-card: #F5EBE0;
  --bg-hover: rgba(164, 119, 100, 0.06);
  --bg-active: rgba(164, 119, 100, 0.10);
  --bg-sidebar: #EDE4DC;
  --bg-paper: #FAF0E6;
  --border: #E0D4C9;
  --border-focus: #A47764;
  --text-primary: #5C4033;
  --text-secondary: #8B7355;
  --text-muted: #B8A898;
  --accent: #A47764;
  --accent-soft: rgba(164, 119, 100, 0.10);

  --green: #7A9A6A;
  --green-soft: rgba(122, 154, 106, 0.10);
  --green-text: #5A7A4A;
  --amber: #B89A6C;
  --amber-soft: rgba(184, 154, 108, 0.08);
  --amber-text: #8A7030;
  --red: #A46464;
  --red-soft: rgba(164, 100, 100, 0.08);
  --red-text: #7A4038;
  --purple: #8A7A9A;
  --purple-soft: rgba(138, 122, 154, 0.10);
  --purple-text: #6A5070;

  --status-bar: #E8DDD4;
  --segment-divider: rgba(92, 64, 51, 0.06);
  --paper-shadow: 0 2px 12px rgba(92, 64, 51, 0.06);
  --shadow-sm: 0 1px 3px rgba(92, 64, 51, 0.06);
  --shadow-md: 0 4px 12px rgba(92, 64, 51, 0.08);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;

  --scrollbar-thumb: rgba(164, 119, 100, 0.12);
  --scrollbar-thumb-hover: rgba(164, 119, 100, 0.22);

  --brand-wordmark: #5C4033;

  --overlay: rgba(92, 64, 51, 0.4);

  --mark-bg: rgba(184, 154, 108, 0.3);
  --mark-text: #5C4033;
  --mark-delete-bg: rgba(164, 100, 100, 0.3);
  --mark-insert-bg: rgba(122, 154, 106, 0.3);

  --btn-bg: rgba(164, 119, 100, 0.08);
  --btn-border: rgba(164, 119, 100, 0.15);
  --btn-bg-hover: rgba(164, 119, 100, 0.14);

  /* Glow & micro-interaction tokens */
  --glow-accent: rgba(164, 119, 100, 0.20);
  --glow-accent-strong: rgba(164, 119, 100, 0.35);
  --btn-glow: 0 0 0 transparent;
  --btn-glow-hover: 0 0 10px rgba(164, 119, 100, 0.10);
  --btn-depth: 0 1px 2px rgba(92, 64, 51, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  --btn-depth-hover: 0 2px 8px rgba(92, 64, 51, 0.12), 0 0 12px rgba(164, 119, 100, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  --btn-depth-active: inset 0 1px 3px rgba(92, 64, 51, 0.15);
  --glass-bg: rgba(255, 255, 255, 0.35);
  --glass-border: rgba(92, 64, 51, 0.08);
  --glass-bg-hover: rgba(255, 255, 255, 0.50);
  --panel-glow: 0 0 16px rgba(164, 119, 100, 0.04);
  --action-gradient: linear-gradient(135deg, rgba(122, 154, 106, 0.14), rgba(122, 154, 106, 0.04));
  --action-border: rgba(122, 154, 106, 0.30);
  --action-glow: 0 0 12px rgba(122, 154, 106, 0.10);
}
```

- [ ] **Step 2: Verify the app loads with Linen theme**

Run: `cd catforcat && npm run dev`
Open browser, go to Settings, switch to Linen theme. Verify:
- Background is warm cream (#FAF0E6)
- Text is readable chocolate brown (#5C4033)
- Accent color is Mocha Mousse (#A47764)
- No color clashes or unreadable text

- [ ] **Step 3: Commit**

```bash
cd catforcat && git add src/app/globals.css
git commit -m "feat: update Linen theme to Mocha Soft palette (Pantone Mocha Mousse)"
```

---

### Task 3: Update Dark, Sakura, and Light themes with new radius and spacing

**Files:**
- Modify: `catforcat/src/app/globals.css`

- [ ] **Step 1: Update radius values in all themes**

In all 3 remaining theme blocks (`:root/dark`, `sakura`, `light`), update the radius values to match the new design system:

```css
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
```

These replace the old values of `10px`, `6px`, `14px`.

- [ ] **Step 2: Add typography scale tokens after the themes**

After all 4 theme blocks (before any other CSS rules), add a new `:root` block with typography and spacing tokens that apply to ALL themes:

```css
/* ═══════════════════════════════════════════
   DESIGN SYSTEM TOKENS — shared across themes
   ═══════════════════════════════════════════ */
:root {
  /* Typography scale (Major Third 1.25) */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: 35px;
  --text-hero: 56px;

  /* Spacing scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Font families */
  --font-display: var(--font-display, 'Cormorant Garamond'), Georgia, serif;
  --font-ui: var(--font-sans, 'DM Sans'), system-ui, sans-serif;
  --font-editor: var(--font-mono, 'JetBrains Mono'), monospace;

  /* Border radius aliases */
  --radius-full: 9999px;
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd catforcat && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Verify all 4 themes render correctly**

Run: `cd catforcat && npm run dev`
Switch between all 4 themes in Settings. Verify:
- Dark: border-radius looks slightly more rounded (12px vs 10px)
- Sakura: same
- Light: same
- Linen: Mocha Soft palette with new radius

- [ ] **Step 5: Commit**

```bash
cd catforcat && git add src/app/globals.css
git commit -m "feat: add design system tokens — typography scale, spacing, font families, updated radius"
```

---

### Task 4: Update all font-family references in components

**Files:**
- Modify: Multiple component files that reference font-family inline

- [ ] **Step 1: Find all hardcoded font-family references**

Run from catforcat/:
```bash
grep -rn "font-family.*Inter\|font-family.*Playfair\|font-family.*DM Sans\|font-family.*JetBrains" src/ --include="*.tsx" --include="*.ts"
```

For each result, replace:
- `"'Playfair Display', Georgia, serif"` → `"var(--font-display), Georgia, serif"`
- `"'Inter', system-ui, sans-serif"` → `"var(--font-ui), system-ui, sans-serif"`
- `"'DM Sans', system-ui, sans-serif"` → `"var(--font-ui), system-ui, sans-serif"`
- `"'JetBrains Mono', monospace"` → `"var(--font-editor), monospace"`

This decouples component code from specific font names. If we change fonts later, we only change layout.tsx and globals.css.

- [ ] **Step 2: Verify build compiles**

Run: `cd catforcat && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify fonts render correctly**

Run: `cd catforcat && npm run dev`
Check:
- Landing page headline uses Cormorant Garamond (thinner, more elegant than Playfair)
- Navigation and buttons use DM Sans
- Editor textareas use JetBrains Mono

- [ ] **Step 4: Commit**

```bash
cd catforcat && git add src/
git commit -m "refactor: replace hardcoded font-family with CSS variable references"
```

---

### Task 5: Set Linen as the default theme

**Files:**
- Modify: `catforcat/src/components/ThemeProvider.tsx`

- [ ] **Step 1: Read ThemeProvider.tsx**

Read the file to find where the default theme is set (likely from localStorage or a default constant).

- [ ] **Step 2: Change default theme from "dark" to "linen"**

Find the default/fallback theme value and change it from `"dark"` to `"linen"`. This means:
- New users see Linen by default
- Users who already chose a theme keep their choice (from localStorage)

- [ ] **Step 3: Verify new users get Linen**

Open an incognito window, go to localhost:3000. The landing should show with the Mocha Soft / Linen palette, not dark.

- [ ] **Step 4: Commit**

```bash
cd catforcat && git add src/components/ThemeProvider.tsx
git commit -m "feat: set Linen as default theme for new users"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full build check**

```bash
cd catforcat && npx next build
```

Expected: Build succeeds with zero errors.

- [ ] **Step 2: Visual verification checklist**

```
[ ] Landing loads with Cormorant Garamond headline
[ ] Landing loads with Linen/Mocha Soft colors by default
[ ] Switch to Dark theme — all variables work
[ ] Switch to Sakura theme — all variables work
[ ] Switch to Light theme — all variables work
[ ] Switch back to Linen — Mocha Mousse accent visible
[ ] Editor page loads — DM Sans for UI, JetBrains Mono for text
[ ] Radius feels slightly more rounded everywhere (12px vs old 10px)
[ ] No broken styles, no missing colors, no font fallbacks
```

- [ ] **Step 3: Commit any fixes**

```bash
cd catforcat && git add -A
git commit -m "fix: address visual issues found during Fase 16-A verification"
```

---

## Summary

```
TASK    WHAT                                    FILES
──────────────────────────────────────────────────────
1       Replace font imports                    layout.tsx
2       Update Linen to Mocha Soft palette      globals.css
3       Update shared tokens (radius, spacing)  globals.css
4       Replace hardcoded font-family refs      multiple .tsx
5       Set Linen as default theme              ThemeProvider.tsx
6       Final verification                      —
```

After this sub-plan, the visual foundation is in place. Sub-Plan B (Landing + Auth pages) and Sub-Plan C (Editor + App pages) build on these tokens.
