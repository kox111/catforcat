# Teams Mode — Design Spec

**Fecha:** 2026-04-05
**Autor:** Jorge León (director) + Claude (arquitectura)
**Estado:** Aprobado para implementación

---

## Objetivo

Agregar modo de equipos profesionales a CATforCAT. Múltiples traductores, revisores y un PM trabajan simultáneamente en el mismo proyecto con presencia visual en tiempo real, asignación de segmentos por rango, y un workflow de flujo continuo (Continuous Flow) que supera a Smartcat, Trados, memoQ y Phrase.

## Diferenciadores vs competencia

| Feature | Trados | memoQ | Phrase | Smartcat | **CATforCAT** |
|---------|--------|-------|--------|----------|---------------|
| Equipo persistente | ✓ (servidor) | ✓ (servidor) | ✓ (vendors) | ✓ (pool) | **✓ (Team entity)** |
| Asignación | Por archivo | Por doc×rol | Por job×step | Por doc×stage | **Flexible: doc completo O rango de segmentos** |
| Pipeline | Secuencial archivo | Secuencial doc | Steps config | Stream por seg | **Continuous Flow + checkpoints PM** |
| Presencia visual | ✗ | ✗ | ✗ | Básica | **Barras de color por miembro en editor** |
| Propagación de errores | ✗ | ✗ | ✗ | ✗ | **Automática al rechazar** |
| Interacción en segmento | ✗ | Comentarios | Comentarios | Comentarios | **Post-its + Suggestions inline (ya existe)** |

## Arquitectura

### Sistema: Continuous Flow con Context Awareness

No hay 3 modos separados. Es UN sistema unificado:

1. **Flujo continuo** (de Stream): segmentos avanzan al siguiente stage en cuanto se confirman
2. **Contexto inteligente** (de Batch): el reviewer siempre ve segmentos agrupados por estructura del documento (párrafo/sección), nunca aislados
3. **Checkpoints selectivos** (de Gate): el PM marca puntos específicos del documento donde quiere aprobar antes de que avancen. El resto fluye automático

### Presencia visual en editor

- Cada miembro tiene un color único (8 colores semánticos como CSS variables en 6 temas)
- Barra lateral izquierda del editor muestra la posición de cada miembro online en su color
- Heartbeat cada 5s. Si no hay heartbeat por 30s → desaparece el marcador (usuario offline)
- El estado guardado del último segmento NO cuenta como presencia. Solo online = visible
- Shortcut para saltar al segmento donde está un compañero

### Permisos por rango

- PM asigna rangos: Traductor A = segs 1-1500, Traductor B = 1501-3000
- Segmentos fuera de tu rango → read-only (fondo sutil diferente)
- PERO puedes dejar Post-its y Suggestions en cualquier segmento (si tu rol lo permite)
- El reviewer no tiene rango — revisa todo el documento
- Los permisos reemplazan el locking. No hay candados ni race conditions

### Colores del equipo

8 colores con nombres simples. Se guardan en DB como string. Se renderizan como CSS variables por tema.

| Nombre DB | Variable CSS |
|-----------|-------------|
| rojo | --team-rojo |
| rosa | --team-rosa |
| morado | --team-morado |
| azul | --team-azul |
| celeste | --team-celeste |
| teal | --team-teal |
| verde | --team-verde |
| amarillo | --team-amarillo |

Cada variable existe en los 6 temas (dark, sakura, light, linen, forest, midnight). NADA hardcodeado. Los valores se calibran por contraste en cada tema.

Los colores no se repiten dentro del mismo equipo. 8 colores = máximo 8 miembros por equipo.

---

## Schema (Prisma)

### Tablas nuevas

**Team**
- id (uuid), name, description (nullable), ownerId (FK User), createdAt

**TeamMember**
- id (uuid), teamId (FK Team), userId (FK User), role (string: pm/translator/reviewer/proofreader/terminologist/dtp), color (string: rojo/rosa/etc), joinedAt
- Unique: [teamId, userId]
- Unique: [teamId, color] (color no se repite en equipo)

**WorkflowTemplate**
- id (uuid), name, stages (JSON array de strings de roles en orden, ej: ["translator","reviewer"]), ownerId (FK User), isDefault (bool)
- Defaults del sistema: "Simple" (translator→reviewer), "Standard" (translator→reviewer→proofreader), "Full" (translator→reviewer→proofreader→dtp)

**SegmentAssignment**
- id (uuid), projectId (FK Project), userId (FK User), rangeStart (int, nullable), rangeEnd (int, nullable)
- nullable = documento completo (para reviewer)
- Unique: [projectId, userId]

**UserPresence**
- projectId (FK Project), userId (FK User), currentSegmentPosition (int), lastHeartbeat (DateTime)
- Composite PK: [projectId, userId]
- Cleanup: registros con lastHeartbeat > 30s se ignoran/eliminan

### Cambios en tablas existentes

**Project** (agregar):
- teamId (FK Team, nullable) — proyecto puede no tener equipo
- workflowTemplateId (FK WorkflowTemplate, nullable)
- pipelineCheckpoints (String, default "[]") — JSON array de positions donde PM quiere gate

**Segment** (agregar):
- workflowStage (String, default "translating") — "translating" | "reviewing" | "proofreading" | "completed"
- confirmedBy (FK User, nullable)
- confirmedAt (DateTime, nullable)
- needsRecheck (Boolean, default false) — propagación de errores

### NO se crea

- No lockedBy/lockedAt en Segment — permisos por rango reemplazan locking
- No tabla separada para checkpoints — se guardan como JSON en Project

---

## API Endpoints

### Teams CRUD
- `POST /api/teams` — crear equipo (auth + rate limit)
- `GET /api/teams` — listar mis equipos (owner + miembro)
- `GET /api/teams/[id]` — detalle con miembros
- `PATCH /api/teams/[id]` — editar nombre/desc (solo owner)
- `DELETE /api/teams/[id]` — eliminar equipo (solo owner, si no hay proyectos activos)
- `POST /api/teams/[id]/members` — agregar miembro (invite por @username, role, color)
- `DELETE /api/teams/[id]/members/[uid]` — remover miembro (owner o self)
- `PATCH /api/teams/[id]/members/[uid]` — cambiar rol/color

### Workflow Templates
- `GET /api/workflow-templates` — listar (defaults + propios)
- `POST /api/workflow-templates` — crear custom
- `DELETE /api/workflow-templates/[id]` — eliminar (solo custom, solo owner)

### Segment Assignment
- `POST /api/projects/[id]/assignments` — PM asigna rangos a miembros
- `GET /api/projects/[id]/assignments` — ver asignaciones
- `PATCH /api/projects/[id]/assignments/[aid]` — modificar rango
- `DELETE /api/projects/[id]/assignments/[aid]` — quitar asignación

### Segment Workflow
- `PATCH /api/segments/[id]/confirm` — confirmar traducción → avanza stage (o espera checkpoint)
- `PATCH /api/segments/[id]/reject` — reviewer rechaza → regresa stage + propaga needsRecheck
- `POST /api/projects/[id]/checkpoints/approve` — PM aprueba checkpoint (body: { position: number })

### Presencia
- `POST /api/projects/[id]/presence` — heartbeat (segmentPosition, cada 5s)
- `GET /api/projects/[id]/presence` — obtener posiciones de todos los miembros activos

### Dashboard PM
- `GET /api/projects/[id]/team-progress` — progreso por miembro, por stage, alertas, checkpoints pendientes

---

## Páginas nuevas

- `/app/teams` — lista de equipos
- `/app/teams/[id]` — dashboard del equipo (miembros, proyectos del equipo)
- `/app/projects/[id]/team` — dashboard PM del proyecto (progreso, asignaciones, workflow)

---

## Cambios en UI existente

### TopBar
- Agregar "Teams" entre "Projects" y "Classrooms": Projects | Teams | Classrooms

### NewProjectModal
- Agregar campo "Team" (dropdown, opcional)
- Agregar campo "Workflow" (dropdown, solo si hay Team seleccionado)
- Al seleccionar Team → auto-agregar miembros como ProjectMembers

### Editor (VirtualSegmentList + SegmentRow)
- Barras de presencia multi-color en la columna izquierda
- Segmentos fuera de rango asignado → read-only con fondo sutil
- Click derecho en segmento de otro → solo Post-it / Suggestion
- Badge de workflowStage por segmento (sutil, en el número de segmento)
- Shortcut Ctrl+G → modal con lista de miembros activos → click → salta a su posición

### MemberCard
- Migrar COLOR_OPTIONS de hex hardcodeado a CSS variables (--team-rojo, etc.)
- Mostrar nombre del color + swatch

### Notifications
- Nuevos tipos: team_suggestion, team_postit, segments_ready, correction_needed, checkpoint_pending, member_completed
- Click → navega al segmento

---

## Propagación de errores (Continuous Flow)

Cuando el reviewer rechaza el segmento N (del traductor A):
1. Segmento N → workflowStage regresa a "translating"
2. Notificación al traductor A: "SOURCE #N fue rechazado"
3. Buscar segmentos downstream del mismo traductor A en la misma sección (hasta próximo doble salto de línea o fin de rango) → marcar needsRecheck = true
4. El reviewer ve un indicador en esos segmentos: "puede necesitar re-revisión"
5. El traductor corrige → confirma → fluye de vuelta al reviewer

---

## Workflow Templates predefinidos

| Template | Stages |
|----------|--------|
| Simple | translator → reviewer |
| Standard | translator → reviewer → proofreader |
| Full | translator → reviewer → proofreader → dtp |

El PM puede crear templates custom combinando los 6 roles en cualquier orden.

---

## Seguridad

- Auth + membership + role check en cada endpoint de Teams
- Rate limiting en creación de equipos y miembros
- Solo el owner del equipo puede eliminar/editar
- Solo PM/owner puede asignar segmentos y crear checkpoints
- Un usuario no puede editar segmentos fuera de su rango asignado (enforcement en API, no solo UI)
- Zod validation en todos los inputs

---

## Bug conocido (fuera de scope, para fix posterior)

- Classrooms no se pueden eliminar ni editar miembros después de crear. Registrado para fix en sesión separada.
