# Batería de preguntas: arquitectura del repositorio y de la página

**2026-11-02 · `arquitecto` · para que decida Jose.** Entrada: `docs/brief.md` (estilo B ya decidido). Cada pregunta trae opciones cerradas, una recomendación y su contrapartida en una línea. Lo que Jose responda se cierra en `docs/arquitectura/decisiones.md` y pasa al tablón. Las lecciones de la v1 (rama `archivo/v1-2026-11-02`) se usan para recomendar, no se copian: la v1 murió por alcance y reglas acumuladas, no por el stack.

Formato: **Reco** = opción recomendada. Las preguntas marcadas `(técnica)` las puede dejar en la recomendación si no tiene preferencia.

---

## 1. Repositorio

### 1.1 Monorepo o repos separados
- A) Monorepo pnpm: `apps/web` (Next), `apps/omen` (backend Node que corre en Omen), `packages/*`.
- B) Monorepo solo con `apps/web` + `packages/*`; Omen en su repo actual `josecoded-worker`.
- C) Un solo paquete sin workspace (todo dentro de la web).
- **Reco: A.** Contratos y tipos compartidos en un sitio y un único repo como muestra de trabajo full stack; contrapartida: el despliegue a Omen sale del mismo repo (imagen Docker por app).

### 1.2 Gateway intermedio (Cloudflare Worker aparte, como `apps/api` en v1)
- A) Sin gateway: el servidor de Next (route handlers + Server Actions) es la capa pública; Omen es la privada.
- B) Gateway propio en Cloudflare entre web, Supabase y Omen.
- **Reco: A.** Una pieza menos que mantener y desplegar; contrapartida: la lógica de servidor vive dentro de la app web (se aísla en `apps/web/server/`).

### 1.3 Framework y hosting de la web
- A) Next 16 App Router en Cloudflare Workers vía OpenNext (dominio y cuenta ya en Cloudflare).
- B) Next en Vercel (cero fricción con Next; dominio apuntando a Vercel).
- C) Astro para lo público + Next para las zonas privadas.
- **Reco: A.** Todo en Cloudflare (DNS, Workers, Turnstile, R2 si hace falta) y ya se probó en la v1; contrapartida: OpenNext va un paso por detrás de Next (sin middleware Node, alguna feature tarda).

### 1.4 Estilos
- A) CSS Modules por componente que consumen solo tokens (`var(--token)`); stylelint lo vigila.
- B) Tailwind v4 con tokens como `@theme`.
- C) CSS-in-TS tipado (vanilla-extract / Panda).
- **Reco: A.** Sin runtime, sin clases en el JSX, legible como muestra; contrapartida: más ficheros y más líneas que Tailwind.

### 1.5 Fuente de los tokens `(técnica)`
- A) `tokens.css` escrito a mano es la fuente; los nombres tipados se generan desde él.
- B) `design.json` genera `tokens.css` (como en la v1).
- **Reco: A.** Un fichero, sin paso de build; contrapartida: no hay JSON para herramientas de diseño.

### 1.6 Paquetes compartidos
- A) Desde el día 1 solo `packages/types` (zod + tipos) y `packages/config` (eslint, tsconfig, stylelint). Componentes dentro de `apps/web`.
- B) Además `packages/ui` con los componentes.
- **Reco: A.** Solo hay una app con interfaz; `packages/ui` se extrae cuando exista una segunda; contrapartida: si aparece la segunda, hay que mover ficheros.

### 1.7 Nivel de tests
- A) Mínimo: typecheck + lint + E2E de humo por pantalla.
- B) Medio: A + unit (Vitest) solo en lógica con comportamiento + axe bloqueante en E2E + tests RLS cuando haya esquema.
- C) Completo: B + regresión visual por capturas + tests de contrato web↔Omen.
- **Reco: B.** Cubre lo que rompe sin testear componentes sin lógica; contrapartida: un cambio visual se detecta en preview, no en CI.

### 1.8 CI y previews
- A) GitHub Actions en cada PR: lint, typecheck, test, build + preview en Cloudflare por PR; E2E en el PR.
- B) Lo mismo sin E2E en CI (E2E solo en local).
- C) Sin CI; todo en local.
- **Reco: A.** La preview es donde Jose aprueba; contrapartida: cada PR tarda unos minutos más.

### 1.9 Código sin comentarios: cómo se mantiene legible
- A) Regla de lint que falla con cualquier comentario (incluidos `eslint-disable` y `@ts-expect-error`); nombres completos, funciones cortas, un módulo por concepto, `README.md` por app y paquete, decisiones en `docs/arquitectura/decisiones.md`, el «por qué» en el mensaje de commit.
- B) Igual, pero permitiendo JSDoc en la API pública de `packages/*`.
- C) Solo convención, sin regla de lint.
- **Reco: A.** Si la regla no lo vigila, los comentarios vuelven; contrapartida: cuando algo necesita explicación hay que extraerla a un nombre o a un documento.

### 1.10 Listón de «repositorio como muestra»
- A) Conventional Commits, README raíz con el mapa del repo y cómo arrancar, ADR cortos en `docs/arquitectura/decisiones.md`, CI en verde visible, sin ficheros muertos.
- B) A + repo público desde el principio.
- C) A + público solo tras el lanzamiento y una auditoría de secretos y de historial.
- **Reco: C.** Público es la muestra real; contrapartida: hasta entonces solo se enseña por invitación.

---

## 2. Página: secciones, rutas, idiomas, SEO

### 2.1 Mapa público
- A) `/` · `/sobre-mi` (con el stack como sección) · `/proyectos` y `/proyectos/[slug]` · `/servicios` (tres vías: contratación, freelance, packs) · `/blog` y `/blog/[slug]` · `/contacto` · `/chat` · legales · `/lab` reservada.
- B) Igual pero `/stack` como página propia.
- C) Home larga con anclas + `/proyectos` + `/servicios` + `/blog` (menos páginas).
- **Reco: A.** Una página por intención de búsqueda, sin páginas de relleno; contrapartida: el stack no tiene URL propia (se enlaza como `/sobre-mi#stack`).

### 2.2 Packs
- A) Dentro de `/servicios` (ancla `#packs`), con comparador.
- B) Página propia `/packs` enlazada desde `/servicios`.
- **Reco: A.** Una sola página de oferta, un solo embudo; contrapartida: página larga y menos foco SEO en «packs».

### 2.3 Idiomas
- A) Solo español.
- B) Español e inglés desde el lanzamiento (`/en/...`).
- C) Español publicado; inglés preparado (todos los textos en `messages/es.json`, rutas con segmento de idioma) y se publica cuando el contenido esté estable.
- **Reco: C.** La v1 dobló el trabajo de contenido con el inglés antes de tener el español; contrapartida: el inglés llega más tarde.

### 2.4 Redirecciones
- A) No hay URLs antiguas indexadas: sin redirecciones.
- B) Hay URLs antiguas (josedev u otras): Jose pasa la lista y van como 301 en `next.config`.
- **Reco: depende de si hoy hay algo indexado en `josecoded.com`.** Si no, A.

### 2.5 Nivel SEO/GEO en el lanzamiento
- A) Básico: metadatos, `sitemap`, `robots`, Open Graph, JSON-LD `Person`/`Organization`, `llms.txt`.
- B) A + blog con guías largas, FAQ con schema, párrafos citables por página.
- C) B + Search Console, IndexNow y seguimiento con Semrush.
- **Reco: A en el lanzamiento, B progresivo con el blog, C cuando haya contenido que medir.** Contrapartida: el posicionamiento tarda meses.

### 2.6 Dónde vive el contenido del blog y de los proyectos
- A) En el repo (MDX + frontmatter validado con zod); se publica con un PR.
- B) En Supabase, editado desde el admin.
- C) Repo + overrides desde el admin (la v1 lo hizo y fue lo más caro).
- **Reco: A.** Es contenido técnico que Jose escribe con el editor; contrapartida: publicar exige un commit.

---

## 3. Roles y zonas

### 3.1 Modelo de roles
- A) Un `role` por usuario: `admin` · `closer` · `freelance` · `client`. Subcloser = `closer` con `parent_closer_id`.
- B) `subcloser` como rol aparte.
- **Reco: A.** Un closer puede tener closers a su cargo sin cambiar permisos; contrapartida: la jerarquía es de un nivel (closer → subcloser), no de N.

### 3.2 Una app o subdominios
- A) Una app, grupos de rutas: `/admin`, `/crm` (closers), `/freelance`, `/area` (clientes); guardia por rol en el layout; 404 si no tienes la zona.
- B) Público en `josecoded.com` y todo lo privado en `app.josecoded.com` (misma base de código, dos despliegues).
- C) Una app por rol.
- **Reco: A.** Un despliegue, un diseño, un login; contrapartida: cookies y CSP compartidas entre lo público y lo privado (se mitiga con rutas y cabeceras).

### 3.3 Métodos de acceso
- A) Sin contraseña: código por email (OTP) para todos; Google opcional; TOTP obligatorio para admin, closers y freelance.
- B) Contraseña + OTP por email; TOTP para el personal.
- C) Solo OAuth (Google / GitHub).
- **Reco: A.** No hay contraseñas que filtrar; contrapartida: dependemos de que el correo llegue.

### 3.4 Quién crea cuentas
- A) Solo por invitación del admin (closers, freelance, clientes); nadie se registra solo.
- B) Los clientes pueden registrarse solos y el admin los asocia a un proyecto.
- **Reco: A.** Cero cuentas basura y cada cuenta nace ya con su rol; contrapartida: cada cliente pasa por Jose.

### 3.5 Dónde se guarda el rol `(técnica)`
- A) Tabla `profiles.role` y helper `private.role()` en RLS.
- B) Claim en el JWT con hook de Supabase Auth.
- **Reco: A.** Cambiar el rol tiene efecto inmediato y se prueba en local; contrapartida: una lectura indexada por consulta.

---

## 4. Omen y Supabase

### 4.1 Reparto
- A) Supabase: base de datos, auth, storage (documentos de clientes), realtime (chat). Omen: IA del chat, Radar, trabajos privados y lo que necesite GPU o datos locales.
- B) Supabase solo DB + auth; ficheros y realtime en Omen.
- C) Omen como único backend; Supabase solo como Postgres.
- **Reco: A.** Lo que debe estar siempre disponible va en un servicio gestionado; contrapartida: dos proveedores con sus límites.

### 4.2 Cómo llega la web a Omen
- A) Omen solo sale, nunca recibe: se conecta a Supabase con la clave de servicio, escucha Realtime y una cola de trabajos (`jobs`), y escribe las respuestas. Sin puerto abierto ni túnel.
- B) Túnel de Cloudflare (`omen.josecoded.com`) con token de servicio de Cloudflare Access; solo el servidor de Next lo llama (nunca el navegador).
- C) Las dos: A para trabajos y Radar, B para el chat cuando haga falta respuesta inmediata.
- **Reco: A.** Superficie de ataque cero en casa y el chat funciona igual (Omen responde en ~1 s por Realtime); contrapartida: todo lo que Omen hace tiene que modelarse como datos en Supabase y no hay streaming de tokens (se escribe la respuesta entera o por trozos en la fila).

### 4.3 Qué pasa si Omen está apagado
- A) Latido (`heartbeat`) en Supabase; el admin ve un semáforo; el chat guarda el mensaje y avisa «Jose te responde en cuanto pueda»; Radar y trabajos esperan.
- B) A + IA de reserva en la nube (Workers AI o API) desde Next.
- **Reco: A.** Honesto y sin coste; contrapartida: sin IA mientras Omen duerme.

### 4.4 Limpieza de Omen
- A) `apps/omen` nuevo (Node + Docker Compose) sustituye a `josecoded-worker`; n8n y el resto de servicios de Omen no se tocan.
- B) Se extiende `josecoded-worker` tal cual.
- **Reco: A.** Mismo criterio que el resto del reinicio; contrapartida: hay que rehacer los módulos `ai`, `storage` y `system` que valgan.

### 4.5 Modelo de IA
- A) Modelo local en Omen (Ollama o similar), sin coste por uso.
- B) API externa (Anthropic/OpenAI) llamada desde Omen con el contexto de Jose; Omen orquesta.
- C) Local por defecto y API para lo que el local no resuelva.
- **Reco: Jose lo decide según lo que tenga en Omen; si hay duda, B** por calidad de respuesta con un coste pequeño. Contrapartida: datos de visitantes salen a un tercero (se recoge en privacidad).

---

## 5. Chat

### 5.1 Chat público en la home
- A) Anónimo: identificador en cookie firmada, Turnstile en el primer mensaje, cuota por IP y día; sin cuenta.
- B) Pide email antes de hablar.
- C) Requiere cuenta.
- **Reco: A.** Sin fricción para quien llega; contrapartida: hilos anónimos que se purgan a los 90 días.

### 5.2 Cómo responde la IA
- A) Responde siempre primero y Jose puede intervenir en cualquier hilo (interruptor de IA por hilo); en los hilos de clientes, closers y freelance la IA solo responde si Jose activa esa opción en ese hilo.
- B) La IA responde en todos los hilos por defecto; Jose desactiva donde quiera.
- C) La IA redacta borradores y Jose los envía.
- **Reco: A.** Automática donde el riesgo es bajo (público) y bajo control donde hay un proyecto en juego; contrapartida: Jose contesta a mano a sus clientes salvo que active la IA.

### 5.3 Quién firma la respuesta
- A) «Asistente de Jose», con etiqueta visible, y «Jose» cuando interviene él.
- B) Todo como «Jose».
- **Reco: A.** Confianza y legalidad (IA identificada); contrapartida: menos sensación de atención personal.

### 5.4 Tecnología en tiempo real `(técnica)`
- A) Supabase Realtime (cambios en `chat_messages` filtrados por RLS).
- B) Sondeo cada pocos segundos.
- C) WebSocket propio en Omen.
- **Reco: A.** Ya está pagado y respeta los permisos; contrapartida: depende de la cuota de conexiones del plan.

### 5.5 Dónde está el chat
- A) Panel lateral abierto desde la barra de navegación en toda la web + bloque en la home que lo abre; `/chat` es la versión a pantalla completa y la de los usuarios con cuenta.
- B) Solo un bloque en la home.
- C) Solo `/chat`.
- **Reco: A.** Está a un clic desde cualquier página; contrapartida: un componente más en el layout público (se carga solo al abrir).

---

## 6. Área de clientes

### 6.1 «Ver el desarrollo en tiempo real»
- A) Tablero de tareas por fases que Jose actualiza + porcentaje de avance calculado desde las tareas.
- B) A + feed de commits y despliegues del proyecto vía webhook de GitHub.
- C) B + enlace a la preview del proyecto en curso.
- **Reco: A primero, B como bloque posterior.** Lo que el cliente entiende es «qué está hecho y qué falta»; contrapartida: el feed de commits llega después.

### 6.2 Documentos y archivos
- A) Supabase Storage, bucket privado por cliente, subida y descarga con URL firmada, límite de tamaño y tipos.
- B) En Omen.
- **Reco: A.** Disponible aunque Omen esté apagado; contrapartida: cuota de Storage del plan.

### 6.3 Historias de usuario
- A) Formulario «Como… quiero… para…» + criterios de aceptación; estados `propuesta → aceptada | rechazada → en tareas`; Jose decide desde el CRM/admin.
- B) Petición en texto libre.
- **Reco: A.** Da estructura al cliente y a Jose; contrapartida: más campos que rellenar.

### 6.4 Notificaciones
- A) En la app (campana) + email transaccional al cliente (Resend) + Telegram a Jose.
- B) Solo en la app.
- **Reco: A.** El cliente no entra cada día; contrapartida: un proveedor de email más.

---

## 7. CRM de closers

### 7.1 Entidades
- A) `contacts` · `deals` (oportunidad con pipeline, pack/servicio, importe) · `activities` (notas, llamadas, reuniones, cambios de estado) · `commissions`. Organización como campo del contacto.
- B) Solo `contacts` con estado (sin oportunidades).
- C) A + `organizations` como tabla.
- **Reco: A.** Lo que un closer necesita y nada más; contrapartida: si una empresa tiene varios contactos, se repite el nombre.

### 7.2 Pipeline
- A) Fases fijas: `nuevo → contactado → reunión → propuesta → ganado | perdido`.
- B) Fases configurables desde el admin.
- **Reco: A.** Se razona y se reporta igual para todos; contrapartida: cambiar una fase es una migración.

### 7.3 Subclosers y visibilidad
- A) El subcloser ve su cartera; su closer ve la suya y las de sus subclosers; el admin, todo. RLS lo garantiza.
- B) Todos los closers ven todo.
- **Reco: A.** Es lo que pidió Jose; contrapartida: reasignar un contacto es una acción explícita del admin.

### 7.4 Comisiones
- A) Dos tasas por usuario fijadas al invitar (`closer_rate`, y si tiene padre, `parent_rate`); al ganar una oportunidad se crea la comisión con los importes en campos separados (`closer_amount`, `subcloser_amount`) congelados; estados `pendiente → aprobada → pagada | rechazada`; el pago se registra, no se ejecuta.
- B) Una sola tasa y el reparto se calcula al pagar.
- **Reco: A.** Campos separados como pidió Jose y sin sorpresas si cambia una tasa; contrapartida: cambiar una tasa no afecta a lo ya creado (es lo deseado).

### 7.5 Importación de contactos
- A) Plantilla CSV fija (columnas dadas) sin mapeo; duplicados por email van a una cola que resuelve el admin.
- B) Importador con mapeo de columnas.
- C) Sin importación: alta manual.
- **Reco: A, en un bloque posterior al CRM básico.** Cubre el 90 % con poco código; contrapartida: el closer adapta su CSV a la plantilla.

---

## 8. Admin

### 8.1 Qué controla el admin
- A) Usuarios y roles (invitar, desactivar, reasignar cartera, tasas) · packs y precios (tabla en Supabase que lee la web pública) · interruptores de secciones (blog, lab, chat, precios visibles) · Radar · estado de Omen · notificaciones.
- B) A + edición de textos de la web.
- C) Solo usuarios y precios.
- **Reco: A.** Los textos viven en el repo (2.6); contrapartida: cambiar un texto es un PR.

### 8.2 Precios y packs
- A) En Supabase, editados en el admin; la web los lee en servidor con caché; historial de cambios.
- B) En el repo (`pricing.json`).
- **Reco: A.** Cambiar un precio no debería exigir un despliegue; contrapartida: la página de servicios depende de una consulta (cacheada).

### 8.3 Radar: qué detecta
- A) Ofertas de empleo que encajan con Jose (como en la v1) → contactos `recruiter`.
- B) Empresas o negocios que podrían necesitar web/app → leads para closers.
- C) Las dos, en fases.
- **Reco: Jose define el alcance; en esta fase solo se reserva su lugar** (tablas `radar_*`, pantalla `/admin/radar` con estado). Contrapartida: Radar es un proyecto en sí mismo.

### 8.4 Reglas de notificación
- A) Fijas en código con pocos interruptores en el admin (qué le llega a Jose por Telegram).
- B) Matriz evento × destinatario × canal configurable (la v1 la diseñó y nunca se construyó).
- **Reco: A.** Diez líneas en vez de una pantalla; contrapartida: cambiar una regla es un commit.

---

## 9. Seguridad, accesibilidad, rendimiento, responsive

### 9.1 Innegociables de seguridad
- A) Lista base: RLS en toda tabla con políticas por operación; `anon` sin permisos salvo lo público explícito; clave de servicio solo en servidor y Omen; RPC `security definer` con `search_path` vacío; CSP estricta con nonce, HSTS, `frame-ancestors 'none'`; Turnstile y límite de peticiones en todo formulario público; TOTP para el personal; URLs firmadas para ficheros; validación zod en toda frontera; sin datos personales en logs; `pnpm audit` y escaneo de secretos en CI; advisors de Supabase a cero.
- B) A + ZAP baseline contra la preview en CI.
- C) B + pentest externo antes del lanzamiento.
- **Reco: B.** Automático y barato; contrapartida: ZAP da falsos positivos que hay que triar.

### 9.2 Accesibilidad
- A) WCAG 2.2 AA: teclado completo, foco visible, contraste, `prefers-reduced-motion` sin animaciones, axe bloqueante en E2E.
- B) A + revisión con lector de pantalla por pantalla.
- **Reco: B.** El axe no ve el orden de lectura; contrapartida: media hora más por pantalla.

### 9.3 Presupuestos de rendimiento
- A) Móvil: LCP < 2,5 s, INP < 200 ms, CLS < 0,1; JS de la home ≤ 150 KB gz; Lighthouse ≥ 95 en CI sobre la preview.
- B) Más laxo (JS ≤ 300 KB, sin Lighthouse en CI).
- **Reco: A.** Es la primera impresión de un cliente; contrapartida: condiciona cómo se hace el hero animado (9.4).

### 9.4 Hero animado («la app transformándose»)
- A) CSS + SVG/Canvas ligero, sin librería 3D; vídeo de reserva en móvil y con `reduced-motion`.
- B) Escena WebGL en vivo (la de glifos del archivo, three.js).
- C) Vídeo renderizado desde la escena de glifos + póster (como en la v1).
- **Reco: A.** Cumple el presupuesto y se ve nítido en cualquier pantalla; contrapartida: lo diseña `ui` desde cero en la fase de pantallas.

### 9.5 Responsive
- A) Mobile-first, dos breakpoints globales en `rem` + container queries por componente; unidades relativas; Baseline 2024 con `@supports`.
- B) Tres o cuatro breakpoints clásicos sin container queries.
- **Reco: A.** Los componentes se adaptan a donde se colocan, no a la ventana; contrapartida: exige Baseline 2024 (ya decidido).

---

## 10. Método de trabajo

### 10.1 Ramas
- A) `main` protegida; una rama por bloque; PR con preview; squash; producción se despliega desde `main` con OK de Jose. Se elimina `develop`.
- B) `main` + `develop` como integración, releases a `main`.
- C) Commits directos a `main`.
- **Reco: A.** Una sola línea, cada PR se ve en preview; contrapartida: lo que entra en `main` debe estar listo para producción.

### 10.2 Tamaño de un bloque
- A) Un bloque = una pantalla con sus componentes, o una función de principio a fin; ≤ ~400 líneas de diff, ≤ 1 h de agente; si no cabe, se parte antes de empezar.
- B) Bloques mayores (una zona entera).
- **Reco: A.** Es lo que pidió Jose y lo que la v1 no hizo; contrapartida: más PRs.

### 10.3 Puertas de revisión
- A) `revisor` en cada bloque; `/puerta-calidad` una vez por pantalla antes de merge; Jose aprueba en la preview.
- B) Solo `/puerta-calidad` por rama.
- C) Solo `revisor`.
- **Reco: A.** Lo caro (cinco revisores) una vez por pantalla, lo barato en cada bloque; contrapartida: una pantalla de tres bloques pasa tres revisiones y una puerta.

### 10.4 Qué aprueba Jose y cuándo
- A) Decisiones de arquitectura (esta batería) · cada pantalla en el navegador (prototipo HTML) antes de implementarla · cada PR en la preview antes del merge · cada despliegue y migración en producción.
- B) Solo producción.
- **Reco: A.** Decidir viendo, no leyendo; contrapartida: Jose está en el circuito varias veces por pantalla.

### 10.5 Tablón
- A) El tablón artefacto existente (`claude.ai/artifact/VQd4B9VtsaxjY5hoKcNk9D`) reflejado en `ESTADO.md`.
- B) GitHub Issues + Projects (una issue por bloque enlazada a su PR).
- C) `docs/tablon.md` en el repo.
- **Reco: B.** Bloque, PR y preview quedan enlazados y visibles en el repo público; contrapartida: el tablón artefacto queda como vista, no como fuente.

### 10.6 Orden de construcción por zonas
- A) Público (home → servicios → proyectos → sobre mí → contacto → chat → blog → legales y errores) → auth y admin base → CRM → área de clientes → freelance → Radar → lab.
- B) Auth y admin primero, público después.
- C) Público y CRM en paralelo.
- **Reco: A.** Lo público capta desde el primer día y fija el sistema visual; contrapartida: el CRM llega más tarde.

### 10.7 Entornos de Supabase
- A) Producción `echlwywbucgbhwpncviy` + un segundo proyecto gratuito `josecoded-dev` para previews y sesiones en la nube; local con Docker en el Mac.
- B) Solo producción + local.
- C) Supabase Branching (plan de pago).
- **Reco: A.** Las sesiones en la nube pueden probar esquema sin tocar producción; contrapartida: dos proyectos que mantener con las mismas migraciones (lo hace CI).

---

## Qué sale de aquí

- `docs/arquitectura/decisiones.md`: una línea por pregunta con la respuesta de Jose y la fecha.
- `CLAUDE.md` reescrito con el stack y las reglas decididas (sustituye la descripción de la v1).
- `ESTADO.md`: «Decisiones recientes» y siguiente paso (pantallas y componentes).
- Tablón: los bloques de la fase de pantallas, en el orden de 10.6.
