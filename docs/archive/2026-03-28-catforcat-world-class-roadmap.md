# CATforCAT — Roadmap to World-Class

**Fecha:** 2026-03-28
**Autor:** Claude Code (Asesor) + Jorge Leon (Director de Producto)
**Tipo:** Informe estrategico + Roadmap de implementacion
**Estado:** PENDIENTE DE APROBACION

---

## 1. Donde estamos hoy

CATforCAT tiene 14 fases completadas. Es una CAT tool funcional con:

- Editor side-by-side con atajos profesionales
- Translation Memory con fuzzy matching (Levenshtein)
- Glosario inteligente con enforcement
- QA con 13 checks y export CSV
- Pre-translate (TM + Google/DeepL)
- Import: TXT, DOCX, PDF, XLIFF
- Export: TXT, DOCX, TMX, XLIFF, HTML
- PWA con modo offline (Dexie.js + Service Worker)
- Stripe billing (Free / Pro $10/mes)
- 4 temas visuales (Dark, Sakura, Light, Linen)
- Split/merge, comments, undo/redo, concordance search

**Veredicto:** Buen MVP. NO es competitivo a nivel mundial. Todavia.

---

## 2. La competencia y sus precios

```
HERRAMIENTA       PRECIO FREELANCER    MODELO
-----------------------------------------------
Trados Studio     $645 perpetua        Desktop (Windows only)
memoQ             $915 perpetua        Desktop (Windows only)
Phrase            Solo enterprise      Cloud
Smartcat          $0 free / $99/mo     Cloud + marketplace
MateCat           Gratis               Cloud (open source)
CafeTran          EUR 80/ano           Desktop (Java)

CATforCAT         $0 free / $29/mo     Cloud + PWA + Offline
```

**CATforCAT es 22x mas barato que Trados y no es "barato" — es premium
a precio justo.** La estrategia NO es competir por precio. Es crear
NECESIDAD: que los usuarios de Trados NECESITEN cambiarse porque CATforCAT
hace cosas que Trados no puede hacer (IA como copiloto, cloud nativo,
UX moderna). El precio refleja el valor, no descuenta por ser nuevo.

---

## 3. Que falta — Organizado por FASES

Cada fase tiene: que se hace, por que importa, costo de API si aplica,
y complejidad estimada.

---

### FASE 15: PERFORMANCE + SEGURIDAD (Blockers)

**Sin esto la app no escala. Es invisible para el usuario pero critico.**

```
FEATURE                         POR QUE                                     COMPLEJIDAD
------------------------------------------------------------------------------------------
Virtualizacion de lista         +2000 segmentos = app muerta                Media
(react-window o tanstack-virtual) Solo renderiza lo visible en pantalla

2FA (TOTP)                      Sin esto ninguna agencia te usa             Media
                                Standard de seguridad minimo

Rate limiting mejorado          El in-memory actual se pierde al restart    Baja
(persistido en DB)

CSP headers + security          Proteccion basica contra XSS/injection     Baja
headers
```

**Costo de API:** $0 — Todo es frontend/backend, sin APIs externas.
**Estimacion:** 1 fase de trabajo.

---

### FASE 16: FORMATOS DE ARCHIVO CRITICOS

**Sin SDLXLIFF, un freelancer no puede usar CATforCAT para el 80% de los
trabajos que recibe de agencias.**

```
FEATURE                         POR QUE                                     COMPLEJIDAD
------------------------------------------------------------------------------------------
SDLXLIFF import/export          70% del mercado usa Trados. Las agencias    Alta
                                envian archivos en SDLXLIFF. Es el
                                formato #1 de la industria.

MXLIFF import/export            Formato nativo de Phrase/Memsource.         Media
                                Segundo mas usado despues de SDLXLIFF.

PO/POT (gettext)                Standard de localizacion de software.       Media
                                Linux, WordPress, Django, Ruby.

SRT/VTT (subtitulos)            Mercado de video/streaming en explosion.    Baja
                                Netflix, YouTube, contenido multimedia.

JSON (i18n)                     React (react-intl, next-intl), Vue          Baja
                                (vue-i18n). Apps web modernas.

YAML (i18n)                     Rails, Flutter, Hugo. Apps y static sites.  Baja
```

**Costo de API:** $0 — Solo parseo de archivos.
**Estimacion:** 1 fase de trabajo. SDLXLIFF es lo mas complejo (XML con namespaces).

---

### FASE 17: IA COMO COPILOTO (El Diferenciador)

**Aqui es donde CATforCAT deja de ser "otra CAT tool" y se convierte en
la primera CAT tool con IA integrada como copiloto real.**

```
FEATURE                         QUE HACE                                    COMPLEJIDAD
------------------------------------------------------------------------------------------
Claude Haiku 4.5 como           Traduccion contextual: lee el documento     Media
motor de traduccion             completo, respeta tono, glosario, y
                                contexto. No traduce segmento aislado
                                como Google/DeepL.

Multi-engine preview            Muestra 3 sugerencias lado a lado:          Baja
                                Google vs DeepL vs Claude. El traductor
                                elige la mejor base para editar.

Auto post-editing               Pasa el output de Google/DeepL por          Media
                                Claude Haiku para pulirlo. Calidad de
                                LLM a costo de MT. Lo mejor de ambos.

Quality Estimation              Antes de que el traductor toque nada,       Alta
                                Claude predice que segmentos necesitan
                                revision humana (rojo) y cuales estan
                                bien (verde). Priorizacion inteligente.

Adaptive MT                     Cuando el usuario confirma una correccion,  Media
                                el sistema aprende y ajusta las
                                sugerencias futuras (boost de TM +
                                patterns guardados).

Explicacion de traduccion       El traductor puede preguntar "por que       Baja
                                tradujiste esto asi?" y Claude explica
                                la decision en contexto.
```

**COSTOS DE API POR USUARIO/MES (estimaciones conservadoras):**

```
ESCENARIO: Freelancer traduce ~50,000 palabras/mes (~250,000 caracteres)

PROVEEDOR          COSTO/MILLON CHARS    COSTO ESTIMADO/MES    NOTAS
--------------------------------------------------------------------------------
Google Translate    $20/M chars           ~$5.00                Rapido, basico
DeepL API Pro       $25/M chars + $5.49   ~$11.74               Mejor calidad EU
Claude Haiku 4.5    $1 input + $5 output  ~$0.30 - $1.50       Por MTok, muy barato
                    por MTok                                    con prompt caching

MODELO HIBRIDO RECOMENDADO:
- Pre-translate masivo: Google ($5/mes por usuario)
- Post-editing con IA: Claude Haiku ($0.50/mes por usuario)
- Quality Estimation: Claude Haiku ($0.20/mes por usuario)
- TOTAL IA por usuario Pro: ~$5.70/mes

CON PROMPT CACHING (90% ahorro en input):
- TOTAL IA por usuario Pro: ~$2.50/mes
```

**PRICING DEFINITIVO:**

```
PLAN        PRECIO       MT ENGINE           IA FEATURES
---------------------------------------------------------
Free        $0/mes       Google              QA basico, 50 segs/mes,
                         (limitado)          sin Claude, sin DeepL

Pro         $29/mes      Google + DeepL      Claude post-editing,
                                             multi-engine preview,
                                             quality estimation,
                                             adaptive MT,
                                             explicaciones de IA,
                                             todos los formatos,
                                             ilimitado

Team        $49/mes      Todo lo de Pro      + Roles (translator,
 (por user)                                  reviewer, PM),
                                             review mode, sharing,
                                             assignments, audit log
```

**Por que $29 y no $15:**

El valor de CATforCAT no es "ser mas barato". Es ser MEJOR.
$29/mes sigue siendo 22x mas barato que Trados ($645).
Un freelancer que traduce 50K palabras/mes a $0.08/palabra
gana $4,000/mes. $29 es el 0.7% de su ingreso mensual.
Si la herramienta le ahorra 2 horas/mes, ya se pago sola.

La estrategia es la misma que Anthropic con Claude:
crear la solucion a una necesidad que existe hace anos
pero nunca fue resuelta bien. El usuario paga con gusto
porque NECESITA el producto, no porque sea barato.

---

### FASE 18: UI/UX PREMIUM REDESIGN

**Filosofia de diseno: "Respira, no llena."**

```
PRINCIPIOS
----------
1. ESPACIO     — Padding generoso. El contenido respira.
                 Nada de 200 botones apretados como Trados.

2. JERARQUIA   — Solo 2-3 acciones visibles a la vez.
                 El resto en menus contextuales inteligentes.
                 Ctrl+K como command palette (estilo VS Code/Linear).

3. TIPOGRAFIA  — Un solo font premium para UI. Uno para codigo/editor.
                 Tamanos con escala musical (major third 1.25).

4. COLOR       — Paleta reducida. Maximo 3 colores semanticos.
                 El color comunica estado, no decora.

5. MOVIMIENTO  — Transiciones de 150-200ms. Nada brusco, nada lento.
                 Spring animations para feedback tactil.

6. PROFUNDIDAD — Sombras sutiles con capas (elevation system).
                 Glass morphism solo donde agrega claridad.

7. CUSTOM      — Cero componentes genericos. Todo hecho a medida.
                 Cada boton, dropdown, modal es unico de CATforCAT.
```

**Lo que se rehace vs. lo que se pule:**

```
COMPONENTE              ACCION                  HERRAMIENTA
------------------------------------------------------------
Command Palette         NUEVO — Ctrl+K abre     21st.dev MCP
                        buscador universal de
                        acciones, segmentos,
                        TM, glosario

Editor Grid             REDISENAR — mas          21st.dev MCP +
                        espacio entre filas,     ui-ux-pro-max skill
                        source/target con mejor
                        separacion visual

Toolbar                 SIMPLIFICAR — max 4-5    21st.dev MCP
                        iconos visibles. El
                        resto en command palette

Sidebar                 ELIMINAR o MINIMIZAR     Custom CSS
                        a un rail de iconos
                        (estilo Linear/Figma)

Paneles TM/Glosario     REDISENAR — cards con   21st.dev MCP
                        mejor jerarquia, menos
                        ruido visual

Modales                 UNIFICAR estilo —        21st.dev MCP
                        backdrop blur, bordes
                        sutiles, animacion
                        consistente

Temas                   REFINAR paletas —        Stitch MCP +
                        evaluar si los 4 temas   nano-banana
                        actuales son optimos o
                        si necesitan ajuste
                        de pantone

Onboarding              NUEVO — tutorial          21st.dev MCP
                        interactivo para
                        nuevos usuarios.
                        3 pasos, no 20.

Empty States            NUEVO — ilustraciones    nano-banana MCP
                        custom para estados
                        vacios (sin proyectos,
                        sin TM, etc.)

Landing Page            REDISENAR — debe         21st.dev MCP +
                        comunicar "moderno,      nano-banana
                        premium, IA" en 3
                        segundos
```

**Costo de API:** $0 — Las herramientas MCP son parte de tu stack.
**Estimacion:** 1 fase de trabajo, iterativa. Se puede hacer en paralelo con Fase 17.

---

### FASE 19: WORKFLOW PROFESIONAL

```
FEATURE                         QUE HACE                                    COMPLEJIDAD
------------------------------------------------------------------------------------------
Review Mode                     Vista de solo-lectura donde el reviewer     Media
                                aprueba/rechaza/comenta segmentos.
                                No puede editar directamente.

Roles basicos                   Translator, Reviewer, PM.                   Media
                                Cada rol ve/hace cosas diferentes.

Project sharing por link        "Comparte este proyecto con tu reviewer"    Baja
                                con permisos (view/edit/review).

Segment locking                 PM bloquea segmentos que no deben           Baja
                                editarse (headers, disclaimers).

Locale-specific QA              Formatos de numeros (EN: 1,000.50 vs       Baja
                                ES: 1.000,50), fechas, puntuacion
                                invertida en ES, comillas tipograficas.
```

**Costo de API:** $0
**Estimacion:** 1 fase de trabajo.

---

### FASE 20: ANALYTICS Y PRODUCTIVIDAD

```
FEATURE                         QUE HACE
------------------------------------------------------------------------------------------
Speed metrics                   Palabras/hora, segmentos/hora por proyecto.
                                Los freelancers cobran por palabra.

Earnings calculator             "A $0.08/palabra y tu velocidad actual,
                                este proyecto = $X en ~Y horas"

MT Utility Rate                 Que % de sugerencias MT uso el traductor
                                vs. tradujo desde cero. Mide si la IA sirve.

Time tracking                   Start/stop por proyecto. Para freelancers
                                que facturan por hora.

Dashboard de productividad      Historial, graficos, tendencias mensuales.
```

**Costo de API:** $0
**Estimacion:** 1 fase de trabajo.

---

### FASE 21: API PUBLICA + INTEGRACIONES

```
FEATURE                         QUE HACE
------------------------------------------------------------------------------------------
API REST documentada            Endpoints publicos para crear proyectos,
                                subir archivos, obtener traducciones.
                                Con API keys y rate limits.

Webhooks                        "Cuando un proyecto se complete, notificame
                                en esta URL" (Slack, email, custom).

GitHub connector                Pull strings de repos (JSON/PO/YAML),
                                push traducciones como PR.

Zapier/Make integration         Automatizacion sin codigo para agencias.
```

**Costo de API:** $0 (los webhooks son outbound, costo negligible)
**Estimacion:** 1-2 fases de trabajo.

---

## 4. Presupuesto mensual y proyecciones financieras

### 4.1 Costos fijos mensuales

```
CONCEPTO                    COSTO/MES         NOTAS
-----------------------------------------------------
Hetzner VPS (ROMA)          ~$11              Ya lo tienes
Coolify                     $0                Self-hosted
PostgreSQL                  $0                Self-hosted en ROMA
DeepL API Pro (base fee)    $5.49             Fee fija mensual
Dominio catforcat.app       ~$1               ~$10/ano
Email transaccional         ~$0-10            Resend free tier o ~$10
                            ─────
TOTAL FIJO:                 ~$27/mes
```

### 4.2 Costos variables por usuario Pro activo

```
CONCEPTO                    COSTO/USUARIO/MES   NOTAS
------------------------------------------------------
Google Translate API        ~$5.00               ~250K chars/mes
DeepL API (usage)           ~$6.25               ~250K chars a $25/M
Claude Haiku 4.5            ~$0.70               Con prompt caching
Stripe fee (2.9% + $0.30)  ~$1.14               Sobre $29
                            ─────
TOTAL VARIABLE:             ~$13.09/usuario/mes
```

### 4.3 Margen por usuario Pro

```
Revenue por usuario:         $29.00
- Costos variables:         -$13.09
                             ─────
MARGEN BRUTO/USUARIO:        $15.91 (55%)
```

### 4.4 Proyecciones por escala

```
USUARIOS PRO    REVENUE      COSTOS FIJOS   COSTOS VAR    MARKETING*   GANANCIA NETA
---------------------------------------------------------------------------------------
    10          $290          $27            $131          $100         $32/mes
    50          $1,450        $27            $655          $300         $468/mes
   100          $2,900        $27            $1,309        $500         $1,064/mes
   250          $7,250        $27            $3,273        $800         $3,150/mes
   500          $14,500       $50**          $6,545        $1,200       $6,705/mes
 1,000          $29,000       $80**          $13,090       $2,000       $13,830/mes
 5,000          $145,000      $200**         $65,450       $5,000       $74,350/mes

* Marketing: Google Ads, SEO tools, email marketing, content
** Costos fijos suben con escala: mas VPS, backups, monitoring
```

### 4.5 Escenario Team ($49/user/mes)

```
Si el 20% de los Pro son Team (agencias):

100 Pro + 25 Team = 100×$29 + 25×$49 = $4,125/mes revenue
Costos estimados: ~$2,200
GANANCIA: ~$1,925/mes

500 Pro + 100 Team = $19,400/mes revenue
Costos estimados: ~$10,500
GANANCIA: ~$8,900/mes
```

### 4.6 Meta a 12 meses (Solo SaaS, sin marketplace)

```
OBJETIVO REALISTA: 250 Pro + 50 Team en 12 meses
= $7,250 + $2,450 = $9,700/mes revenue
= ~$5,000/mes ganancia neta
= ~$60,000/ano de ganancia

OBJETIVO AMBICIOSO: 500 Pro + 100 Team en 12 meses
= $14,500 + $4,900 = $19,400/mes revenue
= ~$8,900/mes ganancia neta
= ~$107,000/ano de ganancia
```

### 4.7 Meta a 24 meses (SaaS + Education + Marketplace)

```
SaaS:
  500 Pro x $29         = $14,500/mes
  100 Team x $49        = $4,900/mes

Education:
  10 universidades      = $1,990/mes
  200 estudiantes x $9  = $1,800/mes

Marketplace (comision 5%):
  500 traductores activos
  x $500/mes promedio   = $12,500/mes

TOTAL REVENUE:            $35,690/mes
COSTOS ESTIMADOS:         ~$15,000/mes
GANANCIA NETA:            ~$20,690/mes
                          = ~$248,000/ano

Y cada universidad genera ~100 futuros Pro users/ano.
El flywheel se acelera solo.
```

**Nota importante sobre costos de API:** Los costos de Google y DeepL
se pueden OPTIMIZAR significativamente:
- Cache de traducciones repetidas (ya tenemos TM)
- Prompt caching de Claude (90% ahorro)
- Batch API de Claude (50% descuento)
- El Free tier de Google (500K chars gratis/mes) absorbe usuarios light
- No todos los Pro usan DeepL todos los meses

**Costo real por usuario probablemente sera ~$8-10, no $13.**
Eso sube el margen a ~65-70%.

---

## 5. Orden de ejecucion recomendado

```
ORDEN    FASE    QUE                           DEPENDE DE    POR QUE PRIMERO
-------------------------------------------------------------------------------
  1      15      Performance + Seguridad       Nada          COMPLETADA ✓
                                                             (2026-03-28)

  2      16      UI/UX Premium Redesign        Fase 15       La primera impresion
                                                             vende. Sin esto el
                                                             producto no transmite
                                                             el nivel premium.
                                                             EN CURSO →

  3      17      Formatos (SDLXLIFF, PO...)    Fase 16       Sin SDLXLIFF no hay
                                                             usuarios de agencias

  4      18      IA Copiloto (Claude)          Fase 16       El diferenciador #1.

  5      19      Workflow + Review Mode         Fase 18       Roles, review mode con
                 + Control de Cambios                         control de cambios
                 + Document Preview                           (estilo Google Docs),
                 + Notificaciones                             document preview,
                                                             fecha de entrega,
                                                             asignacion de segmentos,
                                                             post-its, emails
                                                             @catforcat.app

  6      20      Analytics + Productividad     Fase 19       Necesita data de
                                                             proyectos reales

  7      21      API + Integraciones           Fase 19       Platform play

  8      22      Classroom Mode + Task Board   Fase 19       Reutiliza review mode,
                 (Education & Teams)                          control de cambios,
                                                             roles. Agrega: Task Board
                                                             Kanban (reemplaza Trello),
                                                             aulas, grading, normas
                                                             de traduccion

  9      23      Marketplace                   Fase 22       Necesita masa critica
                                                             de usuarios
```

**Cambios vs. roadmap original:**
- UI/UX sube de Fase 18 a Fase 16 (la primera impresion es lo primero)
- Fase 19 se expande: control de cambios, document preview, fecha entrega
- Fase 22 se expande: Task Board Kanban integrado (reemplaza Trello)
- Fase 15 marcada como COMPLETADA

---

### FASE 19 (actualizada): WORKFLOW + REVIEW + NOTIFICACIONES

**El sistema de comunicacion sin friccion.**

```
FEATURE                         QUE HACE
------------------------------------------------------------------------------------------
Review Mode con Control         3 modos como Google Docs:
de Cambios                      - EDICION: el traductor trabaja normalmente
                                - SUGERENCIAS: el reviewer/profesor hace cambios
                                  que aparecen como sugerencias (tachado rojo +
                                  texto verde + comentario al costado). El
                                  traductor acepta o rechaza cada una.
                                - VISUALIZACION: solo lectura para el cliente.
                                Usa previousTargetText (ya existe en schema)
                                para tracking de versiones por segmento.

Roles                           Translator, Reviewer, PM (y futuro: Student, Professor).
                                Cada rol ve/hace cosas diferentes.
                                Reviewer solo puede usar modo Sugerencias.
                                PM puede usar Edicion y Sugerencias.

Post-its anclados               Comentario anclado a una POSICION ESPECIFICA dentro
                                del segmento, no al segmento entero. El profesor
                                toca la palabra "database" y el post-it aparece
                                justo ahi. Color por severidad:
                                - Rojo: error critico
                                - Amarillo: sugerencia
                                - Verde: bien hecho

Document Preview                Dos formas de acceder:
                                1) LONG PRESS (2 seg) en un segmento: muestra
                                   preview de ESE segmento en contexto dentro
                                   del documento. Se cierra al soltar. Ideal
                                   para tablet/mobile.
                                2) BOTON PREVIEW en toolbar: abre el documento
                                   completo renderizado con estilos originales
                                   (headings, listas, parrafos). Se queda abierto
                                   hasta cerrarlo. Para revision general.

Fecha de entrega                Campo deadline por proyecto. Visible en la card
                                de proyectos. Notificacion cuando se acerca.
                                Campo en Prisma: dueDate DateTime? en Project.

Asignacion de segmentos         PM/profesor asigna rangos de segmentos a
                                diferentes traductores:
                                "Keyla: segs 1-20, Pamela: segs 21-45"
                                Cada traductor solo ve/edita sus segmentos.

Notificaciones internas         Al enviar a revision → notificacion al reviewer.
                                Al devolver con notas → notificacion al traductor.
                                Badge de "2 pendientes" en la app.

Email transaccional             Emails desde usuario@catforcat.app via Resend/SES.
                                "Keyla envio su tarea" con link directo.
                                "El profesor reviso — 2 anotaciones"
                                El usuario NUNCA abre Gmail para esto.

Resumen IA al enviar            La IA genera automaticamente:
                                "45/45 segmentos, 2 QA warnings, 98% glosario"
                                Se incluye en la notificacion y el email.

Diff de cambios                 Cuando el traductor corrige y reenvia,
                                el reviewer ve: "Seg 12: antes X, ahora Y"
                                resaltado en verde/rojo. Integrado con el
                                modo Sugerencias.

Project sharing por link        URL unica con permisos. Sin crear cuenta para
                                revisar (guest access con token temporal).
```

**Costo:** Resend = $0 (free tier 100 emails/dia) o ~$20/mes para 50K emails.

---

### FASE 22: CLASSROOM MODE + TASK BOARD (Education & Teams)

**El aula virtual + tablero de tareas que reemplaza Trello + Smartcat.**

```
FEATURE                         QUE HACE
------------------------------------------------------------------------------------------
Task Board (Kanban)             Tablero visual estilo Trello integrado en CATforCAT.
                                Columnas: Pendiente | En Curso | Finalizado
                                Cada tarjeta = una tarea de traduccion/revision.
                                El % de progreso viene de los segmentos REALES
                                (no se actualiza manualmente como en Trello).
                                Click en tarjeta → abre el editor directamente.

                                Para Teams: PM crea tareas, asigna traductores.
                                Para Education: Profesor crea tareas, asigna alumnos.

Tarjetas de tarea               Cada tarjeta muestra:
                                - Titulo de la tarea
                                - Asignado (avatar + nombre)
                                - Fecha de entrega
                                - Barra de progreso (% real de segmentos)
                                - Labels de color por persona/rol
                                - Conteo de comentarios

Aulas virtuales                 El profesor crea un "aula" con nombre, idiomas,
                                y lista de estudiantes (por email @catforcat.app
                                o email externo).

Tareas de aula                  El profesor crea una tarea: sube documento,
                                define deadline, asigna al aula completa
                                o a estudiantes especificos.
                                La tarea aparece en el Task Board del aula.

Flujo estudiante                Estudiante ve sus tareas en el Task Board.
                                Abre la tarea → traduce → presiona "Enviar".
                                La tarjeta se mueve a "Finalizado" sola.
                                La IA resume y notifica al profesor.
                                NUNCA abre Gmail. NUNCA abre Trello.

Flujo profesor                  Profesor ve el Task Board completo.
                                Ve quien entrego y quien no de un vistazo.
                                Click en tarjeta → review mode con sugerencias
                                (control de cambios estilo Google Docs).
                                Da nota (opcional, la IA sugiere basada en QA).

Normas de traduccion            Documento de reglas por proyecto/aula:
                                "Usar usted formal", "No traducir nombres propios",
                                "Seguir glosario del curso". Visible para todo
                                el equipo/aula desde el sidebar del proyecto.

IA sugiere nota                 Basada en: QA score, glossary compliance,
                                consistency, completeness, fluency.
                                "Sugerido: 82/100. 2 errores de glosario."

Dashboard de aula               El profesor ve: quien entrego, quien no,
                                promedio de QA score, progreso general.
                                Exportable para registros academicos.

Revision entre pares            Opcional: estudiante A revisa a estudiante B.
                                Mismo sistema de sugerencias y post-its.
                                El profesor ve ambas versiones.

Comentarios en tarea            Hilo de comentarios dentro de cada tarjeta
                                (como Trello). Para coordinar sin salir de
                                CATforCAT. Con @menciones y notificaciones.

Checklists en tarea             Sub-tareas dentro de cada tarjeta.
                                Solo para Teams (no Education).
```

**Pricing Education:**

```
PLAN              PRECIO           QUE INCLUYE
------------------------------------------------------
Student           $9/mes           Pro sin Claude post-editing.
                  (o $0 con        Google + DeepL, classroom mode,
                  convenio uni)    compartir con profesor.

Education         $199/mes         20 seats Student + 2 Professor.
(por aula)        (convenio        Classroom mode, grading tools,
                  institucional)   analytics por alumno, IA sugiere nota.
```

---

### FASE 23: MARKETPLACE

**El ecosistema de traductores profesionales.**

```
FEATURE                         QUE HACE
------------------------------------------------------------------------------------------
Perfil de traductor             Portfolio publico: idiomas, especialidades,
                                velocidad promedio (datos reales de la app),
                                QA score promedio, calificaciones de clientes.

Publicacion de trabajos         El cliente sube documento, define par de
                                idiomas, deadline, presupuesto. Los traductores
                                ven y aplican.

Match automatico                La IA sugiere los 3 mejores traductores
                                basada en: especialidad, idiomas, velocidad,
                                disponibilidad, rating.

Trabajo dentro de CATforCAT     El traductor acepta → el proyecto se crea
                                automaticamente en su cuenta → traduce →
                                entrega → el cliente revisa (review mode).
                                TODO dentro de la plataforma.

Pagos integrados                Stripe Connect. El cliente paga, CATforCAT
                                retiene 5% de comision, el traductor recibe
                                95% directo a su cuenta.

Comision justa                  5% al CLIENTE (no al traductor).
                                0% comision al traductor.
                                Esto diferencia de Smartcat (20-30%).

Reputacion                      Rating bidireccional. El traductor tiene
                                score basado en entregas reales (no reviews
                                falsos). Los datos vienen de la herramienta
                                misma: velocidad, QA, on-time delivery.
```

**Modelo economico del marketplace:**

```
1,000 traductores activos
x $500/mes promedio en trabajos
= $500,000/mes transaccionado
x 5% comision al cliente
= $25,000/mes revenue adicional

Esto es ADICIONAL al revenue del SaaS ($29/mes Pro, $49 Team, etc.)
```

---

## 6. Posicionamiento final

```
LO QUE DICE LA COMPETENCIA          LO QUE DICE CATFORCAT
---------------------------------    ---------------------------------
"Enterprise translation platform"    "Tu copiloto de traduccion"

"500+ integrations"                  "Hace una cosa y la hace perfecto"

"Contact sales for pricing"          "$29/mes. Sin letra chica."

"Download for Windows"               "Abre el navegador. Ya estas."

"AI-powered" (caja negra)            "IA que explica sus decisiones"

"Free tier with limitations"         "Free tier que realmente sirve"

"Designed in 2005"                   "Diseñado para descansar la vista"
```

**Tagline:**
> CATforCAT — The translator's copilot.
> Professional translation tools, AI-powered, beautifully simple.

**Filosofia de negocio (TheLionKey):**

La estrategia NO es competir por precio. Es aplicar IA a un micro-nicho
donde los incumbentes llevan decadas sin innovar, crear un producto
premium de maxima calidad que genere NECESIDAD de cambiarse, y cobrar
lo que vale. Es el mismo modelo que Anthropic aplico con Claude:
resolver un problema real que existia hace anos pero nunca fue resuelto
bien. El usuario paga con gusto porque el producto le cambia la forma
de trabajar.

CATforCAT no es "el Trados barato". Es "el futuro de la traduccion
asistida". Los $29/mes no son un descuento — son el precio justo por
una herramienta que un dinosaurio de $645 no puede igualar.

---

## 7. El flywheel de CATforCAT

```
                    ┌─────────────────────┐
                    │   UNIVERSIDADES     │
                    │   Education $199/mo │
                    └─────────┬───────────┘
                              │
                    estudiantes aprenden en CATforCAT
                    (sin Gmail, sin exportar, sin friccion)
                              │
                              ▼
                    ┌─────────────────────┐
                    │   GRADUATES         │
                    │   ya saben usar     │
                    │   CATforCAT         │
                    │   → Pro $29/mo      │
                    └─────────┬───────────┘
                              │
                    buscan trabajo en el marketplace
                              │
                              ▼
                    ┌─────────────────────┐
                    │   MARKETPLACE       │
                    │   encuentran        │
                    │   clientes (5% fee) │
                    └─────────┬───────────┘
                              │
                    agencias ven calidad + velocidad
                              │
                              ▼
                    ┌─────────────────────┐
                    │   AGENCIAS          │
                    │   Team $49/mo/user  │────── publican mas trabajo
                    └─────────┬───────────┘
                              │
                              └──────► MAS VOLUMEN → MAS REVENUE
                                       MAS TRADUCTORES → MAS CLIENTES
                                       (loop infinito)
```

---

## 8. Proximos pasos

1. Jorge aprueba o ajusta este roadmap
2. Se inicia Fase 15 (Performance + Seguridad)
3. Se escribe plan detallado de implementacion para Fase 15
4. Ejecutar: 15 → 16 → 17+18 → 19 → 20 → 21 → 22 → 23

---

*Documento generado por Claude Code como asesor estrategico para TheLionKey.*
*Costos de API: estimaciones basadas en precios publicados a marzo 2026.*
*Costos reales dependeran del volumen de uso.*

*Filosofia de producto (TheLionKey):*
*Aplicar IA a micro-nichos donde los incumbentes llevan decadas sin innovar.*
*Crear productos premium que generen NECESIDAD, no solo deseo.*
*Cobrar lo que vale. El precio refleja el valor, no descuenta por ser nuevo.*
*Es el mismo camino que Anthropic recorrio con Claude.*
*CATforCAT es el primer producto. No sera el ultimo.*
