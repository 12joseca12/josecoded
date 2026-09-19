# joseCoded — plataforma web personal (spec v1)

**Fecha:** 2026-09-13 · **Perfil:** web · **Estado:** v1.4 (2026-09-17: dirección visual redefinida, §12 UI/R14). v1.3 (decisiones técnicas P1–P6). v1.1 (2026-09-14: packs escalonados, extras, ampliaciones y afiliados, R12). v1 cerrada el 2026-09-13 con la batería de preguntas a Jose (R1–R11). Sustituye a la v0.

## 1. Objetivo y métricas

**Objetivo:** rehacer joseCoded desde cero como plataforma web personal de Jose con dos audiencias de igual peso:

- **(A) Empresas que contratan** (equipos técnicos, CTOs, reclutadores): la web es a la vez portfolio y demostración. Debe mostrar habilidades y conocimientos —en datos y con la propia web— y leerse como una innovación tecnológica y un despliegue técnico real.
- **(B) Negocios locales que encargan una web**: Jose actúa como freelance con proyectos propios. **No se vende como agencia**; la "agencia de webs para negocios" queda absorbida en la oferta freelance.

Se conservan y no se reescriben `josecoded-api`, `josecoded-worker`, Supabase y el dominio. Estilos, objetivos y UI/UX son nuevos.

**Métricas de éxito (a 3 meses del lanzamiento):**
- (B) ≥ 4 leads cualificados/mes desde la web (formulario, generador de propuesta o WhatsApp con origen web).
- (A) ≥ 2 contactos de empresa/mes; tiempo medio en "Proyectos" y "Sobre mí" > 90 s.
- Un visitante sin scroll entiende qué hace Jose, para quién y cómo contactar (validado por `usuario-ejemplo` con ambas personas).
- Core Web Vitals en verde en móvil 4G (LCP < 2,5 s, INP < 200 ms, CLS < 0,1) con las animaciones activas.
- Lighthouse móvil: rendimiento ≥ 90, accesibilidad ≥ 95, SEO 100. WCAG 2.2 AA en `/puerta-calidad`.
- GEO: josecoded aparece citado al preguntar a ChatGPT/Perplexity/Google AI "desarrollador full-stack React Native freelance en <ciudad de Jose>" y "quién es Jose (josecoded)" (protocolo de verificación en §8).
- Nada publicado sin contenido real.

## 2. Personas

**Principal (para `usuario-ejemplo`): "Marta, dueña de negocio local"** (clínica, restaurante, tienda, taller). 35–55 años, sin perfil técnico, entra desde el móvil por recomendación, LinkedIn o búsqueda local. Quiere saber en un minuto qué le harían, desde cuánto, si Jose es de fiar y cómo hablar con él sin compromiso. Abandona ante jerga, ausencia de precio orientativo o formularios largos. Su ruta: home → "Webs para tu negocio" → generador de propuesta o WhatsApp.

**Secundaria: "Dani, CTO / responsable técnico / reclutador"** que evalúa contratar a Jose (proyecto o puesto). Entra desde escritorio, mira stack, proyectos reales en stores, código, cómo trabaja y cómo está hecha esta web. Su ruta: home → "Proyectos" → "Sobre mí" / "Cómo trabajo" → chat IA o contacto.

`usuario-ejemplo` valida siempre con Marta; con Dani en Proyectos, Sobre mí, chat y blog.

## 3. Inventario de josedev y destino

| Pieza de josedev | Destino en josecoded |
|---|---|
| Home, `/services`, `/sobre-mi` | Se rehacen con la narrativa de las dos audiencias |
| Blog (`blog_posts`, markdown, `ai/blog/*` en el worker) | **Se conserva**, reescrito en MDX en el repo (D8), con comentarios |
| Foro (`/foro/*`, 6 tablas, rutas `forum/*`) | **Se elimina del frontend.** Lo sustituyen los comentarios en artículos. Rutas del gateway y tablas quedan intactas |
| Terminal admin-chat (IA Workers AI + takeover humano, rutas `admin-chat/*`) | **Se conserva** como asistente sobre Jose, con nueva UI |
| `/auth`, `/perfil` (Supabase Auth) | **Se conservan**: una cuenta para chat, comentarios y portal (Google, GitHub, email) |
| Área de clientes (proyecto, tareas, assets, pack) | **Se conserva**, UI nueva sobre las tablas existentes |
| Admin (`/admin`: leads, clientes, packs, finanzas, chats) y closer | **Se sustituye** por un panel admin nuevo, solo Jose (D9). Closer, comisiones y finanzas: fuera; CRM comercial en Notion |
| `/staff/*`, MFA de staff | Fuera (sin staff). Admin = Jose con `staff_members.role='admin'` |
| SEO/GEO (sitemap, robots, OG dinámica, JSON-LD, `llms.txt`, alternates) | Se porta y se amplía (§8) |
| Iconos "jc", carrusel de 3catinfo con marco de móvil | Iconos: rehacer. Carrusel: reutilizar la idea en Proyectos |
| Demo de emulador Android | No vuelve |

## 4. Alcance

No hay MVP: se lanza el **producto final v1** completo, cuanto antes. El trabajo se organiza en ramas por feature con `/puerta-calidad` en cada una, pero producción se abre con todo.

### Producto final v1

**Público**
1. Home: tesis en una frase, dos vías (empresa / negocio local), prueba real visible sin scroll, motion GSAP con propósito.
2. "Trabajo con empresas" (audiencia A): servicios freelance (web, móvil, IA integrada), stack, forma de trabajar, CV descargable.
3. "Webs para tu negocio" (audiencia B): cuatro packs escalonados (P1 básica, P2 pedidos/reservas, P3 gestión, P4 gestión + automatizaciones) con precio cerrado "Desde X €" y extras aparte (mantenimiento básico/extendido, SEO básico/completo, GEO, análisis de ciberseguridad), tomados de `Comercial/tarifas.md`; proceso; CTA al generador de propuesta y a WhatsApp. Los "extras regalados por pack" NO se muestran en la web (son argumento de cierre en la propuesta).
4. **Generador de propuesta con IA**: el negocio describe lo que necesita; la IA lo clasifica en un pack (P1–P4) y extras; el precio orientativo sale de `pricing.json`; al enviarlo se crea un lead cualificado (D5). Si llega con `?ref=CODIGO`, el lead queda atribuido al afiliado (D15).
5. Proyectos: casos reales (3catinfo, Oportunix, HazmeFila, webs de comercios) con pruebas verificables; alimentado después por `/caso-de-exito`.
6. Sobre mí.
7. Blog en MDX con comentarios de usuarios registrados (D8, D10).
8. **Chat IA** asistente sobre Jose, con takeover humano desde el admin (D6).
9. Contacto: formulario corto + WhatsApp + email, Turnstile.
10. Auth de visitantes: Supabase Auth con Google, GitHub y email.
11. i18n es/en.
12. SEO tradicional + GEO de primer nivel (§8).

**Privado**
13. Área interna de clientes y afiliados (`/area-clientes`): proyecto, tareas, comentarios, assets, pack contratado y extras; **ampliaciones** (solicitar subir de pack o añadir extras, con precio calculado por regla: diferencia de lista, sin descuento); **afiliados**: código y enlace propios, leads atribuidos, estado de cada recompensa (pendiente / abonada). Todo usuario del área puede ser afiliado; el nivel premium lo asigna Jose (D15).
14. **Panel de administrador** (`/admin`, solo Jose): bandeja de leads (incluidas propuestas IA y afiliado atribuido), moderación de comentarios, gestión del área de clientes (clientes, tareas, assets, packs, extras, solicitudes de ampliación), afiliados (nivel, recompensas pendientes, marcar abonadas), conversaciones del chat con takeover.

**Transversal:** analítica Umami con eventos (D11), Telegram vía n8n para avisos, `prefers-reduced-motion`, accesibilidad AA.

### Post-lanzamiento
Solo las ideas candidatas de §4.1 que Jose apruebe. Nada más queda pendiente.

### Fuera
Foro, closer/comisiones/finanzas, staff, demo de emulador, 3D/WebGL, datos en vivo, panel de estado de infraestructura, sección de I+D, testimonios fabricados, modo claro.

### 4.1 Ideas candidatas (no están en alcance; máx. 5)

| Idea | Beneficio | Coste | Audiencia |
|---|---|---|---|
| **Auditoría exprés**: el negocio pega la URL de su web actual y recibe informe (PageSpeed API + resumen IA) y CTA | Lead muy cualificado con dolor concreto; GEO citable | Medio: 1 ruta en el gateway, cuota de PageSpeed, plantilla de informe | B |
| **Servidor MCP público** "pregúntale a josecoded" (perfil, proyectos, disponibilidad) sobre el gateway | Innovación real y GEO literal: los agentes consultan la fuente | Medio-bajo: reutiliza `knowledge.json`; skill `cloudflare:build-mcp` disponible | A |
| **CV/JSON Resume generado** desde la entidad única (JSON-LD → PDF y `/resume.json`) | Una fuente de verdad para web, PDF y crawlers | Bajo | A |
| **RSS + newsletter** del blog | Retención de audiencia técnica | Bajo (RSS) / medio (newsletter: proveedor) | A |
| **Playground de motion/componentes** (`/lab`) con el sistema de diseño propio | Demostración de oficio en frontend | Medio; riesgo de vitrina vacía | A |

## 5. Arquitectura

```
navegador
 └─ apps/web (Next.js App Router, Cloudflare Workers vía OpenNext, sin middleware Node)
     ├─ público: RSC estáticos/ISR, MDX del blog, GSAP en cliente
     ├─ Supabase (publishable key + RLS): auth, comentarios, leads, portal, admin
     └─ NEXT_PUBLIC_JOSECODED_API_URL → apps/api (josecoded-api, Hono, Cloudflare Worker)
           ├─ conservado: /api/v1/{health, auth/me, system/status, admin-chat/*, admin-chat/admin/*, forum/*}
           ├─ NUEVO aditivo: /api/v1/proposals/generate  (Workers AI + reglas de precio)  [D5]
           ├─ NUEVO aditivo: /api/v1/notify/lead          (→ worker n8n/trigger → Telegram) [D9]
           └─ WORKER_URL + token interno → josecoded-worker (Omen): ai/*, n8n/*, storage/*, system/*
 stats.josecoded.com → Umami (Docker en Omen, Cloudflare Tunnel)                         [D11]
```

- **Frontend:** Next.js App Router, React Server Components, TypeScript estricto, Tailwind CSS v4, shadcn/ui como base (re-tematizado por `ui`), GSAP + `@gsap/react` + ScrollTrigger, `next/font` autoalojado, MDX (`@next/mdx` o `next-mdx-remote`) para blog y contenido largo. **Sin middleware Node**: guards de `/admin` y `/area-clientes` en layouts server-side leyendo la sesión Supabase (`@supabase/ssr`) y `staff_members.role='admin'` / `clients.user_id`.
- **Auth:** Supabase Auth, proveedores Google, GitHub y email (magic link o password). Una única cuenta de visitante sirve para chat, comentarios y portal. Rol admin = `staff_members.role='admin'`. Los proveedores OAuth se configuran en el dashboard de Supabase (tarea de Jose).
- **Datos:** el sitio público no consulta Supabase en tiempo de petición salvo comentarios (RSC con caché corta), formulario, generador y chat. Contenido de servicios, proyectos y blog en MDX/JSON versionado.
- **Gateway (`apps/api`):** el código de `josecoded-api` se mueve a este repo con su propio `wrangler deploy`; rutas existentes intactas; se **añaden** `proposals/generate` y `notify/lead`, y el origen nuevo en CORS. `knowledge.json` se actualiza con el perfil nuevo.
- **Worker de Omen:** sin cambios. Se usa `n8n/trigger/<workflow>` para Telegram y, desde scripts locales, `ai/blog/*`.
- **Supabase:** tablas heredadas intactas. Migraciones **aditivas**: `blog_comments` (slug, user_id, body, status, parent_id) con RLS; columna `leads.ai_proposal jsonb` y `leads.source`; política de insert anónimo de `leads` restringida a los campos del formulario. `list_tables` y `get_advisors` antes; aplicar en producción solo con OK de Jose en la sesión.
- **Repo:** monorepo pnpm workspaces: `apps/web`, `apps/api`, `packages/config` (eslint, tsconfig compartidos), `supabase/` (migraciones). Un solo `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en la raíz.
- **Entornos:** preview por rama (Workers preview) y producción en josecoded.com. Deploy a producción con OK explícito de Jose.

## 6. Decisiones

| # | Decisión | Razón | Descartado |
|---|---|---|---|
| D1 | Dos audiencias de igual peso (A empresas, B negocios locales); sin marca de agencia | R1: Jose se presenta como freelance con proyectos propios; la web es portfolio y demostración | "Técnico primero" (P8 josedev); "captación primero" (v0) |
| D2 | Persona principal Marta; secundaria Dani | R2 | Persona única |
| D3 | Cloudflare Workers vía OpenNext, sin middleware Node; tarea 0 del plan valida un despliegue real; fallback Vercel sin cambiar código | R3. Todo lo demás está en Cloudflare; el bloqueo previo era el middleware, que aquí no existe por diseño | Vercel como primera opción; Pages estático |
| D4 | Foro eliminado; comentarios en artículos | R4 | Mantener el foro |
| D5 | Generador de propuesta con IA en el gateway: `POST /api/v1/proposals/generate` con Workers AI (el mismo binding que ya usa admin-chat). El modelo **clasifica** la petición en servicios y extras; el **precio lo calcula una tabla de reglas** derivada de `Comercial/tarifas.md`, nunca el modelo. Turnstile + rate limit por IP; Cloudflare AI Gateway delante del binding (caché, límites, logs). El visitante ve alcance + "desde X €" y decide enviarlo: se crea `lead` con `ai_proposal` | R5. Workers AI evita depender de que Omen esté encendido; separar clasificación de precio elimina precios inventados | Ollama en Omen (disponibilidad); Claude API (coste y otra credencial); precio generado por el LLM |
| D6 | Chat IA conservado sobre `admin-chat/*` (requiere cuenta; login con Google en un clic). El generador de propuesta es la vía anónima de Marta; el chat es sobre todo para Dani | R4. Reutiliza el contrato existente sin tocar el gateway; el takeover humano ya existe | Chat anónimo (exigiría nuevo modelo de conversación en el gateway); descartado en Q1 |
| D7 | Sin MVP: producto final v1 en ramas por feature con puerta de calidad cada una; producción se abre con todo | R7 | Lanzamiento por etapas |
| D8 | **Blog en MDX en el repo**, no desde el admin | Un solo autor; versionado en git; render estático perfecto para SEO/GEO; se evita construir un editor, subida de imágenes y previsualización; Claude Code y `ai/blog/*` asisten la redacción en local. El admin solo modera comentarios. `blog_posts` queda sin uso (no se borra) | Editor en el admin (coste alto, beneficio nulo con un autor); Notion como CMS (acopla la web al conector) |
| D9 | Panel admin propio en `/admin` (solo Jose, `staff_members.role='admin'`): leads con propuestas IA, moderación, portal cliente, chat con takeover. Aviso de leads por Telegram: Edge Function `notify` (evento `lead.created`) como vía primaria, n8n opcional (decisión P3, 2026-09-17) | R9. El CRM comercial (propuestas, seguimiento) sigue en Notion vía skills; el admin es operativo, no comercial | Ver leads solo en Notion; email |
| D10 | Comentarios solo con cuenta (Google/GitHub/email), estado `pending`/`approved`/`rejected`, moderación en admin; publicación posterior a moderación (cola de aprobación, Q2) | R10 | Comentarios anónimos; servicio externo (Giscus: exige GitHub y no sirve a Marta) |
| D11 | **Umami autoalojado en Omen** (contenedor nuevo, `stats.josecoded.com` por Cloudflare Tunnel) con eventos `whatsapp_click`, `contact_submit`, `proposal_generated`, `proposal_sent`, `chat_started`, `call_booked`. Cloudflare Web Analytics activo como complemento (un script, sin cookies, sin coste) | R11. Cloudflare Web Analytics no tiene eventos personalizados ni embudos; Umami sí, sin cookies ni banner | GA4 (banner y peso) |
| D12 | Oscuro únicamente, tech elegante, "que no parezca hecho por IA": `ux` y `ui` proponen 2–3 direcciones; prohibido: gradientes morados genéricos, glassmorphism de plantilla, Inter + texto degradado, iconos brillantes, copy vacío. Sin 3D | R8 | Claro por defecto (v0); HUD "Reactor" de P8 se toma como antecedente, no como punto de partida |
| D13 | Precios de packs y extras con fuente única `Comercial/tarifas.md` (con fecha de vigencia) → `pricing.json` en el repo con script de sincronización manual. `pricing.json` contiene packs, extras, regla de ampliación (diferencia de lista) y regla de afiliados (2 meses / 10 % / 20 % sobre el primer pedido sin IVA); los regalos por pack se excluyen del JSON público. Propuestas y presupuestos ya emitidos conservan sus precios en Notion | R8. Una sola fuente para web, generador, área de clientes y skills comerciales; los precios cambian con el tiempo sin reescribir código | Precios escritos a mano en la página; histórico de versiones en tarifas.md |
| D15 | **Programa de afiliados en la web v1**, dentro del área interna: código por usuario, enlace `?ref=CODIGO` guardado en cookie de 30 días y volcado al `lead` al crearse (formulario, generador o chat); al marcar el lead como cerrado y cobrado en admin se genera la recompensa por regla (cliente: 2 meses de mantenimiento; no cliente: 10 %; premium: 20 %; base = primer pedido sin IVA); el pago es manual y el admin lo marca como abonado. Un lead, un afiliado; sin autoreferidos | R12 (decisión de Jose 2026-09-14). Programa simple, verificable y visible para el afiliado sin construir pasarela de pagos | Llevarlo a mano en Notion; post-lanzamiento |
| D14 | Monorepo `apps/web` + `apps/api`; josedev congelado como referencia | R9 | Dejar el gateway en josedev; repo propio |
| D15 | i18n es/en; `es` sin prefijo, `en` en `/en`; blog puede tener artículos solo en un idioma (alternates solo cuando existe la traducción) | R6 | Solo es |

## 7. Restricciones

- No se reescriben `josecoded-api`, `josecoded-worker` ni el esquema de Supabase. Solo cambios **aditivos** (rutas nuevas, migraciones nuevas, configuración). Contratos existentes intocables.
- Variables heredadas: `NEXT_PUBLIC_JOSECODED_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- El navegador nunca habla con el worker de Omen; el token interno no toca el frontend. Servicios preexistentes de Omen intocables; Umami es un contenedor nuevo.
- Cuenta Cloudflare: `developerjose12@gmail.com` (account `d26022a34346cb759178a720bace386d`). Supabase `josecoded` (`nrgrmymsjtgayzejtawa`), plan gratuito, uno de los dos proyectos activos.
- Marca canónica `josecoded`; entidad única (Person + Organization + WebSite); no reintroducir "Jose Dev".
- Producción y migraciones: OK explícito de Jose en la sesión. Gmail solo borradores. Notion solo desde skills comerciales.
- `pnpm` únicamente. Accesibilidad WCAG 2.2 AA. Móvil primero.
- Precios y textos comerciales dependen de `Comercial/tarifas.md` y `Comercial/voz.md` en el vault (los exige también `/propuesta`).

## 8. SEO tradicional + GEO (requisito de primer nivel)

**SEO clásico (criterios):**
- Toda ruta pública: `title` único ≤ 60 car., `description` ≤ 155, canonical, `alternates` es/en con `x-default`, OG/Twitter image generada.
- `sitemap.xml` con ambos idiomas y `lastmod`; `robots.txt`; 301 desde las URLs públicas de josedev que tengan equivalente (`/services`, `/sobre-mi`, `/en/...`); `/blog/<slug>` antiguos y `/foro/*` → 410 (Q4).
- HTML semántico, un `h1` por página, imágenes con `alt` y dimensiones, `next/image` con AVIF/WebP.
- Rendimiento: CWV en verde con GSAP activo (animaciones fuera del hilo crítico, `will-change` medido, `ScrollTrigger` con `matchMedia`).
- Palabras clave objetivo por página validadas con Semrush (`keyword_research` en `es`) antes de escribir copy.

**GEO (criterios):**
- `llms.txt` y `llms-full.txt` regenerados en build desde el contenido real (no a mano).
- Datos estructurados JSON-LD site-wide: `Person` (Jose, `sameAs` LinkedIn/GitHub/stores), `Organization` (josecoded), `WebSite` con `SearchAction`, `ProfilePage` en Sobre mí, `Service` + `Offer` con `priceSpecification` "desde" en servicios, `BlogPosting` con `author` en artículos, `FAQPage` en negocios locales, `SoftwareApplication` para 3catinfo (solo nombre y enlace a stores), HazmeFila y Oportunix. Validado con el validador de schema.org en CI (test de snapshot).
- Contenido citable: cada página de servicio y proyecto abre con un párrafo de 2–3 frases autocontenidas (quién, qué, para quién, dónde) y una sección de preguntas con respuestas directas.
- `robots.txt` permite explícitamente `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`; bloquea solo `/admin`, `/area-clientes`, `/auth`.
- Entidad única y coherente: mismo nombre, título y descripción en web, `llms.txt`, LinkedIn y GitHub (doc off-site que P5 dejó pendiente).
- **Protocolo de verificación** (post-lanzamiento, mensual): 10 preguntas fijas a ChatGPT, Perplexity, Claude y Google AI Overviews; se registra si citan josecoded.com y con qué texto. Baseline en el lanzamiento.

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Alcance grande sin MVP | Lanzamiento tardío | Orden del plan por valor: home + negocios + generador + contacto primero; portal y admin después; cada rama pasa `/puerta-calidad`; preview público para que Jose vea avance |
| OpenNext incompatible con la versión de Next | Bloquea despliegue | Tarea 0: hello world real en Workers con Server Actions y `@supabase/ssr`; fallback Vercel |
| Precio inventado por la IA | Propuesta engañosa, lead perdido | Precio solo por reglas (D5); el texto dice "orientativo, sujeto a propuesta" |
| Abuso del generador y del chat (coste Workers AI) | Coste y ruido | Turnstile, rate limit por IP y por usuario, cuota diaria en el gateway, alerta en Telegram |
| Contenido real insuficiente | Web genérica (fallo de P8) | Inventario de contenido y capturas como tarea del plan antes de `ux` |
| Cláusula de confidencialidad sobre 3catinfo | Legal | Decidido (Q6): nombre visible, sin métricas ni stack; ficha con campos ocultables |
| Programa de afiliados sin control | Recompensas indebidas (autoreferidos, leads falsos) | Un lead, un afiliado; sin autoreferidos (mismo email/usuario); la recompensa solo nace al marcar el lead cobrado a mano en admin |
| Omen apagado | Sin analítica ni Telegram (el sitio sigue) | `notify/lead` reintenta y, si falla, email vía Edge Function `notify`; Umami tolera huecos |
| Supabase pausado por inactividad | Auth, leads y comentarios rotos | Ping semanal (launchd/n8n) + alerta; formulario con fallback a email |
| Estética "hecha por IA" | Rechazo de Jose y de Dani | `ui` entrega 2–3 direcciones con lista negra explícita (D12); `usuario-ejemplo` y `ui` revisan la implementación |
| Ramas largas con Supabase Auth y RLS nuevas | Fugas entre clientes | `revisor-seguridad` en cada rama con RLS; tests de RLS con dos usuarios |

## 10. Criterios de aceptación de v1

- Sin scroll, en móvil, se entiende qué hace Jose, para quién y dos formas de contacto; `usuario-ejemplo` (Marta y Dani) sin abandonos en sus rutas de §2.
- Generador: descripción → propuesta con alcance y "desde X €" correcto según `pricing.json`; enviar crea `lead` con `ai_proposal` y Jose recibe Telegram en < 1 min.
- Chat: usuario con Google puede conversar; Jose ve la conversación en admin y toma el control.
- Blog: artículo MDX renderizado con JSON-LD `BlogPosting`; comentar exige cuenta; moderación cambia el estado y la vista pública.
- Portal: un cliente ve solo lo suyo (test RLS con dos cuentas); Jose gestiona tareas y assets desde admin.
- Ampliación: un cliente con P2 solicita P3 y ve 1.100 € (diferencia de lista según `pricing.json`); la solicitud aparece en admin.
- Afiliados: visita con `?ref=CODIGO` → lead creado con `affiliate_code`; al marcarlo cerrado y cobrado en admin con base 1.400 € se genera recompensa de 140 € (no cliente), 280 € (premium) o 2 meses de mantenimiento (cliente); el afiliado la ve en su área como pendiente y como abonada tras marcarla Jose.
- `/admin` inaccesible sin `staff_members.role='admin'` (comprobado sin middleware).
- SEO/GEO: todos los criterios de §8 verificados; redirecciones 301 probadas; `llms.txt` generado.
- Umami registra los seis eventos; Cloudflare Web Analytics activo.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde; `/puerta-calidad` pasa en todas las ramas; Lighthouse móvil ≥ 90/95/100.

## 11. Preguntas abiertas (resueltas el 2026-09-13)

| # | Pregunta | Decisión |
|---|---|---|
| Q1 | Chat con cuenta o anónimo | Con cuenta (login Google en un clic). D6 se mantiene |
| Q2 | Comentarios antes o después de moderar | Cola de aprobación: nada visible hasta aprobar en admin; el autor ve el suyo como "pendiente" |
| Q3 | `Comercial/tarifas.md`, `condiciones.md`, `voz.md` | Creados el 2026-09-13; tarifas v2 el 2026-09-14: 40 €/h, 150 €/feature; packs web P1 900 € (1 sem), P2 1.400 € (2 sem), P3 2.500 € (2 sem), P4 4.200 € (3 sem); app MVP 4.000 € (6 sem), app ampliada 6.000 € (8 sem); extras: mantenimiento 49 / 149 €/mes sin hosting, SEO 250 / 600 €, GEO 300 €, ciberseguridad 250 €; regalos por pack no oficiales; ampliación = diferencia de lista; afiliados 2 meses / 10 % / 20 % (D15). Dominio y hosting a cargo del cliente. Ejemplos de voz provisionales, pendientes de corrección por Jose |
| Q4 | Migrar `blog_posts` a MDX | Partir de cero. Los slugs antiguos `/blog/<slug>` devuelven 410 (no 301) |
| Q5 | Ciudad para SEO local | Toda España, sin ciudad: `areaServed: ES`. Sin páginas "diseño web en <ciudad>" |
| Q6 | Confidencialidad 3catinfo | Se muestra el nombre; **sin métricas ni stack**. La ficha de proyecto admite ocultar esos campos |
| Q7 | OAuth Google/GitHub en Supabase | No está. Tarea de Jose antes de la rama de auth (en ESTADO.md) |
| Q8 | Quién monta Umami | Tarea `infra` del plan (`implementador-infra`), OK de Jose antes de exponer `stats.josecoded.com` |
| Q9 | Modelo de Workers AI | Se mantiene Llama 3.3 70B para generador y chat |

## 12. Decisiones de UX, UI e integraciones (batería del 2026-09-17, R13)

**UX**
- Home sin scroll: tesis en una frase + dos vías con el mismo peso (Empresas / Negocios).
- Navegación: Empresas · Negocios · Proyectos · Blog · Sobre mí + CTA Contacto. Chat y área privada como accesos secundarios (cabecera/pie). Móvil: desplegable.
- Generador de propuesta: chat guiado de 3–4 preguntas (tipo de negocio, qué debe hacer la web, ¿vende o reserva online?, plazo) → propuesta. Nunca página en blanco.
- Acción primaria de contacto: Negocios → WhatsApp; Empresas → formulario/email y reserva de llamada (calendario).

**UI** (redefinida el 2026-09-17 tras rechazar Jose las tres direcciones y la demo de motion; R14)
- Referencias: **limpieza y claridad de raycast.com** (pero menos negro: con color, verde o morado) + **efectos de scroll, animaciones al pulsar y transiciones de página de igloo.inc, lusion.co y activetheory.net**, sin marear. Elementos interactivos, no simples tarjetas.
- "Futurista pero elegante, muy tecnológico sin recargar; wow de diseño y animación". El wow debe venir de: (1) **profundidad y materiales** (capas, luz volumétrica, vidrio/metal, sensación 3D sin 3D real), (2) **transiciones morph entre secciones** (la interfaz se transforma, nada se recarga), (3) **detalle microscópico** en cada hover, foco y cambio de estado.
- Hero: de fondo, **código que se sobreescribe alternando sus letras, lento y no todo de golpe**; el título hace lo mismo pero resuelve rápido en el título final. El fondo no debe quitar atención a las llamadas a la acción.
- Rechazado: ejecución plana sin profundidad ni acabado; tipografía y composición "de web normal"; partículas, ondas, retículas y visual generativo decorativo; el foco de luz estático.
- Solo modo oscuro (no negro puro). Tipografías con roles distintos (titulares / texto / UI). Motion GSAP + scroll suave con barra propia, desactivable por `prefers-reduced-motion`.
- Aprobación: `ui` estudia las referencias en el navegador, entrega **un prototipo único de la home** (IDE-lite de UX v2.1) en HTML real y se itera con Jose hasta aprobar antes del plan.

**Integraciones externas (además de Supabase, gateway, worker de Omen, n8n→Telegram, Umami)**
- GitHub: actividad y repos públicos (API pública, cacheada en build/ISR) como prueba real para Dani.
- Stores: App Store / Google Play, valoraciones y enlaces en fichas de apps.
- Calendario: Cal.com (preferido, open source, embebible) o Calendly para "reserva 20 min" en la vía Empresas.
- Jose está abierto a más propuestas: el diseño técnico lista candidatas con coste/beneficio.

**Tests**
- Vitest (lógica, componentes, `pricing.json`, reglas de afiliados/ampliación) + integración (rutas del gateway, RLS) + Playwright E2E en flujos críticos (generador, contacto, auth, área privada, admin) + snapshot de JSON-LD + Lighthouse CI en build.

**Documento previo a implementación (pedido por Jose):** pantallas, componentes por pantalla, subpantallas y páginas de error (404, 500, sin permisos, offline), funcionalidades, stack, restricciones, flujos, tests, preview de estilos aprobada, integraciones con API/worker y con plataformas externas. Se consolida en `docs/superpowers/design/` antes del plan.

## Anexo A — Contratos conservados del gateway (`apps/api`, montado en `/api/v1`)

- `GET /health` (público), `GET /api/v1/health`.
- `GET /api/v1/auth/me`, `GET /api/v1/system/status` (JWT Supabase; `system/status` proxya al worker).
- `admin-chat/*`: `GET thread`, `POST messages`, `POST meeting`, `POST n8n/inbound`. `admin-chat/admin/*`: `GET conversations`, `GET/POST :id/messages`, `POST :id/ai`, `POST :id/read` (solo admin: `staff_members.role='admin'`).
- `forum/*`: intactas, sin consumidor.
- Middlewares: `requestId`, `securityHeaders`, CORS por origen (añadir preview y producción nuevos), rate limit fijo y de escritura.
- **Nuevas (aditivas):** `POST /api/v1/proposals/generate`, `POST /api/v1/notify/lead`.

## Anexo B — Worker de Omen (`josecoded-worker`, solo vía gateway)

`GET /health` (público); con token interno: `ai/status`, `ai/chat`, `ai/admin-chat`, `ai/blog/generate`, `ai/blog/improve`, `ai/summarize`, `n8n/status`, `n8n/trigger/:workflow`, `storage/list|upload|file/:area/:filename`, `system/status`. Sin cambios.

## Anexo C — Supabase

Heredadas e intactas (esquema real verificado el 2026-09-17 en el diseño técnico §0 y §6: no existe `admin_superusers`, el admin es `staff_members.role='admin'`): `blog_posts`, `forum_*` (6), `admin_chat_conversations`, `admin_chat_messages`, `staff_members`, `leads`, `lead_assignments`, `commission_entries`, `clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_pack_extras`, `pack_templates`, `pack_extras`. Edge Function `notify` (requiere `NOTIFY_SHARED_SECRET`).

Aditivas (solo se añade, nunca se altera lo heredado): `blog_comments`; `affiliates` (user_id, code, level `standard|premium`, created_at); columna `leads.affiliate_code` (nullable); `affiliate_rewards` (affiliate_id, lead_id, type `maintenance_months|percent`, amount, status `pending|paid`, paid_at); `upgrade_requests` (client_id, from_pack, to_pack, extras[], computed_price, status). RLS: cada usuario ve solo sus filas; Jose (`staff_members.role='admin'`) ve todo. `pack_templates` y `pack_extras` heredadas se alinean con `pricing.json` mediante el script de sincronización (no se editan a mano).

Aditivas previstas: `blog_comments` + RLS; `leads.ai_proposal jsonb`, `leads.source text`; política de insert anónimo en `leads` acotada. Todas con `list_tables` y `get_advisors` antes y después, y OK de Jose para producción.
