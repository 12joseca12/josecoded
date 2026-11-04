# Decisiones de arquitectura

**2026-11-02 · cerradas por Jose sobre `docs/arquitectura/preguntas.md`.** Una línea por pregunta, con su id. Jose aceptó las recomendaciones salvo donde se indica **(Jose)**. Las marcadas **ABIERTA** esperan su confirmación. Lo que cambie después se añade aquí con fecha, no se reescribe.

**2026-11-02 (segunda ronda).** Jose cerró 4.5 y 8.3 aceptando la recomendación y respondió a las preguntas de `pantallas.md` y `datos.md` (todas con la recomendación): quedan recogidas en 2.7–2.9, 4.6, 5.6, 6.5–6.7 y 7.6–7.7. Lo único abierto son acciones suyas (10.7, 10.8) y dos decisiones de diseño en el navegador (10.9, 10.10).

**2026-11-04 (tercera ronda).** Jose cerró 10.10 en el navegador (hero variante B «Móvil + web» con las cinco fases) y decidió la cápsula de contacto (2.18), el nombre y los estados del asistente (5.9) y el modelo del chat de visitantes anónimos (5.10; el avatar SVG y su motion son 5.8, en su propia rama). El reparto de contenido entre pantallas está en `division-pantallas.md`, con ocho preguntas pendientes (Q1–Q8) que se anotarán aquí como 2.19 en adelante.

## 1. Repositorios

- **1.1 (Jose) Dos repos.** `josecoded` (este): la web Next y todo lo que despliega en Cloudflare, más `supabase/` (migraciones, tests RLS) y `contracts/`. `josecoded-omen` (nombre propuesto, corto y ordena junto al primero en GitHub): backend Node que corre en Omen (IA, RAG, Radar, trabajos). Sustituye a `josecoded-worker`, que se archiva.
- **1.1b Tipos compartidos entre repos.** La frontera entre los dos repos es la base de datos, no una API: por eso el contrato es `database.ts` generado desde `supabase/migrations/` del repo web (`supabase gen types`), y las columnas se tipan en SQL en vez de usar `jsonb` siempre que se pueda. Lo poco que viaja como JSON (`jobs.payload`, `jobs.result`, `radar_findings.raw`) se valida con zod en los dos lados a partir de fixtures en `josecoded/contracts/`. `josecoded-omen` copia `database.ts` y `contracts/` con un script (`pnpm contracts:pull`, commit fijado en `contracts.lock`) y su CI falla si difieren. Descartados: paquete npm publicado (versionar y publicar para una persona sola) y submódulo (fricción en cada clon).
- **1.1c Repo web sin workspace.** Al salir Omen del repo solo queda una app: `josecoded` es un único paquete Next (`src/`), sin `apps/*` ni `packages/*`. Se extrae a workspace cuando exista una segunda app. (Deriva de 1.1; sustituye a 1.6.)
- **1.2 Sin gateway.** El servidor de Next (route handlers, Server Actions, cron de Cloudflare) es la capa pública; Omen es la privada.
- **1.3 Next 16 App Router en Cloudflare Workers vía OpenNext.** Dominio, DNS, Turnstile y R2 (si hace falta) en la cuenta Cloudflare.
- **1.4 CSS Modules con tokens.** Cada componente consume solo `var(--token)`; stylelint lo vigila. Sin Tailwind ni shadcn.
- **1.5 `tokens.css` a mano es la fuente** de los tokens; los nombres tipados se generan desde él.
- **1.6 Sustituida por 1.1c.** Los tipos viven en `src/types/` (un fichero por dominio, barrel único) y la configuración de lint en la raíz.
- **1.7 Tests nivel medio:** typecheck + lint + E2E de humo por pantalla + Vitest solo en lógica con comportamiento + axe bloqueante en E2E + tests RLS cuando haya esquema.
- **1.8 CI en cada PR:** lint, typecheck, test, build, E2E, preview en Cloudflare. En `josecoded-omen`: lint, typecheck, test, contrato, imagen Docker.
- **1.9 Código sin comentarios, vigilado por lint** (incluye `eslint-disable` y `@ts-expect-error`). El porqué va al nombre, al commit o a este documento.
- **1.10 Repo como muestra:** Conventional Commits con el área como scope, README con mapa y arranque, decisiones aquí, CI visible. Público tras el lanzamiento y una auditoría de secretos e historial.

## 2. Página

- **2.1 Mapa público:** `/` · `/sobre-mi` (stack como sección `#stack`) · `/proyectos` y `/proyectos/[slug]` · `/servicios` · `/blog` y `/blog/[slug]` · `/contacto` · `/chat` · `/legal/*` · `/lab` reservada.
- **2.2 (Jose, 2026-11-03; sustituye a «packs dentro de `/servicios#packs`») Servicios en tres páginas indexables:** `/servicios` como hub y `/servicios/freelance` y `/servicios/packs` (con comparador) como hijas, cada una con su búsqueda principal, H1, precios «desde» y FAQ (`seo.md`).
- **2.3 Español publicado, inglés preparado:** textos solo en `messages/es.json` (y `en.json` cuando llegue), rutas con segmento de idioma.
- **2.4 Sin redirecciones.** Comprobado el 2026-11-02: nada indexado en `josecoded.com` y el dominio responde 521 (origen caído). Se apunta al nuevo Worker en el primer despliegue.
- **2.5 SEO básico en el lanzamiento** (metadatos, sitemap, robots, Open Graph, JSON-LD `Person`, `llms.txt`); guías y FAQ con schema según crezca el blog; Search Console y Semrush cuando haya qué medir.
- **2.6 Blog y proyectos en el repo** (MDX con frontmatter validado por zod). Publicar es un PR.
- **2.7 Blog sin comentarios en el lanzamiento** (moderación y spam). Se revisa con el blog vivo.
- **2.8 La vía «contratación» publica solo CV y chat;** la disponibilidad (plantilla, remoto, ciudad) la responde el asistente, no la página.
- **2.9 Contacto por email y chat en el lanzamiento;** WhatsApp y Cal.com se añaden cuando Jose dé los datos (`{{DATO}}`), sin cambiar la pantalla.
- **2.10 (Jose) Todo scroll interno se ajusta elemento a elemento:** `data-snap="x"` o `"y"` en el contenedor (utilidad de `base.css`: `scroll-snap-type` mandatory, `scroll-snap-align: start` en los hijos, `scroll-padding` con tokens, `overscroll-behavior` contenido en su eje, suave solo sin reduced motion); el texto con desbordamiento (código, tablas de `Prose`) queda libre.
- **2.11 (Jose) Esta web es el proyecto insignia:** ficha en `/proyectos` y página «Cómo está hecha» con métricas vivas (Lighthouse, peso de JS, accesibilidad, CI). El método con agentes de IA no se cuenta en la web.
- **2.12 (Jose) Máxima visibilidad en IA:** `robots.txt` permite buscadores y rastreadores de entrenamiento de IA, se desactiva el bloqueo de Cloudflare y se cuida todo lo que hace citable la web (entidad única, `llms.txt`, precios y FAQ en HTML) para que recomienden a Jose como freelance y para construir webs y apps.
- **2.13 (Jose) La ciudad se publica:** Madrid, junto a «España y remoto», en Sobre mí y en el JSON-LD `Person`.
- **2.14 (Jose, 2026-11-04) Cinco fases comunes:** Descubrir · Diseñar · Construir · Publicar · Mantener; las usan el hero, «Cómo trabajo» en servicios y el progreso del área (`projects.phase`).
- **2.15 (Jose) Configurador de packs** (web, app o las dos más extras → precio «desde» en vivo), bloque propio.
- **2.16 (Jose) Buscador tipo ⌘K** en la cápsula (páginas, proyectos, posts y servicios); en móvil, icono de lupa. Chat como icono en la cápsula y «Entrar» solo en el pie.
- **2.17 (Jose) Fuera por ahora:** métricas vivas en «Cómo está hecha» (2.11 queda sin ellas hasta nueva decisión) y la sección «Qué haría distinto hoy» en las fichas.
- **2.18 (Jose, 2026-11-04) Cápsula de contacto:** botón de chat visible en la cápsula (icono, abre `ChatPanel` con Nexo) y «Hablemos» abre un **chooser** con dos entradas: WhatsApp y chat con Nexo. WhatsApp solo aparece cuando Jose dé el número (2.9); mientras tanto el chooser se resuelve según Q6 de `division-pantallas.md` (recomendación: tercera entrada «Formulario» → `/contacto` y «Contacto» fuera de la cápsula). Rama `public/header-contact`.
- **2.19 (Jose, 2026-11-04, respuestas a `division-pantallas.md`)** Home como **escaparate** (hero y una línea por contenido con enlace a su casa); **stack** en `/sobre-mi#stack`; blog **por tema**; **FAQ por página** (una por página de servicio y por guía, sin repetir).
- **2.20 (Jose) «Cómo trabajo» en lugar de «Cómo está hecha»:** página propia que cuenta resolución de problemas, última tecnología, diseño y desarrollo, y el aspecto técnico (lo que valoran clientes y recruiters), usando esta web como caso; sustituye a la sección de la ficha de 2.11.
- **2.21 (Jose) `/contacto` reúne todas las vías:** chat con Nexo, WhatsApp, formulario interno (cada envío aparece en «Interesados» en admin y en closers) y las que se añadan; «Hablemos» ofrece WhatsApp · Nexo · Formulario y «Contacto» sale del menú de la cápsula.
- **2.22 ABIERTA (idea de Jose): bandeja compartida tipo WhatsApp/Telegram.** El usuario habla con «una persona» y responden Jose o cualquier closer desde un canal común. Se estudia cuando se diseñe el chat humano (handoff de 5.2).

## 3. Roles y zonas

- **3.1 Un `role` por usuario:** `admin` · `closer` · `freelance` · `client`. Subcloser = `closer` con `parent_closer_id` (un nivel).
- **3.2 Una app con grupos de rutas:** `/admin`, `/crm`, `/freelance`, `/area`. Guardia por rol en el layout; 404 si no tienes la zona.
- **3.3 Sin contraseña:** OTP por email para todos, Google opcional, TOTP obligatorio para admin, closers y freelance (sin `aal2` no se entra en sus zonas).
- **3.4 Solo por invitación del admin.** Nadie se registra solo.
- **3.5 Rol en `profiles.role`** con helper `private.role()` en RLS.

## 4. Omen y Supabase

- **4.1 Reparto:** Supabase = base de datos, auth, storage, realtime, pgvector. Omen = IA, RAG, Radar, trabajos privados, GPU.
- **4.2 Omen solo sale, nunca recibe.** Se conecta a Supabase con la clave de servicio, escucha Realtime y la cola `private.jobs`, y escribe resultados. Sin puerto abierto ni túnel.
- **4.3 Si Omen está apagado:** latido en Supabase, semáforo en `/admin`, el chat guarda el mensaje y avisa; trabajos y Radar esperan. Sin IA de reserva en la nube. Lo que debe funcionar siempre (email, Telegram, notificaciones) lo hace el servidor de Next, no Omen (ver datos.md, `private.outbox`).
- **4.4 Omen limpio:** `josecoded-omen` nuevo (Node + Docker Compose). n8n y el resto de servicios de Omen no se tocan. Despliegue: la CI publica la imagen y Omen la recoge (coherente con 4.2); cada despliegue con OK de Jose.
- **4.5 (Jose) Modelo local + RAG propio + Groq, reparto cerrado:** Groq para el chat público (latencia baja, el visitante no espera) con el modelo local como reserva si Groq falla; modelo local para Radar, embeddings, indexado del RAG y borradores (volumen, sin prisa, sin coste). Contrapartida de Groq: los mensajes de visitantes salen a un tercero (se recoge en la política de privacidad). `chat_messages.model` registra qué proveedor respondió.
- **4.6 Vectores del RAG en pgvector de Supabase** (esquema `private`, tablas `rag_documents` y `rag_chunks`): Omen no guarda estado y la copia de seguridad va con la base de datos.

## 5. Chat

- **5.1 Chat público anónimo:** identificador en cookie firmada, Turnstile en el primer mensaje, cuota por IP y día; hilos purgados a los 90 días.
- **5.2 IA primero en lo público; en hilos de clientes, closers y freelance solo si Jose la activa en ese hilo.** Interruptor por hilo.
- **5.3 Firma «Asistente de Jose»** con etiqueta visible; «Jose» cuando interviene él.
- **5.4 Supabase Realtime** sobre `chat_messages` filtrado por RLS.
- **5.5 Panel lateral en toda la web** abierto desde la barra; `/chat` a pantalla completa y para usuarios con cuenta.
- **5.6 Un hilo por usuario con cuenta** (`unique(user_id) where kind = 'user'`), no por proyecto; desde el área, el mensaje enlaza al proyecto.
- **5.7 (Jose) El asistente habla primero:** al nuevo visitante le saluda «Hola, soy {{DATO: nombre del asistente}}, el asistente IA virtual de josecoded» con una pregunta proactiva; detecta si hay interés, pide email o teléfono con consentimiento y lo guarda como lead (interesado sí/no). Sustituye la firma de 5.3 cuando haya nombre.
- **5.9 (Jose, 2026-11-04) El asistente se llama Nexo.** Cierra el `{{DATO}}` de 5.7: el saludo es «Hola, soy Nexo, el asistente IA de josecoded»; la etiqueta de burbuja «Nexo» (y «Jose» cuando interviene él). Jose aportó una referencia de imagen; el avatar es SVG con motion propio (5.8, rama `chat/nexo-avatar`) y sus **estados los mueve la conversación**, no un temporizador: `idle` (saluda y espera), `listening` (el visitante escribe), `thinking` (hay un trabajo `chat.reply` encolado o en curso), `speaking` (está llegando la respuesta), `handoff` (Jose ha entrado en el hilo), `offline` (Omen sin latido), `quota` (cuota agotada). Con `prefers-reduced-motion`, cada estado es un fotograma fijo.
- **5.10 (Jose, 2026-11-04) Chat de visitantes anónimos.** La conversación se identifica con una **cookie propia `httpOnly`** (`Secure`, `SameSite=Lax`) que lleva un identificador aleatorio de visitante; no es una cookie firmada con datos, solo un token opaco, y en la base se guarda su hash. **Sin datos personales hasta el consentimiento**: el visitante no da email ni teléfono salvo por `HandoffCard` con botón explícito (5.7); nunca se extraen del texto. Ni cookie ni fila existen hasta el primer mensaje del visitante (el saludo de Nexo se pinta desde `messages/es.json`). `anon` no tiene grants: el visitante lee y escribe solo a través de rutas de servidor de Next que usan la clave de servicio y resuelven la conversación desde la cookie; el cliente nunca envía un identificador de conversación. **Purga:** las conversaciones sin interacción se borran a un **TTL desde el último mensaje** (`last_activity_at`) con un trabajo programado de Supabase (`pg_cron`, diario); propuesta **30 días** (Q8 de `division-pantallas.md`); las conversaciones convertidas en lead quedan exentas de ese TTL y siguen la retención de 5.1 (90 días), y el contacto se conserva aparte en el CRM con un resumen en `activities`. Límite de peticiones por IP y por visitante, Turnstile en el primer mensaje. Detalle del esquema en `datos.md` §10 (propuesta). Sustituye el «identificador en cookie firmada» de 5.1 y las RPC `public_chat_send`/`public_chat_thread` de `datos.md` §4.
- **5.11 (Jose) Plazos de borrado del chat:** 7 días si el visitante no llega a responder; 60 días si dejó contacto; 90 días desde su última respuesta si es cliente. El lead en el CRM no se borra con la conversación.

## 6. Área de clientes

- **6.1 Tablero de tareas por fases** con porcentaje calculado. Feed de commits en un bloque posterior.
- **6.2 Supabase Storage,** bucket privado, URL firmadas, límites de tamaño y tipo.
- **6.3 Historias de usuario** con «Como… quiero… para…» y criterios; estados `propuesta → aceptada | rechazada → en tareas`; decide el admin.
- **6.4 Notificaciones:** campana en la app + email transaccional al cliente (Resend) + Telegram a Jose.
- **6.5 Varios proyectos por cliente** (`projects.client_id`); el selector solo aparece si tiene más de uno.
- **6.6 Documentos:** 25 MB por fichero, 1 GB por proyecto, tipos cerrados (PDF, imágenes, vídeo corto, zip, Office).
- **6.7 El freelance ve brief, tareas, documentos `team` y el nombre del proyecto;** nunca cliente, contacto ni importes (vista `freelance_projects`).
- **6.8 (Jose) Historias fuera de presupuesto:** una historia que cae fuera del pack o del alcance contratado (p. ej. una revisión extra) queda «en revisión» con un aviso de que está fuera del presupuesto; el cliente confirma si quiere seguir y entonces se presupuesta. Lo que está dentro pasa directo a tareas.
- **6.9 (Jose) Los documentos que Jose pide al cliente son tareas suyas** en el área, sin sección aparte.

## 7. CRM

- **7.1 Entidades:** `contacts` · `deals` · `activities` · `commissions`. Organización como campo del contacto.
- **7.2 Pipeline fijo:** `new → contacted → meeting → proposal → won | lost`.
- **7.3 Visibilidad por RLS:** el subcloser ve su cartera; su closer, la suya y las de sus subclosers; el admin, todo. Reasignar es acción explícita del admin.
- **7.4 Comisiones con dos tasas fijadas al invitar** y los importes congelados en campos separados (`closer_amount`, `subcloser_amount`); estados `pending → approved → paid | rejected`; el pago se registra, no se ejecuta.
- **7.5 Importación CSV con plantilla fija,** duplicados a una cola que resuelve el admin. Bloque posterior al CRM básico.
- **7.6 Las dos tasas se aplican sobre el importe cobrado** (closer 10 % + subcloser 5 % = 15 % del total, por ejemplo), no una sobre la otra; se fijan al invitar y se congelan por fila de `commissions` (`closer_rate`, `closer_amount`, `subcloser_rate`, `subcloser_amount`).
- **7.7 La comisión se crea al marcar la oportunidad «ganada»** (RPC `win_deal` con el importe cobrado, estado `pending`); el admin la aprueba cuando ha cobrado y registra el pago después.

## 8. Admin

- **8.1 El admin controla:** usuarios y roles, precios y packs, interruptores de secciones, Radar, estado de Omen, notificaciones. Los textos siguen en el repo.
- **8.2 Precios en Supabase,** editados en el admin, leídos en servidor con caché, con historial.
- **8.3 (Jose) Radar detecta** ofertas de empleo, negocios sin web o app y proyectos freelance, y «opera por mí» en su versión segura: **Radar encuentra, puntúa y redacta; Jose envía con un clic** desde `/admin/radar`. Envío sin salir de ahí solo donde haya API oficial autorizada (Upwork con partner API, Freelancer.com); en el resto, «Copiar» y «Marcar enviado». **Nunca sesiones de navegador automatizadas ni envío sin revisión**: las condiciones de Upwork, Freelancer, Malt y LinkedIn prohíben la automatización de cuentas y una propuesta enviada sola compromete el nombre de Jose. Misma regla que el chat de clientes: borrador automático, acción humana.
- **8.4 Reglas de notificación fijas en código** con pocos interruptores en el admin.
- **8.5 (Jose) Atajos de teclado en Radar:** se deciden al construir Radar.

## 9. Seguridad, accesibilidad, rendimiento, responsive

- **9.1 Lista base de seguridad + ZAP baseline contra la preview en CI.** La lista: RLS en toda tabla por operación; `anon` sin permisos salvo lo público explícito; clave de servicio solo en servidor y Omen; RPC `security definer` con `search_path` vacío; CSP estricta con nonce, HSTS, `frame-ancestors 'none'`; Turnstile y límite de peticiones en todo formulario público; TOTP para el personal; URL firmadas; zod en toda frontera; sin datos personales en logs; `pnpm audit` y escaneo de secretos en CI; advisors de Supabase a cero.
- **9.2 WCAG 2.2 AA** + lector de pantalla por pantalla.
- **9.3 Presupuestos:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JS de la home ≤ 150 KB gz, Lighthouse ≥ 95 en CI.
- **9.4 Hero animado en CSS + SVG/Canvas ligero,** sin librería 3D; vídeo de reserva en móvil y con `reduced-motion`.
- **9.5 Mobile-first,** dos breakpoints en `rem` + container queries; Baseline 2024 con `@supports`.

## 10. Método

- **10.1 (Jose) Ramas cortas, legibles y coherentes, en los dos repos.** Convención `<area>/<tema>`: área de una lista fija, tema en kebab-case de 1 a 3 palabras, sin números ni fechas. Áreas: `public` · `auth` · `admin` · `crm` · `area` · `freelance` · `chat` · `radar` · `lab` · `ai` · `data` · `infra` · `docs` · `fix`. Ejemplos: `public/home-hero`, `crm/contacts-list`, `data/commissions`, `ai/rag-index`, `fix/otp-expiry`. El scope del commit es el área. `main` protegida, PR por bloque, squash, producción desde `main` con OK de Jose. `develop` y las ramas `chore/*`, `design/*`, `docs/*`, `claude/*` del remoto se borran (las `archivo/*` se quedan).
- **10.2 Un bloque = una pantalla con sus componentes o una función completa;** ≤ ~400 líneas de diff, ≤ 1 h de agente. Si no cabe, se parte antes de empezar.
- **10.3 `revisor` en cada bloque; `/puerta-calidad` una vez por pantalla antes del merge;** Jose aprueba en la preview.
- **10.4 Jose aprueba:** decisiones de arquitectura, cada pantalla en el navegador antes de implementarla, cada PR en la preview, cada despliegue y migración en producción.
- **10.5 Tablón en GitHub Issues + Projects,** una issue por bloque enlazada a su PR; `ESTADO.md` es la vista resumida.
- **10.6 Orden por zonas:** público (home → servicios → proyectos → sobre mí → contacto → chat → blog → legales y errores) → auth y admin base → CRM → área de clientes → freelance → Radar → lab.
- **10.7 Dos proyectos de Supabase. ABIERTA (acción de Jose): crear `josecoded-dev`** (gratuito, misma región) en su cuenta para previews y sesiones en la nube; producción sigue en `echlwywbucgbhwpncviy`; local con Docker en el Mac. La CI aplica las mismas migraciones a los dos.
- **10.8 ABIERTA (acción de Jose): crear el repo `josecoded-omen`** en GitHub (privado, `main` protegida). Hasta entonces su backlog (`docs/plan/bloques.md`, lista O) no arranca.
- **10.9 (Jose): navegación cápsula.** Barra que se condensa en cápsula al bajar; el progreso del scroll es su borde coral (0 % sin borde, 100 % completo). Sin eyebrows encima de los textos. Scroll por bloques en escritorio y nativo en móvil.
- **10.10 (en el navegador): hero animado y scroll.** Jose revisa en `prototipos/estilo-b/` la transformación del hero (wireframe → app → datos → IA), los estados (Cargando, Error, 404, Deshabilitado) y la barra de scroll, y dice qué cambia antes de portarlo (`public/home-hero-*`). **Cerrada (Jose, 2026-11-04):** aprobada la **variante B «Móvil + web»** del hero, cuya transformación recorre las cinco fases de 2.14 (Descubrir · Diseñar · Construir · Publicar · Mantener). Se porta tal cual en W14–W16 (`public/home-hero`).

## Abiertas (resumen)

| Id | Qué falta | Quién |
|---|---|---|
| 10.7 | Crear el proyecto Supabase `josecoded-dev` y pegar URL y clave publicable en los secretos de CI | Jose (acción) |
| 10.8 | Crear el repo GitHub `josecoded-omen` | Jose (acción) |
| Q1–Q8 | Reparto de pantallas (`division-pantallas.md` §4): home, stack, «Cómo está hecha», categorías del blog, contacto, chooser, FAQ, TTL del chat | Jose (batería) |
