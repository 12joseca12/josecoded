# ref/crm · prototipo de `/crm` y de las pantallas de `/admin`

**Tarea:** 6.0b del plan v3.4 (`docs/superpowers/plans/2026-09-19-josecoded-v1.md`) · **Agente:** `ui` · **Fecha:** 2026-11-02
**Fuentes:** PANT v2.2 (`docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md`, bloque v2.1 con las enmiendas v2.2), DATOS v1.4 (`2026-10-28-datos-v2.md` §14), `DESIGN.md`, `.impeccable/design.json` → `apps/web/styles/tokens.css`, componentes ya construidos (`components/ui/button`, `components/forms/field`, `components/ui/surface`, `components/area/area-shell`) y `packages/pricing/pricing.json` (packs, extras y tarifa).
**Gate:** Jose decide en el navegador. Cuando diga OK se anota en `ESTADO.md` con fecha; 6.0, 6.1, 6.2 y siguientes toman los valores de aquí.

> `impeccable` no estaba disponible en la sesión en la nube que hizo este prototipo. Se ha aplicado `DESIGN.md` como suelo de calidad y la paleta, las tipografías y las medidas salen de los tokens generados. Antes del gate conviene pasar `/impeccable critique` y `/impeccable audit` en el Mac.

## 1. Cómo verlo

```sh
python3 -m http.server 8000 --directory docs/superpowers/design/ref
# abrir http://localhost:8000/crm/
```

`index.html` enlaza cada pantalla en vista admin y en vista closer. Rutas útiles:

| Parámetro | Efecto |
|---|---|
| `?role=closer` | Vista de Carla (closer). Sin él, vista admin. Los enlaces internos conservan el rol. |
| `?open=<id>` | Abre una hoja al cargar: `sheet-quote`, `sheet-access`, `sheet-draft`, `sheet-status`, `sheet-reassign`, `sheet-story`, `sheet-invite`, `sheet-publish`, `sheet-price`, `more`… |
| `?tab=<valor>` | Pestaña inicial en K3 (`historial`, `mensajes`, `historias`, `presupuestos`), K4 (`importar`, `conflictos`) y D2 (`textos`, `faq`, `proyectos`, `blog`, `secciones`, `precios`, `publicaciones`). Cambiar de pestaña actualiza la URL. |
| `?step=1|2|3` | Paso inicial de K4 (por defecto, el 2: vista previa). |
| `?shot=1` | Oculta el botón «Prototipo» (lo usan las capturas). |

El botón **Prototipo** (abajo a la derecha) conmuta el rol y las variantes abiertas (§4) sin recargar; se guardan en `localStorage` (`crm.*`). También se pueden fijar por URL: `?density=compact&overdue=pending&title=v6&mbar=5&k3=stack`.

Las variables de prototipo están al principio de `crm.css` en `:root` y se ajustan en DevTools: ancho del raíl, altos de fila de las dos densidades, alto de las barras móviles, ancho de las hojas, tamaño del titular, ancho máximo del contenido y la propuesta de color `--danger`.

## 2. Ficheros

| Fichero | Qué es |
|---|---|
| `index.html` | Índice de pantallas, decisiones abiertas y lo que queda fuera. |
| `resumen.html` | **K1** Resumen (`/crm`). |
| `contactos.html` | **K2** Contactos (bandeja). Hoja `sheet-status`. |
| `contacto.html` | **K3** Contacto: historial, Mensajes (C4), Historias, **Presupuestos** (v2.2). Hojas `sheet-draft`, `sheet-status`, `sheet-access`, `sheet-reassign` (admin), `sheet-quote`, `sheet-story`; diálogos `confirm-close` (admin) y `confirm-ask` (closer). |
| `importar.html` | **K4** Importar CSV en tres pasos + historial + filas en conflicto propias; pestaña **Conflictos** (admin). |
| `comisiones.html` | **K5** Comisiones. Diálogos `confirm-approve`, `confirm-reject`, `confirm-paid`. |
| `clientes.html`, `cliente.html` | **K6** Clientes y detalle con historias. Hoja `sheet-story`. |
| `ajustes.html` | **K7** Ajustes: Telegram, avisos, TOTP, mi tasa. |
| `equipo.html` | **D1** Equipo. Hojas `sheet-invite`, `sheet-rate`, `sheet-portfolio`; diálogos `confirm-deactivate`, `confirm-revoke`. |
| `contenido.html` | **D2** Contenido con sus siete pestañas. Hojas `sheet-publish`, `sheet-price`. |
| `notificaciones.html` | **D3** Notificaciones (matriz). |
| `crm.css` | Shell y piezas. Solo `var(--token)` de `tokens.css` más las variables de prototipo de su `:root`. |
| `tokens.css` | **Copia** de `apps/web/styles/tokens.css` (el servidor tiene la raíz en `ref/` y no llega a `apps/`). No se edita: se vuelve a copiar si cambia `design.json`. |
| `crm.js` | JS mínimo: hojas (`<dialog>` nativo), pestañas ARIA, copiar, interruptores, pasos de K4, Telegram, totales del presupuesto y el panel del prototipo. |
| `icons.svg` | Subconjunto de Lucide 0.469.0 (ISC) como sprite: el mismo set y trazo (1.75) que la home. |

Sin JS se ve todo el contenido (las pestañas y los pasos aparecen uno tras otro) y en vista admin.

## 3. Qué fija este prototipo (para 6.0, 6.1, 6.2 y siguientes)

### 3.1 Shell (`StaffShell`, una pieza con dos juegos de navegación)

- **Escritorio (≥ 64rem):** raíl lateral fijo de `--crm-rail` (15.5rem) con la marca y una etiqueta de zona («CRM» / «Admin»), los cuatro destinos con icono y, debajo, el grupo «Más» desplegado. Al pie, quién eres (avatar con iniciales, nombre, rol y tasa). Fila de 2.5rem, seleccionada con `--tint-selected` y `--shadow-selected-row` (la misma fila elegida de la paleta). El contador de vencidas va en la fila de Contactos.
- **Móvil (< 64rem):** barra superior de 3.5rem (marca y avatar → Ajustes) y **barra inferior de 4** de 3.75rem + zona segura: Contactos · Clientes · Comisiones · Más (`/crm`) o Resumen · Clientes · Equipo · Más (`/admin`). «Más» abre una hoja inferior con el resto. Las dos barras usan el vidrio de la cabecera con scroll (`--header-scrolled` + `--blur-header`) bajo `@supports`.
- **Rol:** lo exclusivo del admin lleva `data-only="admin"` (columna y filtro de dueño, reasignar, descuento, cerrar cobrado, pestaña Conflictos, acciones de comisiones, material, Administración). Un closer en `/admin/*` ve el estado 404 (prueba: `equipo.html?role=closer`).
- **Una acción violeta por vista:** K1 «Ver vencidas», K3 «Redactar mensaje», K4 el paso actual, K6 «Decidir» en la historia propuesta, K7 «Vincular Telegram», D1 «Invitar», D2 «Publicar», D3 «Guardar». K2, K5 y K6 lista no tienen ninguna: su acción es abrir una fila. Dentro de cada hoja, su acción final es la violeta.

### 3.2 Piezas y su nombre en el inventario de PANT

| Clase del prototipo | Componente (PANT §2) | Notas |
|---|---|---|
| `.table[data-stack]` | `ContactTable`, `CommissionRow`, `StaffRow`, `PriceTable`… (un `Table` con variantes) | Tabla real en escritorio; bajo **46rem de contenedor** cada fila se apila (`flex-wrap`) en nombre + estado, siguiente acción a lo ancho y una línea de metadatos con etiqueta. Por eso las celdas llevan `role` explícito: el cambio de `display` no rompe la semántica. Toda la fila es el enlace del nombre (`::after` que la cubre), sin interactivos anidados. |
| `.badge[data-tone]` | `StatusBadge` | Tonos: neutro, `active` (violeta suave: en curso), `live` (verde: vivo o hecho), `attention` (oro `--pending`: espera una decisión), `overdue` (variante A), `muted` (final o caducado, punto hueco). El estado nunca va solo en color: siempre hay texto. |
| `.owner` | `OwnerBadge` | Avatar de iniciales; «Sin asignar» con contorno; desactivado atenuado con «(desactivado)». |
| `.due[data-state]` | parte de `ContactTable` / `NextActionField` | Vencida con icono de aviso + texto oculto «Vencida:» para lectores; «hoy» en lavanda a 500. |
| `.next-action` | `NextActionField` | Banda con el tinte de vencida, «Hecho» y «Cambiar» (abren la hoja de estado: cambiar de estado exige siguiente acción salvo en estados finales). |
| `.timeline .tl` | `InteractionTimeline` | Icono por tipo; los cambios de estado son una línea sin caja; mensajes y notas llevan caja. |
| `.sheet` | hojas (`StatusSheet`, `ReassignSheet`, `InviteAccessSheet`, `QuoteComposer`, `StoryDecisionSheet`, `InviteStaffSheet`, `PublishSheet`, `PriceItemSheet`) | `<dialog>` modal: lateral derecha de `--crm-sheet-w` (34rem; 52rem la ancha) desde 48rem, hoja inferior por debajo. Velo `--scrim` con `--blur-scrim`. Entrada de 360 ms con `--ease-vt` (`@starting-style`), nada con reduced motion. Esc, el velo y «Cerrar» la cierran y el foco vuelve al botón que la abrió. |
| `.confirm` | `ConfirmDialog` | `alertdialog` centrado de 28rem; importe y destinatario en negrita; destructivas con la variante `danger`. |
| `.seg` | `SegmentedControl` | Filtro de tipo, vía de la FAQ, idioma del presupuesto, decisión de historia (radios + `:has`, sin JS). En móvil se desplaza dentro de sí mismo, nunca la página. |
| `.tabs [role=tab]` | `Tabs` | Subrayado de 2px en violeta suave (sin pulgar violeta, que se reserva a la acción de la vista). Flechas, Inicio y Fin. |
| `.total` | `CommissionTotals` | Cifras en celdas, sin gráficas; en K5 son botones que filtran. |
| `.story` | `StoryCard` | Como / quiero / para + criterios; pie con veredicto y acción según estado. |
| `.quote-line`, `.stepper`, `.sum`, `.picker` | `QuoteComposer` | Descuento: campos para admin, «lo fija Jose» en gris para el closer. |
| `.faces`, `.face`, `.diff` | `ConflictQueue` | Dos caras lado a lado desde 44rem; los campos distintos llevan «· distinto». |
| `.steps`, `.step-panel`, `.drop`, `.file-pill`, `.result` | `CsvDropzone`, `ColumnMapper`, `ImportPreview`, resultado | El valor `=HYPERLINK(` se ve como texto. |
| `.tg[data-state]`, `.code-box` | `TelegramLinkCard` | Estados no vinculado → código (15 min) → vinculado. |
| `.publish-bar`, `.bilingual`, `.base`, `.entry` | barra de D2, `OverrideEditor` | La base de `messages` en gris encima de cada campo; es y en lado a lado desde 36rem de contenedor. |
| `.switch[role=switch]` | `Switch` | 2.5 × 1.5rem; zona táctil ampliada con puntero grueso. |
| `.matrix` | `RuleMatrix` | `<th scope>` por fila y columna; cada interruptor con nombre «evento → destinatario por canal». Bajo 46rem, un bloque por evento con los interruptores etiquetados. |
| `.band` | `PendingPricesBand` y avisos de cola | Oro, con icono y texto. |

### 3.3 Medidas que se llevan a tokens si Jose aprueba

Nuevos para `.impeccable/design.json` (se marcan `deviation:` al portarlos):

- Colores: `danger` `#ff8a7a` (solo si gana la variante A coral) y las alfas `tint-danger`, `edge-danger`, `tint-pending`, `edge-pending`, `tint-live`, `edge-live`.
- Tamaños: `crm-rail` 15.5rem, `crm-topbar-h` 3.5rem, `crm-tabbar-h` 3.75rem, `crm-row` 3rem y `crm-row-compact` 2.5rem (según la variante B), `crm-sheet-w` 34rem, `crm-page-max` 90rem.
- Contenedores: `cq-table-stack` 46rem (apilado de tablas), `cq-faces` 44rem; breakpoint `bp-rail` 64rem.
- Tipografía: `crm-title` `clamp(1.5rem, 1.1rem + 1.2vw, 2.125rem)` con el peso, interlineado 1.08 y tracking del headline.

Todo lo demás (botones, campos, superficies, foco, movimiento, sombras, radios) sale de los tokens existentes sin cambios.

### 3.4 Accesibilidad (contrato para cada componente)

- Contraste AA en todo texto, comprobado: `--text-3` 6,0:1 sobre el fondo y 5,5:1 sobre `--card`; `--pending` 12,1:1; `--green` 11,3:1; `--danger` 8,8:1; texto índigo sobre violeta 5,2:1.
- Foco visible siempre: anillo de 2px en violeta suave (`--focus-ring-*`); en los campos y la búsqueda, el filete pasa a 2px; en las filas, el anillo rodea la fila entera.
- Objetivos táctiles: con `pointer: coarse` nada interactivo baja de 2.75rem (botones pequeños, iconos, segmentados, pasos del presupuesto, orden de la FAQ); los campos pasan a 1rem de letra para que iOS no haga zoom.
- Teclado: «Saltar al contenido»; `/` enfoca la búsqueda de K2 (`aria-keyshortcuts`); pestañas con flechas; hojas modales nativas; en K4 cada paso mueve el foco a su título.
- Nombres: botones de icono con `aria-label` que dicen a quién afectan («Estado y siguiente acción de Marina Soler», «Subir «¿Firmas NDA?»»); tablas con `<caption>`; filas inválidas de la vista previa con `aria-describedby` al motivo; totales del presupuesto en `aria-live`.
- Movimiento: con `prefers-reduced-motion` no hay ninguna transición ni animación.

## 4. Decisiones abiertas para Jose

Se conmutan en el panel «Prototipo». La opción por defecto es la que propone `ui`.

| | Pregunta | Opciones | Propuesta de `ui` |
|---|---|---|---|
| **A** | Color de «vencida» (PANT dice «en rojo») | **Coral** `#ff8a7a`, token nuevo `--danger` (8,8:1) · **Oro** `--pending`, el que ya marca errores de formulario | Coral: vencida es la única urgencia del CRM y el oro ya significa «espera una decisión» (historias, conflictos, sin publicar). Si se prefiere no abrir un color nuevo, oro. |
| **B** | Densidad de tablas | **Cómoda** (filas de 3rem, 0.875rem) · **Compacta** (2.5rem, 0.8125rem, nombre y organización en una línea) | Cómoda por defecto; compacta para Jose con 128 contactos. Podría ser una preferencia por usuario. |
| **C** | Segundo tono de los titulares en `/crm` y `/admin` | **Ámbar** `--highlight` (como la home v7) · **Lavanda terciaria** (como la v6) | Ámbar, para que se note que es la misma marca. Si al usarlo compite con los estados, lavanda. |
| **D** | Barra inferior en móvil | **4** (PANT: Resumen en la marca y en «Más») · **5** con Resumen delante | 4, como PANT; mirar si Carla echa de menos Resumen. |
| **E** | Detalle de contacto en escritorio (≥ 60rem) | **Dos columnas** (oportunidad, cliente y datos fijos a la derecha) · **Una columna** | Dos columnas. |
| **F** | Acción violeta de K3 para el admin | **Redactar mensaje** (prototipo; «Cerrar cobrado» en fantasma dentro de la tarjeta de oportunidad) · **Cerrar cobrado** como acción principal del admin | Redactar mensaje: es lo que se hace casi siempre; cerrar cobrado es una vez por oportunidad. |
| **G** | Guardar en D3 | **Botón Guardar** con contador «N cambios sin guardar» (prototipo) · cada interruptor se guarda al momento | PANT dice las dos cosas; con 48 interruptores, Guardar evita avisos a medias. |
| **H** | Resumen y Clientes de `/admin` | Aquí apuntan a K1 y K6 en vista admin | Fundir C1 en K1 (admin ve los contadores de C1 en una celda) y C9 en K6 con edición; si no, prototipar C1 y C9 aparte. |

Otras cosas que Jose puede querer mirar sin variante: el verde de «Cliente activo», «Activo» y «Vinculado» en D1 (se cuentan como vivos; si se quiere el verde más escaso, pasarían a neutro), la barra de fases de cinco segmentos de la tarjeta «Cliente» en K3 (a tamaño pequeño puede leerse como una raya; alternativa: «Fase 5 de 5» en texto), la etiqueta de zona junto a la marca, y si el raíl debe poder plegarse a solo iconos.

## 5. Desvíos y notas

- **Rojo de PANT → variante A.** El sistema no tenía color de peligro; se propone `--danger` y se deja el oro como alternativa.
- **Pestañas sin pulgar violeta.** El segmentado de `DESIGN.md` pinta de violeta la opción elegida; en una pantalla con su propia acción violeta eso daría dos. Las pestañas usan subrayado; el segmentado violeta se queda para filtros y elecciones dentro de un formulario.
- **Más denso que la web pública.** Celdas con radio `--r-lg` y relleno fijo de 1.25rem en lugar del `--r-cell` y `--sp-pad-cell` fluidos de la home; sin luz que sigue al cursor ni entradas ligadas al scroll. El grano sí está; los haces no (son de los glifos).
- **Correos y teléfonos de ejemplo** en `.test` y `+34 600 000 xxx`. Nombres inventados; «Carla», «Dani» y «Ana» coinciden con los usuarios de seed de los E2E del plan.
- **Plan 6.0b decía «sin JS salvo el conmutador».** Hay algo más (hojas, pestañas, pasos, copiar) porque el encargo pide variantes conmutables y hojas que se puedan probar; el producto usará `<dialog>` y Server Actions igual que aquí.
- Copy del CRM solo en español y provisional: no pasa por `redactor` (PANT v2.1 §3); el texto copiable del presupuesto y los correos transaccionales sí, en el Mac.
