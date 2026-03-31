# CATforCAT — Estado del Proyecto

## Resumen General

**Ultima actualizacion:** 2026-03-30
**Branch:** main
**Deploy:** Coolify en Hetzner ROMA → https://catforcat.app

---

## Fases Completadas

### Fases 1-18 — Core CAT Tool
**Status:** COMPLETADAS

Motor de segmentacion, editor side-by-side, TM con fuzzy matching, glosario, QA checks, pre-traduccion (TM + AI), atajos de teclado, file import/export (DOCX, XLSX, TXT, PDF, TMX, XLIFF, HTML, JSON, SRT, PO, Markdown), smart review, Stripe subscriptions, 5 temas (Dark, Sakura, Light, Linen, Forest), offline sync (Dexie.js), command palette, 2FA, AI scoring, concordancia, alineacion TM.

---

### Fase 19+22 — Classroom Mode + Raid System + Review Mode
**Status:** COMPLETADA (2026-03-30)
**Spec:** docs/superpowers/specs/2026-03-30-classroom-mode-design.md

#### Lo implementado:

**Schema (10 tablas nuevas + 2 modificadas):**
- ProjectMember, Invitation, Classroom, ClassroomMember, Assignment, Submission, Suggestion, PostIt, Notification, ClassSession
- User +username (alias publico @username)
- Project +dueDate, +isTemplate

**API Endpoints (31 nuevos):**
- Classrooms: CRUD, invite, join, member management
- Assignments: CRUD, clone-for-student
- Submissions: submit, unsubmit, grade (simple + rubric)
- Suggestions: CRUD, accept/reject (aplica texto al segmento)
- Post-its: CRUD, resolve (anclados a posicion char_start/char_end)
- Class Sessions: start, end, live polling (5s)
- Notifications: list paginated, mark read, mark all read
- Users: search by @username (autocomplete)
- Projects: duplicate, submission status

**UI Componentes (17 nuevos):**
- UserPreviewCard (con gradient ring PRO)
- InviteModal (busqueda por alias + email + color picker)
- NotificationBell (polling 30s + dropdown)
- ProjectContextMenu (click derecho: open, rename, duplicate, export, delete)
- ClassroomCard, NewClassroomModal, MemberCard (con color picker inline)
- NewAssignmentModal (selecciona proyecto template, rubrica, deadline)
- GradeModal (nota simple o rubrica por criterios)
- SubmitButton, ReviewToolbar (Edit/Suggestions/View toggle)
- SuggestionInline (original strikethrough + propuesto)
- PostItAnchor + PostItComposer (severidad: error/suggestion/good)
- LiveDashboard (progreso en tiempo real por alumno)
- SessionControls (Start/End Session)
- DocumentPreview (modal zoom-out con toggle source)

**Paginas (4 nuevas):**
- /app/classrooms (lista de aulas)
- /app/classrooms/[id] (dashboard: miembros + tareas + live view)
- /app/classrooms/[id]/assignments/[aid] (detalle tarea + submissions)
- /app/join/[code] (unirse por invite code)

**Integraciones en componentes existentes:**
- TopBar: +NotificationBell, +Classrooms nav link
- EditorToolbar: +ReviewToolbar, +SubmitButton, +Preview button
- Projects page: +ProjectContextMenu (click derecho)
- Register page: +campo @username
- Segments PATCH: +progress_pct middleware (actualiza submission)

**Seguridad:**
- Auth + membership + role check en cada endpoint
- Rate limiting en endpoints de mutacion (spec compliant)
- Role validation (solo roles validos aceptados)
- Email nunca expuesto, alias como identidad publica
- Upsert en invitation accept (evita error de constraint)

**CSS Variables (5 temas):**
- --suggestion-original-bg/text, --suggestion-proposed-bg/text
- --postit-error/suggestion/good (bg + text)
- --pro-gradient-start/end, --pro-glow
- --live-indicator, --live-pulse

---

## Pendiente / Backlog

- Invite code expiration (30 dias) — no implementado
- Student "Session active" indicator sutil en editor
- Rate limiting en endpoints de mutacion menores
- Integracion completa de SuggestionInline y PostItAnchor en SegmentRow
- Tests e2e del flujo classroom completo
