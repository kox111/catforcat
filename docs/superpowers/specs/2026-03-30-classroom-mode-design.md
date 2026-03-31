# CATforCAT — Classroom Mode + Raid System + Review Mode

**Fecha:** 2026-03-30
**Autor:** Claude Code (Asesor) + Jorge Leon (Director de Producto)
**Estado:** APROBADO
**Scope:** Fase 19 (Workflow/Review) + Fase 22 (Classroom) fusionadas

---

## 1. Vision

Los profesores son el primer link entre CATforCAT y sus futuros clientes. La primera impresion debe ser impecable. Los alumnos no necesitan IA — necesitan traducir ellos mismos. El classroom mode es el motor del flywheel: universidades adoptan → alumnos aprenden en CATforCAT → graduados se suscriben a Pro.

El sistema de invitacion y roles usa la metafora de "raid" de videojuegos: un lider (profesor o PM) invita, asigna roles con colores, coordina. Intuitivo para cualquier generacion.

---

## 2. Modelo de Datos

### 2.1 Tablas nuevas (10)

#### `project_members` — Sistema Raid

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| project_id | FK → projects | CASCADE |
| user_id | FK → users | CASCADE |
| role | TEXT | 'owner', 'translator', 'reviewer', 'professor', 'student' |
| color | TEXT | Color asignado por el raid leader |
| can_edit | BOOLEAN | Default: true |
| invited_by | FK → users | Quien invito |
| joined_at | TIMESTAMP | |
| UNIQUE | (project_id, user_id) | |

#### `invitations`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| from_user_id | FK → users | CASCADE |
| to_email | TEXT | Email del invitado (privado, solo para matching) |
| to_user_id | FK → users | Nullable, se llena si ya tiene cuenta |
| project_id | FK → projects | Nullable, invitacion a proyecto |
| classroom_id | FK → classrooms | Nullable, invitacion a aula |
| role | TEXT | Rol asignado al aceptar |
| color | TEXT | Color asignado |
| status | TEXT | 'pending', 'accepted', 'declined', 'expired' |
| token | TEXT UNIQUE | UUID para link de invitacion |
| expires_at | TIMESTAMP | 7 dias por defecto |
| created_at | TIMESTAMP | |

#### `classrooms`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| professor_id | FK → users | CASCADE |
| name | TEXT | 'Traduccion Especializada 2026-I' |
| description | TEXT | Nullable |
| src_lang | TEXT | Idioma por defecto del aula |
| tgt_lang | TEXT | |
| invite_code | TEXT UNIQUE | Codigo corto: 'TRAD-A7X3' |
| status | TEXT | 'active', 'archived' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `classroom_members`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| classroom_id | FK → classrooms | CASCADE |
| user_id | FK → users | CASCADE |
| role | TEXT | 'professor', 'student' |
| color | TEXT | Color del miembro en el aula |
| joined_at | TIMESTAMP | |
| UNIQUE | (classroom_id, user_id) | |

#### `assignments`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| classroom_id | FK → classrooms | CASCADE |
| project_id | FK → projects | Proyecto template (source) |
| title | TEXT | 'Practica 3 — Texto medico' |
| instructions | TEXT | Nullable |
| due_date | TIMESTAMP | Deadline |
| grading_mode | TEXT | 'simple', 'rubric' |
| grading_scale | TEXT | 'numeric-20', 'numeric-100', 'letter' (default: 'numeric-20') |
| rubric_criteria | JSONB | Nullable: ['accuracy', 'fluency', 'terminology', 'consistency'] |
| status | TEXT | 'draft', 'active', 'closed' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `submissions`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| assignment_id | FK → assignments | CASCADE |
| student_id | FK → users | CASCADE |
| project_id | FK → projects | Clon del proyecto donde traduce el alumno |
| status | TEXT | 'in_progress', 'submitted', 'reviewing', 'graded' |
| submitted_at | TIMESTAMP | Nullable |
| grade_value | DECIMAL | Nullable — nota numerica |
| grade_comment | TEXT | Nullable — comentario general |
| rubric_scores | JSONB | Nullable — {accuracy: 18, fluency: 15, ...} |
| graded_at | TIMESTAMP | Nullable |
| progress_pct | INTEGER | Default: 0, cache de % confirmados |
| last_active_at | TIMESTAMP | Solo se actualiza en sesion activa |
| created_at | TIMESTAMP | |
| UNIQUE | (assignment_id, student_id) | |

#### `suggestions`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| segment_id | FK → segments | CASCADE |
| author_id | FK → users | CASCADE |
| original_text | TEXT | Lo que estaba |
| suggested_text | TEXT | Lo que el profesor propone |
| status | TEXT | 'pending', 'accepted', 'rejected' |
| created_at | TIMESTAMP | |

#### `post_its`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| segment_id | FK → segments | CASCADE |
| author_id | FK → users | CASCADE |
| char_start | INTEGER | Posicion inicio en target text |
| char_end | INTEGER | Posicion fin |
| content | TEXT | El comentario |
| severity | TEXT | 'error', 'suggestion', 'good' |
| resolved | BOOLEAN | Default: false |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `notifications`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| user_id | FK → users | CASCADE |
| type | TEXT | 'invitation', 'submission', 'review', 'grade', 'deadline' |
| title | TEXT | |
| body | TEXT | |
| link | TEXT | URL interna |
| read | BOOLEAN | Default: false |
| created_at | TIMESTAMP | |

#### `class_sessions`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | TEXT PK | UUID |
| classroom_id | FK → classrooms | CASCADE |
| assignment_id | FK → assignments | Nullable, sesion enfocada en tarea |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | Nullable, null = sesion activa |
| status | TEXT | 'active', 'ended' |

### 2.2 Modificaciones a tablas existentes

#### `users` — agregar:

| Campo | Tipo | Notas |
|-------|------|-------|
| username | TEXT UNIQUE | Alias publico (@username) |

#### `projects` — agregar:

| Campo | Tipo | Notas |
|-------|------|-------|
| due_date | TIMESTAMP | Nullable |
| is_template | BOOLEAN | Default: false |

### 2.3 Nota sobre migracion

No hay datos en produccion. Se puede hacer `prisma db push` o reescribir migraciones desde baseline sin riesgo.

---

## 3. Flujos de Usuario

### 3.1 Registro con alias

Al crear cuenta el usuario elige un `@username` (alias publico). Validacion: letras, numeros, guiones, puntos. 3-20 chars. Unico. Es la identidad publica — lo que ven los demas. El email nunca se expone.

### 3.2 User Cards

Cada usuario tiene una card visual con: foto de perfil, display name, alias, pares de idiomas, y badge PRO.

- **FREE:** Card limpia, borde simple con color asignado por el raid leader
- **PRO:** Marco gradiente en la foto (colores del tema activo), pill "PRO" debajo. La card completa se ve premium — es un status visual como skins de videojuegos

El PRO crea el marco gradiente. Es social/aspiracional, no solo funcional.

### 3.3 Busqueda de usuarios

Campo autocomplete al invitar. Se busca por alias (min 3 chars). Muestra UserPreviewCard con: foto, nombre, alias, idiomas, badge PRO. Sin email, sin datos privados, sin cantidad de proyectos.

### 3.4 Profesor crea aula

Profesor → /app/classrooms → "New Classroom" → nombre, idiomas, descripcion → se genera invite_code automatico → redirige al dashboard del aula.

### 3.5 Invitacion tipo raid

Desde el dashboard del aula:
- Opcion A: compartir invite_code en clase
- Opcion B: buscar por alias → UserPreviewCard → Invitar
- Opcion C: ingresar emails (para alumnos sin cuenta aun)

El profesor asigna color a cada miembro desde el dashboard.

### 3.6 Alumno se une

- Por codigo: /app/join/[code] o ingresa codigo manualmente
- Por invitacion: notificacion in-app → aceptar
- Al unirse queda como 'student' en el aula

### 3.7 Profesor crea tarea

Dashboard del aula → "New Assignment" → sube documento (parser existente) → titulo, deadline, instrucciones → modo calificacion (simple o rubrica con criterios) → publica.

Al publicar: se clona el proyecto template para cada alumno del aula (segmentos source con targets vacios). Se crea submission por alumno. Notificacion a todos.

### 3.8 Alumno traduce

Alumno ve tarea en su aula → click → abre su proyecto clon en el editor normal. Traduce con los mismos atajos, TM, glosario. Auto-save cada 2s. Cuando termina → boton "Submit" en toolbar. Notificacion al profesor.

### 3.9 Sesion de clase (Live View)

Profesor presiona "Start Session" → dashboard cambia a modo live. Ve cada alumno con: card, barra de progreso, tiempo desde ultimo save. Click en alumno → abre su proyecto en modo read-only. Alumnos ven indicador sutil "Sesion activa". Profesor presiona "End Session" → live view se apaga.

Live view es polling cada 5 segundos. `last_active_at` y `progress_pct` solo se actualizan cuando hay sesion activa. Fuera de sesion, el profesor solo ve entregas finales.

### 3.10 Profesor revisa (Sugerencias + Post-its)

Profesor abre proyecto del alumno en modo review. Toggle en toolbar: Edicion / Sugerencias / Visualizacion.

**Modo Sugerencias:** profesor edita un segmento → se crea suggestion (original_text + suggested_text). Visual: texto original con indicador + texto propuesto con indicador. Colores semanticos por tema (CSS variables), nunca rojo/verde hardcodeado. Alumno ve sugerencias y puede Accept o Reject cada una.

**Post-its:** profesor selecciona texto dentro del segmento → popover para escribir comentario + elegir severidad (error, suggestion, good). Post-it anclado a posicion (char_start, char_end). Colores semanticos por tema.

### 3.11 Calificacion

Profesor → submission → "Grade".
- Modo simple: nota numerica + comentario general
- Modo rubrica: nota por criterio definido en el assignment + comentario
- submission.status → 'graded'. Notificacion al alumno.

### 3.12 Document Preview

Boton "Preview" en toolbar del editor. Modal zoom-out del documento renderizado como se veria exportado (headings, parrafos, listas). Client-side con segmentos ya cargados. No es live view — es vista estatica del estado actual. Independiente del classroom.

### 3.13 Context menu de proyectos (bug fix)

Click derecho en proyecto en /app/projects → abrir, renombrar, duplicar, exportar, eliminar (con confirmacion).

---

## 4. API Endpoints (35 nuevos)

### Classrooms (8)

```
POST   /api/classrooms                           crear aula
GET    /api/classrooms                           listar mis aulas
GET    /api/classrooms/[id]                      detalle + miembros + assignments
PATCH  /api/classrooms/[id]                      editar
DELETE /api/classrooms/[id]                      archivar (soft delete)
POST   /api/classrooms/[id]/invite               invitar por alias/email
POST   /api/classrooms/join                      unirse por invite_code
PATCH  /api/classrooms/[id]/members/[uid]        cambiar color/rol
DELETE /api/classrooms/[id]/members/[uid]        remover miembro
```

### Assignments (6)

```
POST   /api/classrooms/[id]/assignments          crear tarea + clonar proyectos
GET    /api/classrooms/[id]/assignments          listar tareas
GET    /api/assignments/[id]                      detalle
PATCH  /api/assignments/[id]                      editar
DELETE /api/assignments/[id]                      eliminar (cascade)
POST   /api/assignments/[id]/clone-for-student    clonar para alumno tardio
```

### Submissions (5)

```
POST   /api/submissions/[id]/submit              entregar
POST   /api/submissions/[id]/unsubmit            retirar entrega
GET    /api/submissions/[id]                      estado
POST   /api/submissions/[id]/grade               calificar
PATCH  /api/submissions/[id]/grade               modificar nota
```

### Class Sessions (4)

```
POST   /api/classrooms/[id]/sessions             iniciar sesion
PATCH  /api/class-sessions/[id]                   terminar sesion
GET    /api/class-sessions/[id]/live              polling: progreso alumnos
GET    /api/class-sessions/active                 sesion activa? (para alumnos)
```

### Suggestions (4)

```
POST   /api/segments/[segId]/suggestions          crear sugerencia
GET    /api/projects/[id]/suggestions              listar sugerencias
PATCH  /api/suggestions/[id]                       accept/reject
DELETE /api/suggestions/[id]                       eliminar
```

### Post-its (4)

```
POST   /api/segments/[segId]/post-its              crear post-it
GET    /api/projects/[id]/post-its                  listar post-its
PATCH  /api/post-its/[id]                           editar/resolver
DELETE /api/post-its/[id]                           eliminar
```

### Notifications (3)

```
GET    /api/notifications                          listar (paginadas)
PATCH  /api/notifications/read-all                 marcar todas leidas
PATCH  /api/notifications/[id]                     marcar una leida
```

### Users (1)

```
GET    /api/users/search?q=                        buscar por alias (autocomplete)
```

### Projects (1)

```
POST   /api/projects/[id]/duplicate                clonar proyecto
```

---

## 5. Componentes UI

### Paginas nuevas (4)

```
/app/classrooms                              lista de aulas
/app/classrooms/[id]                         dashboard del aula
/app/classrooms/[id]/assignments/[aid]       detalle de tarea
/app/join/[code]                             pagina publica para unirse
```

### Componentes nuevos (23)

| Componente | Proposito |
|------------|-----------|
| ClassroomCard | Card de aula en la lista |
| NewClassroomModal | Modal crear aula |
| ClassroomDashboard | Layout con tabs Miembros / Tareas |
| MemberCard | Card de usuario con foto, alias, color, PRO |
| MemberColorPicker | Popover para asignar color |
| InviteModal | Invitar por alias/email/codigo |
| UserPreviewCard | Preview al buscar usuario para invitar |
| NewAssignmentModal | Crear tarea: doc, titulo, deadline, rubrica |
| AssignmentCard | Card de tarea en dashboard |
| SubmissionRow | Fila de alumno: card + progreso + status + nota |
| LiveDashboard | Vista live con progreso en tiempo real |
| SessionControls | Botones Start/End Session |
| ReviewToolbar | Toggle Edicion / Sugerencias / Visualizacion |
| SuggestionInline | Texto original + propuesto en segmento |
| SuggestionActions | Botones Accept / Reject |
| PostItAnchor | Marcador visual + popover con comentario |
| PostItComposer | Popover al seleccionar texto |
| GradeModal | Calificar: nota simple o rubrica |
| NotificationBell | Badge + dropdown en TopBar |
| NotificationItem | Linea de notificacion |
| SubmitButton | Boton "Submit" para alumnos |
| DocumentPreview | Modal zoom-out del documento |
| ProjectContextMenu | Click derecho en proyectos |

### Componentes modificados (5)

| Componente | Cambio |
|------------|--------|
| TopBar | + NotificationBell, + link Classrooms |
| EditorToolbar | + ReviewToolbar, + SubmitButton, + Preview button |
| SegmentRow | + SuggestionInline, + PostItAnchor, + modo read-only |
| /app/projects/page.tsx | + ProjectContextMenu, + indicador tarea |
| register/page.tsx | + campo alias (@username) |

---

## 6. Seguridad

### Matriz de permisos

| Accion | Owner | Professor | Translator | Reviewer | Student |
|--------|-------|-----------|------------|----------|---------|
| Editar segmentos | si | no | si | no | si (su clon) |
| Crear sugerencias | si | si | no | si | no |
| Crear post-its | si | si | no | si | no |
| Accept/reject sugerencias | si | no | si | no | si |
| Calificar | no | si | no | no | no |
| Live view | no | si (sesion) | no | no | no |
| Invitar | si | si | no | no | no |
| Eliminar proyecto | si | no | no | no | no |
| Submit tarea | no | no | no | no | si |
| Start/End session | no | si | no | no | no |

### Validacion en cada endpoint

1. Autenticacion (session NextAuth)
2. Membership (classroom_members o project_members)
3. Rol (matriz de permisos)
4. Ownership de recurso
5. Estado (deadline, submission status)

### Rate limiting

| Endpoint | Limite |
|----------|--------|
| POST /api/classrooms | 5/hora/usuario |
| POST /api/classrooms/[id]/invite | 30/hora/usuario |
| POST /api/classrooms/join | 10/hora/IP |
| GET /api/class-sessions/[id]/live | 20/minuto/usuario |
| POST /api/segments/[id]/suggestions | 60/hora/usuario |
| POST /api/segments/[id]/post-its | 60/hora/usuario |
| GET /api/users/search | 30/minuto/usuario |

### Privacy

- Email personal nunca se expone en ningun endpoint ni UI
- Live view solo con class_session activa (403 sin sesion)
- Proyectos de alumnos solo visibles para el alumno y su profesor
- Alias (@username) es lo unico publico
- Invite codes expiran en 30 dias, regenerables
- Tokens de invitacion UUID v4, expiran en 7 dias

### Checklist por endpoint (5 puntos)

1. Input validado (tipos, longitud, formato)
2. Ownership verificado (userId + membership + rol)
3. Rate limiting en mutaciones
4. Error responses no filtran info interna
5. Cero secrets hardcodeados

---

## 7. Orden de Implementacion

Un solo deploy. Build check despues de cada bloque.

### Bloque 1 — Schema + Auth

- Migracion Prisma completa (10 tablas + campos nuevos)
- Campo username en registro
- GET /api/users/search
- UserPreviewCard
- Check: next build + tsc --noEmit

### Bloque 2 — Sistema Raid + Notificaciones

- API project_members + invitations
- InviteModal con autocomplete
- ProjectContextMenu (bug fix click derecho)
- NotificationBell + API notifications
- Check: build + flujo invitacion en localhost

### Bloque 3 — Classrooms

- API classrooms + classroom_members
- Pagina /app/classrooms + ClassroomCard + NewClassroomModal
- ClassroomDashboard + MemberCard + MemberColorPicker
- JoinPage /app/join/[code]
- TopBar actualizado
- Check: build + crear aula, invitar, unirse

### Bloque 4 — Assignments + Submissions

- API assignments + submissions
- NewAssignmentModal + AssignmentCard + SubmissionRow
- Logica clonacion de proyecto
- SubmitButton en EditorToolbar
- Notificaciones automaticas
- Check: build + flujo completo profesor→alumno→submit

### Bloque 5 — Review Mode

- API suggestions + post-its
- ReviewToolbar + SuggestionInline + SuggestionActions
- PostItComposer + PostItAnchor
- CSS variables para colores semanticos por tema
- Modo read-only
- Check: build + flujo sugerencias + post-its

### Bloque 6 — Live View + Calificacion

- API class_sessions + live polling
- LiveDashboard + SessionControls
- Indicador "Sesion activa" para alumnos
- Middleware progress_pct + last_active_at
- GradeModal + API grade
- Check: build + flujo live + calificacion

### Bloque 7 — Document Preview + Polish + Deploy

- DocumentPreview modal
- Security checklist completa
- Rate limiting en todos los endpoints
- Test end-to-end en localhost
- Push unico a main → Coolify rebuild

---

## 8. CSS Variables nuevas (por tema)

```css
/* Sugerencias — control de cambios */
--suggestion-original-bg
--suggestion-original-text
--suggestion-proposed-bg
--suggestion-proposed-text

/* Post-its — severidad */
--postit-error
--postit-error-bg
--postit-suggestion
--postit-suggestion-bg
--postit-good
--postit-good-bg

/* PRO card */
--pro-gradient-start
--pro-gradient-end
--pro-glow

/* Live view */
--live-indicator
--live-pulse
```

Cada tema (Linen, Dark, Sakura, Light, Forest) define valores dentro de su paleta Pantone. Nunca colores hardcodeados.

---

## 9. Notas de Diseno

- TODO respeta el design system existente: CSS variables, fonts, spacing, radius, animaciones
- Colores de post-its y sugerencias son semanticos por tema, nunca rojo/verde literal
- Animaciones a ritmo humano (150-200ms/char)
- User cards PRO: marco gradiente en foto + pill PRO. El marco es lo que crea el gradiente
- Sin limite de alumnos por aula — el aula es el funnel, no el revenue
- Live view solo en sesion activa — no vigilancia fuera de clase
- Email personal nunca visible — alias (@username) como identidad publica

---

*Spec generado para TheLionKey — CATforCAT Classroom Mode*
*Aprobado por Jorge Leon (Director de Producto) — 2026-03-30*
