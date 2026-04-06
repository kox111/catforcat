# CATforCAT — UI/UX Premium Redesign Spec

> **Fase 16 (reordenada)** — El rediseño visual completo antes de features nuevas.

**Goal:** Transformar CATforCAT de "webapp funcional" a "producto premium de clase mundial" sin cambiar funcionalidad. Solo visual, layout, y UX.

**Principio rector:** El espacio es el lujo. No es el tamaño de los elementos, es el aire alrededor de cada uno. La diferencia entre Zara y Hermes es que Hermes tiene 5 prendas con un metro de aire cada una.

---

## 1. Sistema de identidad visual

### 1.1 Tema principal: Linen (Mocha Soft)

Linen es la identidad de marca. Los otros 3 temas son alternativas.

```
PALETA MOCHA SOFT
─────────────────────────────
--bg-deep:       #FAF0E6      (fondo principal, linen)
--bg-panel:      #F0E0D6      (cards, paneles)
--bg-card:       #F5EBE0      (cards elevadas)
--bg-hover:      rgba(164,119,100, 0.06)
--bg-active:     rgba(164,119,100, 0.10)
--border:        #E0D4C9
--border-focus:  #A47764
--text-primary:  #5C4033      (texto principal, chocolate)
--text-secondary:#8B7355      (texto secundario)
--text-muted:    #B8A898      (texto terciario)
--accent:        #A47764      (Pantone Mocha Mousse 17-1230)
--accent-soft:   rgba(164,119,100, 0.10)
--green:         #7A9A6A      (confirmado)
--green-soft:    rgba(122,154,106, 0.10)
--amber:         #B89A6C      (draft/warning)
--amber-soft:    rgba(184,154,108, 0.08)
--red:           #A46464      (error)
--red-soft:      rgba(164,100,100, 0.08)
--purple:        #8A7A9A      (glosario)
--purple-soft:   rgba(138,122,154, 0.10)
```

### 1.2 Tipografia

```
HEADINGS / BRANDING:  Cormorant Garamond
                      Elegante, trazos finos/gruesos, editorial.
                      Usado en: landing headline, modales de titulo,
                      empty states, pagina de login/register.

UI / BODY:            DM Sans (ya instalado)
                      Geometrico, amigable, legible.
                      Usado en: toolbar, botones, labels, nav,
                      badges, toasts, todo el chrome de la app.

EDITOR / CODE:        JetBrains Mono (ya instalado)
                      Monospace legible.
                      Usado en: textareas del editor, concordance,
                      metadata, JSON preview.
```

### 1.3 Escala tipografica (Major Third 1.25)

```
--text-xs:    11px
--text-sm:    13px
--text-base:  15px
--text-lg:    18px
--text-xl:    22px
--text-2xl:   28px
--text-3xl:   35px
--text-hero:  56px  (landing headline)
```

### 1.4 Espaciado

```
--space-xs:   4px
--space-sm:   8px
--space-md:   16px
--space-lg:   24px
--space-xl:   32px
--space-2xl:  48px
--space-3xl:  64px

El principio: siempre errar hacia MAS espacio, no menos.
Si dudas, agrega padding.
```

### 1.5 Bordes y sombras

```
--radius:     12px   (cards, modales)
--radius-sm:  8px    (botones, badges)
--radius-lg:  16px   (pills, CTA)
--radius-full: 9999px (avatars, dots)

--shadow-sm:  0 1px 3px rgba(92,64,51, 0.06)
--shadow-md:  0 4px 12px rgba(92,64,51, 0.08)
--shadow-lg:  0 8px 24px rgba(92,64,51, 0.10)

Sombras calidas (basadas en el marron), no negras.
```

---

## 2. Landing Page

### 2.1 Layout

```
Single screen, no scroll. Centrado vertical.

┌──────────────────────────────────────────┐
│ catforcat.                    Log in     │ ← nav
│                                          │
│                                          │
│              [gato line-art]             │ ← SVG actual (opcion C)
│                                          │
│     a cat tool, provided by a cat       │ ← Cormorant Garamond
│                                          │
│                meow                      │ ← italic, sin asteriscos
│                                          │
│        [ Start translating — free ]      │ ← pill button
│                                          │
│                                          │
│ catforcat.  FAQ  Privacy  Changelog      │ ← footer
└──────────────────────────────────────────┘
```

### 2.2 Decisiones

- Wordmark "catforcat." en serif (Cormorant Garamond) con punto final, sin icono
- Solo 1 boton en nav: "Log in" — el CTA ya dice "free" abajo
- Gato: SVG actual de opcion C — caminando hacia izquierda, cabeza girada mirando derecha. Dirige la mirada del visitante hacia el nav
- Headline: "a cat tool, provided by a cat" — SIN punto final. El mensaje queda abierto, conecta con el meow
- "meow" en italic Cormorant Garamond, mas pequeno, color text-secondary
- CTA: pill redondeado, fondo accent (#A47764), texto blanco, "Start translating — free"
- Fondo: bg-deep (#FAF0E6)

---

## 3. Editor — Concepto "Dos libros abiertos"

### 3.1 Filosofia

El traductor tiene dos libros sobre su escritorio. Izquierda: el texto original. Derecha: su traduccion. La pantalla simula esa experiencia.

- Sensacion Kindle: colores que no cansan, tipografia legible, padding generoso
- Los segmentos son "paginas", no celdas de Excel
- La informacion (TM, glosario) no ocupa espacio permanente
- Fullscreen mode para inmersion total
- Funciona comodo en 16 pulgadas (laptop) y en 27 pulgadas (desktop)

### 3.2 Layout del editor

```
MODO NORMAL:
┌──────────────────────────────────────────────┐
│ catforcat.  [🔍] [✦AI] [QA] [Export] [⛶]   │ ← toolbar limpia
├──────────────────────┬───────────────────────┤
│                      │                       │
│  SOURCE              │  TARGET               │
│  (libro izquierdo)   │  (libro derecho)      │
│                      │                       │
│  Seg 1: texto...     │  Seg 1: traduccion... │
│                      │                       │
│  Seg 2: texto...     │  Seg 2: traduccion... │
│         📚3 🟣1      │                    ✓  │
│                      │                       │
│  Seg 3: texto...     │  Seg 3: [escribir]    │
│                      │                       │
└──────────────────────┴───────────────────────┘
  Seg 2/45 · 1,234 words · 44% confirmed

MODO FULLSCREEN (F11 o boton ⛶):
Todo el viewport. Desaparece la barra del navegador.
La toolbar se minimiza a una linea sutil.
Maximo espacio para los dos libros.
```

### 3.3 Toolbar

5-6 iconos visibles, separados con espacio generoso:

```
VISIBLES:
  🔍 Search (Ctrl+F)
  ✦  AI Translate (Ctrl+Shift+Enter)
  QA Run QA
  📤 Export
  ⛶  Fullscreen (F11)

OCULTOS (Ctrl+K command palette o click derecho):
  Analysis, Go to segment, Concordance, Shortcuts,
  Pre-translate, Copy src→tgt, Settings
```

Cada icono: DM Sans, limpio, sin borde visible en reposo.
Al hover: fondo sutil bg-hover. Al click: feedback inmediato.
Espacio entre iconos: minimo 24px.

### 3.4 Segmentos como paginas

Cada segmento es una card con padding generoso, no una fila de tabla:

```
┌─────────────────────────┐ ┌─────────────────────────┐
│                         │ │                         │
│  1  The database was    │ │  La base de datos fue   │
│     corrupted after     │ │  corrompida despues     │
│     the system update.  │ │  de la actualizacion.   │
│                         │ │                         │
│              📚3 🟣1    │ │                      ✓  │
└─────────────────────────┘ └─────────────────────────┘

Segmento activo: borde accent (#A47764), sombra sutil
Segmento inactivo: borde border (#E0D4C9) o sin borde
Separacion entre segmentos: space-sm (8px)
Padding interno: space-md (16px) vertical, space-lg (24px) horizontal
```

### 3.5 TM y Glosario — Badges inline + Popover on demand

NO hay paneles permanentes debajo del editor.

**Badges inline:** En la esquina inferior derecha del source de cada segmento, aparecen badges pequenos si hay matches:
- 📚3 = 3 TM matches disponibles
- 🟣1 = 1 termino de glosario detectado

**Popover on demand:** Click en el badge o click derecho en el segmento abre un popover elegante anclado al segmento:

```
┌────────────────────────────────┐
│ Translation Memory        ───  │
│                                │
│  95%  The database was co...   │
│  82%  The database error...    │
│  71%  A database was cre...    │
│                                │
│ Glossary                       │
│  database → base de datos      │
└────────────────────────────────┘
```

Click en un match → se aplica al target. El popover se cierra.

**Para usuarios avanzados:** Toggle en settings para mostrar paneles permanentes debajo del editor (modo clasico). Pero el default es badges + popover.

### 3.6 Fullscreen mode

- Boton ⛶ en toolbar o F11
- Usa la API `document.documentElement.requestFullscreen()`
- En fullscreen: toolbar se reduce a una linea minima
- Escape o boton para salir
- Persiste la preferencia en localStorage

---

## 4. Paginas de servicio

### 4.1 Login / Register

- Fondo bg-deep (#FAF0E6)
- Card centrada con formulario
- Titulo en Cormorant Garamond
- Inputs con bordes sutiles, fondo bg-panel
- **Password: icono "ojito" para toggle show/hide password**
- Boton submit: pill accent (#A47764) con texto blanco
- Link entre login/register abajo del formulario
- Marca de agua: gato SVG esquina inferior derecha, opacidad 5-8%

### 4.2 Settings / TM / Glossary / Changelog / QA

- Mismo layout con card centrada o full-width segun contenido
- Marca de agua del gato en esquina inferior derecha (5-8% opacidad)
- Titulos en Cormorant Garamond
- UI en DM Sans
- Mismo sistema de espacio y colores

### 4.3 Projects list

- Grid de cards con espacio generoso
- Cada card: nombre, idiomas, barra de progreso, fecha
- Boton "New project" como pill accent
- SIN marca de agua del gato (ya estas trabajando)

---

## 5. Donde aparece y donde NO aparece el gato

```
MARCA DE AGUA (gato SVG, 5-8% opacidad, esquina inf-der):
✓ Login
✓ Register
✓ Settings
✓ Changelog
✓ TM management
✓ Glossary management
✓ QA report pages

SIN MARCA DE AGUA:
✗ Landing (ya tiene el gato grande)
✗ Projects list (trabajando)
✗ Editor (cero distracciones)
```

---

## 6. Componentes rediseñados

### 6.1 Botones

```
PRIMARY:   pill redondeado (radius-lg), fondo accent, texto blanco
           hover: oscurece 10%. active: scale(0.98)

SECONDARY: pill redondeado, fondo transparente, borde border
           hover: fondo bg-hover. active: scale(0.98)

GHOST:     sin fondo ni borde, solo texto text-secondary
           hover: fondo bg-hover

DANGER:    pill redondeado, fondo red-soft, texto red, borde red
           hover: fondo red mas opaco
```

### 6.2 Modales

- Backdrop: overlay oscuro con blur sutil (backdrop-filter: blur(8px))
- Card: bg-card, radius 12px, shadow-lg
- Titulo: Cormorant Garamond
- Contenido: DM Sans
- Animacion: fadeIn + scale desde 0.97 a 1, 150ms

### 6.3 Inputs

- Fondo: bg-panel
- Borde: border, focus: border-focus (accent)
- Radius: radius-sm (8px)
- Padding: 10px 14px
- Font: DM Sans 15px
- **Password inputs: icono ojito (eye/eye-off) a la derecha para toggle visibility**

### 6.4 Toasts

- Posicion: bottom-center
- Card con shadow-md, radius 12px
- Icono + mensaje + auto-dismiss
- Colores por tipo: green (success), amber (warning), red (error), accent (info)

### 6.5 Command Palette (Ctrl+K)

- Modal centrado arriba (top 20%)
- Input de busqueda con icono lupa
- Lista de acciones filtrable
- Keyboard navigation (flechas + Enter)
- Agrupa por categoria: Navigation, Translation, Tools

---

## 7. Temas secundarios

Los 3 temas secundarios se refinan con los mismos principios de espacio y tipografia. Solo cambian los colores:

### Dark
- Mantener paleta actual (Google-style, zero glare)
- Refinar con mismos radius, spacing, shadows (invertidos)

### Sakura
- Mantener base cherry blossom
- Refinar con mismos principios

### Light
- Refinar como alternativa neutral
- Fondo blanco puro con bordes grises suaves

Cada tema hereda: tipografia, spacing, radius, animaciones, layout.
Solo cambian: colores de fondo, texto, bordes, acentos.

---

## 8. Lo que NO se toca

- Funcionalidad: cero cambios en logica, APIs, base de datos
- Atajos de teclado: todos se mantienen identicos
- Flujo de trabajo: el traductor hace lo mismo, solo se ve diferente
- Archivos en /lib/: no se tocan
- API routes: no se tocan

---

## 9. Herramientas de implementacion

- **21st.dev MCP**: componentes premium custom
- **nano-banana MCP**: ilustraciones para empty states
- **Stitch MCP**: design system tokens
- **ui-ux-pro-max skill**: paletas, font pairings, charts

---

## 10. Criterios de exito

- [ ] La landing transmite "premium" en 3 segundos
- [ ] El editor se siente comodo despues de 2 horas de uso
- [ ] Funciona bien en 16" laptop sin scroll horizontal
- [ ] Fullscreen mode funciona y se siente inmersivo
- [ ] Los 4 temas son consistentes en spacing y tipografia
- [ ] Password show/hide funciona en login y register
- [ ] TM/Glosario como badges + popover, no paneles permanentes
- [ ] Command palette (Ctrl+K) reemplaza toolbar overflow
- [ ] Build compila sin errores
- [ ] No se rompio ninguna funcionalidad existente
