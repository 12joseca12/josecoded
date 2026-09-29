# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) desplegado en Cloudflare Workers con OpenNext; monorepo `apps/web` + `apps/api` con pnpm. Se conservan sin reescribir el gateway `josecoded-api` (Worker), el backend `josecoded-worker` en Omen, Supabase (`nrgrmymsjtgayzejtawa`) y el dominio `josecoded.com`. Detalle en `CLAUDE.md` y en la spec.

## Users

- **Marta, dueña de negocio local** (clínica, restaurante, tienda, taller), persona principal. Tiene entre 35 y 55 años y no es técnica. Llega desde el móvil por una recomendación, por LinkedIn o por una búsqueda local. Quiere saber en un minuto qué le harían, desde cuánto, si Jose es de fiar y cómo hablar con él sin compromiso. Se va si encuentra jerga, si no hay precio orientativo o si el formulario es largo.
- **Dani, CTO, responsable técnico o reclutador**, persona secundaria. Evalúa contratar a Jose para un proyecto o un puesto. Llega desde escritorio y mira el stack, los proyectos publicados en las stores, el código, cómo trabaja Jose y cómo está hecha esta web.
- **Jose, operador.** Es el único usuario del admin y de Radar. Revisa la bandeja desde el móvil (Telegram) varias veces al día y desde el escritorio una vez al día. Confirma o descarta en un toque.

Las dos audiencias públicas tienen el mismo peso.

## Product Purpose

Es la plataforma web personal de Jose, desarrollador full-stack freelance (web con Next.js y apps móviles con React Native). Hace cuatro cosas a la vez:

- portfolio y demostración técnica para empresas
- canal de captación para negocios locales, con packs de precio cerrado "desde X €", un generador de propuesta con IA y WhatsApp
- área privada para clientes y afiliados
- herramienta interna de Jose (admin y Radar: caza de empleo y encargos, que nunca envía nada sin su confirmación)

Métricas de éxito a tres meses del lanzamiento:

- 4 o más leads cualificados al mes de negocios locales.
- 2 o más contactos de empresa al mes.
- Un visitante entiende sin hacer scroll qué hace Jose, para quién y cómo contactar.
- Core Web Vitals en verde en móvil 4G con las animaciones activas.

## Positioning

Jose se presenta como freelance con proyectos propios, no como agencia. La propia web es la prueba de oficio: se lee como un despliegue técnico real y a la vez es clara para alguien no técnico. Tiene una mecánica que un competidor no puede copiar tal cual: la escena del hero está hecha de caracteres reales de código que forman, por turnos, un móvil, una web y un chip de IA, que son las tres cosas que Jose construye.

## Operating Context

- Marta entra desde el móvil y su camino es: home → "Webs para tu negocio" → generador de propuesta o WhatsApp.
- Dani entra desde el escritorio y su camino es: home → Proyectos → Sobre mí / Cómo trabajo → chat IA o contacto.
- Navegación clásica: Empresas · Negocios · Proyectos · Blog · Sobre mí, más ES/EN, Entrar y Contacto.
- La web es bilingüe: `es` sin prefijo y `en` en `/en`.
- Los precios salen solo de `Comercial/tarifas.md` (vault) a través de `pricing.json`. El modelo de IA clasifica la petición; el precio lo calcula una tabla de reglas.
- Los textos comerciales siguen `Comercial/voz.md`.

## Capabilities and Constraints

- **Público:**
  - home
  - Trabajo con empresas
  - Webs para tu negocio (packs P1–P4 y extras)
  - generador de propuesta con IA
  - Proyectos
  - Sobre mí
  - blog en MDX con comentarios moderados
  - chat IA sobre Jose con takeover humano
  - contacto con Turnstile
  - auth con Google, GitHub o email
- **Privado:**
  - área de clientes y afiliados
  - admin (solo Jose)
  - Radar
- **Fuera de alcance:**
  - foro
  - staff
  - modo claro
  - testimonios fabricados
  - datos en vivo de infraestructura
  - escenas WebGL fuera del hero
- **Rendimiento:**
  - Lighthouse móvil: rendimiento ≥ 90, accesibilidad ≥ 95, SEO 100.
  - LCP < 2,5 s, INP < 200 ms y CLS < 0,1 en 4G.
  - La escena del hero va en diferido tras el LCP, con un bundle ≤ 200 KB gz. El JS de la home sin la escena ≤ 350 KB gz.
- **SEO y GEO de primer nivel:** JSON-LD de entidad única, `llms.txt` generado en build y contenido citable.
- **Abierto (no inventar):** los 14 `{{DATO}}` de UX §18:
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
- Sin métricas en la web: ni contadores, ni número de repos o apps, ni estadísticas. Los precios «desde X €» de los packs sí se muestran.
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
  - packs: 900, 1.400, 2.500 y 4.200 €
  - mantenimiento: 49 y 149 €/mes
- No hay testimonios, clientes citables ni métricas de resultados. No se fabrican.

## Product Principles

1. Claridad antes que espectáculo: el efecto técnico nunca tapa qué se ofrece, a quién ni cómo contactar.
2. Demostrar, no afirmar: la web es la prueba de oficio y cada afirmación tiene respaldo verificable.
3. Dos puertas con el mismo peso: Marta y Dani encuentran su camino en el primer viewport.
4. Nada inventado: ni precios fuera de `tarifas.md`, ni testimonios, ni cifras.
5. Jose decide: ninguna acción automática (envíos, correos, calendario) sin su confirmación.

## Accessibility & Inclusion

WCAG 2.2 AA (se verifica en `/puerta-calidad`) y diseño móvil primero. Con `prefers-reduced-motion` la web usa fundidos, sin intro, sin morph y con un poster estático. El texto real es accesible desde el primer instante aunque haya animación.
