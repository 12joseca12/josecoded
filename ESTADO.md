# Estado — josecoded

> Traspaso del 2026-09-29 (noche). **Diseño de la home cerrado en `ref/home-v6` y documentos al día**: spec v1.6, UX v4.0, diseño técnico v1.3, plan v2.0 (con la newsletter como fase 10). Falta `/plan-eng-review` y después arrancan las fases 0 y 1. Sin código de aplicación todavía.

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

Fuentes de verdad de diseño: `PRODUCT.md` (producto), `DESIGN.md` + `.impeccable/design.json` (sistema v6, volcado el 2026-09-29; **faltan los tokens de INV §5, que completa la tarea 1.10 del plan**), contrato en `.impeccable/surfaces/`. Figma con exploraciones: https://www.figma.com/design/aGt6l1dnVUB8tmhU8ctn4f.

Histórico de prototipos (no usar como base): `home-v5/` (variantes A/B/C que llevaron a la v6), `home-v4/` (ventana con dock), `hero-lab-3/` (hero aprobado original), `estilo/`, `eje/`, `ui-v3/`, `heros/`, `hero-lab`, `hero-lab-2`.

Documentos (al día con la v6 desde el 2026-09-29):

| Documento | Ruta | Versión |
|---|---|---|
| Spec | `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` | **v1.6** (D27–D33, §12 v6) |
| Spec newsletter | `docs/superpowers/specs/2026-09-29-josecoded-newsletter.md` | v1 (fase 10 del plan; Q1–Q6 pendientes de Jose) |
| UX | `docs/superpowers/design/2026-09-17-josecoded-ux.md` | **v4.0** (§2 y §4.1 v6; interiores → documento de pantallas) |
| Diseño técnico | `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` | **v1.3** (§1.6.2 v6, §1.9–1.12 nuevos) |
| Sistema visual | `DESIGN.md` + `.impeccable/design.json` | v6 (`2026-09-17-josecoded-ui.md` v3 superado) |
| Componentes home | `docs/superpowers/design/2026-09-29-componentes-home-v6.md` | v1.1 |
| Pantallas y contenidos | `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` | v1.0 |
| Convenciones | `docs/working-agreements.md` | v1.0 |
| Plan | `docs/superpowers/plans/2026-09-19-josecoded-v1.md` | **v2.0** (fase 2 v6, 1.10 tokens bloqueante, fase 3 en orden de pantallas, fase 10 newsletter) |

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
- [ ] `{{DATO}}` nuevos: foto real de Jose (celda Sobre mí), entregable por servicio (Empresas), textos en inglés de todo lo que aporte Jose, capturas y reto/trabajo/resultado por proyecto, CV maestro es/en, datos del titular para el aviso legal, respuestas de la FAQ de Empresas, tres artículos del blog, cuenta de Cal.com.
- [x] Volcar la v6 a `DESIGN.md` y `.impeccable/design.json` y al contrato de `.impeccable/surfaces/` (2026-09-29). Quedan los tokens de INV §5 → tarea 1.10 del plan.
- [x] UX §2 y §4.1 reescritos, UI v3 superada, fase 2 del plan reescrita contra la v6 (2026-09-29, plan v2.0).
- [x] Spec §12 alineada (v1.6): home v6, cabecera Chat + Login sin Contacto, orden de secciones, stack visual D27, Baseline 2024 D28, pantallas D30, bilingüe D31, área D32, blog D33.
- [x] Diseño técnico v1.3: `glyph-scene` desde `scene.js` v6 (vídeo en móvil, WebGL solo escritorio), tokens `design.json` → `tokens.css`, `lib/motion/`, `i18n:check`, `user_profiles` + `area_lead_summary()` para la personalización del área.
- [x] Spec de newsletter integrada como fase 10 del plan (sin cambiar sus decisiones; notas de encaje en el plan).
- [ ] **`/plan-eng-review` del plan v2.0** (obligatorio: dinero e integraciones externas). Lo lanza el controlador. Focos: Cal.com, Turnstile, WhatsApp, Workers AI, migraciones (`user_profiles`, RPC `security definer`), y toda la fase 10 (Brevo, GitHub REST + auto-merge, DNS, Claude CLI en Omen, RGPD).
- [x] Preguntas del paso 5 respondidas por Jose (2026-09-30): newsletter **bilingüe** (spec v1.1), repo **privado**, tolerancia de capturas **2 %**, auto-merge solo en `newsletter/*`; n8n evaluado como orquestador y descartado (spec de newsletter §7.5). Sigue abierta solo la del paginado en trackpad (se decide en el navegador en 2.16).
- [x] **Indicaciones de cómo trabajar** antes de escribir código real: `docs/working-agreements.md` + reglas duras en `CLAUDE.md` (2026-09-29). Falta el paso manual de Jose: proteger `main` en GitHub (§9).
- [x] **Decisión de componentes de la home**: `docs/superpowers/design/2026-09-29-componentes-home-v6.md` (decisiones cerradas en su §3).
- [x] **Pantallas independientes**: mapa, contenidos y orden en `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` v1.0 (2026-09-29). Incluye las páginas derivadas: stack/CV (sección en Sobre mí + PDF), tarifas de negocio (comparador en `/negocios`) y personalización automática del área.

**Insumos de Jose (bloquean tareas del plan)**
- [ ] Los `{{DATO}}`: nombre a mostrar, ciudad, años, estado y descripción de 3catinfo/HazmeFila/Oportunix, certificaciones, WhatsApp y email, usuario de GitHub, enlaces de stores, plazo de respuesta real, artículos del blog.
- [ ] Radar: `content/radar/profile.json` y CV maestro es/en; proyecto OAuth de Google; alertas de LinkedIn; ≥ 12 correos reales anonimizados; cuentas en InfoJobs/Tecnoempleo/Upwork/Workana/Malt.
- [ ] Supabase: OAuth Google/GitHub, plantilla OTP **en es y en**, «leaked password protection».
- [ ] GitHub: proteger `main` (working-agreements §9) antes del primer merge; la excepción de auto-merge solo para `newsletter/*` con checks `ci` + `newsletter-content-only` en verde y 0 revisiones requeridas (fase 10, tarea 10.6).
- [ ] Newsletter (fase 10, tras el lanzamiento): cuenta de Brevo y dominio autenticado, registros DNS, PAT fine-grained, `claude setup-token` para Omen (Q1), lista de fuentes (Q6), política de privacidad, 3–5 temas iniciales. Q1–Q6 de su spec **resueltas el 2026-09-30** (recomendaciones aceptadas; Q5: pie con nombre + baja + enlace al aviso legal, NIF y domicilio solo en el aviso legal, valores en la fase de datos) y auto-merge del PR de contenido confirmado (el clic de Aprobar es el OK).
- [ ] Cloudflare: `api.josecoded.com` como custom domain y URL `workers.dev` del gateway. Los servidores MCP de Cloudflare necesitan autorizarse (`/mcp` en una sesión interactiva).
- [ ] Corregir los ejemplos provisionales de `Comercial/voz.md`.

**Suelto**
- [ ] Accesibilidad: al descomponer etiquetas en glifos (home-v4) el nombre accesible puede leerse con basura; en v6 ya no se usa, confirmar al implementar.
- [ ] `.gitignore` de `josedev` y `josecoded-worker` con `graphify-out/` sin commitear.

## Siguiente paso

1. ~~Jose responde las tres confirmaciones.~~ Hecho 2026-09-29.
2. ~~Revisión de acabado + fixes~~ hecho. Jose valida en navegador y decide lo pendiente de la revisión → documentador → `DESIGN.md` + contrato v6 en `.impeccable/surfaces/`.
3. ~~Pantallas independientes y contenidos~~ hecho (2026-09-29).
4. ~~Componentes de la home~~ hecho (2026-09-29).
5. ~~Actualizar spec, UX, diseño técnico y plan~~ hecho (2026-09-29: spec v1.6, UX v4.0, DT v1.3, plan v2.0 con la newsletter en fase 10). **Falta `/plan-eng-review`** (lo lanza el controlador).
6. **Fase 0 del plan** (seis validaciones técnicas sin tocar producción; 0.2 ya con `scene.js` de la v6) y **fase 1** (monorepo con `design-tokens` y stylelint, `packages/pricing` con packs de app, migraciones incluida `user_profiles`, CI; **1.10 tokens completos antes de cualquier UI**).
7. Fase 2: port 1:1 de `home-v6` escena a escena, con capturas comparadas y aprobación de Jose entre escenas.

Gates que no se cruzan sin OK explícito de Jose en la misma sesión: migraciones y deploys a producción, contratar servicios, tocar servicios preexistentes de Omen.

## Decisiones recientes

- **2026-09-30 (respuestas de Jose a las cuatro preguntas del paso 5):**
  1. **Newsletter bilingüe:** cada número genera post y email en es y en en el mismo trabajo de Claude; el suscriptor recibe el de su idioma de alta (`locale` en la suscripción, cambiable desde preferencias); Jose revisa y aprueba las dos versiones en el admin; dos campañas de Brevo por número (una lista, atributo `LOCALE`); PR con dos ficheros; ratio de edición por idioma; LinkedIn solo es. Spec de newsletter **v1.1** (S4, Q2 reabierta; Q1, Q3–Q6 con las recomendaciones) y fase 10 del plan actualizadas.
  2. **Repo de josecoded privado:** el caso de estudio enlaza solo a la web y explica la arquitectura, sin `repoUrl` (spec §4, pantallas P8, plan 3.4).
  3. **Tolerancia del diff de capturas: 2 %** (`maxDiffPixelRatio: 0.02`), fijada en working-agreements §5 y tarea 2.13.
  4. **Auto-merge solo en `newsletter/*`** con `ci` + `newsletter-content-only` en verde y 0 revisiones requeridas; regla escrita en working-agreements §9 (S16). **n8n como orquestador o bot: evaluado y descartado** (spec de newsletter §7.5): no puede ejecutar la CLI de Claude sin cambiar el contenedor de n8n (prohibido) y crons, PR, Brevo y Telegram ya viven gratis y sin depender de Omen en el gateway y en `notify`; n8n solo como workflows opcionales. Ahorro admitido: el runner como segundo servicio en el `compose.yml` de `radar-runner`.

- **2026-09-29 (paso 5, documentos al día; `arquitecto`):**
  1. Spec v1.6: D27 stack visual (CSS Modules + tokens, motion CSS + TS, sin Tailwind/shadcn/GSAP), D28 Baseline 2024, D29 home v6, D30 pantallas y contenidos, D31 todo bilingüe, D32 área personalizada, D33 blog ≥ 3 artículos; §12 reescrita; lanzamiento sigue siendo todo junto.
  2. **Tarifas de Empresas confirmadas por Jose**: 40 €/h y feature cerrada desde 150 € se mantienen como formas de contratar (no packs); la celda Tarifas de la home no cambia; los packs de app van en Negocios.
  3. DT v1.3: `packages/glyph-scene` = port de `ref/home-v6/scene.js` a TS sin código muerto (Geist Mono, bloom 0.22, reflejo 0.35, verde 0); **WebGL solo en escritorio**, móvil vídeo + póster (desaparece `HERO_LIVE_MOBILE`); arte de Proyectos regenerado ≤ 60 KB; `design.json` → `tokens.css` con test de deriva y stylelint; `lib/motion/` como módulos puros; `messages/{es,en}.json` + `i18n:check`; **personalización del área con tabla aditiva `user_profiles` (señal de origen write-once, RLS propia) y RPC `security definer` `area_lead_summary()`**; cliente y lead se calculan en cada petición; `leads` sigue sin lectura para `authenticated`.
  4. Plan v2.0: fase 2 reescrita (paginado = hook, carrusel = componente, celda ampliada genérica, bento JSX, capturas comparadas en 2.13); 2.2 v1 eliminada; nueva **1.10 bloqueante** (tokens de INV §5); fase 3 en el orden de pantallas con prototipo validado por Jose antes de construir; 3.13 (componentes de interiores) y 3.14 (CV maestro → PDF); 4.2 regla de 3 artículos; 5.1 personalización; 9.3 retirada (sin métricas); **fase 10 newsletter** con las ramas de su spec §14 y notas de encaje (sin cambiar sus decisiones).
  5. UX v4.0: §2 y §4.1 v6; §3 y §4.2–4.10, §5.4, §6.1 con «superado por» hacia el documento de pantallas; UI v3 superada por `DESIGN.md`.

- **2026-09-29 (pantallas independientes, `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` v1.0):**
  1. Alcance: todo junto, como la spec (Radar y área incluidos); la prioridad del documento es orden de diseño y construcción, no de lanzamiento.
  2. Interiores: escenas con scroll libre (titular a dos tonos y bentos, sin 100svh ni paginado).
  3. Inglés: todas las páginas en es y en desde el lanzamiento, Negocios y área incluidas.
  4. Contacto: página `/contacto` con selector negocio/empresa y cierre corto en cada página.
  5. Sobre mí: profundidad media.
  6. Stack y CV: sección «Stack y formación» en Sobre mí + PDF es/en desde el CV maestro de Radar.
  7. Proyecto: caso de estudio medio.
  8. josecoded.com: caso propio en Proyectos.
  9. Tarifas de negocio: comparador dentro de `/negocios`.
  10. Packs de app (4.000 / 6.000 €): en Negocios («¿Necesitas una app?»); Empresas solo trabajo y freelancing, sin packs.
  11. Área privada: personalización automática (cliente → propuesta/lead → `?ref` → página de origen → neutra), sin preguntar.
  12. Blog: sale con un mínimo de 3 artículos reales; si no, se ocultan la sección y la entrada de la cabecera.
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
