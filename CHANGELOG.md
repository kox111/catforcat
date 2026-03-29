# Changelog

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
