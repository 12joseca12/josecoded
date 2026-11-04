# Ofertas: nombre, niveles, extras y recomendador

**2026-11-04 · `arquitecto` · ronda de preparación de lo que hoy se llama «packs».** Parte de `brief.md`, `decisiones.md` (2.2, 2.15, 2.23, 6.8, 8.2), `division-pantallas.md` (P2b), `valor-pantallas.md` (Q3, T3), `seo.md` (§1–§3), `datos.md` (§2, §11) y del código actual (`src/lib/services/packs.ts`, `src/app/[locale]/servicios/packs/`, `src/lib/contact/ways.ts`, `supabase/migrations/20261104100100_leads.sql`). No toca código: deja decididos el nombre, la estructura, el catálogo de extras, el recomendador y el modelo de datos para que el plan salga de aquí. Los precios siguen provisionales (`000 €`, decisión 2.23); este documento fija **qué variables** los determinan, no las cifras. Lo que necesita a Jose está en §6, con recomendación.

## 0. Recomendación en diez líneas

1. La línea se llama **Lanzamientos** (`/servicios/lanzamientos`, redirección permanente desde `/servicios/packs`). En el código el concepto es `offer` y nunca «launch»: el nombre público puede cambiar sin tocar identificadores.
2. Cuatro niveles por **plataforma**, no por tamaño: **Prototipo** (entrada) · **Web** · **App móvil** · **Web y app**. Cada uno con para quién, qué incluye, qué no, plazo en semanas y qué aporta el cliente.
3. Doce **extras** ortogonales a los niveles (cuentas y permisos, panel de gestión, cobros, idiomas, posicionamiento, métricas, asistente IA, push, sin conexión, alta en tiendas, mantenimiento, identidad). Cada extra declara a qué niveles aplica y cuándo ya va incluido.
4. Los cinco pasos de la decisión 2.14 ordenan el catálogo: el Prototipo cubre Descubrir y Diseñar; los lanzamientos, de Descubrir a Publicar; Mantener es un extra mensual.
5. El **recomendador** es una tabla de reglas en código, sin IA: seis preguntas como mucho (la primera puede terminar en una, si lo que hay es un proyecto existente que va a freelance), resultado con nivel, extras, «desde» y «por qué te lo recomiendo», y CTA a contacto con todo prefijado.
6. La IA entra **gratis** por donde ya existe: Nexo lee la misma tabla de reglas desde el RAG y el arranque «¿Qué lanzamiento me conviene?» hace de recomendador conversacional. El «describe tu idea → Nexo rellena las respuestas» se deja diseñado para una fase 2 condicionada a datos.
7. El selector funciona sin JavaScript (formulario `GET`, el servidor calcula el resultado), guarda el estado en la URL y es un formulario accesible paso a paso con el anillo coral como progreso (T3).
8. Datos: niveles, extras y reglas viven ahora como contenido tipado en el repo (`src/lib/services/offers.ts`, zod); precios y textos de catálogo pasan a Supabase en W20 (`offers`, `extras`, decisión 8.2); las **reglas no salen nunca del repo** (son lógica, no datos que edite el admin).
9. El contacto recibe `?via=pack&offer=<slug>&extras=a,b`, muestra un resumen de lo elegido y el lead guarda `offer`, `extras[]` y las respuestas (`offer_answers`, jsonb con contrato) para que el closer vea la configuración sin preguntar.
10. Cinco preguntas para Jose (§6): nombre, nivel de entrada, dónde entra la IA, renombrado interno y garantía frente a mantenimiento.

---

## 1. Nombre

### 1.1 Criterios

- Lo entiende un comprador no técnico (la persona de `valor-pantallas.md`: quiere «una web o una app completa sin gestionar piezas» y que «esto se publica de verdad»).
- Suena a producto tecnológico, no a catálogo de agencia ni a menú de restaurante. Sin anglicismos en el nombre público.
- Tiene singular natural («tu lanzamiento»), cabe en la `WayNav`, en una pestaña de la cápsula y en un chip del formulario de contacto.
- No pisa a `/proyectos` (portfolio) ni a «Presupuesto» (el formulario).
- Convive con el SEO de la página: la query principal sigue siendo «precio app móvil» / «presupuesto app» (`seo.md` §1) y va en `<title>`, H1 y H2, **no en el slug**: Google pesa poco el slug y un slug de marca es estable.

### 1.2 Candidatas para la línea

| Nombre | Slug | A favor | En contra |
|---|---|---|---|
| **Lanzamientos** | `/servicios/lanzamientos` | Verbo de producto: lo que el cliente compra es que su web o app se publique. Enlaza con la fase «Publicar» del hero (2.14) y con el valor «se publica de verdad». Tech sin jerga; singular natural; «Lanzamiento web», «Lanzamiento app» se leen solos. | «Lanzamiento» también es un evento de marketing; el slug no lleva keyword de precio (la llevan `<title>` y H1). |
| Planes | `/servicios/planes` | Universal, corto, se entiende a la primera. | Huele a suscripción SaaS (Básico / Pro / Empresa); genérico, no dice web ni app; nada propio. |
| Fórmulas | `/servicios/formulas` | Cercano, sin tecnicismos. | Tono de menú o de hostelería; en una web tecnológica suena cursi. |
| Llave en mano | `/servicios/llave-en-mano` | Existe la búsqueda «web llave en mano»; el no técnico lo entiende sin explicación. | Lenguaje de obra e inmobiliaria; tres palabras no caben en la cápsula ni en un chip; no tiene singular de producto («un llave en mano»). |
| Presupuesto cerrado | `/servicios/presupuesto-cerrado` | Lleva «presupuesto» en nombre y slug; honesto con el modelo. | Nombra la forma de cobrar, no el producto; «Presupuesto» como pestaña se confunde con el formulario de contacto; en plural no funciona. |
| Ediciones | `/servicios/ediciones` | Vocabulario de software («edición Web», «edición App»). | Ambigüedad editorial; no dice qué se entrega; frío. |
| Producto | `/servicios/producto` | Lenguaje de producto, elegante entre técnicos; «hago tu producto». | Abstracto para un negocio local; singular y plural raros en navegación; se confunde con una tienda. |

### 1.3 Recomendación: Lanzamientos

Es el único nombre que a la vez describe el resultado (publicado en tiendas o en tu dominio), encaja con el vocabulario que ya tiene la web (las cinco fases, el hero que termina en «Publicar») y tiene forma de producto en singular. «Planes» sería la alternativa segura si Jose lo prefiere neutro; el resto se descarta por tono (Fórmulas, Llave en mano), por ambigüedad (Ediciones, Producto) o por nombrar el precio en lugar del producto (Presupuesto cerrado).

Frase de definición para el primer párrafo de la página y para el RAG (GEO, `seo.md` §6): «Un lanzamiento es un proyecto de web o app con alcance, precio y fecha cerrados antes de empezar: lo que en otras webs verás como *pack*.» Esa única mención a «pack» conserva la cola larga «pack página web precio» sin usar la palabra en el nombre.

### 1.4 Niveles

Nombrados por lo que se lanza, no por tamaño (Esencial / Completo / Total no dicen nada y obligan a leer la tabla). El H3 de cada tarjeta lleva la keyword: «Lanzamiento app móvil: desde X €».

| Nivel | Nombre recomendado | Alternativas | Slug |
|---|---|---|---|
| Entrada | **Prototipo** | Descubrimiento (fase 1 de 2.14, más abstracto) · Piloto (suena a prueba en producción) · Boceto (suena a dibujo) | `prototipo` |
| Web | **Web** (tarjeta «Lanzamiento web») | Web de negocio (actual; sobra «de negocio» si el H3 ya lo explica) · Sitio web | `web` |
| App | **App móvil** | App · Aplicación móvil | `app-movil` (se conserva: keyword y ya existe) |
| Ambos | **Web y app** | Dúo (cute) · Completo (vuelve al tamaño) · Web + app | `web-y-app` (se conserva) |

El prefijo «Lanzamiento» solo aparece en el H3 y en el chip de contacto; en la tarjeta y en el recomendador basta el nombre corto.

### 1.5 URL, redirección y SEO

- `/servicios/packs` → `/servicios/lanzamientos` con `permanent: true` en `redirects()` de `next.config.ts` (Next emite **308**, equivalente a 301 para buscadores y es lo que ya usa `/` → `/es`; si Jose quiere un 301 literal, regla de redirección en Cloudflare). Hoy nada está indexado (2.4) y el dominio responde 521, así que el coste es cero; la regla queda para las previews ya compartidas y por higiene.
- `/servicios/packs/[slug]` (fase 2, no construida) nace ya como `/servicios/lanzamientos/[slug]`.
- Cambian: `src/lib/seo/routes.ts` (sitemap, prioridad 0,9), `src/lib/seo/llms.ts`, migas (`Inicio › Servicios › Lanzamientos`), `services.ways.packs.nav` («Lanzamientos»), `ServicesStrip` y `PackTeaser` de la home, pie, `buildContactHref`, `seo.test.ts`. `<title>`: «Precio de app móvil y web: lanzamientos cerrados · josecoded» (≤ 60). H1: «Precio de app móvil y web: **lanzamientos con precio y fecha cerrados.**» H2 «Presupuesto de app: compara los lanzamientos» y «Encuentra tu lanzamiento en un minuto» (recomendador).
- JSON-LD: `OfferCatalog` con un `Offer` por nivel (`priceSpecification.minPrice`, `eligibleDuration`) y los extras como `Offer.addOn`; se publica cuando los precios dejen de ser provisionales (`FAQPage` sin precios mientras tanto, como ahora).

### 1.6 Identificadores en el código

El concepto en código es **`offer`** y **`extra`** (en inglés, estable, independiente del nombre público): `src/lib/services/offers.ts`, `Offer`, `offerSlugs`, `Extra`, `extraSlugs`, `recommendOffer()`, `OfferCompare`, `OfferRecommender`, `ExtraList`, claves `offersPage.*` en `messages/es.json`, `ServicePageId = hub | freelance | offers`. `WayId` pasa de `contratacion | freelance | packs` a `hiring | freelance | project` (hoy mezcla idiomas). El parámetro `?via=pack` y el valor `pack` del enum `contact_via` se tratan en §6 (pregunta 4): renombrar a `project` cuesta una línea de migración mientras no hay datos.

---

## 2. Estructura de la oferta

### 2.1 Principios

- **Los niveles se eligen por plataforma; los extras, por necesidad.** Un negocio sabe si quiere web, app o las dos; no sabe si necesita «roles». Las preguntas del recomendador traducen necesidades en extras.
- **Lo que casi todo el mundo necesita va incluido; lo que depende del negocio es extra.** Por eso las cuentas de usuario van incluidas en App móvil y Web y app (una app sin cuentas es rara) y son extra en Web (una web de negocio no suele tenerlas).
- **Cada nivel cierra alcance, precio y fecha.** La fecha cerrada tiene una condición explícita: el cliente responde a cada entrega en ≤ N días laborables (variable). Se dice en la página, no en la letra pequeña.
- **Mapa con las cinco fases (2.14):** Prototipo = Descubrir + Diseñar; cualquier lanzamiento = Descubrir → Publicar; Mantener = extra mensual. El anillo coral de `HowLong` pinta las fases que cubre cada nivel.
- **Lo que no cabe en el alcance se trata como historia fuera de presupuesto (6.8):** se avisa, el cliente decide, se presupuesta. La página lo cuenta en la FAQ.

### 2.2 Resumen

| Nivel | Para quién | Entrega | Plazo (provisional) | Siguiente paso natural |
|---|---|---|---|---|
| **Prototipo** | Tiene una idea y no sabe aún si es web, app o las dos; necesita enseñarla, validarla o pedir financiación; quiere un presupuesto cerrado fiable antes de comprometerse | Prototipo navegable, mapa de pantallas, alcance escrito y presupuesto cerrado del lanzamiento | 1–2 semanas | Cualquier lanzamiento, con el importe del prototipo descontado (pregunta 2) |
| **Web** | Negocio o profesional que necesita una web rápida, bien posicionada y en su dominio | Web pública con Next.js publicada en su dominio | 3–5 semanas | Extras (cuentas → web con área privada; panel; posicionamiento) o Web y app |
| **App móvil** | Quien tiene un servicio que la gente usa desde el móvil: reservas, pedidos, seguimiento, comunidad | App iOS y Android con React Native (Expo), backend y publicación en las dos tiendas | 6–10 semanas | Extras (pagos, push, sin conexión, panel) o Web y app |
| **Web y app** | Producto que necesita presencia pública y app a la vez, con los mismos datos y cuentas | Web pública + app, diseño y datos compartidos, lanzados juntos | 8–14 semanas | Extras; mantenimiento recomendado |

### 2.3 Cada nivel

**Prototipo**
- Incluye: una o dos sesiones de descubrimiento; mapa de pantallas y flujos; prototipo navegable (HTML servido como los de este proyecto, o Figma si el cliente lo pide); alcance escrito con lo que entra y lo que no; presupuesto cerrado y fecha del lanzamiento que encaje; recomendación de nivel y extras.
- No incluye: código de producción, diseño final de todas las pantallas, publicación.
- Aporta el cliente: la idea, referencias (apps o webs que le gustan), disponibilidad para dos sesiones.
- Camino: el importe se descuenta del lanzamiento si se contrata en N días (variable `discovery_credit_days`). Si el cliente ya tiene claro el nivel y el proyecto es pequeño, el recomendador no lo sugiere.

**Web**
- Incluye: descubrimiento corto; diseño a medida sobre el sistema de componentes; hasta N páginas o secciones (variable `web_pages_included`); formulario de contacto con antispam; metadatos, sitemap, rendimiento y accesibilidad AA (lo mismo que exige esta web: Lighthouse ≥ 95); dominio, alojamiento y email transaccional configurados; páginas legales a partir de plantilla; una ronda de revisiones por fase (variable `review_rounds`); una hora de formación; corrección de errores durante N días tras publicar (variable `warranty_days`).
- No incluye: cuentas de usuario, panel de gestión (contenido editable), cobros, varios idiomas, redacción de textos y guías (extra `seo`), identidad gráfica.
- Aporta el cliente: textos e imágenes, logo (o extra `brand`), dominio (o se compra a su nombre), decisiones en ≤ N días por fase.
- Camino: con `accounts` + `admin` se convierte en una web con área privada; para una app además, Web y app.

**App móvil**
- Incluye: descubrimiento; diseño de hasta N pantallas (variable `app_screens_included`); app iOS y Android con React Native y Expo; cuentas de usuario (código por email o Google); backend con base de datos y almacenamiento (Supabase); publicación en App Store y Google Play **con las cuentas de desarrollador del cliente**; una ronda de revisiones por fase; corrección de errores N días tras publicar.
- No incluye: notificaciones push, uso sin conexión, cobros, panel de gestión, varios idiomas, alta de cuentas de tienda, web pública (una landing mínima de una página sí, para la ficha de la tienda y las legales: variable `app_landing_included`).
- Aporta el cliente: cuentas de desarrollador de Apple y Google (o extra `stores`), textos e imágenes, decisiones en ≤ N días por fase.
- Camino: extras; Web y app si necesita web completa.

**Web y app**
- Incluye: todo lo de Web y App móvil, con diseño común, cuentas y datos compartidos, publicación en tiendas y dominio; topes de páginas y pantallas sumados.
- No incluye: los mismos extras que los anteriores.
- Aporta el cliente: lo de ambos.
- Camino: extras y mantenimiento. Es el nivel donde el recomendador sugiere empezar por el Prototipo si el punto de partida es solo una idea (regla R4).

### 2.4 Variables que fijan los precios

Las cifras llegan tras la ronda de evaluación de servicios (2.23). Hasta entonces, cada nivel y extra muestra `000` con la etiqueta «provisional», como hoy. Lo que decide el precio, para que la ronda tenga lista cerrada:

| Variable | Dónde se usa | Quién la fija |
|---|---|---|
| `rates.hourly` (tarifa base por hora) | Base de todas las estimaciones | Jose |
| Horas estimadas por nivel y por extra (tabla) | `offers.from`, `extras.price` | Jose, con la estimación de `arquitecto` |
| Margen de riesgo del precio cerrado (%) | Sobre las horas estimadas | Jose |
| Topes incluidos: `web_pages_included`, `app_screens_included`, `review_rounds`, `app_landing_included` | Textos de «qué incluye» y recomendador | Jose |
| `warranty_days` (corrección de errores tras publicar) y `response_days` (respuesta del cliente que condiciona la fecha) | Textos y condiciones | Jose (pregunta 5) |
| `discovery_credit_days` y porcentaje descontado del Prototipo | Nivel de entrada | Jose (pregunta 2) |
| Costes de terceros, repercutidos o no: Apple (99 $/año), Google (25 $ una vez), dominio, Cloudflare/Supabase/Resend según uso, comisión de Stripe, modelo de IA | Nota al pie de precios y extras `payments`, `ai`, `stores` | Jose |
| Forma de pago (p. ej. 40 / 40 / 20 por fases) e IVA (mostrar sin IVA con nota) | FAQ y contacto | Jose |
| Capacidad semanal (horas por semana dedicadas) | Convierte horas en semanas: los plazos de §2.2 | Jose |
| `offers.to` (tope orientativo, opcional) | Rango «entre X y Y» en el resultado del recomendador | Jose |
| Planes de mantenimiento S / M / L (horas al mes, qué cubre) | Extra `maintenance` | Jose |

---

## 3. Catálogo de extras

Doce extras. `Facturación`: `once` (una vez), `monthly`, `per_unit` (por unidad, p. ej. por idioma). `Aplica` dice en qué niveles se puede añadir; «incluido en» dice dónde no hace falta.

| Slug | Nombre | Qué es (texto de tarjeta, pasa por `redactor`) | Aplica | Facturación | Variable de precio |
|---|---|---|---|---|---|
| `accounts` | Cuentas y permisos | Registro e inicio de sesión sin contraseña (código por email o Google) y, si hace falta, tipos de usuario con distintos permisos. | Web (cuentas + permisos); App móvil y Web y app solo la parte de permisos (las cuentas van incluidas) | `once` | `extra.accounts.basic`, `extra.accounts.roles` |
| `admin` | Panel de gestión | Un panel privado para ver y editar los datos, los usuarios y el contenido de tu producto sin tocar código. En una web, es lo que te deja cambiar textos y publicar novedades. | Todos | `once` | `extra.admin` |
| `payments` | Cobros con Stripe | Pagos únicos o suscripciones con Stripe, facturas y panel de ingresos. Las comisiones de Stripe van aparte. Si vendes contenido digital dentro de la app, Apple y Google obligan a usar sus compras integradas y se presupuesta aparte. | Todos | `once` | `extra.payments`, `extra.payments.iap` |
| `languages` | Varios idiomas | La interfaz en más de un idioma y el contenido preparado para traducir. Las traducciones las aportas tú o se presupuestan. | Todos | `per_unit` (por idioma) | `extra.languages.each` |
| `seo` | Posicionamiento (SEO y GEO) | Estructura, textos y datos para que Google y los asistentes de IA te encuentren: páginas por servicio, guías, FAQ y ficha de negocio. | Web, Web y app | `once` (+ `monthly` opcional para contenido) | `extra.seo.setup`, `extra.seo.monthly` |
| `analytics` | Métricas de uso | Qué hacen tus usuarios: eventos clave, embudos y un cuadro de mando, sin cookies de terceros cuando se puede. | Todos | `once` | `extra.analytics` |
| `ai` | Asistente con IA | Un asistente como Nexo que responde con tus datos (catálogo, FAQ, documentos) dentro de la web o de la app. | Todos | `once` + `monthly` (modelo y alojamiento) | `extra.ai.setup`, `extra.ai.monthly` |
| `push` | Notificaciones push | Avisos en el móvil por eventos de tu producto, con permisos y preferencias del usuario. | App móvil, Web y app | `once` | `extra.push` |
| `offline` | Uso sin conexión | La app funciona sin cobertura y sincroniza al volver: trabajo de campo, almacenes, transporte. | App móvil, Web y app | `once` | `extra.offline` |
| `stores` | Alta en tiendas gestionada | Creo las cuentas de desarrollador a tu nombre, preparo capturas, textos y ficha, y gestiono la revisión hasta la aprobación. Las cuotas de Apple y Google son tuyas. (Publicar con tus cuentas ya va incluido.) | App móvil, Web y app | `once` | `extra.stores` |
| `maintenance` | Mantenimiento | Actualizaciones de sistemas y librerías, copias, vigilancia de errores y una bolsa de horas al mes para cambios pequeños. Tres tamaños. | Todos | `monthly` | `extra.maintenance.s/m/l` |
| `brand` | Identidad y sistema de diseño | Logo, colores, tipografía y componentes documentados para que todo lo que hagas después se vea igual. | Todos | `once` | `extra.brand` |

Notas:
- `admin` absorbe lo que sería un «CMS»: para una web significa contenido editable; para una app, gestión de datos y usuarios. Un solo concepto con variantes, como manda la regla 3.
- `accounts` tiene dos tramos de precio pero es una sola tarjeta: evita «Cuentas» y «Roles» como extras separados que el comprador no distingue.
- `maintenance` no lo sugiere ninguna regla del recomendador: aparece en el resultado como opción con una línea («recomendado en Web y app»), para no inflar el «desde».

---

## 4. Recomendador

### 4.1 Tres enfoques

| | A. Reglas en código | B. IA desde texto libre | C. Híbrido |
|---|---|---|---|
| Cómo | Seis preguntas cerradas; una tabla `rules[]` (`when` → `add`, `reason`) evaluada por una función pura | «Describe tu idea» → trabajo `offer.suggest` en Omen → Nexo devuelve nivel, extras y motivos | A como columna vertebral; B como atajo que rellena las respuestas de A, que el visitante confirma |
| A favor | Transparente (la tabla de este documento es la del código), testeable fila a fila, sin latencia, sin coste, funciona sin JS y con Omen apagado, el precio es determinista | Entiende cualquier descripción («un marketplace de clases de yoga»); menos clics | Lo mejor de ambos cuando hay demanda demostrada |
| En contra | No entiende matices fuera de las preguntas | Latencia 2–5 s, depende de Omen (4.3), texto del visitante a Groq (privacidad, 4.5), Turnstile y cuota, difícil de testear, puede recomendar mal con seguridad, muestra «IA» donde no aporta | Dos caminos que mantener; la fase B solo compensa si el chat demuestra que la gente describe ideas |

**Elección: A ahora, con la IA por donde ya existe.** Nexo indexa (`rag.index`, O06) un documento `content/services/recommender.md` generado desde la misma tabla de reglas, y el arranque de `ChatInvite` «¿Qué lanzamiento me conviene?» hace de recomendador conversacional sin código nuevo. C queda diseñado (§4.7) y condicionado a datos: se construye si, con el chat vivo, al menos un tercio de los arranques de servicios son descripciones de ideas.

### 4.2 Preguntas (máximo seis; una por paso)

| # | id | Pregunta | Opciones (`value`) | Efecto |
|---|---|---|---|---|
| 1 | `start` | ¿De dónde partes? | `idea` Tengo una idea y nada hecho · `defined` Tengo diseño, documento o referencias claras · `existing` Ya existe y quiero ampliarla o arreglarla | `existing` termina aquí: el resultado es la vía freelance (R1) |
| 2 | `kind` | ¿Qué quieres lanzar? | `web` Una web para mi negocio · `app` Una app móvil · `both` Web y app · `unsure` Todavía no lo tengo claro | Nivel (R2, R3) |
| 3 | `accounts` | ¿Tus usuarios tendrán cuenta? | `none` No, solo consultan · `basic` Sí, inician sesión · `roles` Sí, y hay distintos tipos de usuario | Extra `accounts` (R5) |
| 4 | `payments` | ¿Se cobrará dentro? | `no` No · `yes` Sí, pagos o suscripciones | Extra `payments` (R6) |
| 5 | `management` | ¿Quién actualizará el contenido o los datos? | `me` Yo, desde un panel · `rare` Casi nunca cambia · `team` Varias personas con distintos permisos | Extras `admin` y `accounts` (R7) |
| 6 | `more` | Marca lo que aplique (opcional, varias) | `languages` Varios idiomas · `seo` Que me encuentren en Google y en los asistentes de IA (solo si `kind` ∈ web, both) · `push` Avisos en el móvil (solo app, both) · `offline` Uso sin cobertura (solo app, both) · `ai` Un asistente con IA · `stores` Que gestiones tú las cuentas de las tiendas (solo app, both) | Extras (R8). Las opciones que no aplican al `kind` elegido no se muestran |

Con `kind = unsure` se siguen haciendo las preguntas 3–6: el resultado es Prototipo, pero las respuestas prefijan el brief y permiten decir «el lanzamiento que probablemente salga de él es App móvil con pagos».

### 4.3 Reglas

Tabla literal: cada fila es un objeto `{ id, when, add, reason }` de `rules` en `src/lib/services/recommender.ts` y un caso de test. `reason` es una clave de `messages/es.json` que aparece en «Por qué te lo recomiendo».

| Id | Cuando | Añade | Motivo (resumen) |
|---|---|---|---|
| R1 | `start = existing` | Resultado `route: freelance` (sin nivel ni extras); termina en la pregunta 1 | «Lo tuyo no es un lanzamiento: es ampliar o arreglar algo que ya existe, y eso va por horas o por tarea» → `/servicios/freelance` |
| R2 | `kind = unsure` | Nivel `prototipo` | «Antes de cerrar precio y fecha hay que decidir qué se lanza; el prototipo termina con el presupuesto cerrado del lanzamiento que te encaje» |
| R3 | `kind ∈ {web, app, both}` | Nivel `web` / `app-movil` / `web-y-app` | «Quieres una web para tu negocio» / «…una app en las dos tiendas» / «…web y app con los mismos datos» |
| R4 | `start = idea` y (`kind = both` o se activan ≥ 2 extras de {`accounts` roles, `payments`, `admin`, `offline`}) | Sugerencia secundaria «Empieza por el Prototipo» (tarjeta pequeña bajo el resultado; el principal sigue siendo el nivel) | «Es un proyecto con varias piezas y partes de una idea: una o dos semanas de prototipo evitan cambios caros después» |
| R5a | `accounts = basic` y `kind = web` | Extra `accounts` (tramo básico) | «Tus usuarios inician sesión, y una web de negocio no lo trae de serie» |
| R5b | `accounts = basic` y `kind ∈ {app, both}` | Nada | Texto en «incluido»: «Las cuentas de usuario van incluidas en la app» |
| R5c | `accounts = roles` | Extra `accounts` (tramo permisos), en cualquier nivel | «Hay distintos tipos de usuario y cada uno debe ver lo suyo» |
| R6 | `payments = yes` | Extra `payments` | «Vas a cobrar dentro: pagos o suscripciones con Stripe» (+ nota de compras integradas si `kind ∈ {app, both}`) |
| R7a | `management = me` | Extra `admin` | «Quieres cambiar contenido y datos sin depender de nadie» |
| R7b | `management = team` | Extras `admin` y `accounts` (tramo permisos), sin duplicar si R5c ya lo añadió | «Varias personas gestionan: panel y permisos» |
| R7c | `management = rare` | Nada | Texto: «Como cambia poco, los cambios los hago yo cuando los pidas» |
| R8 | cada valor de `more` | Extra con el mismo slug | Una línea por extra |
| R9 | siempre | `maintenance` como opción desmarcada en el resultado; marcada por defecto solo si `kind = both` | «Recomendado en Web y app» |
| R10 | `kind = unsure` | «Siguiente paso probable» = nivel que saldría de R3 con `kind` inferido: `both` si `more` incluye `seo` y (`push` o `offline`); `app` si incluye `push` u `offline`; si no, `web` | Texto informativo, no cambia el nivel |

**Precio del resultado:** `from = offer.from + Σ extras[once].from + Σ extras[per_unit].from × unidades` (idiomas: 1 por defecto, ajustable en la tarjeta); los `monthly` se muestran aparte («+ X €/mes»). Si `offers.to` existe, «orientativo: entre X y Y». Mientras los precios sean provisionales, la tarjeta muestra `000 €` con «provisional» y el texto de 2.23; el recomendador funciona igual (la recomendación no depende de la cifra).

**Invariantes con test:** un solo nivel por resultado; ningún extra fuera de su `applies`; sin duplicados; `existing` nunca produce nivel; `unsure` siempre produce `prototipo`; el resultado es una función pura de las respuestas (mismo input, mismo output, en servidor y en cliente).

### 4.4 UX del selector

- **Sitio:** en `/servicios/lanzamientos`, sección `#recomendador` tras el comparador (los precios citables se quedan arriba en el HTML, `seo.md` T7) y enlace desde el lead del H1 («¿No sabes cuál? Encuentra el tuyo en un minuto»). Un solo botón primario visible a la vez (`valor-pantallas.md` P2): dentro del recomendador, el de avanzar; en el resultado, «Pedir este lanzamiento».
- **Un paso por pantalla:** `fieldset` + `legend` como pregunta, opciones como radios (o checkboxes en la 6) con tarjetas grandes de una línea y una aclaración de ≤ 8 palabras. Avanzar al elegir (con un «Siguiente» visible para teclado y lector) y «Atrás» siempre presente; «Saltar» solo en la pregunta 6.
- **Progreso:** `ProgressRing` variante `steps` (T3, el mismo anillo coral de la cápsula) con «Paso 2 de 6» en texto. Si R1 termina en la 1, el anillo se completa.
- **Resultado (`OfferResult`):** tarjeta con nombre del nivel, «desde X €» (o provisional), plazo, lista de extras con posibilidad de quitar o añadir cualquiera de su `applies` (el precio se recalcula; cambio de número con `transition`, sin contador largo), «Por qué te lo recomiendo» (los `reason` de las reglas activadas), «No incluye» (tres líneas), opción `maintenance`, y tres acciones: **«Pedir este lanzamiento»** (primaria) → `/contacto?via=pack&offer=<slug>&extras=a,b#formulario` · «Preguntar a Nexo» (abre `ChatPanel` con el arranque «He respondido al recomendador: … ¿me conviene?» y el resumen) · «Cambiar respuestas» (vuelve al paso 1 con las respuestas conservadas). Con R1, la tarjeta cambia a la vía freelance con CTA a `/servicios/freelance` y a `/contacto?via=freelance`. Con R4, la tarjeta secundaria «Empieza por el Prototipo» con su CTA (`offer=prototipo` y los mismos `extras` como «lo que vendrá después»).
- **Motion:** paso a paso con un deslizamiento corto en CSS (`view-transition` dentro del componente o `@starting-style`), 150–200 ms; sin animación con `prefers-reduced-motion`. Esqueleto de la tarjeta de resultado con la forma final para que no haya CLS.
- **Móvil:** opciones en columna, área táctil ≥ 44 px, el resultado sustituye al selector en el mismo hueco (no abre nada nuevo).

### 4.5 Accesibilidad

- Cada paso es un `fieldset` con `legend`; el foco pasa a la `legend` al cambiar de paso y a la tarjeta de resultado al terminar (`tabindex="-1"`, sin `autofocus` en carga).
- Progreso anunciado por `aria-live="polite"` («Paso 3 de 6») y el anillo con `role="img"` y `aria-label`; el precio del resultado en una región `aria-live` que anuncia solo el total.
- No se puede avanzar sin respuesta en 1–5 (error asociado por `aria-describedby`, foco al grupo); la 6 es opcional.
- Radios y checkboxes nativos estilizados (no `div` con `role`): flechas entre opciones, espacio para marcar, Enter avanza; Escape no cierra nada (no es un diálogo).
- Contraste AA del coral sobre carbón y acero verificado en el prototipo; axe bloqueante en el E2E de la página; lector de pantalla probado paso a paso (regla 5).

### 4.6 Sin JavaScript y estado en la URL

- El selector es un `<form method="get" action="/es/servicios/lanzamientos">` con los seis `fieldset`. Sin JS se ven todos a la vez y «Ver mi recomendación» envía `?start=idea&kind=app&accounts=basic&payments=yes&management=me&more=push,ai`; el Server Component evalúa `recommendOffer(searchParams)` con la misma función y pinta la tarjeta. Con JS, el componente cliente esconde los pasos no activos, actualiza la URL con `history.replaceState` (el visitante puede recargar, volver atrás y compartir el resultado) y pinta el resultado sin recargar.
- Canonical sin parámetros (`seo.md` §2); con parámetros de recomendación, `noindex` en la respuesta para no crear variantes indexables.
- Sin `localStorage`: la URL es el estado. Nada de respuestas se guarda hasta que el visitante envía el formulario de contacto.

### 4.7 Dónde podría entrar la IA (fase 2, condicionada)

- **Qué:** un campo «Describe tu idea en dos líneas» encima del paso 1. Al enviarlo, la ruta de servidor (Turnstile, cuota por IP como el chat) encola `offer.suggest` en `private.jobs`; Omen (Groq, con reserva local) devuelve `{ answers, confidence, summary }` validado por zod con `contracts/jobs/offer.suggest.json`; el selector se rellena con esas respuestas **marcadas como sugeridas** y el visitante las confirma paso a paso (nunca salta al resultado sin confirmar). El resultado final sigue saliendo de las reglas: la IA solo traduce texto en respuestas.
- **Coste:** un contrato, un job en Omen, una ruta de servidor, estado `offline` cuando Omen no late (el campo desaparece), privacidad (texto a Groq: ya cubierto por la política del chat), latencia visible (esqueleto 2–5 s), tests con respuestas fijas. Tamaño M.
- **Beneficio:** solo para el comprador que no sabe mapear su idea a «cuentas» o «pagos». Es el mismo público que ya puede abrir el chat y preguntar. Por eso se condiciona a datos (§4.1) y, mientras tanto, Nexo con las reglas en el RAG cubre el caso a coste cero.

### 4.8 Datos: dónde vive cada cosa

**Ahora (contenido tipado en el repo).**
- `src/lib/services/offers.ts`: `offerSchema` (`slug`, `kind` `prototype | web | app | both`, `status` `provisional | final`, `from`, `to?`, `weeksMin`, `weeksMax`, `phases` subset de las cinco, `highlight?`), `extraSchema` (`slug`, `applies` kinds[], `includedIn` kinds[], `billing` `once | monthly | per_unit`, `from`, `monthly?`), listas parseadas en build y `publicOffers()` como hoy. Textos en `messages/es.json` (`offersPage.offers.<slug>.*`, `offersPage.extras.<slug>.*`), nunca en el fichero.
- `src/lib/services/recommender.ts`: `questions` (ids y valores, con `showWhen` por `kind`), `rules[]` y `recommendOffer(answers): Recommendation` pura; `answersSchema` zod para parsear `searchParams` y para el lead.
- `content/services/recommender.md` generado en build desde las dos listas para el RAG (O06).
- Se sustituye `packs.ts` entero; `packs.test.ts` pasa a `offers.test.ts` y `recommender.test.ts` (una fila de §4.3 por test).

**Después (W20, decisión 8.2).** Tablas `offers` (sustituye a `packs` de `datos.md` §2: `slug` único, `kind`, `price`, `price_to`, `weeks_min`, `weeks_max`, `highlight`, `visible`, `sort`, `archived_at`) y `extras` (`slug`, `applies` `offer_kind[]`, `included_in` `offer_kind[]`, `billing`, `price`, `price_monthly`, `visible`, `sort`, `archived_at`); vistas `public_offers` y `public_extras` (únicas con grant a `anon`, `datos.md` §Principios); `price_changes` da la fecha del texto citable. **Las reglas no van a la base:** son lógica que cambia con un PR y un test, no un dato que edite el admin. Los textos siguen en `messages` (8.1: «los textos siguen en el repo»); las columnas `name_es/en`, `includes_es/en` de la propuesta de §2 se eliminan.

**Lead y contacto.**
- URL: `/contacto?via=pack&offer=<slug>&extras=a,b#formulario`. El formulario valida `offer` contra `offerSlugs` y `extras` contra `extraSlugs` filtrados por `applies`; lo inválido se ignora en silencio. Muestra un chip de resumen («Lanzamiento App móvil + Cobros + Notificaciones · desde 000 €») con enlace «cambiar» al recomendador, y campos ocultos. El resto del formulario no cambia (nombre, email, mensaje, consentimiento; los campos por vía de P6 siguen).
- `leads`: sustituir `pack_id uuid` (sin FK, en `leads` y `deals`) por `offer text` (slug; cuando exista `offers`, FK a `offers(slug)`), añadir `extras text[]` (check de ≤ 12 elementos con forma de slug) y `offer_answers jsonb` (nullable, contrato `contracts/offer-answers.json`, validado con zod en la Server Action y con `jsonb_matches_schema` o un check mínimo en SQL). `has_domain` y `has_store_accounts` se quedan (siguen siendo los campos por vía de P6; `stores` en `extras` no los sustituye: uno dice qué tiene el cliente, el otro qué compra). `buildLeadArgs` deja de codificar el pack en `page_path`.
- `claim_lead` compone el cuerpo de la `activity` con el resumen («Lanzamiento App móvil · extras: cobros, push · respuestas: idea, cuenta básica…») para que el closer lo lea sin abrir el lead.
- Es una migración sobre `josecoded` (`data/leads-offer`): **se aplica solo con OK de Jose en la sesión** (10.7), con advisors antes y después.

---

## 5. Bloques que saldrían de aquí (para el plan)

| Bloque | Rama | Qué | Tamaño | Gate |
|---|---|---|---|---|
| B1 | `docs/offers-round` | Este documento; respuestas de §6 anotadas en `decisiones.md` como 2.24–2.28 | S | Jose responde §6 |
| B2 | `public/offers-rename` | Slug, redirección 308, identificadores `offer`/`extra`/`WayId`, claves `offersPage.*`, sitemap, `llms.txt`, migas, nav, tests | S | — |
| B3 | `public/offers-data` | `offers.ts`, `recommender.ts` con tests fila a fila, `content/services/recommender.md` en build | S–M | — |
| B4 | `public/offers-page` | `OfferCompare` (cuatro niveles, todos en el DOM), `ExtraList`, `WhatIncludes`, `HowLong` (anillo por fases), `WhatINeedFromYou`, FAQ ampliada | M | **Prototipo HTML en `prototipos/` aprobado por Jose en el navegador** antes de implementar; `ux` → `usuario-ejemplo` → `ui` antes del plan |
| B5 | `public/offers-recommender` | `OfferRecommender` + `OfferResult`, `ProgressRing` `steps` (W08b si no existe), sin JS, URL, E2E con axe | M | Mismo prototipo que B4 (es la pieza que más hay que ver en el navegador) |
| B6 | `public/contact-offer` + `data/leads-offer` | Formulario lee `offer`/`extras`, chip de resumen, `buildLeadArgs`; migración `leads.offer`, `extras`, `offer_answers` | S + S | **OK de Jose a la migración** en la sesión (10.7) |
| B7 | `/puerta-calidad` | Una vez por la rama de la pantalla antes del merge | — | — |
| Después | W20 (`offers`/`extras` en Supabase), W28 (`OfferCatalog` con precios), fase 2 IA (§4.7) | | | Precios reales (2.23) |

`comercial` y `redactor` (Mac): los textos de tarjetas de niveles y extras, los `reason` de las reglas y la FAQ nueva («¿Puedo pagar por fases?», «¿Qué pasa si quiero algo que no está?» → 6.8, «¿Qué es el prototipo y se descuenta?»).

---

## 6. Preguntas para Jose

Listas para AskUserQuestion; la primera opción es la recomendada.

**1. Nombre de la línea** (hoy «packs»; §1.2)
- a) **Lanzamientos** (`/servicios/lanzamientos`): describe el resultado, enlaza con la fase «Publicar», singular natural.
- b) Planes: neutro y universal, pero suena a suscripción.
- c) Llave en mano: lo entiende cualquiera, tono de obra y largo para la navegación.
- d) Otro (dime cuál).

**2. Nivel de entrada «Prototipo»** (§2.3)
- a) **Sí, y su importe se descuenta del lanzamiento si se contrata en N días** (N por fijar en la ronda de precios): baja la barrera, cualifica al cliente y evita cambios caros.
- b) Sí, pero sin descuento.
- c) No: solo Web, App móvil y Web y app.

**3. Dónde entra la IA en el recomendador** (§4.1, §4.7)
- a) **Reglas sin IA; Nexo cubre el caso conversacional con las mismas reglas en el RAG** (coste cero); el «describe tu idea» se construye solo si el chat demuestra demanda.
- b) Reglas ahora y «describe tu idea → Nexo rellena» en el siguiente bloque, sin esperar datos.
- c) Solo IA (texto libre), sin selector de preguntas.

**4. Renombrado interno ahora que no hay datos** (§1.6, §4.8)
- a) **Sí, todo:** `offer`/`extra` en código, `WayId` `hiring | freelance | project`, enum `contact_via` `pack` → `project` (`?via=project`), `leads.pack_id` → `offer` + `extras` + `offer_answers`, tablas futuras `offers`/`extras`. Una migración pequeña con tu OK.
- b) Solo lo visible (slug, textos, componentes); lo interno sigue diciendo `pack` (`?via=pack`, `pack_id`, tabla `packs`).

**5. Garantía frente a mantenimiento** (§2.4, extra `maintenance`)
- a) **Corrección de errores incluida N días tras publicar (propuesta 30) y mantenimiento como plan mensual opcional** con tres tamaños.
- b) Solo plan mensual opcional, sin periodo incluido.
- c) Mantenimiento incluido tres meses en todo lanzamiento y luego plan opcional (sube el precio base).

---

## 7. Qué anotar cuando Jose responda

- **`decisiones.md`:** 2.24 nombre y slug (con la redirección), 2.25 niveles (cuatro, por plataforma, Prototipo descontable o no), 2.26 catálogo de extras y regla «incluido donde casi todos lo necesitan», 2.27 recomendador por reglas sin IA con Nexo sobre el RAG (y la condición de la fase 2), 2.28 renombrado interno y `leads.offer/extras/offer_answers`; 2.15 queda cumplida por este diseño y 2.23 añade la lista de variables de precio. `datos.md` §2: `packs` → `offers`, sin columnas de texto; §11: columnas nuevas de `leads`.
- **`ESTADO.md`:** en «Ahora», esta ronda; en «Pendientes → Jose», las cinco preguntas; en «Pasar por `redactor`», los textos de §3 y los `reason` de §4.3; en «Pendientes → Jose (datos)», la lista de variables de §2.4 como entrada de la ronda de precios; bloques B2–B6 en el tablón cuando esté creado.
- **Vault (`Proyectos/josecoded.md`, desde el Mac):** «la línea de precio cerrado se llama Lanzamientos; cuatro niveles por plataforma; doce extras; recomendador por reglas, Nexo lo replica desde el RAG; prototipo descontable (si a)».
- **ADR en codebase-memory (cuando haya código):** «`offer`/`extra` como identificadores estables independientes del nombre público; reglas del recomendador como datos tipados en el repo con un test por regla, nunca en Supabase; estado del selector en la URL y resultado calculado por la misma función pura en servidor y cliente».
