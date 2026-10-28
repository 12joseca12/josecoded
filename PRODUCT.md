# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) desplegado en Cloudflare Workers con OpenNext; monorepo `apps/web` + `apps/api` con pnpm. Se conservan sin reescribir el gateway `josecoded-api` (Worker), el backend `josecoded-worker` en Omen, Supabase (`nrgrmymsjtgayzejtawa`) y el dominio `josecoded.com`. Detalle en `CLAUDE.md` y en la spec.

## Users

Una sola identidad pública: **Jose, desarrollador freelance** (web con Next.js, móvil con React Native, IA integrada). No hay dos audiencias con páginas separadas; la oferta completa vive en `/servicios` con cuatro vías de trabajo y cada persona encuentra la suya (spec v2.0 §0, D36).

- **Marta, dueña de negocio local** (clínica, restaurante, tienda, taller). Entre 35 y 55 años, no técnica, llega desde el móvil por una recomendación, una búsqueda local o un afiliado. Quiere saber en un minuto qué le harían, desde cuánto, si Jose es de fiar y cómo hablar sin compromiso. Se va si encuentra jerga, si no hay precio orientativo o si el formulario es largo. Su vía: packs y propuesta.
- **Dani, CTO o responsable técnico** de una empresa que contrata un externo por horas o un proyecto cerrado. Escritorio; llega desde LinkedIn, GitHub o una búsqueda. Mira proyectos, el lab, cómo trabaja Jose y cómo está hecha esta web. Su vía: por horas o proyecto cerrado; reserva 20 minutos.
- **Nuria, agencia o consultora que subcontrata** React Native, Next.js o IA. Llega por el enlace de un mensaje de Jose a `/partners` o de rebote a la home. Busca la puerta de agencias (marca blanca, por hora o feature cerrada).
- **Pablo, reclutador técnico o hiring manager** que evalúa a Jose para plantilla o un externo largo. LinkedIn o búsqueda del nombre. Busca el CV y una forma rápida de hablar.
- **Jose, operador.** Único usuario de `/admin` (CRM propio: contactos, contextos del chat, hilos con takeover). Escritorio y Telegram en el móvil. Confirma o descarta en un toque.

Ninguna persona tiene más peso que otra en la home: cada una encuentra su vía en la escena Servicios y en ⌘K.

## Product Purpose

Es la plataforma web personal de Jose, desarrollador full-stack freelance. Hace cuatro cosas:

- presentar a Jose con una sola narrativa (web, móvil, IA) y demostrar el perfil con proyectos publicados, blog técnico, `/lab` y la propia web
- captar trabajo por cuatro vías en `/servicios`: por horas (40 €/h), proyecto cerrado (feature desde 150 €), cinco packs con precio cerrado (P1–P4 web y P5 app móvil) y «Abierto a contratación» (CV); más `/partners` para agencias y consultoras
- chat con IA sin cuenta obligatoria, que responde según el caso (cliente, agencia, reclutador, curioso) con el contexto que Jose publica desde el CRM
- área privada de clientes y CRM propio en `/admin` (Radar queda como módulo futuro del CRM)

Métricas de éxito a tres meses del lanzamiento:

- 4 o más leads cualificados al mes, sumando todas las vías.
- 2 o más conversaciones de agencia al mes, iniciadas desde `/partners` o el CRM y con respuesta.
- 1 o más contactos de reclutador al mes por la vía «Abierto a contratación».
- Contenido en el lanzamiento: 3 o más guías en el blog (y 1 nueva al mes) y 2 o más demos en `/lab`.
- Un visitante entiende sin hacer scroll qué hace Jose y llega a sus precios en un gesto.
- Core Web Vitals en verde en móvil 4G con las animaciones activas.

## Positioning

Jose se presenta como freelance con proyectos propios, no como agencia. La propia web es la prueba de oficio: se lee como un despliegue técnico real y a la vez es clara para alguien no técnico. Tiene una mecánica que un competidor no puede copiar tal cual: la escena del hero está hecha de caracteres reales de código que forman, por turnos, un móvil, una web y un chip de IA, que son las tres cosas que Jose construye.

## Operating Context

- Home: Sobre mí · Servicios · Proyectos · Lab/Blog · ¿Empezamos? (D45). La home es una muestra: la cabecera (Sobre mí · Servicios · Proyectos · Lab · Blog, más EN, ⌘K, Chat y Login), el menú, ⌘K, el pie y los enlaces de cada escena llevan a pantallas propias; solo el indicador de sección y el paginado se quedan dentro de la home. «Para agencias» (`/partners`) vive en la escena Servicios, en el menú ☰, en ⌘K y en el pie; «Contacto» en el cierre, el menú y ⌘K.
- Marta: home → Servicios (packs con precio) → `/servicios#packs` → generador o WhatsApp.
- Dani: home → Proyectos / Lab → Servicios «Por horas» → reservar 20 min.
- Nuria: enlace directo a `/partners`, o home → Servicios → «Para agencias».
- Pablo: home → Sobre mí o Servicios «Abierto a contratación» → Descargar CV.
- La web es bilingüe: `es` sin prefijo y `en` en `/en`.
- Los precios salen solo de `Comercial/tarifas.md` (vault) a través de `pricing.json`. El modelo de IA clasifica la petición; el precio lo calcula una tabla de reglas.
- Los textos comerciales siguen `Comercial/voz.md`.

## Capabilities and Constraints

- **Público:**
  - home
  - `/servicios` (cuatro vías, cinco packs y extras); `/empresas` y `/negocios` se retiran con 301
  - `/partners` (agencias y consultoras)
  - generador de propuesta con IA
  - Proyectos
  - Sobre mí
  - blog técnico en MDX con comentarios moderados y `/lab` (demos propias; sin WebGL)
  - chat IA por casos, sin cuenta obligatoria, con takeover humano desde el CRM
  - contacto con Turnstile
  - auth con Google, GitHub o email
- **Privado:**
  - área de clientes y afiliados
  - CRM propio en `/admin` (solo Jose)
  - Radar (módulo del CRM, fuera del lanzamiento)
- **Fuera de alcance:**
  - foro
  - staff
  - newsletter (aplazada)
  - modo claro
  - testimonios fabricados
  - datos en vivo de infraestructura
  - escenas WebGL fuera del hero
- **Rendimiento:**
  - Lighthouse móvil: rendimiento ≥ 90, accesibilidad ≥ 95, SEO 100.
  - LCP < 2,5 s, INP < 200 ms y CLS < 0,1 en 4G.
  - La escena del hero va en diferido tras el LCP, con un bundle ≤ 200 KB gz. El JS de la home sin la escena ≤ 350 KB gz.
- **SEO y GEO de primer nivel:** JSON-LD de entidad única, `llms.txt` generado en build y contenido citable.
- **Abierto (no inventar):** los 14 `{{DATO}}` de UX §18 y, además, los textos comerciales nuevos de la v2.0 (subtítulo del hero, titulares, frase por vía, resúmenes, demo y guías; lista viva en `docs/superpowers/design/ref/home-v7/README.md` §15), que escribe `redactor` con `voz.md`. Los 14 de UX §18:
  - nombre a mostrar, ciudad y años de experiencia
  - estado real de 3catinfo, HazmeFila y Oportunix
  - certificaciones
  - WhatsApp y email
  - usuario de GitHub
  - enlaces de las stores

## Brand Commitments

- La marca canónica es `josecoded`; no se reintroduce "Jose Dev".
- La web es solo oscura, pero no negro puro (decisión de Jose).
- La escena de partículas-glifo se conserva: caracteres reales de código que morfan móvil → web → chip IA, más la intro por caída en la primera visita de cada sesión (D16). El estilo visual que la rodea está reabierto desde el 2026-09-24.
- Referencias de Jose:
  - la claridad de raycast.com, pero con más color
  - el movimiento, las transiciones y las respuestas al pulsar de igloo.inc, lusion.co y activetheory.net, sin marear
- **Preferencia fija (2026-09-24):** nada de metáforas de objetos físicos (placas, planos, carteles, instrumentos). Se busca un sistema tech limpio a nivel de estudio, con raycast.com e igloo.inc como listón de acabado. El único concepto de la web es la escena de glifos. Las direcciones visuales no se sortean; se ejecuta el estándar de la categoría con esa calidad. En diseño se usan juntas las skills de impeccable y las de Emil Kowalski.
- Sin métricas en la web: ni contadores, ni número de repos o apps, ni estadísticas. Los precios «desde X €» sí se muestran, siempre con «desde» y «sin IVA» antes de la cifra.
- Rechazos explícitos:
  - glassmorphism de plantilla
  - gradientes morados genéricos
  - Inter con texto degradado
  - iconos brillantes
  - copy vacío
  - parallax de fondo
  - gradientes animados
  - inclinaciones o escalas al hacer hover
  - aspecto "de web normal"

## Evidence on Hand

- Proyectos reales: 3catinfo (app en stores), Oportunix, HazmeFila y webs de comercios. Su estado exacto está pendiente de que Jose lo confirme.
- Precios reales en `Comercial/tarifas.md`:
  - por horas 40 €/h; proyecto cerrado (feature) desde 150 €
  - packs: 900, 1.400, 2.500 y 4.200 € (web) y app móvil desde 4.000 € (ampliada 6.000 €)
  - mantenimiento: 49 y 149 €/mes
- No hay testimonios, clientes citables ni métricas de resultados. No se fabrican.

## Product Principles

1. Claridad antes que espectáculo: el efecto técnico nunca tapa qué se ofrece, a quién ni cómo contactar.
2. Demostrar, no afirmar: la web es la prueba de oficio y cada afirmación tiene respaldo verificable.
3. Una identidad, cuatro puertas: un solo freelance, y cada persona (Marta, Dani, Nuria, Pablo) encuentra su vía y su precio en un gesto desde el hero, sin jerga.
4. Nada inventado: ni precios fuera de `tarifas.md`, ni testimonios, ni cifras.
5. Jose decide: ninguna acción automática (envíos, correos, calendario) sin su confirmación.

## Accessibility & Inclusion

WCAG 2.2 AA (se verifica en `/puerta-calidad`) y diseño móvil primero. Con `prefers-reduced-motion` la web usa fundidos, sin intro, sin morph y con un poster estático. El texto real es accesible desde el primer instante aunque haya animación.
