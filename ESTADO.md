# Estado — josecoded

> Actualizado el 2026-09-24 (tarde): **dirección visual rehecha con impeccable + Emil**. Home v4 construida como prototipo; Cristal queda superado.

## Ahora

Fase de diseño terminada, **sin una línea de código de la aplicación todavía**. Lo que existe:

| Documento | Ruta | Versión |
|---|---|---|
| Spec | `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` | v1.5.2 |
| UX (45 pantallas + 33 estados) | `docs/superpowers/design/2026-09-17-josecoded-ux.md` | v3.2 |
| Diseño técnico | `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` | v1.2.1 |
| Sistema visual | `docs/superpowers/design/2026-09-17-josecoded-ui.md` | v3 |
| Plan (97 tareas, 10 fases, 9 gates) | `docs/superpowers/plans/2026-09-19-josecoded-v1.md` | — |

**Nuevo (2026-09-24):**
- `PRODUCT.md` (raíz): verdad de producto para impeccable.
- `ref/home-v5/` — **(26-09) tres variantes** (`index.html` elige): A índice de comandos, B bento de páginas con View Transitions, C carrusel fijado con CSS scroll-driven. Hero conservado; tras él, resúmenes en orden Sobre mí · Empresas · Negocios · Proyectos · Blog (mismo orden en la cabecera). Cabecera: ⌘K, Chat y **Login** destacado; «Contacto» sale de la cabecera (sigue en cierre, badge y ⌘K). Quitada la sección «Esta web la he hecho yo». **Pendiente: que Jose elija variante.**
- `ref/home-v4/` — **(25-09) hero conservado; resto reconstruido al estilo Raycast**: ventana con dock de 4 pestañas (Negocios: generador escribiéndose y resultado «Web con reservas · desde 1.400 €»; Empresas; Proyectos; Asistente), luz tras la ventana según pestaña, atajos 1-4; arquitectura con peticiones viajando por los cables (SMIL, pausada fuera de vista); cierre con teclas ⌘ K que se hunden al pulsar el atajo. Fuera: nube viajera, chorros, barrido, bordes iluminados, imanes, etiquetas en glifos. Copia previa en `*.pre-raycast.*`. Formatos en Figma: https://www.figma.com/design/aGt6l1dnVUB8tmhU8ctn4f. **Antes:** home nueva a nivel estudio (listón raycast.com + igloo.inc, sin metáforas). **«La web se compila» (noche):** fondo casi negro índigo #07060F; al llegar a cada bloque la nube lanza chorros de glifos que trazan el borde de cada componente y este se imprime con línea de barrido (móvil: solo impresión). **Revisión índigo previa:** fondo #0D0B1F con campo de luz violeta que sigue al objeto, texto lavanda, primario violeta #7C6CFF, tarjetas con luz y canto, botones magnéticos. Geist/Geist Mono, paleta ⌘K, ventana de proyectos tipo Raycast, nube de glifos guiada por scroll (hero cicla; en Dos vías responde al hover: Empresas → chip, Negocios → móvil). Sin métricas. Contrato en `.impeccable/surfaces/`, capturas en `.impeccable/review/`. Revisión de acabado: 2 rondas, disposición final `fix` con 2 puntos abiertos (abajo).
- `DESIGN.md` + `.impeccable/design.json`: sistema documentado desde home-v4 (lo genera el documentador de impeccable).

Prototipos navegables (servir con `python3 -m http.server 8765 --directory docs/superpowers/design/ref`):
- `ref/hero-lab-3/` — **hero aprobado**: split tipo Resend, partículas-glifo que morfan móvil → web → chip IA, intro por caída, bloom, reflejo. Panel de ajustes con `c`.
- `ref/estilo/` — tres variantes de estilo; **Jose eligió "Cristal" (V1)**. Incluye la transición de página nueva (fundido a negro + cortina de glifos).
- `ref/eje/` — recorrido 3D de la home con dos formas del eje (A hélice de ADN / B columna de anillos). **Pendiente de que Jose elija.**
- `ref/ui-v3/`, `ref/heros/`, `ref/colores-v2.html`, `hero-lab`, `hero-lab-2` — histórico, ya superados.

Grafos de código (graphify, 2026-09-24): `josecoded-api` 338 nodos · `josecoded-worker` 174 nodos, ambos con `GRAPH_REPORT.md` y `graph.html` en su `graphify-out/`. El grafo de `josecoded` sigue siendo el de documentación (530 nodos) porque aún no hay código propio.

## Pendientes

**Decisiones de Jose (bloquean el diseño final de la home)**
- [ ] Validar home-v4 en el navegador (`/home-v4/`, `?intro` para ver la caída).
- [ ] Badge «Disponible para proyectos» sobre el h1: aprobado en D16 pero impeccable lo prohíbe como eyebrow. ¿Se queda, o el punto verde pasa a la fila de CTA / junto a Contacto?
- [ ] Plazo de respuesta real (la promesa «24 h laborables» no está en `voz.md`); queda como `{{DATO}}`.
- [ ] Nube fuera del hero en escritorio (decisión del 22-09) frente a «WebGL solo en el hero» de la spec: confirmar cuál manda y alinear spec y PRODUCT.md.
- [ ] Haces del fondo que se mueven y luz que sigue al cursor: los eligió en la opción índigo, pero chocan con las prohibiciones de R14 (parallax de fondo, gradientes animados, foco dinámico). Confirmar.
- [ ] Verde en la nube: D16 aprobó 14 % de glifos verdes; home-v4 lo deja solo en el destello de aterrizaje. Confirmar.
- [x] ~~Elegir forma del eje en `ref/eje/`~~: superado; en home-v4 la propia nube recorre la página por bloques.
- [ ] Pasar los valores del panel del hero (`c` en `ref/hero-lab-3/`) para fijarlos en código y quitar el panel. Se copian con:
      `copy(JSON.stringify(Object.fromEntries([...document.querySelectorAll('#panel input')].map(e => [e.id || e.dataset.var, e.type === 'checkbox' ? e.checked : +e.value]))))`
- [ ] Detalles de estilo: cuánta monoespaciada, intensidad del spotlight de hover, badge del hero a 44 px en móvil, duración de la transición de página (≈1 s).

**Insumos de Jose (bloquean tareas concretas del plan)**
- [ ] Los 14 `{{DATO}}` de UX §18: nombre a mostrar, ciudad, años, estado real de 3catinfo/HazmeFila/Oportunix, certificaciones, WhatsApp y email, usuario de GitHub, enlaces de stores.
- [ ] Radar: `content/radar/profile.json` (roles, keywords, modalidad, zona, salario y tarifa mínimos, idiomas, exclusiones, disponibilidad) y CV maestro es/en.
- [ ] Radar: proyecto OAuth de Google (Gmail lectura + borradores, Calendar), alertas de empleo de LinkedIn al Gmail, ≥ 12 correos reales anonimizados para fixtures, cuentas en InfoJobs/Tecnoempleo/Upwork/Workana/Malt cuando toquen.
- [ ] Supabase: alta de OAuth Google/GitHub, plantilla del código OTP, activar "leaked password protection".
- [ ] Cloudflare: alta de `api.josecoded.com` como custom domain; pasar la URL `workers.dev` actual del gateway.
- [ ] Corregir los tres ejemplos provisionales de `Comercial/voz.md` (los redactó Claude).

**Trabajo de diseño que queda**
- [ ] Rehacer UX §2 y §4.1 y UI v3 con la estructura nueva de la home (recorrido 3D con eje), una vez Jose elija forma. Afecta también a la fase 2 del plan.
- [ ] Páginas derivadas aún sin diseñar: stack/CV y tarifas para negocios. En el área privada, al crear cuenta el usuario indica su objetivo y se personaliza la experiencia.
- [ ] `/plan-eng-review` del plan (obligatorio: toca dinero e integraciones externas).

**Suelto**
- [ ] `.gitignore` de `josedev` y `josecoded-worker` modificados (añadido `graphify-out/`) y **sin commitear**.
- [ ] graphify marca `ref/ui-v3/tokens.css` como sensible (falso positivo por la palabra "token") y lo deja fuera del grafo.

## Siguiente paso

1. Jose elige forma del eje y pasa los valores del hero.
2. `ux` + `ui` actualizan home (UX §4.1, UI v3) a la estructura de recorrido con eje.
3. `/plan-eng-review` y arranque de la **fase 0** del plan: seis validaciones en paralelo con `implementador-web` (OpenNext en Workers Free, bundle del hero ≤ 200 KB gz y generación de medios, `submit` de InfoJobs, Browser Rendering, MCP de Indeed en `claude -p`, feed de Tecnoempleo). Ninguna toca producción.
4. Fase 1 (monorepo `apps/web` + `apps/api`, `packages/pricing`, CI) y, en paralelo con las fases 2–6, la rama `feat/radar-core`.

Gates que no se cruzan sin OK explícito de Jose en la misma sesión: migraciones y deploys a producción, contratar servicios, tocar servicios preexistentes de Omen.

## Decisiones recientes

- **2026-09-24 (tarde)**: con las skills nuevas (impeccable + Emil) se reabre el estilo conservando los glifos. Tras dos tiradas de direcciones (metáforas de objeto: placa, plano, carteles), Jose las rechaza por «se notan IA, feas y poco tech» y fija: **nivel estudio sin metáforas**, listón raycast.com + igloo.inc, estándar de la categoría ejecutado a fondo; **nada de métricas** en la web (precios «desde» sí). Registrado en `PRODUCT.md` como preferencia fija.

- **2026-09-24**: indexados con graphify `josecoded-api` y `josecoded-worker`; el grafo de `josecoded` se deja como está (documentación) hasta que haya código.
- **2026-09-22**: estilo cerrado. Vidrio, píldora + 16–18 px, morado en acción/enlaces/foco/datos y **verde como segundo acento libre**; Sora/Manrope/JetBrains Mono con mono muy presente; **densidad media y unidades relativas en todo** (regla de proyecto); campos hundidos, tablas con separador fino, marcos de dispositivo, iconos Lucide, vacíos con glifo grande. Motion: entrada una sola vez, sin pinning, hero que se deshace al 50 % de viewport y se rehace al subir, hover con canto + flecha + luz que sigue al cursor, cifras que cuentan una vez, reduced-motion con fundidos. Variante elegida: **Cristal**. Transición de página: **fundido a negro + cortina de glifos** (no el barrido que ocupaba la pantalla de golpe).
- **2026-09-22**: la home pasa a ser un **recorrido continuo en 3D**: el hero se deshace y sus glifos forman un eje vertical que rota con el scroll, se desplaza (centro → izquierda → derecha) y tiene un nodo por sección (Presentación · Qué hago · Stack · Proyectos · Las dos vías · Contacto), con el contenido en paneles de vidrio.
- **2026-09-19**: hero aprobado (D16) y **módulo Radar en v1** (D17–D26): caza de empleo y encargos freelance, envío **solo tras confirmación de Jose**, conectores enchufables, Gmail por API (Proton diferido), Calendar secundario, Telegram, Supabase como fuente de verdad. Estimación +35–45 % sobre el resto de v1. Plan de 97 tareas.
- **2026-09-17**: navegación clásica (se descartó el shell IDE-lite). Esquema real de Supabase verificado: el admin es `staff_members.role='admin'` (no existe `admin_superusers`) y los leads solo se crean vía gateway.
- **2026-09-14**: tarifas v2 en el vault (packs P1 900 / P2 1.400 / P3 2.500 / P4 4.200 €, extras, mantenimiento 49/149 €/mes) y programa de afiliados (2 meses / 10 % / 20 %).
- **2026-09-13**: dos audiencias de igual peso (empresas que contratan y negocios locales), Jose como freelance sin marca de agencia; sin MVP, producto final v1; SEO + GEO de primer nivel; monorepo en Cloudflare Workers con OpenNext.
