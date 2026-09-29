# joseCoded — Newsletter semanal con generación por IA, preview y aprobación (spec v1)

**Fecha:** 2026-09-29 · **Perfil:** web (+ una tarea `infra` en Omen) · **Estado:** v1, borrador para revisión de Jose · **Autor:** `arquitecto`
**Insumos:** batería de preguntas con Jose (sesión principal, decisiones cerradas 1–10 en §3), spec de plataforma v1.5.2, diseño técnico v1.2.1 (**DT**), plan v1 (97 tareas), `Comercial/voz.md`, `automation/run-skill.sh` de claude-config.
**Relación con lo existente:** módulo **aditivo** sobre el blog MDX (DT §1.5, tarea 4.2), el admin (fase 6), el gateway `apps/api` (rutas nuevas bajo `/api/v1/newsletter/*`), Supabase (tablas nuevas `newsletter_*`), la vía de avisos de Telegram de los leads y el servidor Omen (un contenedor nuevo). Nada heredado se reescribe. **No bloquea la v1**: encaje en §14.

---

## 1. Objetivo y métricas

**Objetivo.** Crear presencia y audiencia con contenido técnico útil para los dos públicos de joseCoded (empresas/agencias y negocios locales) y para el perfil de empleo de Jose, con una cadencia semanal sostenible: cada número lo redacta Claude con la voz de Jose, Jose lo revisa, edita y aprueba en el admin, y de un mismo artículo salen tres piezas: post del blog, email a la lista propia y post corto para LinkedIn.

**Principio rector (hereda el nº 5 de `PRODUCT.md`):** nada se publica ni se envía sin un clic de Jose. El sistema prepara; Jose decide.

**Métricas a 3 meses del primer envío:**
- ≥ 10 números enviados en 13 semanas (cadencia real ≥ 75 %).
- ≥ 50 suscriptores confirmados (doble opt-in); tasa de confirmación ≥ 60 %.
- Apertura ≥ 40 % y clics ≥ 5 % por número (datos de Brevo); bajas < 1 % por número; rebotes duros < 2 %.
- **Ratio de edición** (distancia entre el borrador generado y el texto aprobado, por pieza) < 30 % de media: mide si el generador acierta la voz. Si sube, se revisa el prompt, no se acepta como normal.
- Tiempo mediano desde "borrador listo" hasta "aprobado" < 24 h.
- Cada post del blog generado cumple los criterios SEO/GEO de la spec §8 (JSON-LD `BlogPosting`, párrafo citable, `llms.txt`).

## 2. Personas

- **Jose, operador** (la misma persona operador de Radar, spec §2): revisa desde el móvil (aviso de Telegram → admin) y edita en escritorio. Quiere ver en un minuto cómo quedará cada pieza, tocar lo justo y aprobar en un clic; no quiere maquetar ni pelearse con un editor.
- **Dani, suscriptor técnico** (persona secundaria de la spec): se suscribe desde un artículo o al registrarse; espera contenido concreto, sin marketing, y una baja en un clic.
- **Marta, suscriptora ocasional**: se suscribe desde el formulario de contacto; entiende el email si el artículo explica lo técnico con ejemplos de negocio (regla de `voz.md`).

`usuario-ejemplo` valida con Jose operador el flujo aviso → preview → aprobación en móvil, y con Dani el alta con doble opt-in y la baja.

## 3. Decisiones cerradas por Jose (no se reabren)

| # | Decisión |
|---|---|
| N1 | Cadencia: un número por semana. Jose lanza uno cuando quiera eligiendo el tema; si en la semana no ha lanzado ninguno, se genera uno automático |
| N2 | Nada se publica sin aprobación. El automático genera un borrador y avisa; sin aprobación, esa semana no hay envío. Manual y automático pasan por la misma preview |
| N3 | Preview y edición en el admin de joseCoded: post del blog, email y post de LinkedIn; editar; aprobar/lanzar, regenerar o descartar |
| N4 | Motor: Claude Code CLI (`claude -p`) con la suscripción de Jose, sin API de pago; voz de `Comercial/voz.md`. Riesgo aceptado: solo corre si la máquina que lo ejecuta está encendida (dónde corre: §7) |
| N5 | Temas del automático: cola de temas en el admin (Jose y Claude la rellenan) + actualidad del sector (React Native, Next.js, IA) con opinión de Jose; sin scraping contrario a condiciones de uso (§6.3) |
| N6 | LinkedIn: versión corta (150–250 palabras: gancho, 3–5 ideas, conclusión, llamada a suscribirse; enlace en el primer comentario), preparada para copiar en el admin (texto + imagen + copiar + abrir LinkedIn). Sin API de LinkedIn. Contenido técnico, sin "contrátame" ni precios |
| N7 | Email: Brevo (plan gratuito, ~300 correos/día), lista propia, remitente `@josecoded.com` (DNS en Cloudflare con Email Routing y catch-all); DKIM/SPF combinados |
| N8 | Suscripción: casilla opcional con consentimiento RGPD explícito en contacto, registro del área de clientes y final de cada post; baja en un clic; doble opt-in si se recomienda (se recomienda: §10) |
| N9 | Aviso de borrador listo por Telegram, el mismo canal que los leads |
| N10 | Idioma: la web es es/en; la newsletter decide (§4.4) |

## 4. Decisiones de esta spec (tomadas por el arquitecto; Jose puede revertirlas)

| # | Decisión | Razón | Descartado |
|---|---|---|---|
| S1 | **La generación corre en Omen** (contenedor nuevo `newsletter-runner` con Claude Code CLI) como runner principal; el Mac queda como runner de respaldo con el mismo código y un plist opcional. Detalle y evaluación en §7 | Omen ya está 24/7 con `josecoded-worker`; N2 exige que el borrador esté listo a tiempo y N4 nombra "máquina apagada" como el riesgo; Omen lo elimina por el coste de un contenedor. Un número por semana no justifica depender del portátil | Solo Mac (riesgo aceptado pero evitable); API de Anthropic (N4 lo excluye); Ollama en Omen (calidad de voz insuficiente para texto público; queda fuera de v1) |
| S2 | **Cola de trabajos en Supabase** (`newsletter_jobs`) que el runner **sondea cada 2 min** por el gateway con un token de alcance mínimo; sin webhooks hacia Omen | Mismo patrón que Radar (cola en tablas, `claim` con lock blando, DT §11.3); funciona igual desde Omen y desde el Mac; no expone nada nuevo de Omen; la latencia de 2 min es irrelevante para un borrador que tarda minutos | Webhook gateway → n8n → runner (necesita el ingress con Access de la tarea 8.3 y no sirve para el Mac); Supabase Realtime desde Omen (service role fuera del gateway) |
| S3 | **Semana ISO, zona `Europe/Madrid`. Borrador automático el lunes a las 07:00** si no hay número `ready`/`approved`/`sent` de esa semana; recordatorio el jueves a las 09:00 si sigue sin decisión; **caduca el domingo a las 22:00** (`expired`, esa semana no hay envío). Si Jose lanza y envía un número manual, el automático de esa semana pasa a `superseded` | Da a Jose toda la semana para revisar; una generación "de más" cuesta una ejecución de Claude, no dinero. Generarlo el jueves acortaría el margen de revisión | Generar solo cuando la semana ya va tarde; sin caducidad (acumularía borradores viejos) |
| S4 | **Solo español en v1.** La newsletter sale en `es`; el post del blog se publica en `es` sin `alternates` (la spec D15b admite artículos en un solo idioma). La traducción a `en` del post (sin email) queda como pregunta abierta Q2 | Los dos públicos y el mercado de empleo de Jose son españoles; LinkedIn en español; el cuello de botella es el tiempo de revisión de Jose, y dos idiomas lo duplican; una sola lista de Brevo y una sola preview | Bilingüe desde el inicio; solo inglés |
| S5 | **Estructura fija del número:** un artículo principal (del tema de la cola o, si está vacía, de la actualidad) + bloque opcional "Esta semana" con 2–4 novedades del sector de una o dos frases cada una, con una **toma de posición marcada como borrador** que Jose confirma o borra. Si no hay novedades relevantes en 14 días, el bloque no aparece | Combina N5 (a) y (b) sin inventar opiniones: la opinión la firma Jose al aprobar, y las frases de opinión se marcan visualmente en la preview | Solo temas de la cola (se agota); solo actualidad (contenido de agregador, sin tesis propia) |
| S6 | **Fuentes de actualidad = feeds oficiales RSS/Atom** (lista versionada `content/newsletter/sources.json`), leídas por un cron del gateway cada 6 h; se guarda título, enlace, fecha y resumen ≤ 300 caracteres (nunca el cuerpo). Claude puede usar WebSearch/WebFetch del propio CLI solo para verificar o ampliar un ítem ya obtenido de un feed | Feeds y changelogs oficiales existen para uso público y no violan condiciones de uso; el gateway ya parsea RSS (`fast-xml-parser`, DT §1.2); guardar solo extractos evita problemas de derechos | Scraping de webs o redes; HN/Reddit como fuente primaria (ruido; se admiten sus API oficiales como fuente secundaria en Q6) |
| S7 | **Aprobar = lanzar ahora**, en este orden: (1) publicar el post en el blog (commit en el repo vía GitHub API → CI despliega), (2) comprobar que el post responde 200, (3) enviar el email por campaña de Brevo con el enlace al post, (4) dejar listo el paquete de LinkedIn. El email nunca sale antes de que el post esté vivo | El email enlaza al post; enviar antes rompería el enlace. Programar para más tarde queda fuera de v1 (no-alcance) | Email y blog en paralelo; programación de envío |
| S8 | **El post del blog se publica como fichero `.md` (Markdown puro, formato `md` de `@next/mdx`, sin JSX ni expresiones) en `content/blog/es/<slug>.md`**, con `metadata` generada por el sistema, mediante **PR del bot con auto-merge** a `main` cuando CI está en verde | D8 (blog en el repo, estático, SEO/GEO) se mantiene. Markdown puro cierra la puerta a ejecutar código en build a partir de texto generado o pegado (`.mdx` compila JSX). El PR respeta la regla §9 de `working-agreements` (nunca push directo a `main`) | Renderizar los números desde Supabase en `/blog` (rompe D8 y duplica el render del blog); commit directo a `main`; `.mdx` |
| S9 | **Remitente `novedades@josecoded.com`** ("Jose, josecoded") con `Reply-To: hola@josecoded.com`; envío desde el dominio raíz | Las respuestas al número tienen valor (llegan a Gmail por el catch-all); `noreply@` reduce entregabilidad y cierra conversación. Con ≤ 300 correos/día el dominio raíz no necesita subdominio de envío | `noreply@`; subdominio `news.josecoded.com` (se revisa si el volumen crece) |
| S10 | **Supabase es la fuente de verdad de la lista** (`newsletter_subscribers` con registro de consentimiento); Brevo es un espejo sincronizado por el gateway (contactos, lista, blocklist) | "Lista propia" (N7) y prueba de consentimiento RGPD en datos que controla Jose; cambiar de proveedor no pierde la lista | Brevo como único registro |
| S11 | **Doble opt-in propio** (email de confirmación transaccional por Brevo con enlace firmado; 7 días de validez) | Prueba de consentimiento, lista limpia y mejor reputación de envío; cuesta un correo por alta | Alta directa; doble opt-in de Brevo (no deja el registro en Supabase) |
| S12 | **Aviso de Telegram por la vía que usan los leads**: evento aditivo `newsletter.draft_ready` (y `newsletter.failed`, `newsletter.sent`) en la Edge Function `notify`, que envía al mismo bot y `chat_id` (DT §3.4, decisión P3); el workflow n8n `lead-created` sigue siendo opcional | N9 pide "el mismo canal que los leads"; el DT ya fijó que la vía primaria de los leads es la Edge Function y n8n opcional. Mensajes sin botones (el enlace al admin basta), así no hace falta la vía directa del gateway de Radar | Bot API directa desde el gateway (solo necesaria cuando hay botones y edición de mensajes, como en Radar); n8n como vía primaria |
| S13 | **Paquete de LinkedIn**: texto sin enlaces + "primer comentario" con el enlace del post y UTM + imagen OG del post (1200×630, la que ya genera la tarea 2.11) + botones Copiar texto, Copiar comentario, Descargar imagen, Abrir LinkedIn; en móvil, además Web Share API con texto e imagen. Un `lint` bloquea palabras prohibidas (precios, "contrátame", packs) y exige 150–250 palabras | N6 al pie de la letra sin API de LinkedIn ni generación de imágenes | Generar imágenes con IA; prefijar el enlace en el cuerpo |
| S14 | **Lanzamiento manual con dos entradas**: (a) tema nuevo (Jose escribe título/ángulo o elige uno de la cola) → Claude genera las tres piezas; (b) **artículo ya escrito** por Jose en `content/blog/es/` → Claude genera solo email y LinkedIn | Cubre el caso de que Jose escriba un artículo a mano (tarea 4.2 ya prevé artículos manuales) y aproveche la distribución | Solo (a) |
| S15 | **Modelo y límites de la ejecución**: `claude -p` con `--output-format json`, herramientas limitadas a `WebSearch,WebFetch`, `--max-turns` acotado, modelo configurable (`NEWSLETTER_CLAUDE_MODEL`, por defecto el de más calidad disponible en el plan; es una ejecución por semana); la salida es un JSON validado con zod; un reintento con prompt más estricto si falla la validación | Una ejecución semanal puede permitirse el modelo lento; la validación estricta es lo que permite tratar la salida como datos | Modelo rápido por defecto; salida en texto libre |

## 5. Alcance

### Dentro
1. **Cola de temas** en admin (`/admin/newsletter/temas`): crear, ordenar, etiquetar audiencia (empresas / negocios / ambos), descartar; Claude añade propuestas de tema marcadas `source='claude'` (desde la actualidad y desde huecos temáticos) que Jose acepta o borra.
2. **Generación** manual (S14) y automática (S3) con la voz de `voz.md`, salida en tres piezas (post, email, LinkedIn) + bloque "Esta semana" (S5).
3. **Admin de números** (`/admin/newsletter`, `/admin/newsletter/[id]`): lista por semana y estado; detalle con tres pestañas (Blog · Email · LinkedIn), preview fiel de cada pieza, edición en Markdown con vista previa, "Enviar prueba a mi correo", Regenerar (todo o una pieza, con instrucciones), Descartar, **Aprobar y lanzar** con confirmación de dos pasos.
4. **Publicación**: post en el blog vía PR del bot (S8); email por campaña de Brevo (S7); paquete de LinkedIn (S13).
5. **Suscripción**: casilla RGPD en `/contacto`, en el registro y `NewsletterForm` al final de cada post; doble opt-in; páginas `/newsletter/confirmar`, `/newsletter/baja`, `/newsletter` (landing corta con último número y alta); sincronización con Brevo; baja en un clic + `List-Unsubscribe`; webhook de Brevo para bajas, rebotes y quejas.
6. **Avisos** por Telegram (S12): borrador listo, recordatorio, enviado, fallo, runner sin actividad.
7. **Métricas** en admin (§12) y eventos de Umami.
8. **Infra**: contenedor `newsletter-runner` en Omen (§7) y su documentación en `infra/omen/newsletter-runner/`.

### Fuera (no-alcance)
- Programar envíos a una hora futura; series o secuencias automáticas; segmentación por audiencia (una sola lista en v1; la etiqueta de audiencia del tema es solo orientación para el redactor).
- Editor WYSIWYG, subida de imágenes propias del número (la imagen es la OG del post), plantillas múltiples.
- Publicar en LinkedIn por API o automatizar el navegador; programar posts de LinkedIn.
- Versión en inglés del email; traducción automática (Q2).
- Comentarios del blog: sin cambios (los posts generados los heredan).
- Módulo **Oportunidades** (ingesta de ofertas de plataformas freelance): spec futura. Comparte con este módulo el patrón de **cola de trabajos de Claude** (`newsletter_jobs` → generalizable a `claude_jobs`) y la vía de avisos; se diseña de forma que renombrar la tabla a genérica sea una migración pequeña, pero **no se generaliza ahora**.

## 6. Flujos

### 6.1 Lanzamiento manual
1. Jose, en `/admin/newsletter`, pulsa **Nuevo número** y elige: (a) tema (escribe título + ángulo + audiencia, o toma uno de la cola) o (b) artículo existente (selector de posts `es` publicados sin número asociado).
2. La Server Action llama a `POST /api/v1/newsletter/issues` (JWT admin). El gateway crea `newsletter_issues` en `queued` (origen `manual`, `week_key` de la semana actual) y un `newsletter_jobs` de tipo `generate` (o `generate_distribution` en el caso b).
3. El runner reclama el trabajo (§7.3), genera, entrega el resultado; el gateway valida, guarda, pasa el número a `ready`, registra `generated` y dispara el aviso de Telegram "Borrador listo: <título> → enlace".
4. Sigue en §6.3.

### 6.2 Automático semanal
1. Cron del gateway (lunes 07:00 Madrid): si no existe número de `week_key` actual en `ready`/`approved`/`publishing`/`sent` ni trabajo en curso → crea número `auto` + trabajo `generate` con `topic_id` = siguiente tema de la cola (`status='queued'`, por `priority`, `created_at`); si la cola está vacía → `topic_id` nulo y el prompt construye el artículo desde la actualidad (`newsletter_news_items` de los últimos 14 días, ≥ 3 ítems; si hay menos de 3, el número se crea en `failed` con motivo `no_material` y Telegram "Sin material esta semana: añade un tema").
2. Igual que 6.1 pasos 3–4.
3. Jueves 09:00: si sigue en `ready` → Telegram "Sigue pendiente el número de esta semana".
4. Domingo 22:00: si sigue en `ready` (o `queued`/`generating` sin acabar) → `expired`, Telegram "Esta semana no ha salido número". El tema de la cola **vuelve a `queued`** (no se consume sin publicar).
5. Si un número manual de la misma semana llega a `sent`, cualquier `auto` de esa semana en `ready` pasa a `superseded`.

### 6.3 Preview, edición, aprobación
1. Detalle `/admin/newsletter/[id]`: cabecera (semana, origen, estado, tema, fuentes usadas), tres pestañas:
   - **Blog**: preview del artículo con los estilos del blog (render Markdown compartido, §8.3), metadatos editables (título, slug, descripción ≤ 155, etiquetas), aviso de longitud (objetivo 900–1.500 palabras), párrafo citable y JSON-LD que se generará.
   - **Email**: asunto (≤ 60) y preencabezado (≤ 90) editables, preview del HTML en `iframe` con `srcdoc` (ancho móvil/escritorio), botón **Enviar prueba** (campaña de prueba de Brevo a `ADMIN_NOTIFY_EMAIL`).
   - **LinkedIn**: texto (contador de palabras, marca del corte de "ver más" a ~210 caracteres), primer comentario, imagen, botones de S13. Los botones de copiar están activos también antes de aprobar (Jose puede querer publicar en LinkedIn a otra hora).
   - Bloque "Esta semana": cada ítem con su enlace y la frase de opinión resaltada como borrador; quitar ítem / quitar bloque.
2. Edición: Markdown en `textarea` con vista previa al lado; guardado por Server Action sobre Supabase (RLS admin) con `version` optimista (si el runner o otra pestaña cambió el texto, se avisa y no se pisa). Cada guardado crea una fila en `newsletter_issue_versions` (`actor='jose'`).
3. **Regenerar**: todo o una pieza, con un campo de instrucciones ("más corto", "cambia el ejemplo por una clínica"). Crea un trabajo `regenerate` con `parts` y `instructions`; la versión actual queda guardada; al volver, la preview muestra "Regenerado" y permite **volver a la versión anterior**.
4. **Descartar**: motivo opcional; estado `discarded`; el tema vuelve a la cola si no se ha usado en otro número.
5. **Aprobar y lanzar**: botón primario → segundo paso "Se publicará el post y se enviará a N suscriptores. ¿Seguro?" (10 s de margen para cancelar, como Radar) → `POST /api/v1/newsletter/issues/:id/approve` (JWT admin; el gateway vuelve a comprobar `staff_members.role='admin'`, `status='ready'`, `lint` de las tres piezas en verde y que no haya `{{DATO}}` sin cubrir). Registra `approved_by_jose` y pasa a `approved`.

### 6.4 Publicación: blog → email → LinkedIn
1. `approved` → `publishing_blog`: el gateway genera `content/blog/es/<slug>.md` (frontmatter/`metadata` con `title`, `description`, `date`, `tags`, `newsletter: { issue_id, week_key }`), crea rama `newsletter/<week_key>-<slug>` y PR vía GitHub REST (`GITHUB_CONTENT_TOKEN`, fine-grained: solo este repo, `contents` + `pull_requests`), activa auto-merge (squash). El PR lleva la etiqueta `newsletter` y el cuerpo con el enlace al admin.
2. CI (`ci.yml`) valida el Markdown (`i18n:check`, `content-index`, build) y `deploy-production.yml` despliega tras el merge. **Este despliegue lo autoriza el clic de aprobación de Jose** (gate de producción cumplido en el propio flujo; anotar en el ADR).
3. Sweep del gateway (cada 5 min): número en `publishing_blog` → comprueba el PR (mergeado) y `GET https://josecoded.com/blog/<slug>` = 200 con el `<meta name="newsletter-issue">` correcto → `blog_published` + evento; si a los 45 min no está vivo → `failed` (`publish_timeout`) + Telegram con el enlace al PR.
4. `blog_published` → `sending_email`: el gateway crea la campaña en Brevo (`POST /v3/emailCampaigns`: asunto, preencabezado, remitente S9, HTML de `renderEmailHtml`, lista `NEWSLETTER_BREVO_LIST_ID`, `List-Unsubscribe` lo añade Brevo), guarda `brevo_campaign_id` **antes** de `POST /emailCampaigns/{id}/sendNow`; éxito → `sent`, `sent_at`, Telegram "Enviado a N".
5. Paquete de LinkedIn queda listo en la pestaña (ya lo estaba); el evento `linkedin_copied` se registra al copiar o compartir.
6. La home ("último artículo") y `/newsletter` (último número) se actualizan con el despliegue.

### 6.5 Suscripción, confirmación y baja
1. **Alta**: casilla no marcada por defecto con el texto de consentimiento versionado (`consent_version`): "Quiero recibir la newsletter semanal de josecoded (un email a la semana, baja en un clic). Trataré tu email según la política de privacidad." Fuentes: `/contacto` (el gateway `POST /leads` recibe `newsletter_opt_in` y llama al servicio de alta), registro (Server Action tras crear la cuenta), `NewsletterForm` al final del post y `/newsletter` (formulario propio con Turnstile → `POST /api/v1/newsletter/subscribe`).
2. El servicio crea/actualiza `newsletter_subscribers` en `pending` (email normalizado, `source`, `locale`, `consent_version`, `consent_at`, hash de IP, `user_id` si hay sesión) y envía el email de confirmación (Brevo transaccional, plantilla propia, enlace `/newsletter/confirmar?t=<token firmado, 7 días>`). Reenvío limitado: 1 por hora y email, 3 por día.
3. **Confirmar**: `GET /newsletter/confirmar` (página RSC) → `POST /api/v1/newsletter/confirm` → `confirmed`, `confirmed_at`; alta en Brevo (`POST /v3/contacts` con `listIds`, atributos `LOCALE`, `SOURCE`); Umami `newsletter_confirm`.
4. **Baja**: enlace firmado en cada email (`/newsletter/baja?t=`) → una página con un solo botón "Darme de baja" (un clic, sin login) → `unsubscribed` + blocklist en Brevo. Además, webhook de Brevo (`POST /api/v1/newsletter/brevo/webhook`, firmado) para `unsubscribed`, `hardBounce`, `spam` → estado correspondiente.
5. **Derechos RGPD** desde admin: buscar por email, ver consentimiento, **borrar** (Supabase + Brevo) o exportar la fila.

## 7. Dónde corre la generación (N4): evaluación y decisión

### 7.1 Comparativa

| Criterio | Mac de Jose (launchd + `run-skill.sh`) | Omen (contenedor `newsletter-runner`) |
|---|---|---|
| Disponibilidad | Solo con el Mac encendido y despierto; launchd recupera el cron al despertar, pero un borrador pedido desde el móvil espera | 24/7 (ya sostiene `josecoded-worker`, n8n, túneles) |
| Coste de puesta en marcha | Cero: CLI autenticado, patrón probado (`/cerebro update`, `/seguimiento`, `/radar-indeed`) | Un contenedor nuevo con Node 22 + `@anthropic-ai/claude-code`, un volumen para la sesión, un `.env`; una tarea `infra` con OK de Jose |
| Autenticación de Claude | Sesión interactiva ya iniciada | Token de larga duración generado en el Mac con `claude setup-token` y guardado en el `.env` del contenedor (`CLAUDE_CODE_OAUTH_TOKEN`), o login por dispositivo desde `docker exec`. **A verificar en la tarea 0 de este módulo** (§14) |
| Acceso a la voz y al contexto | Vault en iCloud accesible con `--add-dir` | Sin vault: la voz llega desde el repo (`content/voice.md`, generado por el `sync-voice` ya previsto en DT §9) empaquetada en el gateway y servida al runner en `GET /newsletter/runner/context` |
| Cuota del plan | Comparte la cuota de Jose | Igual (misma cuenta) |
| Riesgo operativo | Portátil cerrado, en viaje, actualizándose | Caducidad del token (se detecta: trabajo `failed` con `error_class='auth'` → Telegram); un contenedor más que vigilar (Uptime Kuma ya existe en Omen) |
| Regla de Omen | — | Solo contenedor **nuevo**; no toca el worker ni n8n |

### 7.2 Decisión (S1)
**Omen es el runner principal; el Mac, respaldo.** El código del runner es el mismo (`packages/newsletter-runner`, Node, sin dependencias de runtime concreto) y se despliega:
- **Omen**: `infra/omen/newsletter-runner/` (Dockerfile, `compose.yml`, `.env.example`): contenedor sin puertos publicados, `restart: unless-stopped`, volumen `/srv/josecoded-data/newsletter-runner/` (sesión de Claude y logs), bucle de sondeo cada 2 min, `timeout` de 20 min por trabajo. Salud: `POST /newsletter/runner/heartbeat` en cada sondeo; el admin muestra "último latido hace X min".
- **Mac** (opcional, no instalado por defecto): `infra/mac/com.jose.josecoded.newsletter-runner.plist` que ejecuta el mismo runner cada 10 min con `~/.config/josecoded/newsletter.env`. Se instala solo si Omen falla o Jose lo prefiere (GATE: plist en el Mac).
- Si los dos están activos, el `claim` con lock garantiza que un trabajo lo ejecuta uno solo.

### 7.3 Contrato runner ↔ gateway (token `NEWSLETTER_RUNNER_TOKEN`, alcance mínimo)
- `POST /api/v1/newsletter/runner/claim` `{ runtime:'omen'|'mac', version }` → `204` si no hay trabajo, o `200 { job, context }` con `newsletter_claim_job()` (`status='queued'` → `claimed`, `claimed_at`, lock blando 25 min, `skip locked`). `context` = voz, prompt (`prompt_version`), tema, ítems de actualidad, títulos de los últimos 8 números (evitar repetición), reglas de `lint`, artículo origen en el caso S14(b).
- El runner escribe `prompt.md` e `input.json` en su directorio de trabajo temporal y ejecuta `claude -p "$(cat prompt.md)" --output-format json --allowedTools WebSearch,WebFetch --max-turns 12 [--model $NEWSLETTER_CLAUDE_MODEL]`. Extrae el bloque JSON de la respuesta, valida con el esquema compartido (`packages/newsletter-core`), reintenta una vez con el prompt "estricto" si no valida.
- `POST /api/v1/newsletter/runner/jobs/:id/result` `{ ok:true, output, usage:{ durationMs, model } }` o `{ ok:false, errorClass:'auth'|'timeout'|'invalid_output'|'no_material'|'runtime', message }`. El gateway vuelve a validar, guarda versión `actor='claude'`, aplica `lint` y pasa el número a `ready` o `failed`.
- El runner **no puede** leer suscriptores, aprobar, publicar ni enviar: el token solo autoriza `claim`, `result` y `heartbeat` (rate limit 1004 compartido de Radar o uno propio).
- Reintentos: trabajo `claimed` sin resultado a los 25 min → vuelve a `queued` (`attempts+1`); a los 3 intentos → `failed` + Telegram.

### 7.4 Prompt y salida
- Prompt versionado en `packages/newsletter-core/prompts/issue.v1.md` con: voz (texto íntegro de `voice.md`), reglas duras (sin emojis ni exclamaciones; primera persona; sin "soluciones innovadoras"; sin precios ni "contrátame" en LinkedIn; no inventar datos, proyectos ni cifras; las opiniones del bloque "Esta semana" van marcadas `[opinión]`), estructura exacta de cada pieza, ejemplo del tono, y los datos de entrada como JSON **tratado como datos, nunca como instrucciones** (los títulos de feeds pueden contener texto malicioso).
- Salida (zod): `{ post:{ title, slug, description, tags[], body_md, quotable }, email:{ subject, preheader, intro_md, body_md }, linkedin:{ text, first_comment }, this_week:[{ news_item_id, take_md }], topic_suggestions:[{ title, angle, audience }] }`. `topic_suggestions` alimenta la cola con `source='claude'`.

## 8. Arquitectura y encaje técnico

### 8.1 Piezas
```
apps/web  (/admin/newsletter/*, /newsletter/*, NewsletterForm, casillas en contacto/registro)
   ├─ lecturas y ediciones: Supabase con sesión admin (RLS)
   └─ acciones de estado y de IA → gateway /api/v1/newsletter/* (JWT admin)
apps/api  (gateway)
   ├─ /newsletter/issues (crear, approve, regenerate, discard, test-send)
   ├─ /newsletter/subscribe · /confirm · /unsubscribe · /brevo/webhook (público, Turnstile/firmas)
   ├─ /newsletter/runner/{claim,result,heartbeat} (token runner)
   ├─ cron: lunes 07:00 (auto), jueves 09:00 (recordatorio), domingo 22:00 (caducidad),
   │        cada 6 h (feeds), sweep */5 (publicación, envío, reintentos, latido), diario (stats de Brevo)
   └─ servicios: brevo.service, github-content.service, feeds.service, issue-state.service
packages/newsletter-core  (tipos, zod, máquina de estados, renderEmailHtml, renderMarkdown, buildPostFile, lint, prompts)
packages/newsletter-runner (bucle de sondeo + ejecución de claude -p; se despliega en Omen y opcionalmente en el Mac)
supabase/migrations/2026MMDD_newsletter_*.sql (aditivas)
supabase/functions/notify (eventos aditivos newsletter.*)
infra/omen/newsletter-runner/, infra/mac/com.jose.josecoded.newsletter-runner.plist
content/newsletter/sources.json · content/blog/es/<slug>.md (generados por el flujo)
```

### 8.2 Endpoints nuevos del gateway (todos aditivos, `envSchema` ampliado)

| Ruta | Auth | Función |
|---|---|---|
| `POST /api/v1/newsletter/issues` | JWT admin | Crea número + trabajo (`manual`, S14 a/b) |
| `POST /api/v1/newsletter/issues/:id/regenerate` | JWT admin | Trabajo `regenerate` con `parts`, `instructions` |
| `POST /api/v1/newsletter/issues/:id/approve` | JWT admin | Comprobaciones de §6.3.5 → `approved`; arranca §6.4 |
| `POST /api/v1/newsletter/issues/:id/discard` | JWT admin | `discarded` |
| `POST /api/v1/newsletter/issues/:id/test-send` | JWT admin | Campaña de prueba de Brevo a `ADMIN_NOTIFY_EMAIL` (cuenta como 1 correo) |
| `POST /api/v1/newsletter/issues/:id/retry` | JWT admin | Reintenta el paso fallido (`publish` o `send`) |
| `POST /api/v1/newsletter/subscribe` | Turnstile + rate limit | Alta `pending` + email de confirmación |
| `POST /api/v1/newsletter/confirm` · `POST /unsubscribe` | Token firmado | Confirmación / baja |
| `POST /api/v1/newsletter/brevo/webhook` | Firma/secret de Brevo | Bajas, rebotes, quejas |
| `POST /api/v1/newsletter/runner/*` | `NEWSLETTER_RUNNER_TOKEN` | §7.3 |
| `GET /api/v1/newsletter/health` | JWT admin | Latido del runner, cola, última pasada de feeds, `configured` de secretos (`SecretRef`, sin valores) |

### 8.3 Render compartido
`packages/newsletter-core` incluye `renderMarkdown(md)` (parser Markdown ligero compatible con Workers, sin HTML crudo: `html: false`, enlaces `rel="noopener"`), `renderEmailHtml(issue)` (plantilla de tablas, una columna, 600 px, texto claro sobre fondo del sistema visual con respaldo para clientes sin `prefers-color-scheme`, tipografía del sistema, botón "Leer en la web", pie con motivo del envío, dirección postal si la ley la exige (Q5), enlace de baja y de preferencias), `renderLinkedIn(issue)` y `buildPostFile(issue)`. La preview del admin y el email de verdad usan la misma función: lo que ve Jose es lo que se envía. El post del blog en producción lo compila `@next/mdx` en build (DT §1.5); la preview usa `renderMarkdown` con los mismos estilos del blog (pequeñas diferencias de resaltado de código se aceptan).

### 8.4 Fuentes de actualidad (`content/newsletter/sources.json`, S6)
Lista inicial a validar por Jose (Q6), todas con feed público: blog de Next.js, blog de React, blog de React Native, changelog de Expo, changelog de Vercel, blog de Supabase, blog de Cloudflare, releases de GitHub (`vercel/next.js`, `facebook/react-native`, `expo/expo`, `supabase/supabase`), news de Anthropic y de OpenAI (si exponen feed; si no, quedan fuera), web.dev. Cada entrada: `code`, `url`, `kind` (`rss`|`atom`), `topic` (`nextjs`|`react-native`|`ia`|`web`), `weight`. El cron guarda ≤ 40 ítems por fuente y 14 días; `used_in_issue_id` evita repetir.

## 9. Modelo de datos (Supabase, todo aditivo, prefijo `newsletter_`)

Colisiones: ninguna tabla `newsletter_*` existe en producción (verificar con `list_tables` antes de la migración). Políticas con `(select auth.uid())`, FKs indexadas (advisors de DT §6.4).

| Tabla | Campos principales | Notas |
|---|---|---|
| `newsletter_settings` (1 fila) | `auto_enabled bool`, `auto_weekday`, `auto_hour_local`, `reminder_weekday`, `expire_weekday`, `from_name`, `from_email`, `reply_to`, `consent_version`, `runner_expected_heartbeat_min` | Editable en admin; valores por defecto S3/S9 |
| `newsletter_topics` | `id`, `title`, `angle text`, `audience enum(empresas,negocios,ambos)`, `source enum(jose,claude,news)`, `status enum(queued,used,discarded)`, `priority int`, `news_item_id?`, `used_in_issue_id?`, `created_by`, timestamps | Cola de N5(a) |
| `newsletter_news_items` | `id`, `source_code`, `url unique`, `title`, `summary ≤300`, `published_at`, `fetched_at`, `topic`, `used_in_issue_id?` | S6; purga > 60 días |
| `newsletter_issues` | `id`, `week_key text ('2026-W40')`, `origin enum(manual,auto)`, `status enum(...)` (§9.1), `locale ('es')`, `topic_id?`, `source_post_slug?` (S14b), `post jsonb` `{title,slug,description,tags,body_md,quotable}`, `email jsonb` `{subject,preheader,intro_md,body_md}`, `linkedin jsonb` `{text,first_comment}`, `this_week jsonb[]`, `generation jsonb` `{job_id,model,prompt_version,runtime,duration_ms}`, `lint jsonb`, `blog_pr_number?`, `blog_url?`, `blog_published_at?`, `brevo_campaign_id?`, `sent_at?`, `recipients_count?`, `approved_at?`, `approved_by?`, `error jsonb?`, `version int`, timestamps | `unique (week_key, origin) where origin='auto'`; índice por `status` |
| `newsletter_issue_versions` | `id`, `issue_id`, `n`, `actor enum(claude,jose)`, `content jsonb` (post/email/linkedin/this_week), `job_id?`, `created_at` | Historial y "volver a la anterior" |
| `newsletter_issue_events` | `id`, `issue_id`, `type` (`queued, generated, edited, regenerate_requested, approved_by_jose, blog_pr_opened, blog_published, email_sent, linkedin_copied, discarded, expired, superseded, failed, retried`), `actor enum(jose,system,claude,rule)`, `payload jsonb`, `created_at` | Auditoría; el trigger `newsletter_guard_sent` exige un `approved_by_jose` previo para pasar a `sent` (invariante con test) |
| `newsletter_jobs` | `id`, `kind enum(generate,generate_distribution,regenerate)`, `issue_id`, `payload jsonb`, `status enum(queued,claimed,done,failed)`, `runtime?`, `claimed_at?`, `attempts int`, `result jsonb?`, `error jsonb?`, timestamps | Función `newsletter_claim_job(runtime)` (`for update skip locked`) |
| `newsletter_subscribers` | `id`, `email citext unique`, `status enum(pending,confirmed,unsubscribed,bounced,complained)`, `locale`, `source enum(contact_form,signup,post_footer,landing,admin)`, `consent_version`, `consent_at`, `consent_ip_hash`, `consent_user_agent?`, `user_id? → auth.users`, `confirmed_at?`, `unsubscribed_at?`, `brevo_contact_id?`, `last_sent_issue_id?`, timestamps | Sin tokens en tabla: confirmación y baja usan tokens HMAC con `NEWSLETTER_TOKEN_KEY` (`sub`, `exp`, `purpose`) |
| `newsletter_runner_heartbeats` | `runtime`, `last_seen_at`, `version` | Latido (fila por runtime) |

### 9.1 Estados del número
`queued` → `generating` → `ready` → `approved` → `publishing_blog` → `blog_published` → `sending_email` → `sent`
Laterales: `failed` (desde `generating`, `publishing_blog`, `sending_email`; conserva `error` y admite `retry` al mismo paso o `discard`), `discarded` (desde `ready`/`failed`), `expired` (desde `queued`/`generating`/`ready` por regla dominical), `superseded` (desde `ready`, solo `auto`). Regenerar: `ready` → `generating` (guarda versión). Invariantes con test: ningún camino a `sent` sin `approved_by_jose`; ningún `sending_email` sin `blog_published`; `brevo_campaign_id` se persiste antes de `sendNow`.

### 9.2 RLS
| Tabla | anon | authenticated | admin |
|---|---|---|---|
| `newsletter_settings`, `_topics`, `_issues`, `_issue_versions`, `_issue_events`, `_jobs`, `_news_items`, `_runner_heartbeats` | — | — | select/insert/update (ediciones de contenido y temas desde la web; estados solo vía gateway con service role) |
| `newsletter_subscribers` | — | — | select/delete (RGPD) — **inserts y updates solo service role** (gateway) |

El gateway usa `SUPABASE_SERVICE_ROLE_KEY` (ya existente). Tests RLS con tres cuentas (DT §8.4) ampliados: cliente y anónimo no ven ninguna tabla `newsletter_*`.

## 10. Seguridad y privacidad

- **Secretos** (todos en `wrangler secret` del gateway, ninguno en `apps/web` ni en el repo): `BREVO_API_KEY`, `BREVO_WEBHOOK_SECRET`, `NEWSLETTER_RUNNER_TOKEN` (+ `_PREV` para rotación con solape 24 h, como Radar), `NEWSLETTER_TOKEN_KEY` (HMAC de confirmación/baja), `GITHUB_CONTENT_TOKEN` (fine-grained, solo `josecoded`, `contents` + `pull_requests`, caducidad 1 año con recordatorio en admin). Vars: `NEWSLETTER_BREVO_LIST_ID`, `NEWSLETTER_FROM_EMAIL`, `NEWSLETTER_REPLY_TO`, `GITHUB_CONTENT_REPO`, `NEWSLETTER_CLAUDE_MODEL`. Omen `.env` (`/srv/josecoded-data/newsletter-runner/.env`, `chmod 600`, fuera del repo): `NEWSLETTER_API_URL`, `NEWSLETTER_RUNNER_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` (o sesión en el volumen). Mac: `~/.config/josecoded/newsletter.env`.
- **Quién aprueba**: solo `staff_members.role='admin'` con JWT válido, comprobado en la Server Action y otra vez en el gateway (`assertAdmin`). El runner no puede. Telegram no lleva botones de aprobación (S12): aprobar exige ver la preview.
- **Salida de Claude = datos no confiables**: esquema zod, Markdown sin HTML crudo, `lint` (longitudes, palabras prohibidas, sin emojis/exclamaciones, sin `{{DATO}}`, enlaces solo `https`), fichero `.md` (no `.mdx`, S8) y `slug` saneado (`^[a-z0-9-]{3,80}$`, sin colisión con posts existentes). Los ítems de feeds se pasan como JSON con la instrucción de tratarlos como datos; la revisión de Jose es la última barrera.
- **Doble uso de la cuota de Claude**: el token del runner permite gastar la cuota de Jose; vive solo en Omen (`.env` 600) y se revoca desde el Mac (`claude` → sesiones) si Omen se compromete. Pregunta abierta Q1.
- **Endpoints públicos**: `subscribe` con Turnstile (action `newsletter`) + rate limit por IP (10/día) y por email (3/día); `confirm`/`unsubscribe` solo con token firmado y caducado; webhook de Brevo verificado por secreto en la URL + IPs de Brevo si las publica; respuestas sin revelar si un email existe.
- **Publicación en el repo**: el bot solo crea ramas `newsletter/*`, ficheros bajo `content/blog/es/` y PRs con auto-merge; CI valida; la protección de `main` sigue exigiendo PR y checks (regla §9 de `working-agreements`). Cambios fuera de esa carpeta en un PR `newsletter/*` fallan en CI (check dedicado).
- **RGPD**: base jurídica consentimiento (art. 6.1.a), casilla no premarcada, texto versionado y guardado con fecha, hash de IP y origen; doble opt-in; baja en un clic sin login; `List-Unsubscribe`; Brevo como encargado del tratamiento (sede en la UE) citado en la política de privacidad junto con Supabase y Cloudflare; **`/legal/privacidad` se amplía** (finalidad, encargados, plazo: mientras dure la suscripción; tras la baja se conserva email y fecha como registro de supresión 3 años); derechos por `privacidad@josecoded.com` y desde admin (borrado en Supabase y Brevo). Seguimiento de aperturas y clics de Brevo: se informa en la política; decisión de mantener aperturas en Q4. Sin más rastreo (los enlaces llevan UTM; Umami no identifica al suscriptor).
- **Correo saliente y DNS (N7)**: un único registro SPF en `josecoded.com` que combine Email Routing y Brevo: `v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all` (Email Routing no envía, pero exige su `include`; si Resend/Email Service envían desde el raíz, se añade su `include` sin superar 10 lookups). DKIM de Brevo: los registros (`brevo1._domainkey`, `brevo2._domainkey` o el que indique el panel) y el TXT `brevo-code` de verificación, tal como los dé el panel de Brevo al autenticar el dominio. DMARC: `_dmarc` `v=DMARC1; p=none; rua=mailto:privacidad@josecoded.com` el primer mes, luego `p=quarantine`. Los MX de Email Routing no cambian. Direcciones: `novedades@` como remitente (catch-all ya la recibe), `hola@` como Reply-To. Tarea de Jose con checklist (GATE: DNS de producción).

## 11. Errores y degradación

| Situación | Detección | Respuesta |
|---|---|---|
| Runner apagado (Omen caído, Mac sin instalar) | Trabajo `queued` > 30 min o latido > `runner_expected_heartbeat_min` | Telegram "Runner sin actividad desde HH:MM" (una vez por incidente); admin muestra el estado; el trabajo espera; el domingo caduca el número si nada lo procesa |
| Claude no autenticado / token caducado | `errorClass='auth'` | Trabajo `failed` sin reintento; Telegram con instrucción ("regenera el token y actualiza el .env de Omen"); Jose puede reencolar desde admin |
| Salida vacía o inválida | Validación zod / `lint` | Un reintento estricto en el runner; luego `failed` (`invalid_output`) con la salida cruda guardada en `error` para inspección; Telegram |
| Sin material (cola vacía y < 3 novedades) | Cron del lunes | Número en `failed` (`no_material`); Telegram "añade un tema"; Jose puede lanzar manual después |
| Fallo del PR/CI del blog | Sweep: PR cerrado sin merge, checks en rojo, o 45 min sin post vivo | `failed` (`publish_failed`/`publish_timeout`) con enlace al PR; **no se envía email**; `retry` reabre el PR o relanza la comprobación |
| Brevo caído, 4xx/5xx o cuota diaria | Respuesta de la API; `credits` insuficientes | `failed` (`send_failed`) con reintento automático ×3 (5/30/120 min) si es 5xx/429; en 4xx no reintenta; Telegram; el post ya está vivo (se comunica: "publicado sin email"); `retry` manual; antes de crear otra campaña, comprueba si `brevo_campaign_id` existente ya se envió (idempotencia) |
| Más de ~280 suscriptores confirmados (límite gratuito de 300/día, contando pruebas y confirmaciones) | Contador en admin | Aviso al llegar a 250; a 280 el envío se bloquea hasta decidir Q3 |
| Brevo añade su logotipo en el plan gratuito | Conocido | Se acepta en v1; se anota en la plantilla |
| Doble aprobación / doble clic | `status` con transición atómica (`update … where status='ready'`) | Segundo clic → 409 |
| Edición concurrente | `version` optimista | La segunda escritura recibe conflicto y ve la versión nueva |
| Supabase pausado | `supabase-ping.yml` (ya previsto) | Todo el módulo se detiene como el resto del admin; los cron del gateway registran el error y siguen |
| Feeds caídos o cambiados | Cron cada 6 h | Fuente marcada con `last_error`; el número sigue con lo que haya; admin lista fuentes con último éxito |

## 12. Métricas y observabilidad

- Admin `/admin/newsletter` (cabecera): suscriptores confirmados y variación semanal, pendientes de confirmar, bajas del mes; números enviados / semanas transcurridas; ratio de edición medio de los últimos 5 números; latido del runner; última pasada de feeds.
- Por número: destinatarios, entregados, aperturas, clics, bajas, rebotes (cron diario que lee `GET /v3/emailCampaigns/{id}` de Brevo y guarda en `newsletter_issues.stats jsonb`), visitas del post (Umami, enlace externo), copias de LinkedIn.
- Eventos Umami nuevos: `newsletter_subscribe` (fuente), `newsletter_confirm`, `newsletter_unsubscribe`. Nada de métricas en la web pública (regla de `PRODUCT.md`).
- Logs: Workers Logs para el gateway; `~/…/newsletter-runner/logs/` en Omen con rotación (30 ficheros, como `run-skill.sh`); Uptime Kuma vigila el latido vía `GET /api/v1/newsletter/health` (o un push monitor desde el runner).

## 13. Criterios de aceptación

1. Lanzar un número manual desde admin con un tema crea el trabajo; con el runner en marcha (local o Omen) el número pasa a `ready` en < 15 min y llega el Telegram con el enlace.
2. Con la cola de temas vacía y ≥ 3 ítems de feeds, el cron del lunes genera un número `auto` cuyo artículo trata una novedad y cuyo bloque "Esta semana" marca las opiniones; con < 3 ítems, `failed` (`no_material`) y Telegram.
3. La preview de Email es idéntica al HTML enviado (test: `renderEmailHtml` es la única fuente; snapshot). "Enviar prueba" llega al correo de Jose.
4. Editar el post y guardar crea una versión `jose`; regenerar solo LinkedIn conserva post y email y permite volver a la versión anterior.
5. **Test negativo**: ninguna ruta puede llevar un número a `sent` sin evento `approved_by_jose` (trigger + test de máquina de estados); ninguna a `sending_email` sin `blog_published`.
6. Aprobar abre un PR `newsletter/<week>-<slug>` con un solo fichero `content/blog/es/<slug>.md`; tras el merge, `/blog/<slug>` responde 200 con JSON-LD `BlogPosting`, aparece en `/feed.xml`, `sitemap.xml` y `llms.txt`; entonces (y no antes) se crea y envía la campaña de Brevo; el número queda `sent` con `recipients_count`.
7. Un fichero con JSX o `<script>` en el cuerpo no pasa el `lint` ni el check de CI del PR `newsletter/*`.
8. Alta con casilla en `/contacto`, registro y pie de post → `pending` + email de confirmación; confirmar → `confirmed` y contacto en la lista de Brevo; baja desde el enlace del email en un clic → `unsubscribed` en Supabase y blocklist en Brevo; el webhook de Brevo refleja una baja hecha desde el pie de Brevo.
9. Cliente autenticado y anónimo no leen ninguna tabla `newsletter_*` (test RLS con tres cuentas); el token del runner no puede aprobar ni leer suscriptores (tests del gateway).
10. Paquete de LinkedIn: 150–250 palabras, sin enlaces en el texto, primer comentario con URL + UTM, imagen descargable; `lint` rechaza "€", "precio", "contrátame", "pack", emojis y "!".
11. Runner parado > 30 min con trabajo en cola → un solo Telegram; al volver, procesa el trabajo sin duplicarlo (test de `claim`).
12. Domingo 22:00 con número `ready` → `expired`, el tema vuelve a `queued`, Telegram de resumen.
13. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde; `/puerta-calidad` de cada rama (con `revisor-seguridad` centrado en tokens, webhooks, RLS, sanitización del Markdown y alcance del PAT de GitHub); `usuario-ejemplo` como Jose operador en móvil sin abandonos desde el Telegram hasta "Aprobar".

## 14. Encaje en el plan v1 (sin reescribirlo)

**Fase 10 — Newsletter (post-lanzamiento)**, después de la tarea 9.6. No se añade nada a las fases 0–9. Depende de: 4.2 (blog, RSS, índice), 4.1 (auth), 6.1 (shell del admin), 3.8/3.10 (ruta de leads y `/contacto`: casilla), 2.11 (OG del post), 1.7 (`scheduled` del gateway), 8.x (patrón de contenedores en Omen). La candidata "RSS + newsletter" del DT §5.8 decía "newsletter no hasta ≥ 10 artículos"; **esta spec la supera** por decisión de Jose: la newsletter es la que produce los artículos.

Ramas y orden sugerido (una puerta por rama):
1. `spike/t10-claude-runner` (tarea 0 del módulo, no se mergea): verificar en Omen `claude -p --output-format json` con token de `claude setup-token` dentro de un contenedor sin TTY, tiempo y tamaño de una generación real con el prompt v1, y que Brevo permite campañas por API en el plan gratuito con el remitente autenticado. Resultado en `docs/superpowers/specs/2026-MM-DD-tarea10-resultados.md`.
2. `feat/newsletter-core`: `packages/newsletter-core` (tipos, zod, máquina de estados, render, lint, prompts), migraciones + tests RLS y de invariantes, **GATE** migraciones en producción.
3. `feat/newsletter-api`: rutas del gateway, servicios (Brevo, GitHub, feeds), crons, Edge Function `notify` con eventos `newsletter.*` (**GATE** deploy de la función y secretos).
4. `feat/newsletter-runner` + `infra/newsletter-runner`: paquete del runner, Dockerfile/compose y plist; `implementador-infra` lo levanta en Omen (**GATE**).
5. `feat/newsletter-admin` (con entregas previas de `ux` y `ui`: lista, detalle con tres pestañas, cola de temas, ajustes, RGPD) y `feat/newsletter-public` (casillas, `NewsletterForm`, `/newsletter/*`, política de privacidad ampliada).
6. **GATE final**: DNS (SPF/DKIM/DMARC), dominio autenticado en Brevo, lista y webhook, PAT de GitHub, primer número real de prueba a la lista interna, `/puerta-calidad`, `/cierre` de etapa.

Insumos de Jose antes de la fase: cuenta de Brevo y autenticación del dominio; registros DNS; PAT fine-grained de GitHub; `claude setup-token` para Omen (Q1); lista inicial de fuentes (Q6); texto de la política de privacidad revisado; `voz.md` con ejemplos reales (pendiente heredado); 3–5 temas iniciales en la cola.

## 15. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Uso del token de suscripción de Claude fuera del Mac (Omen) contraviene condiciones o deja de funcionar | Sin generación automática | Tarea 0 lo verifica; el runner es el mismo en el Mac (respaldo inmediato por plist); si Anthropic lo restringe, la única alternativa es la API (N4 la excluye; se reabriría con Jose) |
| Texto generado que no suena a Jose | Rechazo de lectores, más tiempo de edición | Prompt con la voz íntegra y ejemplos reales (hay que sustituir los provisionales de `voz.md`); métrica de ratio de edición; regenerar con instrucciones; revisión del prompt cuando el ratio supere el 30 % |
| Opiniones o datos inventados en "Esta semana" | Reputación | Opiniones marcadas como borrador y visibles; datos solo de ítems de feed enlazados; Jose aprueba; regla "no inventar" en el prompt y `lint` de enlaces |
| Un despliegue completo por cada número (contenido en el repo) | Coste de CI y riesgo de romper producción por un cambio de contenido | El PR solo toca `content/blog/es/`; CI completa antes del merge; si el despliegue falla, el email no sale; alternativa futura: render de números desde Supabase (descartada en S8) |
| Entregabilidad (dominio nuevo, plan gratuito con logotipo) | Spam | SPF/DKIM/DMARC correctos, doble opt-in, `Reply-To` real, texto sin señuelos, volumen bajo y constante; revisar reputación a los 2 meses; subdominio de envío si empeora |
| Límite de 300/día de Brevo | Bloqueo del envío al crecer | Aviso a 250, bloqueo a 280, decisión Q3 |
| Dos runners activos a la vez | Trabajo duplicado | `claim` con lock y `attempts`; el Mac no se instala por defecto |
| Feeds que cambian o desaparecen | Bloque "Esta semana" vacío | Fuentes con `last_error`, el número sigue; lista versionada fácil de editar |
| Prompt injection desde títulos de feeds | Salida manipulada | Datos como JSON, esquema y `lint`, revisión humana obligatoria antes de publicar |

## 16. Preguntas abiertas para Jose (máx. 6, con recomendación)

| # | Pregunta | Recomendación |
|---|---|---|
| Q1 | ¿Aceptas que un token de larga duración de tu suscripción de Claude (`claude setup-token`) viva en el `.env` del contenedor de Omen? Permite gastar tu cuota desde Omen. | Sí, con `.env` en `chmod 600`, sin puertos publicados y revocación documentada. Si no, runner solo en el Mac (S1 pasa a Mac principal) |
| Q2 | ¿Traducir a `en` el post aprobado (solo blog, sin email) automáticamente con un segundo trabajo de Claude y publicarlo con `alternates`? | No en v1; medir primero si el blog `en` recibe tráfico. Reabrir a los 3 meses |
| Q3 | Cuando la lista pase de ~280 confirmados: ¿plan Starter de Brevo (de pago) o repartir el envío en dos días? | Starter cuando llegue el momento; repartir rompe "un email a la semana" y complica la idempotencia |
| Q4 | ¿Mantener el píxel de aperturas de Brevo (métrica útil, pero es rastreo) o solo clics? | Mantener aperturas informando en la política; revisar si un lector lo objeta |
| Q5 | El pie del email: ¿qué identificación pones (nombre y NIF/dirección postal, como exige la LSSI para comunicaciones comerciales)? Es un `{{DATO}}`. | Nombre a mostrar + ciudad + email de contacto; confirmar si hace falta dirección completa |
| Q6 | Lista inicial de fuentes de actualidad (§8.4): ¿añadir o quitar alguna? ¿Admitir la API oficial de Hacker News como fuente secundaria? | Aprobar la lista base; HN solo como secundaria con umbral de puntos |

## 17. Anotaciones que deja esta spec (no aplicadas)

- **Nota del vault (`Proyectos/josecoded.md`)**: nuevo módulo Newsletter (2026-09-29): semanal con borrador automático el lunes si no hay manual, aprobación obligatoria en admin, generación con Claude CLI en un contenedor de Omen (Mac como respaldo), tres salidas (post `.md` en el repo vía PR del bot, campaña de Brevo desde `novedades@josecoded.com`, paquete de LinkedIn para copiar), lista propia en Supabase con doble opt-in y Brevo como espejo, solo español en v1, fuentes de actualidad por feeds oficiales; fuera de la v1 (fase 10). Supera la nota del DT "newsletter no hasta ≥ 10 artículos".
- **`ESTADO.md`**: en Pendientes, "Spec newsletter v1 escrita (2026-09-29), pendiente de que Jose responda Q1–Q6 y de `ux`/`ui` + plan de la fase 10 tras el lanzamiento"; insumos nuevos de Jose (Brevo, DNS, PAT, `setup-token`, fuentes, política de privacidad, temas iniciales).
- **ADR (codebase-memory)**: "Newsletter: cola de trabajos en tablas sondeada por un runner externo con token de alcance mínimo (mismo patrón que Radar); el runner nunca aprueba ni envía" · "Posts generados como `.md` puro publicados por PR del bot con auto-merge; el clic de aprobación de Jose es el OK del despliegue de contenido" · "Supabase como fuente de verdad de suscriptores; Brevo espejo" · "Telegram de newsletter por la Edge Function `notify` (eventos aditivos), sin botones" · "Generación en Omen con Claude CLI; Mac de respaldo con el mismo runner".
