# Changelog

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
