# CATforCAT — EditorToolbar Redesign Spec

**Fecha:** 2026-04-02
**Estado:** APROBADO
**Autor:** Jorge Leon (spec) + Claude (formalización)

---

## 1. Problema

El EditorToolbar actual tiene 3 grupos separados (left, center, right) que se sienten como contenedores independientes. El expand/collapse mueve iconos en la dirección incorrecta. El save indicator tiene demasiados elementos visuales (dot + texto + iconos). El font size picker es un popup flotante separado en la esquina inferior derecha en vez de estar integrado en el dropdown del perfil.

---

## 2. Diseño — Una Sola Barra

UNA barra horizontal continua. Sin contenedores separados. Separadores sutiles "|" entre secciones lógicas.

### 2.1 Estado COLLAPSED (default, modo trabajo)

```
[catforcat.] [Nombre Proyecto]     1/907     [✦ Pre-translate] [TM] [Glossary] | [▶] | "Saved" | [Avatar]
 ← LEFT                          CENTER                              RIGHT →
```

- **Izquierda:** Logo "catforcat." (link a /app/projects) + nombre proyecto
- **Centro:** Counter "1/907" (segmento activo / total) — tipografía JetBrains Mono
- **Derecha:** Iconos esenciales + flecha + save text + avatar

### 2.2 Estado EXPANDED (click en flecha, modo herramientas)

```
[catforcat.] [Nombre Proyecto]     1/907     [✦] [TM] [Gls] | [◀] [Search] [Concordance] [Notes] [Analysis] [QA] [Export] [Fullscreen] | [●] |
 ← LEFT                          CENTER              RIGHT (comprimido + expandido) →
```

Al expandir:

- Avatar **desaparece** (fade-out 200ms)
- Save text "Saved"/"Saving" **se convierte en solo el dot de color** (crossfade)
- Flecha **empuja** los esenciales (Pre-translate, TM, Glossary) hacia la izquierda
- **Aparecen** 7 iconos secundarios: Search, Concordance, Notes, Analysis, QA, Export, Fullscreen
- Save dot queda **siempre visible**

### 2.3 Save Indicator

| Estado | Collapsed                                                    | Expanded               |
| ------ | ------------------------------------------------------------ | ---------------------- |
| Idle   | Nada visible                                                 | Nada visible           |
| Saving | Texto "Saving" (typewriter 60ms/char) color var(--accent)    | Dot amarillo con pulse |
| Saved  | Texto "Saved" (typewriter 80ms/char) color var(--text-muted) | Dot verde, fade-in     |
| Error  | Texto "Error" color var(--red-text)                          | Dot rojo               |

**Reglas del save text (collapsed):**

- Solo la palabra. Sin check, sin "...", sin iconos, sin dot.
- Tipografía limpia: font-ui, 11px, font-weight 400.
- Crossfade suave (200ms) entre estados.
- "Saved" aparece con typewriter y desaparece después de 2.5s.

**Reglas del save dot (expanded):**

- 7px, redondo, colores: green/amber/red/muted.
- Pulse suave cuando saving.
- Fade-in al aparecer.

### 2.4 Avatar / Perfil

**Visible en collapsed, desaparece en expanded.**

- Borde gradiente shimmer si PRO (proShimmer 3s)
- Borde normal si free
- Click abre dropdown

**Dropdown del avatar:**

1. User info: nombre + @username + plan badge
2. Separador
3. Theme picker: 6 dots (dark, sakura, light, linen, forest, midnight)
4. Font size: 3 opciones — Compact (12px) / Default (14px) / Large (16px)
5. Separador
6. Settings (link)
7. Changelog (link)
8. Separador
9. Sign out

**El popup flotante de font size en la esquina inferior derecha se ELIMINA.** La funcionalidad se mueve al dropdown del avatar.

### 2.5 Animaciones — Obligatorias

| Elemento                  | Animación                      | Duración      | Easing                       |
| ------------------------- | ------------------------------ | ------------- | ---------------------------- |
| Expand secondary icons    | max-width 0→auto + opacity 0→1 | 300ms + 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Collapse secondary icons  | max-width auto→0 + opacity 1→0 | 300ms + 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Avatar fade out (expand)  | opacity 1→0 + scale 1→0.9      | 200ms         | ease                         |
| Avatar fade in (collapse) | opacity 0→1 + scale 0.9→1      | 200ms         | ease                         |
| Save text→dot crossfade   | opacity crossfade              | 200ms         | ease                         |
| Flecha rotación           | rotate(0deg)→rotate(180deg)    | 250ms         | ease                         |
| Save "Saved" typewriter   | 80ms por carácter              | ~320ms total  | linear per char              |
| Save "Saving" typewriter  | 60ms por carácter              | ~360ms total  | linear per char              |
| Save dot pulse (saving)   | opacity 0.5→1→0.5              | 1.4s          | ease-in-out infinite         |
| Hover en TODOS los iconos | color 150ms + scale(1.05)      | 150ms         | ease                         |
| Avatar dropdown open      | fade-in + translateY(-4px→0)   | 200ms         | ease                         |
| prefers-reduced-motion    | Todas las transiciones a 0ms   | instant       | none                         |

**Regla absoluta:** NADA puede ser instantáneo. Cada cambio visual tiene transición.

---

## 3. Reglas de Implementación

- CERO colores hardcoded. Todo con CSS variables.
- Todos los icon-only buttons llevan `aria-label`.
- `prefers-reduced-motion` respetada globalmente.
- Iconos de Lucide, consistentes en 15px.
- Todos los botones son elementos iguales en el flujo — no tratar unos diferente a otros.
- SaveDot se refactoriza para soportar los 2 modos (text-only vs dot-only) según prop `mode: "text" | "dot"`.
- El popup flotante de font size se elimina. La funcionalidad migra al avatar dropdown.

---

## 4. Archivos Afectados

| Archivo                                   | Cambio                                    |
| ----------------------------------------- | ----------------------------------------- |
| `src/components/editor/EditorToolbar.tsx` | Reescritura completa del layout           |
| `src/components/editor/SaveDot.tsx`       | Refactor: prop `mode` en vez de `compact` |
| Popup font size (identificar ubicación)   | Eliminar                                  |
| Página/componente que monta el popup      | Limpiar referencia                        |

---

## 5. Fuera de Scope

- No se cambian colores del design system
- No se cambia tipografía global
- No se tocan otros componentes fuera del toolbar
- No se agrega funcionalidad nueva — solo reorganización y animaciones
