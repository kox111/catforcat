# CATforCAT — Design Brief: Elevation & Visual Hierarchy System

**Autor:** @FrontEnd (ui-ux-pro-max + 21st.dev references)
**Fecha:** 2026-03-31
**Estado:** PENDIENTE DE APROBACION

---

## 1. Diagnóstico

### Problema reportado
> "Los botones, las barras, las cartillas, las pestañas — todo parece de la misma textura, del mismo nivel. Como si por flojera metieran todo en pills."

### Evidencia técnica

**17 instancias de `borderRadius: 9999`** — todo es pill:
- Botones de acción (CTA, Submit, Create)
- Botones de navegación (tabs, links)
- Badges de estado
- Cards de proyecto
- Toolbar pills
- Incluso el boton de login

**Variables de sombra fantasma** — residuos del glass overhaul revertido:
- `glass-container-shadow`, `glass-container-border`, `shadow-float` se usan en componentes pero **no están definidas en globals.css**
- Resultado: 0 sombras visibles en cards y paneles flotantes

**Misma textura en todo:**
- Cards, botones, tabs, badges — todos usan `background: var(--bg-card)` + `border: 1px solid var(--border)` + `borderRadius: var(--radius-sm)` o `9999`
- Sin diferencia de peso visual entre contenedores, interactivos, y decorativos

---

## 2. Sistema de Elevación — 5 Niveles

Basado en Swiss Modernism 2.0 (ui-ux-pro-max) + Material Design elevation principles + 21st.dev tab references.

### Nivel 0 — Superficie base (background)
**Qué:** El fondo de la página. No tiene sombra, no tiene borde.
**Variables:** `--bg-deep`
**Elementos:** Page wrapper, sidebar background
**Border-radius:** N/A
**Sombra:** Ninguna

### Nivel 1 — Contenedor recesado (sunken)
**Qué:** Áreas que contienen grupos de elementos. Se sienten "hundidas" en la superficie.
**Variables:** `--bg-panel`, nuevo `--shadow-inset`
**Elementos:** Toolbar container, sidebar panels, tab bar background, bottom panels (TM, glossary)
**Border-radius:** `var(--radius)` (12px)
**Sombra:** `inset 0 1px 2px rgba(0,0,0,0.06)` (luz sutil, no profunda)
**Borde:** `1px solid var(--border)` (sutil)

### Nivel 2 — Card / Superficie elevada
**Qué:** Contenido principal que flota sobre la base. Se siente elevado.
**Variables:** `--bg-card`, nuevo `--shadow-card`
**Elementos:** Project cards, classroom cards, segment list container, modals
**Border-radius:** `var(--radius)` (12px) — NUNCA 9999
**Sombra:** `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)`
**Borde:** `1px solid var(--border)` (estructural, no decorativo)

### Nivel 3 — Elemento interactivo
**Qué:** Botones, dropdowns, pills clicables. Se sienten "sobre" las cards.
**Variables:** Según tipo (ver sección 3)
**Elementos:** Botones primarios, secundarios, dropdowns abiertos
**Border-radius:** Por tipo:
- Botones primarios (CTA): `var(--radius-sm)` (8px) — rectángulo con esquinas suaves, NO pill
- Botones secundarios/ghost: `var(--radius-sm)` (8px)
- Pills de filtro/tag: `9999` — SOLO estos mantienen pill shape
**Sombra:** Botones primarios: `var(--btn-primary-shadow)`. Secundarios: ninguna.

### Nivel 4 — Overlay / Flotante
**Qué:** Elementos que flotan sobre todo lo demás. Dropdowns, tooltips, context menus.
**Variables:** nuevo `--shadow-float`
**Elementos:** Dropdown menus, context menus, tooltips, popovers, command palette
**Border-radius:** `var(--radius-sm)` (8px)
**Sombra:** `0 4px 16px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.08)` — sombra más pronunciada
**Borde:** `1px solid var(--border)`

---

## 3. Diferenciación por Tipo de Elemento

### A. Navegación (tabs, sidebar links)
**Forma actual:** Pills con fondo
**Forma nueva:** Underline tabs (referencia: 21st.dev "Tabs with line")
- Tab inactivo: texto `var(--text-muted)`, sin fondo, sin borde
- Tab activo: texto `var(--text-primary)`, underline de 2px con `var(--accent)`
- Sin borderRadius — es texto con indicador lineal, no una forma
- Esto diferencia navegación de botones de acción

### B. Botones de acción
**Forma actual:** Pill (borderRadius: 9999) para TODO
**Forma nueva:**
- **Primary (CTA):** `borderRadius: var(--radius-sm)` (8px), fondo sólido `var(--accent)`, texto contrastante, sombra `var(--btn-primary-shadow)`. Rectángulo con esquinas suaves.
- **Secondary:** `borderRadius: var(--radius-sm)` (8px), fondo transparente, borde `var(--border)`, sin sombra.
- **Ghost:** Sin fondo, sin borde, solo color de texto. Hover: fondo sutil.
- **NINGÚN botón de acción usa pill shape (9999)**

### C. Badges / Tags / Status indicators
**Forma actual:** Igual que botones
**Forma nueva:**
- **Status badge:** `borderRadius: 4px`, padding mínimo (2px 8px), fontSize 10px, font-weight 600. Background semitransparente del color semántico. SIN borde. Peso visual mínimo.
- **Tag/filter pill:** `borderRadius: 9999` — estos SÍ son pills. Pero se diferencian por su tamaño pequeño (fontSize 11px, padding 4px 10px) y por no tener sombra.

### D. Cards / Contenedores
**Forma actual:** borderRadius variado, sin sombra (variables fantasma)
**Forma nueva:**
- `borderRadius: var(--radius)` (12px) — uniforme
- `background: var(--bg-card)`
- `border: 1px solid var(--border)`
- `boxShadow: var(--shadow-card)` — SIEMPRE presente. Es lo que crea la elevación.
- Hover: `boxShadow: var(--shadow-card-hover)`, `borderColor: var(--border-focus)`

### E. Input fields
**Forma actual:** Mezclados con el mismo estilo que todo
**Forma nueva:**
- `borderRadius: var(--radius-sm)` (8px)
- `background: var(--bg-deep)` — más oscuro que la card (se hunde)
- `border: 1px solid var(--border)`
- Focus: `borderColor: var(--accent)`, `boxShadow: 0 0 0 2px var(--accent-soft)`
- Visualmente recesados (inset shadow sutil)

---

## 4. Variables CSS Nuevas (globals.css)

```css
/* ── Elevation System ── */
--shadow-inset: inset 0 1px 2px rgba(0,0,0,0.06);
--shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
--shadow-card-hover: 0 2px 8px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06);
--shadow-float: 0 4px 16px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.08);

/* Glass cleanup — define missing variables */
--glass-container-shadow: var(--shadow-card);
--glass-container-border: var(--border);
--glass-active-shadow: var(--shadow-card-hover);
--glass-active-border: var(--border-focus);
```

**Nota:** Los valores de sombra se ajustarán por tema:
- Dark/Forest: opacidades más altas (rgba 0.15-0.25) porque el fondo es oscuro
- Light/Linen/Sakura: opacidades bajas (rgba 0.04-0.12) para sutileza

---

## 5. Resumen de Cambios por Border-Radius

| Elemento | Antes | Después | Razón |
|----------|-------|---------|-------|
| Botones CTA | 9999 (pill) | 8px (rounded rect) | Acción ≠ pill. Peso visual claro. |
| Botones secondary | 9999 (pill) | 8px (rounded rect) | Consistencia con primary |
| Tabs de navegación | pill con fondo | underline sin fondo | Navegación ≠ acción |
| Cards de proyecto | var(--radius) | var(--radius) + sombra | Elevación visible |
| Status badges | pill grande | 4px, compacto | Decorativo, no interactivo |
| Tags/filters | 9999 | 9999 (mantiene) | Único uso legítimo de pill |
| Modals | var(--radius) | var(--radius) + shadow-float | Flotante sobre todo |
| Dropdowns | var(--radius-sm) | var(--radius-sm) + shadow-float | Flotante |
| Inputs | variado | 8px + inset | Recesado, no elevado |

---

## 6. Bloques de Implementación Propuestos

| Bloque | Qué | Archivos | Riesgo |
|--------|-----|----------|--------|
| 1 | Variables CSS de elevación en globals.css (5 temas) | globals.css | Bajo |
| 2 | Buttons: 9999 → 8px en CTA y secondary buttons | ~10 archivos | Medio |
| 3 | Tabs: pill → underline en classroom dashboard y toolbar | 2-3 archivos | Bajo |
| 4 | Cards: agregar shadow-card a project cards y classroom cards | 3-4 archivos | Bajo |
| 5 | Overlays: agregar shadow-float a dropdowns, context menus, modals | 4-5 archivos | Bajo |
| 6 | Badges: reducir a 4px radius, padding compacto | 3-4 archivos | Bajo |

**Cada bloque con gate: build + diff + aprobación.**

---

## 7. Lo que NO se cambia

- Colores — ya fueron ajustados en la sesión anterior
- Tipografía — Cormorant Garamond / DM Sans / JetBrains Mono se mantienen
- Espaciado base — padding/margin existentes se mantienen
- HTML structure — solo CSS/style props
- Funcionalidad — cero cambios de lógica
