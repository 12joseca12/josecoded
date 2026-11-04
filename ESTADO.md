# Estado — josecoded

## Ahora

Arquitectura cerrada del todo (2026-11-02, `docs/arquitectura/decisiones.md`): Jose respondió a las preguntas de `pantallas.md` y `datos.md` aceptando las recomendaciones y cerró 4.5 (Groq en el chat público con reserva local; local para Radar, RAG y borradores; pgvector en Supabase) y 8.3 (Radar encuentra, puntúa y redacta; Jose envía con un clic; API oficial donde exista; nunca navegador automatizado). Primer tablón escrito en `docs/plan/bloques.md`: scaffold (W01–W06), kit de interfaz y estados (W07–W12), home con hero (W13–W22), proyectos, servicios, sobre mí, contacto, chat, blog, legales, SEO, seguridad y lanzamiento (W23–W46); lista O para `josecoded-omen` y las zonas siguientes como grupos.

## Siguiente paso

1. Cargar los bloques W01–W46 en el tablón (GitHub Issues + Projects, una issue por bloque, decisión 10.5).
2. Empezar el scaffold en orden: `infra/scaffold` (W01) → `infra/lint` (W02) → `infra/tokens` (W03) → `infra/i18n` (W04) → `infra/ci` (W05) → `infra/opennext` (W06). No dependen de ninguna decisión pendiente.
3. En paralelo, Jose decide en el navegador la navegación (10.9) y da feedback del hero y el scroll (10.10) sobre `prototipos/estilo-b/`; hasta entonces W11 queda bloqueado y W15 espera.

## Pendientes

- **Jose (acciones):** crear el proyecto Supabase `josecoded-dev` (10.7) y pegar URL y clave publicable en los secretos de CI; crear el repo GitHub `josecoded-omen` (10.8); proteger `main` en los dos repos; borrar `develop` y las ramas `chore/*`, `design/*`, `docs/*`, `claude/*` del remoto (se quedan las `archivo/*`).
- **Jose (decisiones en el navegador):** navegación A cápsula / B terminal / C raíl (10.9); feedback del hero animado, los estados y la barra de scroll (10.10).
- **Jose (cuando toque, cada bloque lo marca):** token de Cloudflare (W06), claves de Turnstile (W31), dominio y clave de Resend (W35), textos y datos `{{DATO}}` (hero, proyectos, sobre mí, legales), modelo local y `GROQ_API_KEY` (O05).
- El dominio `josecoded.com` responde 521 (origen caído) hasta W46.
- **Sincronizar desde el Mac:** nota del vault `Proyectos/josecoded.md` (decisiones cerradas de la segunda ronda, tablón, abiertas 10.7–10.10) y ADR en codebase-memory cuando haya código. Los bloques `data/*` necesitan Docker (Mac) o `josecoded-dev`.
- **Pasar por `redactor` (Mac):** el lead del hero (`home.hero.lead` en `messages/es.json` y `messages/en.json`) y los textos de las tarjetas decorativas del visual (`home.hero.demo.*`).
- **Hero de la home (W13–W16, parcial, `public/home-hero`):** hecho: variante B «Móvil + web» aprobada por Jose (prototipo en la rama `docs/hero-prototype`), secuenciador de las cinco fases (decisión 2.14) con tests, raíl con pausa y reduced-motion estático en «Publicar» resuelto desde CSS. Pendiente: test de presupuesto del hero en CI, póster y `content-visibility` en móvil (W16) y ver la preview con Jose. El eyebrow y los `stats` que W13 pide en `docs/plan/bloques.md` quedan descartados por la regla de Jose de no usar eyebrows.

## Decisiones recientes

- **2026-11-02 — Segunda ronda cerrada.** 4.5 y 8.3 con la recomendación; pantallas y datos: comisiones con dos tasas sobre el importe cobrado congeladas por fila y creadas al ganar (7.6, 7.7); un hilo por usuario (5.6); varios proyectos por cliente (6.5); documentos 25 MB / 1 GB / tipos cerrados (6.6); el freelance no ve cliente ni importes (6.7); blog sin comentarios (2.7); vía contratación solo CV y chat (2.8); WhatsApp y Cal.com cuando haya datos (2.9); vectores del RAG en pgvector (4.6). Abiertas solo 10.7–10.10.
- **2026-11-02 — Primer tablón** en `docs/plan/bloques.md`: 46 bloques W (scaffold y zona pública) y 8 bloques O (Omen), cada uno ≤ ~400 líneas y ≤ 1 h, con URL local, dependencias y criterio de hecho.
- **2026-11-02 — Arquitectura cerrada.** Dos repos (`josecoded` web + `josecoded-omen` backend), contrato por `database.ts` y `contracts/`, sin gateway, Omen solo sale, roles en `profiles.role`, OTP + TOTP, ramas `<area>/<tema>`, tablón en GitHub Issues, orden público → auth/admin → CRM → área → freelance → Radar → lab. Detalle en `docs/arquitectura/decisiones.md`.
- **2026-11-02 — Estilo: opción B** (acero, carbón y coral) con prototipo en `prototipos/estilo-b/` (hero animado, tres navegaciones, scroll y barra lateral, estados).
- **2026-11-02 — Supabase de producción limpio** (OK de Jose). Borrados esquema `private`, todas las tablas, funciones, tipos y políticas de `public`, las políticas de `storage.objects`, el trigger `on_auth_user_created`, el bucket `client-assets`, las extensiones `citext` y `unaccent` y el historial de `supabase_migrations`. No había usuarios ni ficheros. Advisors de seguridad: 0. Se mantienen los privilegios por defecto endurecidos (sin grants a `anon`/`authenticated` en objetos nuevos de `public`).
- **2026-11-02 — Ramas limpias.** Solo quedan `main`, `develop` y las de archivo (`archivo/v1-2026-11-02`, `archivo/chore-monorepo-base`, `archivo/chore-supabase`). Worktrees antiguos del Mac eliminados.
- **2026-11-02 — Reinicio.** Se vacía `main` con un commit (historial conservado), se archiva todo en `archivo/v1-2026-11-02` y se crea `develop` desde el `main` vacío.
