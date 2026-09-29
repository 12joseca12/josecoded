# Estado — josecoded

> Traspaso del 2026-09-29. **Diseño de la home prácticamente cerrado en `ref/home-v6`**; faltan dos confirmaciones de Jose, la revisión de acabado y volcarlo a los documentos. Sin código de aplicación todavía.

## Ahora

**Home elegida: `docs/superpowers/design/ref/home-v6/` («bento por escenas»).**
Servir con `python3 -m http.server 8765 --directory docs/superpowers/design/ref` → http://localhost:8765/home-v6/ (`?intro` para ver la caída de letras del hero). En la sesión de Claude existe la config `josecoded-design-ref` en `~/Documents/ClaudeDocuments/.claude/launch.json`.

Qué tiene la v6:
- **Hero** aprobado (split + GlyphScene: glifos que morfan móvil → web → chip IA). La nube vive solo en el hero.
- **Orden tras el hero** (y de la cabecera): Sobre mí · Empresas · Negocios · Proyectos · Blog · cierre «¿Empezamos?».
- **Cabecera**: ⌘K, **Chat** (punto verde), **Login** destacado en violeta. «Contacto» fuera de la cabecera (sigue en cierre y ⌘K) — confirmado 2026-09-29.
- **Cada sección es una escena** a pantalla con un bento de 3 celdas sin huecos; Negocios con los 4 packs (900 / 1.400 / 2.500 / 4.200 € desde, sin IVA). **Proyectos es un carrusel fijado** horizontal (CSS `animation-timeline`).
- **Un gesto = una escena**: rueda/trackpad/teclado/enlaces deslizan ~0,8 s a la siguiente; en Proyectos, una tarjeta por gesto. Solo en escritorio con puntero fino y si la escena cabe; si no, scroll nativo.
- **Transiciones por elemento** ligadas al scroll (entra: sube + nitidez; sale: retrocede + se apaga). Celdas grandes se amplían con View Transitions (Esc cierra).
- **Vida en las celdas**: luz bajo el cursor, marquesina doble del stack, mini-chat que se escribe, selección deslizante en Servicios y Packs, selector de tarifa, checks que se dibujan, arte flotando en Proyectos.
- **Indicador de sección**: líneas sin texto en el margen derecho, centradas; activa más larga y violeta; oculto en el hero y cuando no hay margen.
- **Adaptativo sin medidas mágicas**: clamp con vw/svh/vmin + container queries (bento 1 → 2 → 12 columnas según su contenedor). Probado de 360×640 a 1920×1080 sin desbordes.
- Pendiente de datos reales: todo lo marcado `{{DATO}}` (ciudad, descripciones de proyectos, artículos del blog, plazo de respuesta).

Fuentes de verdad de diseño: `PRODUCT.md` (producto), `DESIGN.md` + `.impeccable/design.json` (sistema; **documentado hasta la versión índigo de home-v4, falta volcar la v6**), contrato en `.impeccable/surfaces/`. Figma con exploraciones: https://www.figma.com/design/aGt6l1dnVUB8tmhU8ctn4f.

Histórico de prototipos (no usar como base): `home-v5/` (variantes A/B/C que llevaron a la v6), `home-v4/` (ventana con dock), `hero-lab-3/` (hero aprobado original), `estilo/`, `eje/`, `ui-v3/`, `heros/`, `hero-lab`, `hero-lab-2`.

Documentos (anteriores a la v6, hay que actualizarlos):

| Documento | Ruta | Versión |
|---|---|---|
| Spec | `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` | v1.5.2 |
| UX | `docs/superpowers/design/2026-09-17-josecoded-ux.md` | v3.2 |
| Diseño técnico | `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` | v1.2.1 |
| Sistema visual | `docs/superpowers/design/2026-09-17-josecoded-ui.md` | v3 (superado por DESIGN.md) |
| Plan | `docs/superpowers/plans/2026-09-19-josecoded-v1.md` | 97 tareas |

Índices: codebase-memory `Users-jose-Documents-GitHub-josecoded` (indexado 2026-09-29, con ADR de diseño); graphify se regenera en cada commit (hook).

## Pendientes

**Confirmaciones de Jose (cierran el diseño)**
- [x] Badge «Disponible para proyectos»: quitado del hero (2026-09-29).
- [x] «Contacto» fuera de la cabecera: confirmado.
- [x] Indicador de sección: «nunca en el hero», como está implementado.
- [x] A 320 px el botón de menú se salía 8 px: arreglado (Login solo icono en ≤ 22.5rem).

**Cerrar el diseño (siguiente sesión)**
- [x] Revisión de acabado de impeccable sobre `home-v6` y fixes (2026-09-29, commits 79e2516, dfa775f, 412a789, 07afeb9; revisor aprobado). Capturas en `.impeccable/review/v6/` (ignorado por git).
- [x] Decisiones de Jose sobre la revisión (2026-09-29): titular a dos tonos se queda; tarjetas se quedan como están pero algo más separadas del fondo (hecho: superficie más clara + borde más visible, tokens `--card`/`--card-line`); glifos se quedan como detalle discreto; aire en Sobre mí se resuelve al diseñar ese apartado.
- [x] Cabecera en orden idioma → buscador → chat → login; en ≤ 1080px el idioma va dentro del menú ☰.
- [x] Hero a 320×812 se desbordaba 5px (escenario de 38svh): acotado al ancho.
- [ ] `{{DATO}}` nuevos: foto real de Jose (celda Sobre mí) y entregable por servicio (Empresas).
- [ ] Volcar la v6 a `DESIGN.md` y `.impeccable/design.json` (documentador de impeccable) y al contrato de `.impeccable/surfaces/`.
- [ ] Reescribir UX §2 y §4.1 (home) y marcar UI v3 como superado; ajustar la fase 2 del plan a la v6 (paginado, carrusel fijado, View Transitions, container queries).
- [ ] Alinear spec §12 con lo decidido: nube solo en el hero (ya coincide), cabecera nueva (Chat + Login), orden de secciones.
- [ ] `/plan-eng-review` del plan (obligatorio: dinero e integraciones externas).
- [x] **Indicaciones de cómo trabajar** antes de escribir código real: `docs/working-agreements.md` + reglas duras en `CLAUDE.md` (2026-09-29). Falta el paso manual de Jose: proteger `main` en GitHub (§9).
- [ ] **Decisión de componentes de la home**: inventario de componentes de la v6 y cuáles pasan a la app real y cómo.
- [ ] **Pantallas independientes**: listado de pantallas fuera de la home y **contenidos** de cada una.
- [ ] Páginas derivadas sin diseñar: stack/CV, tarifas para negocios; personalización del área privada según objetivo del usuario.

**Insumos de Jose (bloquean tareas del plan)**
- [ ] Los `{{DATO}}`: nombre a mostrar, ciudad, años, estado y descripción de 3catinfo/HazmeFila/Oportunix, certificaciones, WhatsApp y email, usuario de GitHub, enlaces de stores, plazo de respuesta real, artículos del blog.
- [ ] Radar: `content/radar/profile.json` y CV maestro es/en; proyecto OAuth de Google; alertas de LinkedIn; ≥ 12 correos reales anonimizados; cuentas en InfoJobs/Tecnoempleo/Upwork/Workana/Malt.
- [ ] Supabase: OAuth Google/GitHub, plantilla OTP, «leaked password protection».
- [ ] Cloudflare: `api.josecoded.com` como custom domain y URL `workers.dev` del gateway. Los servidores MCP de Cloudflare necesitan autorizarse (`/mcp` en una sesión interactiva).
- [ ] Corregir los ejemplos provisionales de `Comercial/voz.md`.

**Suelto**
- [ ] Accesibilidad: al descomponer etiquetas en glifos (home-v4) el nombre accesible puede leerse con basura; en v6 ya no se usa, confirmar al implementar.
- [ ] `.gitignore` de `josedev` y `josecoded-worker` con `graphify-out/` sin commitear.

## Siguiente paso

1. ~~Jose responde las tres confirmaciones.~~ Hecho 2026-09-29.
2. ~~Revisión de acabado + fixes~~ hecho. Jose valida en navegador y decide lo pendiente de la revisión → documentador → `DESIGN.md` + contrato v6 en `.impeccable/surfaces/`.
3. Actualizar UX §4.1, spec §12 y fase 2 del plan; `/plan-eng-review`.
4. Fase 0 del plan (seis validaciones técnicas sin tocar producción) y fase 1 (monorepo, `packages/pricing`, CI).

Gates que no se cruzan sin OK explícito de Jose en la misma sesión: migraciones y deploys a producción, contratar servicios, tocar servicios preexistentes de Omen.

## Decisiones recientes

- **2026-09-29 (convenciones de trabajo, `docs/working-agreements.md`; resumen en `CLAUDE.md`):**
  1. Estilos: CSS Modules por componente que consumen solo tokens; sin Tailwind ni shadcn; stylelint prohíbe literales fuera del fichero de tokens.
  2. Tokens: `.impeccable/design.json` genera `tokens.css` con test de deriva; la guía de qué token usar vive en `DESIGN.md`.
  3. Motion: CSS nativo primero; JS propio mínimo en TypeScript; GSAP solo con justificación.
  4. Navegadores: Baseline 2024 + `@supports` para `animation-timeline`, View Transitions y `backdrop-filter`; tabla de fallbacks obligatorios que `qa` comprueba en Safari.
  5. Fidelidad: prototipo `home-v6` 1:1 (estructura y valores como tokens); React solo compone; desvíos marcados `deviation:` y decididos por Jose en el navegador.
  6. Validación: capturas app/prototipo a 360, 900 y 1440 comparadas por diff; `ui` revisa; Jose aprueba en preview antes del merge.
  7. Tests de UI: sin unit test en componentes sin lógica; TDD solo en lo que tiene comportamiento.
  8. Unidades: relativas para todo lo que escala con el texto, breakpoints en `rem`; `px` solo en hairlines, trazos, sombras, desenfoques y offsets de motion.
  9. Integración: PR por rama, squash merge, `main` protegida (paso manual de Jose en GitHub).
  10. Contenidos: un JSON de literales por idioma en `messages/{es,en}.json` (hechos bajo `facts.*`, sin `facts.json` aparte); ningún literal en componentes; `i18n:check` lista `{{DATO}}` y claves faltantes.
  11. Dependencias: pnpm siempre, nunca npm; solo las del plan; una extra con justificación de peso y alternativa nativa, la decide `revisor`.
  12. Documento: `docs/working-agreements.md` completo + 10 reglas duras en `CLAUDE.md`. Quedan obsoletas la tarea 2.2 del plan (Tailwind, shadcn, Sora/Manrope) y el GSAP de la spec §5; pendiente decidir `packages/glyph-scene` frente a `scene.js` de la v6 (working-agreements §12).
- **2026-09-29**: indicador de sección con líneas en el margen derecho (sin texto, activa más larga y violeta, oculto en el hero). Paginado por gesto, layout adaptativo por container queries y vida por celda. Repo indexado en codebase-memory con ADR.
- **2026-09-26/27**: Jose elige el **bento**, con secciones claras a pantalla, transiciones suaves y **Proyectos como carrusel fijado** → `home-v6`. Quitada «Esta web la he hecho yo». Resúmenes de cada página tras el hero en orden Sobre mí · Empresas · Negocios · Proyectos · Blog, igual que la cabecera; cabecera con Chat y Login destacado.
- **2026-09-25**: el hero se conserva; lo demás se rehace al estilo Raycast con un solo gesto por sección (fuera chorros, barridos, bordes iluminados, imanes y nube viajera: «básico y lioso»).
- **2026-09-24**: flujo de diseño obligatorio **taste-skill → impeccable → Emil** interconectados. Mundo índigo casi negro `#07060F`, texto lavanda, acción violeta `#7C6CFF`, verde solo para «disponible», Geist/Geist Mono. **Nivel estudio sin metáforas**, listón raycast.com + igloo.inc, **nada de métricas** (precios «desde» sí). Cristal y las direcciones «placa/plano/carteles» descartadas.
- **2026-09-19**: hero aprobado (D16) y **módulo Radar en v1** (D17–D26).
- **2026-09-17**: navegación clásica. Admin = `staff_members.role='admin'`; leads solo vía gateway.
- **2026-09-14**: tarifas v2 (packs 900 / 1.400 / 2.500 / 4.200 €, mantenimiento 49/149 €/mes) y afiliados (2 meses / 10 % / 20 %).
- **2026-09-13**: dos audiencias de igual peso, freelance sin marca de agencia, producto final v1, SEO + GEO, monorepo en Cloudflare Workers con OpenNext.
