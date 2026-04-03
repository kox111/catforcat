# Changelog

## [1.4.0] - 2026-04-03

### Editor Toolbar
- Redesigned as single unified bar with collapsed/expanded states
- Collapsed: Pre-translate, TM, Glossary + save indicator + avatar
- Expanded: +Search, Concordance, Notes, Analysis, QA, Export, Fullscreen
- Save indicator always visible — dot + text when collapsed, dot-only when expanded
- Hover animations with subtle scale effect on all toolbar icons
- Accessibility: aria-labels on all icon-only buttons, prefers-reduced-motion respected

### TM & Glossary — Floating Panels
- TM and Glossary are now floating resizable windows instead of a fixed bottom panel
- TM appears from the left, Glossary from the right
- Three modes: maximized, preview (compact), minimized (icon only)
- Toolbar buttons glow when matches are found — tools come to the translator
- Drag handles for horizontal and vertical resizing
- Slide-in animation on open

### Profile & Avatar
- Avatar crop modal with circular preview and zoom slider on photo upload
- Profile photo propagates to all avatars across the app (TopBar, EditorToolbar, dropdowns)
- PRO users get animated gradient shimmer ring on avatar (no separate badge)
- Username (@alias) editor in Settings with uniqueness validation
- Font size picker (Compact 12px / Default 14px / Large 16px) in avatar dropdown

### Editor UX
- Source/Target column headers restyled as notebook tab separators
- Bottom panel visually integrated — flush against editor, no gap, single border separator
- Split and merge segments now show error feedback instead of failing silently
- Auto-save no longer overwrites server state after split/merge operations
- Quick search filter on projects page

### Import & Export
- PDF segmenter: fixed single-word segments and broken sentences
- Paragraph detection threshold tuned for generous line spacing
- Line rejoin for sentences split across PDF lines
- Garbage segment filter (single chars, lone punctuation)

### Infrastructure
- Split/merge API routes converted to atomic interactive transactions
- PRO plan pricing updated to $30/month
- Midnight theme (6th theme) with 105 CSS variables
- OAuth Google + Apple sign-in
- Security audit: email validation, password min 8 chars, OAuth email_verified check

---

## [1.3.0] - 2026-03-31

### New
- Classroom Mode — professors create classrooms, invite students, manage assignments
- Review Mode — suggestions (inline accept/reject) and post-its (anchored to character positions) now wired into editor
- Task Board — kanban view in classroom dashboard with 3 columns: Pending, In Progress, Completed
- Live Dashboard — real-time student progress during class sessions with active/inactive indicator
- Raid System — invitation flow with roles (professor/student), color-coded members
- Grading — simple numeric or rubric-based grading with per-criteria scores
- Notification system — in-app notifications with polling, mark read, mark all read
- Project context menu — right-click for rename, duplicate, export, delete
- Document Preview — modal zoom-out view with source toggle
- User profiles — public @username alias, PRO gradient ring
- Session controls — professor starts/ends live sessions, 5-second polling

### Fixed
- Autosave indicator reacts to actual save events, not keystrokes (1s/char typewriter animation)
- Pre-translate shows clear message when API keys are not configured instead of silent failures
- Favicon replaced — was 6 bytes (corrupted), now shows catforcat cat logo (32x32 + 16x16)
- Invite codes expire 30 days after classroom creation (HTTP 410 with clear message)

### Changed
- Themes updated to 5: Dark, Sakura, Light, Linen, Forest
- Classroom API returns submissions with student data for Task Board
- TypeScript excludes _backup/ directory from compilation

---

## [1.0.1] - 2026-03-28

### New
- Virtualized segment list — editor now handles 5,000+ segments without performance issues
- Two-Factor Authentication (2FA) with TOTP — setup via QR code in Settings, required on login when enabled
- Persistent rate limiting — API rate limits now survive server restarts

### Changed
- Security headers upgraded: added Content-Security-Policy, Strict-Transport-Security, DNS prefetch control
- Scroll-to-segment behavior improved for keyboard navigation and QA panel links

---

## [1.0.0] - 2026-03-27

### New
- Side-by-side translation editor with real-time segment management
- Translation Memory (TM) with fuzzy matching and concordance search
- Glossary management with term consistency checking
- Import support for DOCX, PDF, and TXT files
- Multi-format export (DOCX, XLIFF, TMX, CSV, TXT)
- QA checks for consistency, formatting, and terminology
- Keyboard shortcuts for efficient translation workflow
- Four visual themes: Dark, Sakura, Light, and Linen
- PWA with offline support via service worker
- Free and Pro plans with Stripe billing integration
- User authentication with email/password
- Project management with progress tracking
- Smart review and segment review workflows
- Pre-translation from Translation Memory
- TM alignment tool for importing parallel texts
