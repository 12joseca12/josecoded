# joseCoded — diseño de experiencia (UX) v1

**Fecha:** 2026-09-17 · **Versión:** 2.1 (2026-09-17: alineada con el esquema real de Supabase, diseño técnico v1.1 §0 H1–H8 y §3.3; v2.0: shell IDE-lite, hero de presentación, textos con hechos, §3 y §18; v1.1 validada con `usuario-ejemplo`, §16) · **Perfil:** web · **Spec:** `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` (v1.2) · **Precios:** `Comercial/tarifas.md` (v2, vigencia 2026-09-14) · **Voz:** `Comercial/voz.md`.

Este documento describe todas las pantallas, subpantallas, componentes, estados, páginas de error, flujos y textos de interfaz de josecoded v1, para que `ui` defina el sistema visual y el `arquitecto` escriba el plan sin adivinar. Respeta las decisiones de §11 y §12 de la spec; no las reabre.

Convenciones:
- **Mobile-first.** Cada wireframe es la vista móvil (≈ 390 px); la nota "Escritorio" indica cómo se reorganiza a partir de ≈ 1024 px.
- **Una acción primaria por pantalla**, marcada como `[[ Primaria ]]`. Secundarias como `[ Secundaria ]`. Enlaces como `> enlace`.
- **Nunca fotos ni decoración generativa.** Sin partículas, ondas ni retículas (decisión de Jose, 2026-09-17). El motion se limita a tres recursos con sentido técnico (§3.7): `CompileReveal`, `FocusLight` y la transición de página. Los bloques marcados `== bloque ==` son secciones de scroll con `FocusLight`.
- **Shell IDE-lite** (§3): toda página pública vive dentro del mismo shell (barra de título, árbol, panel central, línea de estado). Los wireframes de §4 muestran solo el panel central; la cabecera "josecoded · Menú" de los wireframes equivale a la barra de título + línea de estado del shell.
- **Textos con hechos:** cada frase de interfaz dice algo verificable. Lo que no consta en las fuentes va como `{{DATO: …}}` y se lista en §18 para que Jose lo rellene. Prohibido: "soluciones", "ayudo a", "sin complicaciones", "de alto rendimiento", "profesional", "innovador".
- Rutas: `es` sin prefijo, `en` con `/en`. `/admin` solo en español.
- Los "regalos por pack" de tarifas.md **no aparecen en ninguna pantalla pública ni privada**; solo viven en la propuesta de Notion.
- Colores, tipografías, iconos y motion concreto: los decide `ui` (§13).

---

## 1. Personas y tareas clave

### 1.1 Marta — dueña de negocio local (persona principal)
35–55 años, sin perfil técnico, entra desde el móvil por recomendación o búsqueda. Tolera poco: abandona ante jerga, ausencia de precio o formularios largos. Ruta prevista: home → Negocios → generador o WhatsApp.

| # | Tarea | Éxito |
|---|---|---|
| M1 | Entender en menos de un minuto qué le harían, desde cuánto y si Jose es de fiar | En la home ve quién es Jose y, en el índice de secciones, "Webs para tu negocio: 4 packs, de 900 a 4.200 €"; en `/negocios` ve los cuatro precios "desde" antes del segundo scroll |
| M2 | Conseguir una propuesta orientativa sin hablar con nadie | Responde 3–4 preguntas con chips y ve pack + "desde X €" en < 2 min |
| M3 | Hablar con Jose sin compromiso | Un toque abre WhatsApp con mensaje ya escrito; nunca un formulario largo |
| M4 | (Cliente) Ver cómo va su web, contestar tareas y subir material | Entra con Google, ve su proyecto y las tareas que le tocan a ella |
| M5 | (Cliente) Recomendar a otro negocio y saber qué gana | Copia su enlace, ve el lead atribuido y el estado de la recompensa |

### 1.2 Dani — CTO / responsable técnico / reclutador (persona secundaria)
Entra desde escritorio. Verifica antes de creer: stores, código, cómo está hecha esta web. Ruta prevista: home → Proyectos → Sobre mí / Cómo trabajo → chat o contacto.

| # | Tarea | Éxito |
|---|---|---|
| D1 | Verificar proyectos reales (stores, repos, valoraciones) | Cada ficha tiene enlaces verificables; ninguna afirmación sin prueba |
| D2 | Entender stack, forma de trabajar y disponibilidad; descargar CV | `/empresas` y `/sobre-mi` responden sin hipérbole; CV en un clic |
| D3 | Ver cómo está hecha esta web | Bloque "Cómo está hecha esta web" con arquitectura y métricas reales, enlace al repo si es público |
| D4 | Contactar o reservar una llamada de 20 min | Formulario corto o calendario embebido, sin cuenta |
| D5 | Preguntar al asistente y leer el blog | Login con Google en un clic; chat responde sobre Jose; artículos con comentarios |

### 1.3 Jose — operador del admin
No es audiencia, pero usa `/admin` a diario desde móvil y escritorio.

| # | Tarea | Éxito |
|---|---|---|
| J1 | Atender un lead nuevo en < 1 min desde el aviso de Telegram | Abre el lead desde el enlace, ve propuesta IA y afiliado, cambia el estado |
| J2 | Moderar comentarios | Aprueba o rechaza desde una lista, sin abrir el artículo |
| J3 | Gestionar clientes: tareas, assets, pack, ampliaciones | Todo en la ficha del cliente, sin saltar entre secciones |
| J4 | Cerrar un lead cobrado y abonar la recompensa al afiliado | Dos acciones explícitas con confirmación; la regla calcula el importe |
| J5 | Tomar el control de una conversación del chat | Ve la lista, entra, activa takeover y responde |

---

## 2. Mapa de sitio

### 2.1 Público

| Pantalla | Ruta es | Ruta en | Acceso | i18n |
|---|---|---|---|---|
| Home | `/` | `/en` | público | sí |
| Trabajo con empresas | `/empresas` | `/en/companies` | público | sí |
| Webs para tu negocio | `/negocios` | `/en/business` | público | sí |
| Generador de propuesta | `/propuesta` | `/en/proposal` | público (Turnstile) | sí |
| Proyectos | `/proyectos` | `/en/projects` | público | sí |
| Ficha de proyecto | `/proyectos/[slug]` | `/en/projects/[slug]` | público | sí |
| Blog | `/blog` | `/en/blog` | público | sí (artículos pueden existir en un solo idioma) |
| Artículo | `/blog/[slug]` | `/en/blog/[slug]` | público; comentar con cuenta | sí |
| Sobre mí | `/sobre-mi` | `/en/about` | público | sí |
| Contacto | `/contacto` | `/en/contact` | público (Turnstile) | sí |
| Chat con el asistente | `/chat` | `/en/chat` | cuenta | sí |
| Aviso legal | `/legal/aviso-legal` | `/en/legal/notice` | público | sí |
| Privacidad | `/legal/privacidad` | `/en/legal/privacy` | público | sí |
| Cookies | `/legal/cookies` | `/en/legal/cookies` | público | sí |
| Entrar | `/auth/login` | `/en/auth/login` | público | sí |
| Crear cuenta | `/auth/registro` | `/en/auth/sign-up` | público | sí |
| Introduce el código | `/auth/codigo` | `/en/auth/code` | público | sí |
| Callback OAuth | `/auth/callback` | (misma) | técnico | — |
| Mi cuenta | `/perfil` | `/en/profile` | cuenta | sí |

Redirecciones heredadas: `/services` → `/empresas`; `/sobre-mi` se mantiene; `/en/services` → `/en/companies`; `/blog/<slug antiguo>` y `/foro/*` → **410**. `/auth` (josedev) → `/auth/login`.

### 2.2 Área interna `/area-clientes` (cuenta)

Cualquier usuario con cuenta entra. Las secciones de proyecto solo aparecen si su usuario está enlazado a `clients.user_id`; "Recomiéndame" (programa de afiliados) aparece siempre (D15: todo usuario del área puede ser afiliado; un no cliente cobra el 10 %).

| Pantalla | Ruta es | Ruta en | Visible para |
|---|---|---|---|
| Inicio del área (mi proyecto) | `/area-clientes` | `/en/client-area` | todos (estado distinto si no es cliente) |
| Tareas | `/area-clientes/tareas` | `/en/client-area/tasks` | clientes |
| Detalle de tarea | `/area-clientes/tareas/[id]` | `/en/client-area/tasks/[id]` | clientes |
| Material (assets) | `/area-clientes/material` | `/en/client-area/files` | clientes |
| Pack y extras | `/area-clientes/pack` | `/en/client-area/plan` | clientes |
| Solicitar ampliación | `/area-clientes/pack/ampliar` | `/en/client-area/plan/upgrade` | clientes |
| Recomiéndame (afiliados) | `/area-clientes/recomiendame` | `/en/client-area/referrals` | todos |

Profundidad máxima: área → tareas → detalle (3 niveles). "Pack → ampliar" es el tercer nivel de esa rama.

### 2.3 Admin `/admin` (solo `staff_members.role = 'admin'`, solo es)

| Pantalla | Ruta |
|---|---|
| Resumen | `/admin` |
| Leads | `/admin/leads` |
| Detalle de lead | `/admin/leads/[id]` |
| Comentarios (moderación) | `/admin/comentarios` |
| Clientes | `/admin/clientes` |
| Ficha de cliente (pestañas: resumen, tareas, material, pack y extras) | `/admin/clientes/[id]` |
| Nueva tarea / editar tarea (hoja lateral dentro de la ficha) | `/admin/clientes/[id]?tarea=nueva` · `?tarea=[taskId]` |
| Ampliaciones | `/admin/ampliaciones` |
| Afiliados | `/admin/afiliados` |
| Detalle de afiliado (leads y recompensas) | `/admin/afiliados/[id]` |
| Chat: conversaciones | `/admin/chat` |
| Chat: conversación con takeover | `/admin/chat/[id]` |

### 2.4 Páginas y estados de error

| Caso | Ruta / lugar | Código |
|---|---|---|
| No encontrado | `/404` (cualquier ruta) | 404 |
| Contenido retirado (blog antiguo, foro) | `/blog/<slug viejo>`, `/foro/*` | 410 |
| Error del servidor | `error.tsx` global y por segmento | 500 |
| Sin permisos | `/admin/*` sin fila en `staff_members` con `role = 'admin'`; recurso ajeno en el área | 403 (página) |
| Sesión caducada | redirección a `/auth/login?next=…&reason=expired` (SSR) o toast inline (cliente) | — |
| Sin conexión (navegador) | banner global + estados inline | — |
| Servicio no disponible (gateway o Omen caídos) | estado inline en generador, chat, contacto | 502/503 |
| Límite de uso del generador o del chat | estado inline | 429 |
| Verificación Turnstile fallida | estado inline en formularios | — |
| Supabase pausado (auth/leads caídos) | formulario con fallback a email; login con aviso | — |
| Mantenimiento programado | página estática opcional | 503 |

---

## 3. Shell público IDE-lite, navegación y estructura común

Decisión de Jose (2026-09-17): **la home es la aplicación en sí**, con metáfora de editor ligera. Un shell de app reconocible que una persona no técnica usa como una web normal. Una sola interfaz para Marta y Dani; no se divide a las audiencias.

### 3.1 Qué es y qué no es IDE-lite

**Sí:** un árbol del sitio a la izquierda (escritorio) o en una hoja (móvil); un panel central con el contenido de la sección; en escritorio, pestañas con las secciones abiertas; una línea de estado abajo con datos reales del build y los accesos secundarios; una barra de título arriba que es el hero minimizado (nombre y rol).

**No:** iconos de fichero, extensiones (`.md`, `.tsx`) en las etiquetas, números de línea, minimapa, paleta de comandos, cuerpo de texto en monoespaciada, temas de VS Code. La monoespaciada aparece solo en dos sitios: el estado "compilando" de la animación de entrada (§3.6) y la línea de estado. Las etiquetas del árbol son palabras normales ("Webs para tu negocio", no `negocios/`).

**Prueba de uso para Marta:** desde la home en 375 px llega a Negocios, al generador o a WhatsApp en dos toques sin entender la metáfora: Home → tarjeta "Webs para tu negocio" (1) → `[[ WhatsApp ]]` en la barra fija de Negocios (2); o Home → "Contacto" en la línea de estado (1) → `[[ WhatsApp ]]` (2); o Home → "Webs para tu negocio" (1) → `[ Pedir propuesta ]` (2).

### 3.2 Árbol del sitio (sustituye al menú de cinco)

El árbol es la navegación principal y sustituye al menú horizontal. Tres niveles como máximo; las hojas de nivel 3 (fichas, artículos) solo aparecen desplegadas cuando estás dentro de esa rama.

```
Inicio
Trabajo con empresas
Webs para tu negocio
  ├ Packs y extras            (#packs, dentro de la misma página)
  └ Propuesta orientativa     (/propuesta)
Proyectos
  ├ {{DATO: proyecto 1}}      (/proyectos/[slug])
  ├ {{DATO: proyecto 2}}
  └ …
Blog
  └ (últimos 5 artículos)
Sobre mí
Contacto
```

En inglés: Home · Working with companies · Websites for your business (Packs and extras · Proposal) · Projects · Blog · About · Contact.

Reglas: la rama activa se despliega sola; el nodo activo va marcado con texto y un indicador, no solo con color; el árbol es un `nav` con lista anidada (`ul`/`li`), navegable con flechas y con `aria-current="page"`. En escritorio es fijo (240–280 px), plegable a una columna estrecha con las iniciales de sección; el estado plegado se recuerda en `localStorage`. En móvil no se ve: se abre desde "Menú" en la línea de estado como hoja a pantalla completa.

### 3.3 Escritorio: composición

```
┌──────────────────────────────────────────────────────────────────────────┐
│ {{DATO: nombre}} · desarrollador full-stack     [Contacto]  ⌕chat  ●  ES │  barra de título = hero minimizado
├──────────────┬───────────────────────────────────────────────────────────┤
│ Inicio       │ [Inicio ×] [Webs para tu negocio ×] [Proyectos ×]         │  pestañas (máx. 6)
│ Empresas     ├───────────────────────────────────────────────────────────┤
│ Negocios   ▾ │                                                           │
│   Packs      │   contenido de la sección                                 │
│   Propuesta  │   (ancho de lectura ≤ 72 caracteres, bloques con          │
│ Proyectos  ▸ │    con FocusLight)                                        │
│ Blog       ▸ │                                                           │
│ Sobre mí     │                                                           │
│ Contacto     │                                                           │
├──────────────┴───────────────────────────────────────────────────────────┤
│ main · a1b2c3d · publicado 17 sep 2026 · LCP 1,1 s     Chat · Entrar · ES│  línea de estado
└──────────────────────────────────────────────────────────────────────────┘
```

- **Barra de título:** nombre y rol (destino de la animación de entrada), `[[ Contacto ]]` (CTA global), acceso al chat, avatar/"Entrar", ES/EN. Al hacer clic en el nombre desde cualquier página se va a Inicio; desde Inicio, vuelve a expandir el hero (repetición manual, §3.6).
- **Pestañas:** cada ruta abierta es una pestaña; clic en un nodo del árbol abre o activa su pestaña; la URL cambia con normalidad (cada pestaña es una ruta real; el historial del navegador manda). Cierre con "×" y con Ctrl/Cmd+W capturado solo cuando el foco está en la pestaña. Máximo 6; la más antigua se cierra sola. Estado en `sessionStorage`. Si `ui` o `usuario-ejemplo` detectan que estorban, se degradan a "migas" (una sola fila con la ruta actual) sin cambiar el resto.
- **Línea de estado:** izquierda, datos del build generados en CI: rama, commit corto, fecha de publicación, LCP medido; derecha: Chat, Entrar/avatar, ES/EN. Nunca datos en vivo (spec: fuera). Es un `footer` con `role="contentinfo"`; el pie largo (§3.5) queda al final del contenido, no en la línea de estado.
- **Panel central:** el contenido de la página con el mismo ancho de lectura en todas las secciones. Las composiciones grandes (proyectos, packs) pueden ocupar el panel entero.

### 3.4 Móvil (375 px): composición

```
┌──────────────────────────────────────┐
│ {{DATO: nombre}}              ●  ES  │  cabecera = hero minimizado (una línea)
│ desarrollador full-stack             │
├──────────────────────────────────────┤
│                                      │
│  contenido de la sección             │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  Menú          Contacto        Chat  │  línea de estado (3 objetivos ≥ 44 px)
└──────────────────────────────────────┘
```

- Sin árbol visible, sin pestañas. "Menú" abre el árbol como hoja a pantalla completa: mismos nodos, tipografía normal, hijos con sangría y una guía vertical fina; sin iconos. Cierra con "Cerrar", deslizando o con Escape.
- "Contacto" lleva a `/contacto` (segmento recordado, §4.10). "Chat" a `/chat`.
- Los datos del build no se muestran en móvil (van en "Cómo está hecha esta web").
- La barra fija de `/negocios` (WhatsApp + Propuesta) sustituye a la línea de estado en esa página, para que no haya dos barras.

```
Hoja "Menú" (móvil):
┌──────────────────────────────────────┐
│ Menú                        [Cerrar] │
│                                      │
│ Inicio                               │
│ Trabajo con empresas                 │
│ Webs para tu negocio                 │
│ │  Packs y extras                    │
│ │  Propuesta orientativa             │
│ Proyectos                            │
│ │  {{DATO: proyecto 1}}              │
│ │  {{DATO: proyecto 2}}              │
│ Blog                                 │
│ Sobre mí                             │
│ Contacto                             │
│ ─────────────────────────────────    │
│ Área de clientes · Entrar · ES/EN    │
└──────────────────────────────────────┘
```

### 3.5 Pie de contenido

Al final del panel central de cada página pública (no en la línea de estado): Contacto (WhatsApp, email, LinkedIn, GitHub), Legal (Aviso legal, Privacidad, Cookies), y una línea de hechos: "Esta web: Next.js en Cloudflare Workers, gateway Hono propio, backend Fastify en servidor propio, Supabase. Código en GitHub {{DATO: repo público sí/no}}". Sin newsletter, sin frases de cierre.

### 3.6 Flujo de entrada: hero de presentación que se compila y se minimiza

**Regla:** una vez al día por visitante. Clave `localStorage.hero_seen` = fecha (AAAA-MM-DD, zona del navegador). Solo en `/` y `/en`. Si la clave es hoy, o se entra por una ruta interior, el shell arranca ya minimizado y la presentación se muestra como primer bloque del contenido (§4.1), sin animación.

**Hero de presentación (contenido, no de venta):**
- Título: `{{DATO: nombre a mostrar}}` (destino de la compilación).
- Línea de rol: "Desarrollador full-stack. React Native, Next.js, TypeScript, Supabase. {{DATO: ciudad}}, España."
- Tres hechos (uno por línea): "Apps propias: 3catinfo {{DATO: rol exacto}}, HazmeFila {{DATO: estado}}, Oportunix {{DATO: estado}}" · "Esta web: gateway en Cloudflare Workers, backend en servidor propio, Supabase; datos del build en la línea de estado" · "{{DATO: formación certificada: ITIL 4, DevOps & Cloud Computing (AWS), Professional Scrum Master — cuáles están obtenidas}}".
- Dos enlaces discretos: `> Proyectos` y `> Contacto`. Nada de packs ni precios aquí.

**Estados y tiempos (escritorio, máximo 3,5 s):**

| t | Estado | Qué ocurre |
|---|---|---|
| 0 ms | `boot` | El shell (árbol, línea de estado) está pintado pero atenuado. El hero ocupa el panel central completo. En el título aparece una cadena semilla en monoespaciada: `build("{{DATO: nombre}}")` |
| 0–1.200 ms | `compiling` | El título cambia de caracteres (scramble determinista: cada carácter converge de izquierda a derecha al carácter final; sin aleatoriedad visible al final). Al converger, la monoespaciada se sustituye por la tipografía de titular (`ui`). Un foco de luz suave (`FocusLight`) enfoca el título |
| 1.200–2.000 ms | `typing` | La línea de rol aparece completa con un barrido de luz de izquierda a derecha (no letra a letra); los tres hechos entran escalonados (80 ms) |
| 2.000–2.600 ms | `hold` | Sin cambios. El visitante puede leer |
| 2.600–3.300 ms | `minimizing` | El título se contrae y viaja a la barra de título (FLIP con GSAP); la línea de rol se reduce a la barra; el shell recupera su brillo; el contenido de la home entra desde abajo. Los tres hechos y los enlaces quedan como primer bloque "Presentación" del contenido, ya en su sitio |
| ≥ 3.300 ms | `ready` | Estado final: idéntico al de una visita repetida. Se escribe `hero_seen` |

**Móvil:** mismos estados, máximo 2.400 ms (compiling 800, typing 500, hold 400, minimizing 600). El título compila en una sola línea; el destino es la cabecera compacta. Nada se anima fuera del viewport.

**Saltar:** cualquier clic, toque, tecla (incluida Tab), rueda o scroll durante `boot`–`minimizing` lleva a `ready` en ≤ 200 ms sin pasos intermedios, y se escribe `hero_seen`. Un enlace visible "Saltar" aparece en la esquina desde 0 ms, enfocable en primer lugar en el orden de tabulación.

**`prefers-reduced-motion`:** no hay `compiling` ni `minimizing`; se pinta directamente `ready`; el bloque "Presentación" queda arriba con el título a tamaño de titular normal. Se escribe `hero_seen` igual.

**Repetir a mano:** en `ready`, en la home, un enlace pequeño "Repetir presentación" al final del bloque "Presentación" (y el clic en el nombre de la barra de título) vuelve a `boot` sin tocar `hero_seen`. Con `prefers-reduced-motion` este enlace no se muestra.

**Errores:** si GSAP no carga (script bloqueado), el estado inicial es `ready` (CSS sin JS). Si `localStorage` no está disponible, se comporta como primera visita en cada carga de `/` pero nunca en rutas interiores.

**Accesibilidad:** el título compilando lleva `aria-label` con el nombre final desde 0 ms y `aria-live="off"`; los lectores de pantalla no reciben los caracteres intermedios. El foco inicial está en "Saltar al contenido" (que también salta la animación).

**Eventos:** `hero_played` (con `skipped: true|false`, `ms`).

### 3.7 Vocabulario de motion (para toda la web)

Solo tres recursos, con sentido técnico y sobrios. Prohibido: partículas, ondas, retículas decorativas, gradientes animados, parallax de fondo.

| Recurso | Qué es | Dónde |
|---|---|---|
| `CompileReveal` | Un bloque aparece primero como su "fuente" (una línea monoespaciada corta con su título, p. ej. `section: Packs y extras`) que se resuelve en el bloque renderizado en ≤ 300 ms. Solo en el `h2` de cada bloque, una vez, al entrar en viewport | Home, secciones públicas |
| `FocusLight` | Un foco de luz suave que enfoca el bloque centrado en el viewport (scroll-driven, GSAP ScrollTrigger) y, en escritorio, resalta la tarjeta bajo el puntero (sin inclinaciones ni escalas) | Todas las páginas públicas; en móvil solo scroll |
| Transición de página | El contenido saliente se atenúa 120 ms y el entrante sube 8 px en 160 ms; la pestaña activa cambia sin animación | Público |

"El scroll explica, el puntero solo resalta": nada cambia de significado con el hover; el scroll revela en orden de lectura. Con `prefers-reduced-motion`, `CompileReveal` y las transiciones se desactivan y `FocusLight` queda fijo en el bloque activo.

### 3.8 Shell del área de clientes

Sin cambios respecto a v1.1: cabecera reducida + barra inferior (Proyecto · Tareas · Material · Pack · Recomiéndame) en móvil; barra lateral en escritorio. `ui` alinea el aspecto de la barra inferior con la línea de estado del shell público, pero la estructura no cambia.

### 3.9 Shell del admin

Sin cambios respecto a v1.1: barra inferior (Leads · Clientes · Chat · Más) en móvil; barra lateral con contadores en escritorio.

### 3.10 Componentes transversales (catálogo)

| Componente | Uso | Notas para `ui` |
|---|---|---|
| `AppShell` | Barra de título (hero minimizado), árbol, pestañas (escritorio), panel central, línea de estado | La pieza que define la web; `ui` la entrega primero |
| `SiteTree` | Árbol de navegación de tres niveles; fijo en escritorio, hoja en móvil | Sin iconos de fichero; etiquetas en lenguaje normal |
| `TitleBar` | Nombre, rol, CTA Contacto, chat, cuenta, idioma | Destino del FLIP del hero |
| `StatusLine` | Datos del build (escritorio) y accesos (Menú · Contacto · Chat en móvil) | Monoespaciada permitida aquí |
| `Tabs` | Pestañas de rutas abiertas (solo escritorio) | Degradable a migas |
| `HeroIntro` | Presentación con compilación y minimización (§3.6) | Estados `boot`…`ready` |
| `CompileReveal`, `FocusLight` | Motion (§3.7) | Parámetros por `ui` |
| `SectionIndex` | Índice de secciones en la home: seis entradas con una línea de hechos cada una | Es la navegación de un toque en móvil |
| `FactList` | Lista de hechos verificables (tres a cinco líneas, cada una con su prueba o enlace) | Sustituye a los párrafos de presentación |
| `ProofStrip` | Pruebas reales en lenguaje llano: "3catinfo, HazmeFila y Oportunix", "Esta web carga en {x} s", "{n} repos públicos" | Datos de build; nunca inventados |
| `PackCard` | Pack P1–P4: nombre, para quién, incluye, "Desde X €", plazo | Cuatro iguales; sin "recomendado" |
| `ExtraCard` | Extra: nombre llano, sigla entre paréntesis, una línea de qué es, precio | La sigla nunca va sola |
| `PriceTag` | "Desde 900 €" + "sin IVA" | Sin tachados |
| `GuidedChat` | Generador de propuesta: burbujas, chips, texto, progreso | Conversación guiada, no formulario |
| `ProposalCard` | Resultado del generador | Se reutiliza en admin |
| `ProjectCard` | Proyecto: nombre, tipo, una línea de hechos, enlaces de prueba | Capturas de producto en marco de móvil, sin fotos |
| `StoreBadges`, `GitHubActivity` | Pruebas externas | Datos en build/ISR |
| `PostCard`, `CommentThread` | Blog | — |
| `ContactForm`, `WhatsAppButton`, `CalEmbed`, `AuthProviders` | Contacto y acceso | Ver §4.10, §5 |
| `RefNotice` | Aviso de recomendación (una vez por cookie) | Toast persistente inferior |
| `StatusBadge`, `EmptyState`, `ErrorState`, `Skeleton`, `Toast`, `Sheet`, `DataTable`, `LangSwitch`, `OfflineBanner` | Como en v1.1 | — |

---

## 4. Pantallas públicas

Formato por pantalla: objetivo · jerarquía · componentes · acción primaria única · secundarias · estados · wireframe móvil · escritorio · eventos. Todas las páginas públicas viven dentro del `AppShell` (§3).

### 4.1 Home `/` (Inicio)

**Objetivo:** presentar a Jose con hechos y dar acceso de un toque a todas las secciones. No vende: los servicios tienen sus páginas. Marta llega a Negocios/WhatsApp en dos toques; Dani encuentra proyectos, cómo está hecha la web y el chat sin buscar.

**Jerarquía:** 1) presentación (hero → bloque compacto tras la minimización); 2) índice de secciones con un hecho por sección; 3) proyectos; 4) cómo está hecha esta web; 5) último artículo; 6) contacto.

**Componentes:** `AppShell`; `HeroIntro` (§3.6); bloque "Presentación" (`FactList`: nombre, rol, ciudad, tres hechos, enlaces LinkedIn, GitHub, CV; "Repetir presentación"); `SectionIndex` (seis entradas); `ProjectCard` × 3 (ordenadas por número de pruebas verificables, §4.5); bloque "Cómo está hecha esta web" (`FactList` con datos de build: framework, despliegue, gateway, backend, base de datos, tests, LCP; enlace a la arquitectura); último `PostCard` (1); bloque "Contacto" con `[ WhatsApp ]`, `> Formulario`, `> Chat`; pie de contenido.

**Acción primaria:** ninguna de venta. La primaria funcional es el `SectionIndex` (la navegación de un toque). En la barra de título, `[[ Contacto ]]` es la CTA global, no de la página.

**Estados:** primera visita del día → `HeroIntro` (§3.6); resto → `ready`. Sin datos de build (fallo del script en CI) → la build falla; nunca placeholders. Sin proyectos con pruebas → el bloque no se renderiza. `prefers-reduced-motion` → sin animación, mismo contenido.

```
Móvil, estado ready (primera visita: antes de esto, el hero ocupa la pantalla, §3.6)
┌──────────────────────────────────────┐
│ {{DATO: nombre}}              ●  ES  │
│ desarrollador full-stack             │
├──────────────────────────────────────┤
│  Presentación                        │
│  React Native, Next.js, TypeScript,  │
│  Supabase. {{DATO: ciudad}}, España. │
│  · Apps propias: 3catinfo, HazmeFila,│
│    Oportunix {{DATO: estados}}       │
│  · Esta web: Cloudflare Workers +    │
│    servidor propio + Supabase        │
│  · {{DATO: certificaciones}}         │
│  LinkedIn · GitHub · CV              │
│  > Repetir presentación              │
├──────────────────────────────────────┤
│  Secciones                           │
│ ┌ Trabajo con empresas ────────────┐ │
│ │ Por proyecto o por horas, 40 €/h │ │
│ ┌ Webs para tu negocio ────────────┐ │  ← Marta: 1 toque
│ │ 4 packs, de 900 a 4.200 €,       │ │
│ │ 1 a 3 semanas                    │ │
│ ┌ Proyectos ───────────────────────┐ │
│ │ 3 apps y esta web, con enlaces   │ │
│ ┌ Blog ────────────────────────────┐ │
│ │ {n} artículos, último {fecha}    │ │
│ ┌ Sobre mí ────────────────────────┐ │
│ │ {{DATO: años}} años, formación,  │ │
│ │ cómo trabajo                     │ │
│ ┌ Contacto ────────────────────────┐ │
│ │ WhatsApp, formulario, 20 min     │ │
├──────────────────────────────────────┤
│  Proyectos                           │
│  [ProjectCard 1] [ProjectCard 2]     │
│  [ProjectCard 3]  > Ver todos        │
├──────────────────────────────────────┤
│  Cómo está hecha esta web            │
│  · Next.js {v} en Cloudflare Workers │
│    (OpenNext)                        │
│  · Gateway Hono con {n} rutas        │
│  · Backend Fastify en servidor propio│
│  · Supabase: {n} tablas, {n} RLS     │
│  · {n} tests · LCP {x} s en móvil    │
│  > Arquitectura                      │
├──────────────────────────────────────┤
│  Último artículo                     │
│  [PostCard]                          │
├──────────────────────────────────────┤
│  Contacto                            │
│  [ WhatsApp ]  > Formulario  > Chat  │
│  pie de contenido                    │
├──────────────────────────────────────┤
│  Menú          Contacto        Chat  │
└──────────────────────────────────────┘
```

**Escritorio:** árbol a la izquierda; panel central con los mismos bloques en una columna de lectura; "Secciones" en dos columnas de tres; proyectos en tres columnas; "Cómo está hecha esta web" a dos columnas (hechos | esquema de arquitectura en texto, sin gráficos decorativos). `FocusLight` sigue el bloque centrado.

**Eventos:** `hero_played`, `section_open {section}` (clic en `SectionIndex`), `whatsapp_click {origin: home}`.

### 4.2 Trabajo con empresas `/empresas`

**Objetivo:** que Dani sepa qué contrata (web, móvil, IA integrada), con qué stack, cómo trabaja Jose y cómo hablar; descargar CV.

**Jerarquía:** 1) párrafo citable (quién, qué, para quién, dónde); 2) tres servicios; 3) stack y forma de trabajar; 4) pruebas (GitHub, stores, esta web); 5) preguntas frecuentes; 6) contacto: formulario/email y reserva de llamada.

**Componentes:** h1 + `FactList` citable (quién, qué, para quién, tarifa); `ServiceCard` × 3 (Web, Móvil, IA integrada: qué incluye, tecnologías reales, un proyecto de ejemplo con enlace); bloque "Cómo trabajo" (pasos: descubrimiento, propuesta con precio cerrado, iteraciones, entrega y garantía; tarifa hora 40 €/h y 150 €/feature con alcance cerrado); `GitHubActivity`; `StoreBadges`; `ProofStrip` de esta web; FAQ (acordeón, 5–7 preguntas: disponibilidad, remoto, contrato/puesto, plazos, facturación); bloque final con `[[ Reservar 20 min ]]` (`CalEmbed` en modal o inline) y `> Escribir por formulario` / `> Descargar CV`; pie.

**Acción primaria:** Reservar 20 min. **Secundarias:** formulario de contacto (`/contacto?via=empresa`), descargar CV (PDF), chat.

**Estados:** `GitHubActivity` sin datos (fallo de API en build) → no se renderiza. `CalEmbed` bloqueado o caído → botón lleva a la URL de Cal.com en nueva pestaña y texto "Si el calendario no carga, escríbeme y cuadramos hora".

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Trabajo con empresas                │ h1
│  Desarrollador full-stack freelance  │ FactList citable
│  en {{DATO: ciudad}}, España.        │
│  Web (Next.js), móvil (React Native) │
│  e IA integrada (Workers AI, Ollama, │
│  n8n). Por proyecto o por horas:     │
│  40 €/h; feature cerrada, 150 €.     │
│  [ Descargar CV ]                    │
├──────────────────────────────────────┤
│  Qué hago                            │
│  [ServiceCard Web]                   │
│  [ServiceCard Móvil]                 │
│  [ServiceCard IA integrada]          │
├──────────────────────────────────────┤
│ == bloque: Cómo trabajo ==           │
│  1 Hablamos 20 min                   │
│  2 Propuesta con precio cerrado      │
│  3 Iteraciones con demo semanal      │
│  4 Entrega, código y 30 días         │
│  Tarifa: 40 €/h · 150 €/feature      │
├──────────────────────────────────────┤
│  Pruebas                             │
│  [StoreBadges]                       │
│  [GitHubActivity]                    │
│  [ProofStrip esta web] > Cómo está   │
│  hecha                               │
├──────────────────────────────────────┤
│  Preguntas                           │
│  ▸ ¿Trabajas en remoto?              │
│  ▸ ¿Aceptas puesto fijo?             │
│  ▸ …                                 │
├──────────────────────────────────────┤
│  Hablamos                            │
│  [[ Reservar 20 min ]]               │
│  > Escribir por formulario           │
│  > Preguntar al asistente            │
├──────────────────────────────────────┤
│  pie                                 │
└──────────────────────────────────────┘
```

**Escritorio:** servicios en tres columnas; "Cómo trabajo" con pinning y pasos que se iluminan al hacer scroll; pruebas en dos columnas (stores + GitHub); `CalEmbed` inline en el cierre, a la derecha del texto.

### 4.3 Webs para tu negocio `/negocios`

**Objetivo:** que Marta vea en el primer scroll los cuatro packs con precio "desde", entienda el proceso y elija entre generar una propuesta o escribir por WhatsApp.

**Jerarquía:** 1) párrafo citable + dos CTA; 2) cuatro packs; 3) extras; 4) proceso y condiciones; 5) ejemplos (webs de comercios); 6) preguntas; 7) cierre con WhatsApp.

**Componentes:** h1 + párrafo citable con hechos; `[[ WhatsApp ]]` + `[ Pedir propuesta orientativa ]`; `PackCard` × 4 (P1 900 € / 1 sem, P2 1.400 € / 2 sem, P3 2.500 € / 2 sem, P4 4.200 € / 3 sem; "Dominio y hosting a tu nombre", sin regalos); `ExtraCard` × 6 con nombre llano y sigla entre paréntesis (§10.2 `extras.*`): Mantenimiento básico 49 €/mes · Mantenimiento extendido 149 €/mes · Que te encuentren en Google, básico (SEO) 250 € · Que te encuentren en Google, completo (SEO) 600 € · Que te encuentren los asistentes de IA (GEO) 300 € · Revisión de seguridad de tu web 250 €; cada tarjeta lleva una línea llana de qué es; "Cómo es el proceso" (hablamos → propuesta y presupuesto → 40 / 30 / 30 → entrega y 30 días de garantía); `ProjectCard` × N (webs de comercios); FAQ (`FAQPage`: cuánto tarda, qué necesito darte, dominio y hosting, qué pasa después, se puede ampliar); **barra inferior fija en móvil** con `[[ WhatsApp ]]` y `[ Propuesta ]`; pie.

**Acción primaria:** WhatsApp con mensaje prellenado (spec §12). **Secundarias:** generador de propuesta; cada `PackCard` tiene `> Pedir propuesta con este pack` que abre el generador con el pack preseleccionado (`/propuesta?pack=P2`).

**Estados:** precios leídos de `pricing.json` en build; si un pack no existe en el JSON, la build falla (nunca una tarjeta sin precio). Sin ejemplos de comercios reales aún → el bloque "Ejemplos" no se renderiza (spec: nada publicado sin contenido real).

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Webs para tu negocio                │ h1
│  Hago la web de tu clínica, tienda,  │ párrafo citable
│  restaurante o taller con precio y   │
│  plazo cerrados. Desde 900 €.        │
│  [[ Escribir por WhatsApp ]]         │
│  [ Pedir propuesta orientativa ]     │
├──────────────────────────────────────┤
│  Cuatro packs, precio cerrado        │
│ ┌──────────────────────────────────┐ │
│ │ P1 Web básica                    │ │
│ │ Presentación, contacto, SEO base │ │
│ │ y textos legales.                │ │
│ │ Desde 900 €  · 1 semana          │ │
│ │ > Pedir propuesta con este pack  │ │
│ └──────────────────────────────────┘ │
│ ┌ P2 Pedidos / reservas · 1.400 € ┐ │
│ ┌ P3 Gestión · 2.500 €            ┐ │
│ ┌ P4 Gestión + automatizaciones   ┐ │
│ │ · 4.200 € · 3 semanas           │ │
│  Precios sin IVA. Dominio y hosting  │
│  a tu nombre.                        │
├──────────────────────────────────────┤
│  Extras, aparte del pack             │
│  [Mantenimiento básico · 49 €/mes    │
│   Copias, actualizaciones y cambios] │
│  [Mantenimiento extendido · 149/mes] │
│  [Que te encuentren en Google (SEO)  │
│   básico 250 € · completo 600 €]     │
│  [Que te encuentren los asistentes   │
│   de IA (GEO) · 300 €]               │
│  [Revisión de seguridad · 250 €]     │
├──────────────────────────────────────┤
│ == bloque: Cómo es el proceso ==     │
│  1 Hablamos (WhatsApp o propuesta)   │
│  2 Presupuesto cerrado, firmas       │
│  3 40 % al empezar, 30 % diseño,     │
│    30 % entrega                      │
│  4 Web publicada, 30 días garantía   │
├──────────────────────────────────────┤
│  Webs hechas (si hay)                │
│  [ProjectCard] [ProjectCard]         │
├──────────────────────────────────────┤
│  Preguntas                           │
│  ▸ ¿Cuánto tarda?  ▸ ¿Qué te doy?    │
├──────────────────────────────────────┤
│  Te resumo: precio cerrado, plazo    │
│  cerrado, sin permanencia.           │
│  [[ Escribir por WhatsApp ]]         │
├──────────────────────────────────────┤
│  pie                                 │
├──────────────────────────────────────┤
│ [[ WhatsApp ]]     [ Propuesta ]     │ barra fija móvil
└──────────────────────────────────────┘
```

**Escritorio:** packs en cuatro columnas de igual altura; extras en tres columnas; proceso con pinning; sin barra fija (los CTA del hero y del cierre bastan).

**Eventos:** `whatsapp_click` (con `pack` si viene de una tarjeta), clic en "Pedir propuesta".

### 4.4 Generador de propuesta `/propuesta`

**Objetivo:** Marta describe su negocio en 3–4 preguntas guiadas y recibe una propuesta con pack, alcance y "desde X €"; si le encaja, la envía y se crea un lead cualificado. Nunca una página en blanco (spec §12).

**Es un chat guiado**, no un formulario: cada pregunta es una burbuja del asistente con chips de respuesta y campo de texto libre; las respuestas de Marta se muestran como burbujas propias y pueden editarse.

**Subpantallas (una ruta, cinco estados en la misma vista):**

1. **Preguntas (1/4 → 4/4)**
   - P1 "¿Qué tipo de negocio tienes?" — chips: Clínica o consulta · Restaurante o bar · Tienda · Taller o servicios · Otro (abre texto).
   - P2 "¿Qué tiene que hacer la web?" — chips multiselección: Mostrar lo que hago · Que me llamen o escriban · Pedidos · Reservas o citas · Gestionar clientes o stock · Avisos automáticos · Aparecer en Google. Texto libre "Cuéntame más (opcional)".
   - P3 "¿Vas a vender o reservar online?" — chips: Sí, pedidos · Sí, reservas o citas · No · No lo sé. (Se omite si P2 ya lo dejó claro; entonces son 3 preguntas.)
   - P4 "¿Para cuándo la necesitas?" — chips: Cuanto antes · En un mes · Sin prisa.
   - Si llega con `?pack=P2`, el asistente abre con "Vienes del pack P2. Te hago tres preguntas para ajustarlo" y las respuestas se preseleccionan donde aplique.
2. **Generando** — burbuja del asistente con indicador de escritura y texto "Preparando tu propuesta" (Turnstile invisible + `POST /api/v1/proposals/generate`). Tiempo objetivo < 6 s; a los 8 s aparece "Está tardando más de lo normal" y a los 20 s el estado de error.
3. **Propuesta** — `ProposalCard`: pack recomendado (nombre y para qué), qué incluye (3–5 líneas), "Desde X €, sin IVA" (precio del pack según `pricing.json`, calculado por reglas), plazo, aviso "Orientativo. El precio cerrado va en la propuesta que te mando"; debajo, separado, bloque "Extras que te recomiendo (opcionales, no incluidos en el desde)" con 0–3 extras, cada uno con etiqueta "Opcional · no incluido" y su precio aparte. El "desde" nunca suma extras. Debajo: `[[ Enviar a Jose ]]`, `[ Cambiar respuestas ]`, `> Escribir por WhatsApp con esta propuesta`.
4. **Enviar** — el asistente pide los datos en la misma conversación: nombre, nombre del negocio, "email o teléfono" (uno obligatorio; se aceptan ambos), casilla de privacidad. `[[ Enviar ]]`. Se crea el `lead` con `ai_proposal`, `source=proposal`, `affiliate_code` (si hay cookie `ref`).
5. **Enviado** — "Hecho. Te escribo en menos de 24 h laborables." + `[[ Abrir WhatsApp ]]` (mensaje prellenado con pack y nombre) + `> Volver a Negocios`. Evento `proposal_sent`.

**Acción primaria por estado:** responder (chips) → Enviar a Jose → Enviar → Abrir WhatsApp.

**Estados:**
- Carga inicial: la primera pregunta aparece al instante (estática); no depende de red.
- Error de red / gateway caído / Omen no interviene (Workers AI está en el gateway): burbuja de error "No he podido preparar la propuesta. Puedes reintentar o escribirme por WhatsApp con tus respuestas" + `[[ Reintentar ]]` + `[ WhatsApp ]` (el mensaje prellenado incluye las respuestas dadas: así el lead no se pierde).
- 429 (rate limit por IP): "Has pedido varias propuestas seguidas. Prueba en unos minutos o escríbeme por WhatsApp" + `[ WhatsApp ]`. Sin cuenta atrás numérica.
- Turnstile falla: "No he podido verificar que no eres un robot. Recarga la página; si sigue igual, escríbeme por WhatsApp".
- Supabase caído al enviar: el lead no se guarda → "No he podido guardar tus datos. Te dejo la propuesta lista para WhatsApp" + `[[ Abrir WhatsApp ]]` (con propuesta) + fallback: `mailto:` con el mismo texto. Se registra el fallo en Telegram si el gateway responde.
- Éxito: estado 5.
- Sin permisos: no aplica (anónimo).
- Sin conexión: `OfflineBanner`; chips desactivados; al reconectar, se reactiva sin perder respuestas (estado en memoria y `sessionStorage`).

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Propuesta orientativa      1 de 4   │ progreso
│ ┌──────────────────────────────────┐ │
│ │ Te hago cuatro preguntas y te    │ │ asistente
│ │ digo qué web te haría y desde    │ │
│ │ cuánto. Sin compromiso.          │ │
│ │                                  │ │
│ │ ¿Qué tipo de negocio tienes?     │ │
│ └──────────────────────────────────┘ │
│  (Clínica) (Restaurante) (Tienda)    │ chips
│  (Taller o servicios) (Otro)         │
│                                      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Escribe aquí si prefieres…     > │ │ texto libre
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

Estado Propuesta:
┌──────────────────────────────────────┐
│  Propuesta orientativa      4 de 4   │
│  … (conversación previa, editable)   │
│ ┌──────────────────────────────────┐ │
│ │ Con lo que me cuentas, te haría: │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ P2 Pedidos / reservas        │ │ │ ProposalCard
│ │ │ Web con carta, reservas de   │ │ │
│ │ │ mesa y gestión de citas.     │ │ │
│ │ │ Incluye: · · ·               │ │ │
│ │ │ Desde 1.400 € sin IVA        │ │ │
│ │ │ Plazo: 2 semanas             │ │ │
│ │ │ Orientativo. El precio       │ │ │
│ │ │ cerrado va en la propuesta.  │ │ │
│ │ │ ── Extras que te recomiendo  │ │ │
│ │ │ (opcionales, no incluidos)   │ │ │
│ │ │ Google básico (SEO)  +250 €  │ │ │
│ │ │  Opcional · no incluido      │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│  [[ Enviar a Jose ]]                 │
│  [ Cambiar respuestas ]              │
│  > Escribir por WhatsApp con esto    │
└──────────────────────────────────────┘
```

**Escritorio:** la conversación ocupa una columna central de ancho de lectura; a la derecha, un panel fijo con el resumen de respuestas (editable) y, cuando existe, la `ProposalCard`. El árbol y la línea de estado quedan atenuados mientras dura la conversación.

**Eventos:** `proposal_generated` (con pack), `proposal_sent`, `whatsapp_click` (origen `proposal`).

### 4.5 Proyectos `/proyectos`

**Objetivo:** Dani verifica trabajo real; Marta ve que Jose ha hecho cosas que existen.

**Componentes:** cabecera; h1 + párrafo citable; filtro por tipo (Todos · Apps · Webs · Esta web) como chips; `ProjectCard` × N (nombre, tipo, una frase, badges de prueba: stores con valoración, "Código", "Web publicada"); pie. **Orden:** por número de pruebas verificables de cada ficha (enlace a store, web publicada, código público, valoración), calculado en build desde el frontmatter; a igualdad, el más reciente. 3catinfo, con ficha reducida por confidencialidad (solo nombre y stores), no ocupa la primera posición de la home ni de Proyectos. Qué proyectos están publicados y con qué enlaces es `{{DATO}}` (§18): HazmeFila (Expo + Supabase, primer commit junio 2026) y Oportunix (Next.js 16 + Firebase, web de mystery boxes y subastas, febrero 2026) constan en los repos, no su publicación.

**Acción primaria:** abrir una ficha (la tarjeta entera es el enlace). **Secundarias:** filtros.

**Estados:** vacío por filtro → "No hay proyectos de este tipo todavía" + `[ Ver todos ]`. Carga: estático. `StoreBadges` sin valoración (API sin datos) → solo el enlace, sin número.

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Proyectos                           │
│  Apps y webs con enlace a stores,    │
│  web o código.                       │
│  (Todos) (Apps) (Webs) (Esta web)    │
│ ┌──────────────────────────────────┐ │
│ │  ┌──────┐  {{DATO: proyecto 1}}  │ │
│ │  │marco │  Expo + Supabase.      │ │
│ │  │móvil │  {{DATO: estado}}      │ │
│ │  └──────┘                        │ │
│ │  [App Store] [Play] [Código]     │ │
│ └──────────────────────────────────┘ │
│ ┌ {{DATO: proyecto 2}} · [Web] ────┐ │
│ ┌ 3catinfo · [App Store] [Play] ───┐ │
│ ┌ josecoded.com · [Código] ────────┐ │
│  pie                                 │
└──────────────────────────────────────┘
```

**Escritorio:** rejilla de dos o tres columnas; al pasar el ratón, el marco de móvil hace scroll de capturas (idea del carrusel de josedev), scroll-driven en la ficha.

### 4.6 Ficha de proyecto `/proyectos/[slug]`

**Objetivo:** prueba verificable de un proyecto. Campos ocultables (3catinfo: sin métricas ni stack, Q6).

**Componentes:** cabecera; h1 (nombre) + tipo + estado (Publicada / En producción); párrafo citable; `StoreBadges` / enlace web / enlace código; galería de capturas de producto en marco de móvil (scroll-driven en escritorio; carrusel táctil en móvil); "Qué hice" (lista corta); "Stack" (ocultable); "Resultados" (ocultable; solo datos verificables); "Preguntas" (2–4); navegación anterior/siguiente; cierre `[ Hablar de un proyecto así ]` → `/contacto` **sin `?via`**: hereda el segmento recordado (§4.10), no el tipo del proyecto (Marta que mira una app sigue siendo negocio; Dani que mira una web de comercio sigue siendo empresa). El frontmatter `audience` de la ficha solo fija el recuerdo si aún no había ninguno; pie.

**Acción primaria:** el enlace de prueba principal (store o web) en el hero; en el cierre, contacto. Para no tener dos primarias, el hero marca el enlace de prueba como primaria y el cierre usa secundaria visual.

**Estados:** ficha sin capturas → se omite la galería. Sin stack o resultados → se omiten (nunca "confidencial" como texto vacío; se puede poner "Proyecto bajo acuerdo de confidencialidad: muestro nombre y alcance" si Jose lo aprueba).

```
┌──────────────────────────────────────┐
│ < Proyectos                          │
│  3catinfo                            │
│  App · Publicada                     │
│  App de noticias multiplataforma con │
│  tiempo real, sin conexión y sync.   │
│  [[ Ver en App Store ]] [ Google Play]│
│ ┌──────┐┌──────┐┌──────┐             │ capturas en marco
│ │      ││      ││      │  ›          │
│ └──────┘└──────┘└──────┘             │
│  Qué hice                            │
│  · Desarrollo de la app              │
│  · Rendimiento en gama media         │
│  (Stack: oculto)  (Resultados: oc.)  │
│  Preguntas                           │
│  ▸ ¿Está en producción?              │
│  < Anterior   Siguiente >            │
│  [ Hablar de un proyecto así ]       │
│  pie                                 │
└──────────────────────────────────────┘
```

**Escritorio:** dos columnas: texto a la izquierda (sticky), capturas a la derecha que avanzan con el scroll.

### 4.7 Blog `/blog`

**Objetivo:** lectura técnica (Dani) y señales de actividad. Artículos MDX del repo.

**Componentes:** cabecera; h1 + una frase; filtro por etiqueta (chips) opcional; `PostCard` × N (título, fecha, minutos de lectura, etiquetas, "Solo en inglés" si no hay traducción); paginación "Cargar más" (SSG con 12 por página); pie.

**Acción primaria:** abrir un artículo. **Estados:** sin artículos en el idioma → "Todavía no hay artículos en español. Puedes leer los que hay en inglés" + `[ Ver en inglés ]`. Nunca se publica el blog vacío en ambos idiomas.

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Blog                                │
│  Cómo están hechos mis proyectos y   │
│  esta web. {n} artículos.            │
│  (Todo) (Next.js) (React Native) (IA)│
│ ┌──────────────────────────────────┐ │
│ │ Cómo está hecha josecoded.com    │ │
│ │ 17 sep 2026 · 8 min · ES EN      │ │
│ └──────────────────────────────────┘ │
│ ┌ … ┐                                │
│  [ Cargar más ]                      │
│  pie                                 │
└──────────────────────────────────────┘
```

### 4.8 Artículo `/blog/[slug]`

**Objetivo:** leer cómodo, citar (GEO), comentar con cuenta.

**Componentes:** cabecera; cabecera del artículo (h1, fecha, lectura, autor "Jose", etiquetas, enlace al otro idioma si existe); barra de progreso de lectura (parte del scroll propio); cuerpo MDX (código con copiar, imágenes de producto/diagramas, callouts); "Índice" plegable (móvil) / lateral sticky (escritorio); cierre "Si te sirve, compártelo" con copiar enlace y LinkedIn; artículos relacionados × 2; **comentarios** (`CommentThread`); pie.

**Comentarios, por estado de sesión:**
- Sin cuenta: lista de comentarios aprobados + caja bloqueada: "Para comentar necesitas una cuenta. Es un clic con Google" + `[[ Entrar para comentar ]]` (vuelve al ancla `#comentarios`).
- Con cuenta: textarea con nota fija bajo el campo, visible antes de escribir: "Reviso cada comentario antes de publicarlo para evitar spam. Suele ser el mismo día" + `[[ Publicar comentario ]]`; tras enviar, el comentario aparece en la lista solo para el autor con `StatusBadge` "Pendiente de revisión" y texto "Se publica cuando lo revise. Suele ser el mismo día". Responder (un nivel) con `> Responder`.
- Autor con comentario rechazado: no se muestra (se elimina de su vista con un toast si estaba en pantalla).

**Acción primaria:** en la página, ninguna de conversión; la primaria del bloque de comentarios es Publicar (o Entrar para comentar).

**Estados:** sin comentarios → "Todavía no hay comentarios." + caja. Carga de comentarios (RSC con caché corta): `Skeleton` de dos filas. Error al cargar comentarios → "No he podido cargar los comentarios" + `[ Reintentar ]`, el artículo sigue legible. Error al publicar → toast "No se ha publicado. Reintenta" con el texto conservado. Sesión caducada al publicar → toast "Tu sesión ha caducado. Entra de nuevo" + `[ Entrar ]` (texto conservado en `sessionStorage`).

```
┌──────────────────────────────────────┐
│ ▮▮▮▮▮▮▮▯▯▯▯ progreso                 │
│ < Blog                               │
│  Cómo está hecha josecoded.com       │ h1
│  17 sep 2026 · 8 min · Jose · EN >   │
│  ▸ Índice                            │
│                                      │
│  Cuerpo MDX …                        │
│  ┌ código ───────────── [Copiar] ┐   │
│  └────────────────────────────────┘  │
│  …                                   │
│  Compartir: [Copiar enlace] [LinkedIn]│
│  Relacionados: [PostCard] [PostCard] │
├──────────────────────────────────────┤
│  Comentarios (3)                     │
│  ┌ Dani · hace 2 d ────────────────┐ │
│  │ …                  > Responder  │ │
│  └─────────────────────────────────┘ │
│  ┌ Tú · Pendiente de revisión ─────┐ │
│  └─────────────────────────────────┘ │
│  ┌──────────────────────────────────┐│
│  │ Escribe un comentario            ││
│  └──────────────────────────────────┘│
│  Reviso cada comentario antes de     │
│  publicarlo para evitar spam. Suele  │
│  ser el mismo día.                   │
│  [[ Publicar comentario ]]           │
│  pie                                 │
└──────────────────────────────────────┘
```

**Escritorio:** columna de lectura centrada (≈ 70 caracteres), índice sticky a la izquierda, sin barra lateral derecha.

### 4.9 Sobre mí `/sobre-mi`

**Objetivo:** confianza para Marta (persona real, en España, con proyectos), perfil para Dani (`ProfilePage`).

**Componentes:** h1 `{{DATO: nombre}}` + rol + ubicación (`{{DATO: ciudad}}`, España, remoto); **zona de retrato** (decisión abierta §13: única foto permitida del sitio, o avatar generativo); párrafo citable; línea de tiempo con fechas reales (proyectos propios: Oportunix feb 2026, HazmeFila jun 2026, josecoded v2 sep 2026; 3catinfo `{{DATO: año}}`; empleos `{{DATO}}`; sin logos de terceros salvo permiso); "Cómo trabajo" (3 principios de `voz.md`: qué se hace, cuánto cuesta, cuándo está); stack en una lista sobria agrupada como en josedev (móvil, web, backend y datos, calidad y operaciones); formación (ITIL 4, DevOps & Cloud Computing con AWS y GitLab CI, Professional Scrum Master; `{{DATO}}` cuáles están certificadas); enlaces: LinkedIn, GitHub, stores, CV; "Preguntas" (2–3); cierre con `[[ Contacto ]]` (global) y `> Preguntar al asistente`; pie.

**Acción primaria:** Contacto. **Estados:** estático.

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  ┌──────┐  {{DATO: nombre}}          │
│  │retra-│  Desarrollador full-stack  │
│  │ to   │  freelance · {{DATO:       │
│  └──────┘  ciudad}}, España          │
│  · {{DATO: años}} años haciendo webs │
│    y apps; freelance desde {{DATO}}  │
│  · React Native/Expo, Next.js,       │
│    TypeScript, Supabase, Node        │
│    (NestJS, Fastify), PostgreSQL     │
│  · Formación: ITIL 4, DevOps & Cloud │
│    (AWS), Scrum Master {{DATO:       │
│    obtenidas / en curso}}            │
│  [LinkedIn] [GitHub] [CV]            │
├──────────────────────────────────────┤
│ == bloque: Trayectoria ==            │
│  2026 josecoded v2 · HazmeFila       │
│  2026 Oportunix                      │
│  {{DATO: año}} 3catinfo              │
│  {{DATO: empleos anteriores}}        │
├──────────────────────────────────────┤
│  Cómo trabajo                        │
│  Digo qué hago, cuánto cuesta y      │
│  cuándo está. …                      │
│  Stack: Next.js, React Native, …     │
│  Preguntas ▸ ▸                       │
│  [[ Contacto ]]  > Asistente         │
│  pie                                 │
└──────────────────────────────────────┘
```

**Escritorio:** retrato y titular a la izquierda, texto a la derecha; trayectoria como línea horizontal scroll-driven.

### 4.10 Contacto `/contacto`

**Objetivo:** una sola página con la vía correcta según audiencia. Selector "Tengo un negocio / Somos una empresa" que cambia la primaria (spec §12). **Segmento inicial por origen**, con esta prioridad: 1) `?via=negocio|empresa` (override explícito); 2) segmento recordado en `sessionStorage` (`audience`), que se fija al visitar `/empresas` (→ empresa), `/negocios` (→ negocio), una ficha de proyecto con `audience` en su frontmatter, o al cambiar el segmento a mano; 3) sin nada → `negocio` (persona principal). Los enlaces "Contacto" del pie y del menú no llevan `?via`: heredan el recuerdo.

**Componentes:** cabecera; h1; segmento (dos opciones); bloque por vía:
- **Negocio:** `[[ Escribir por WhatsApp ]]` (mensaje prellenado), `> Pedir propuesta orientativa`, `ContactForm` plegado bajo "Prefiero dejar mis datos".
- **Empresa:** `ContactForm` desplegado (`[[ Enviar ]]`), `[ Reservar 20 min ]` (`CalEmbed`), email visible con copiar.
Tarjeta lateral con email, LinkedIn, GitHub, horario de respuesta ("Respondo en menos de 24 h laborables"); pie.

`ContactForm`: nombre · negocio/empresa · email · teléfono (opcional) · qué necesitas (chips: Web · App · IA · Puesto/colaboración · Otro) · mensaje (≤ 1.000) · privacidad · Turnstile. Se guarda como `lead` con `source=contact` y `affiliate_code` si hay cookie; el gateway avisa por Telegram.

**Estados:** envío → botón con "Enviando"; éxito → sustituye el formulario por "Hecho. Te respondo en menos de 24 h laborables" + `[ WhatsApp ]`; error de validación inline por campo; Turnstile fallido → mensaje bajo el botón; Supabase caído → "No he podido enviar el formulario. Escríbeme a hola@josecoded.com o por WhatsApp" con `mailto:` que lleva el mensaje escrito. Sin conexión → botón desactivado + banner.

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Contacto                            │
│  ┌────────────────┬────────────────┐ │
│  │●Tengo un negocio│ Somos empresa │ │ segmento
│  └────────────────┴────────────────┘ │
│  Lo más rápido es WhatsApp. Te       │
│  respondo yo.                        │
│  [[ Escribir por WhatsApp ]]         │
│  > Pedir propuesta orientativa       │
│  ▸ Prefiero dejar mis datos          │
│     (ContactForm plegado)            │
├──────────────────────────────────────┤
│  hola@josecoded.com  [Copiar]        │
│  LinkedIn · GitHub                   │
│  Respondo en menos de 24 h laborables│
│  pie                                 │
└──────────────────────────────────────┘

Vía empresa:
│  Nombre        [__________________]  │
│  Empresa       [__________________]  │
│  Email         [__________________]  │
│  Teléfono (opcional) [____________]  │
│  Qué necesitas (Web)(App)(IA)(Puesto)│
│  Mensaje       [__________________]  │
│  ☐ He leído la política de privacidad│
│  [turnstile]                         │
│  [[ Enviar ]]                        │
│  [ Reservar 20 min ]                 │
```

**Escritorio:** formulario o WhatsApp a la izquierda, tarjeta de datos y `CalEmbed` a la derecha.

**Eventos:** `whatsapp_click` (origen `contact`), `contact_submit`.

### 4.11 Chat con el asistente `/chat`

**Objetivo:** Dani (y quien quiera) pregunta sobre Jose; Jose puede tomar el control desde admin. Requiere cuenta (D6).

**Componentes:** cabecera; **sin cuenta (antesala):** demo de solo lectura con 2–3 intercambios reales de ejemplo (pregunta de un visitante → respuesta del asistente; p. ej. "¿Haces apps en React Native?" → "Sí. 3catinfo y HazmeFila están hechas con React Native y publicadas en las stores"), atenuada al final, y debajo la tarjeta "Para preguntar necesitas una cuenta: así evito bots y Jose puede seguir la conversación y contestarte él si hace falta. Es un toque con Google" + `AuthProviders`; los chips de sugerencia se ven pero abren la tarjeta de cuenta; **con cuenta:** hilo (`GET admin-chat/thread`), burbujas asistente/usuario/Jose (la de Jose lleva nombre y marca "Jose"), banda de estado "Responde el asistente" / "Jose está respondiendo", campo de texto + `[[ Enviar ]]`, sugerencias iniciales (chips: "¿Qué stack usas?", "¿Estás disponible?", "¿Cuánto cuesta una app?"), acción secundaria `[ Pedir una reunión ]` (`POST admin-chat/meeting`: abre hoja con fecha preferida y motivo); pie reducido.

**Acción primaria:** Enviar. **Secundarias:** pedir reunión; borrar conversación no existe (contrato conservado).

**Estados:** carga del hilo → `Skeleton`; hilo vacío → sugerencias; asistente pensando → indicador; error del gateway → burbuja "El asistente no está disponible ahora mismo. Puedes escribirme por el formulario" + `[ Reintentar ]` + `> Formulario`; 429 → "Has enviado muchos mensajes seguidos. Espera un momento"; sesión caducada → toast + `[ Entrar ]` con el mensaje conservado; sin conexión → campo desactivado. Takeover activo → la banda cambia y las respuestas dejan de ser instantáneas: "Jose está respondiendo. Puede tardar unos minutos; te avisa aquí". Al reiniciar el asistente (Jose cierra takeover) la banda vuelve.

```
┌──────────────────────────────────────┐
│ < josecoded        Asistente   (Jose)│
│  ─ Responde el asistente ─           │ banda de estado
│  (sin cuenta: 2–3 intercambios de    │ antesala
│   ejemplo en solo lectura + tarjeta  │
│   "Para preguntar necesitas cuenta") │
│ ┌──────────────────────────────────┐ │
│ │ Hola. Puedo contarte qué hace    │ │
│ │ Jose, con qué stack y si está    │ │
│ │ disponible.                      │ │
│ └──────────────────────────────────┘ │
│  ("¿Qué stack usas?")                │ chips
│  ("¿Estás disponible?")              │
│                 ┌──────────────────┐ │
│                 │ ¿Haces apps RN?  │ │ usuario
│                 └──────────────────┘ │
│ ┌ Jose ────────────────────────────┐ │ takeover
│ │ Sí. 3catinfo y HazmeFila son RN. │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────┐[[>]]│ campo + Enviar
│ └──────────────────────────────┘     │
│  [ Pedir una reunión ]               │
└──────────────────────────────────────┘
```

**Escritorio:** columna central de chat; a la derecha, tarjeta fija con "Sobre este asistente" (qué sabe, qué no, que Jose puede intervenir) y enlaces a Proyectos y Sobre mí.

**Eventos:** `chat_started` (primer mensaje del usuario).

### 4.12 Legales `/legal/*`

Tres páginas con la misma plantilla: cabecera; h1; fecha de última actualización; índice plegable; cuerpo MDX; pie. Cookies: explica que Umami no usa cookies, la cookie `ref` de 30 días (afiliados) y las de sesión de Supabase; sin banner de consentimiento (no hay cookies de seguimiento). Sin estados.

### 4.13 Mi cuenta `/perfil`

**Objetivo:** lo mínimo: nombre visible, avatar (de proveedor), email, idioma preferido, cerrar sesión, solicitar borrado.

**Componentes:** shell público; tarjeta de cuenta (avatar, nombre editable, email solo lectura, proveedor); idioma; enlaces a Área de clientes y Chat; `[[ Guardar ]]`; `[ Cerrar sesión ]`; zona final "Borrar cuenta" → modal de confirmación (envía solicitud; el borrado lo ejecuta Jose por la RLS de datos de cliente).

**Estados:** sin cambios → Guardar desactivado; guardado → toast "Hecho"; error → toast con reintento; sesión caducada → redirección a login con `next=/perfil`.

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  Mi cuenta                           │
│  (avatar)  Nombre  [Marta García__]  │
│            marta@…  · Google         │
│  Idioma    (ES) (EN)                 │
│  [[ Guardar ]]                       │
│  > Área de clientes   > Chat         │
│  [ Cerrar sesión ]                   │
│  ── Borrar cuenta ──                 │
│  > Solicitar borrado                 │
└──────────────────────────────────────┘
```

---

## 5. Autenticación

### 5.1 Entrar `/auth/login`

**Objetivo:** un toque con Google o GitHub, sin salir de la web. Email como vía secundaria mediante **código de 6 cifras** (OTP de Supabase), no enlace: Marta no tiene que abandonar el navegador ni volver desde la app de correo; el código se teclea en la misma pantalla y sirve desde cualquier dispositivo. Sin contraseñas (margen de la spec: "magic link o password"; ver §16). Conserva `?next=` y `?reason=expired`.

**Componentes:** logo; h1 "Entrar"; frase de contexto según `next` ("Para comentar" / "Para chatear" / "Para ver tu proyecto"); banner si `reason=expired`; `AuthProviders`: `[[ Continuar con Google ]]` y `[ Continuar con GitHub ]` juntos, mismo tamaño, a un toque; separador "o con email"; **explicación antes del campo**: "Te envío un código de 6 cifras al email. Lo escribes aquí y entras. Sin contraseña"; email + `[ Enviarme un código ]`; `> ¿No tienes cuenta? Crear cuenta`; texto legal corto; enlace volver.

**Acción primaria:** Continuar con Google (persona principal); GitHub con el mismo tamaño y posición, estilo secundario fuerte. **Estados:** carga del proveedor → botón con "Abriendo Google"; error OAuth (cancelado/denegado) → banner "No se ha completado el acceso. Prueba de nuevo o entra con email"; Supabase caído → banner "El acceso no está disponible ahora mismo. Prueba en unos minutos" con botones desactivados; email inválido → error inline.

```
┌──────────────────────────────────────┐
│ josecoded                            │
│  Entrar                              │
│  Para ver tu proyecto.               │
│  [ Tu sesión ha caducado. Entra de   │
│    nuevo. ]                          │
│  [[ Continuar con Google ]]          │
│  [ Continuar con GitHub ]            │
│  ───────── o con email ─────────     │
│  Te envío un código de 6 cifras al   │
│  email. Lo escribes aquí y entras.   │
│  Sin contraseña.                     │
│  Email  [_______________________]    │
│  [ Enviarme un código ]              │
│  ¿No tienes cuenta? > Crear cuenta   │
│  Al entrar aceptas la privacidad.    │
│  < Volver                            │
└──────────────────────────────────────┘
```

**Escritorio:** tarjeta centrada en el panel; árbol y línea de estado atenuados.

### 5.2 Crear cuenta `/auth/registro`

Misma plantilla; h1 "Crear cuenta"; los botones de Google/GitHub crean la cuenta si no existe; la vía email pide además "Nombre". `> ¿Ya tienes cuenta? Entrar`.

### 5.3 Introduce el código `/auth/codigo`

"Te he enviado un código de 6 cifras a marta@… Caduca en 10 min." + campo de 6 casillas (`autocomplete="one-time-code"`, pegado permitido) + `[[ Entrar ]]` + `[ Reenviar código ]` (desactivado 60 s) + `> Usar otro email`. Estados: código incorrecto → error inline "El código no es correcto. Revísalo o pide otro"; caducado → "El código ha caducado. Pide otro"; reenvío fallido → toast; éxito → redirige a `next` como 5.4.

```
┌──────────────────────────────────────┐
│ josecoded                            │
│  Introduce el código                 │
│  Te he enviado un código de 6 cifras │
│  a marta@… Caduca en 10 min.         │
│  [_] [_] [_] [_] [_] [_]             │
│  [[ Entrar ]]                        │
│  [ Reenviar código ]  > Otro email   │
└──────────────────────────────────────┘
```

### 5.4 Callback `/auth/callback`

Solo para OAuth. Pantalla de un segundo: "Entrando…" con `Skeleton`. Éxito → redirige a `next` (por defecto `/area-clientes` si es cliente, `/chat` si venía del chat, `/` si no). Error → 5.1 con banner "No se ha completado el acceso. Prueba de nuevo o entra con email".

---

## 6. Área de clientes `/area-clientes`

Guard en el layout server-side: sin sesión → `/auth/login?next=/area-clientes&reason=…`. Cada consulta pasa por RLS: el cliente solo ve filas con su `user_id`. Recursos ajenos por URL → página "Sin permisos" (§8.4).

### 6.1 Inicio del área (mi proyecto) `/area-clientes`

**Objetivo:** Marta ve de un vistazo en qué fase está su web, qué le toca hacer y cómo hablar con Jose.

**Componentes:** shell del área; saludo "Hola, Marta" + nombre del negocio; **tarjeta de proyecto**: nombre, pack contratado, fase actual (Inicio · Diseño · Desarrollo · Revisión · Publicada) como pasos, fecha prevista de entrega, `> Ver pack y extras`; **"Te toca a ti"**: lista de tareas asignadas al cliente y pendientes (máx. 3) con `> Ver todas`; **últimas novedades**: 3 últimos comentarios o cambios de estado; tarjeta "Hablar con Jose": `[ WhatsApp ]` + email; tarjeta "Recomiéndame" resumida: "Tu enlace para recomendar" + `> Ver`.

**Acción primaria:** abrir la primera tarea pendiente del cliente (si hay); si no hay, ninguna acción primaria (pantalla de lectura).

**Estados:**
- Carga → `Skeleton` de tarjetas.
- **No es cliente** (usuario con cuenta sin `clients.user_id`): tarjeta "Todavía no tienes ningún proyecto conmigo. Si quieres una web, pide una propuesta orientativa o escríbeme" + `[ Pedir propuesta ]` + `[ WhatsApp ]`; la tarjeta de afiliados sí aparece, con explicación "Puedes recomendarme igualmente: 10 % del primer pedido de quien venga por tu enlace".
- Cliente sin tareas pendientes → "No tienes nada pendiente. Estoy trabajando en la fase de Desarrollo".
- Error de carga → `ErrorState` "No he podido cargar tu proyecto" + `[ Reintentar ]`.
- Sesión caducada → redirección (SSR) o toast (acciones).

```
┌──────────────────────────────────────┐
│ josecoded · Área      (avatar)       │
│  Hola, Marta                         │
│  Clínica Dental García               │
│ ┌──────────────────────────────────┐ │
│ │ Web de la clínica · P2           │ │
│ │ ●──●──◉──○──○                    │ │ fases
│ │ Inicio Diseño Desarrollo Rev. Pub│ │
│ │ Entrega prevista: 3 oct          │ │
│ │ > Ver pack y extras              │ │
│ └──────────────────────────────────┘ │
│  Te toca a ti (2)                    │
│ ┌ Enviar logo en buena calidad ────┐ │ primaria: abrir
│ ┌ Revisar textos de servicios ─────┐ │
│  > Ver todas las tareas             │
│  Novedades                           │
│  · Jose: "Diseño aprobado" · ayer   │
│  · Tarea completada · 12 sep        │
│ ┌ Hablar con Jose  [WhatsApp] email┐ │
│ ┌ Tu enlace para recomendar  > Ver ┐ │
├──────────────────────────────────────┤
│ Proyecto Tareas Material Pack Recom. │ barra inferior
└──────────────────────────────────────┘
```

**Escritorio:** barra lateral; contenido en dos columnas (proyecto y tareas a la izquierda, novedades, contacto y afiliados a la derecha).

### 6.2 Tareas `/area-clientes/tareas`

**Objetivo:** ver todas las tareas del proyecto separando las del cliente de las de Jose.

**Componentes:** título; segmento "Me tocan a mí · Las de Jose · Todas"; lista de `TaskRow` (título, estado `StatusBadge`: Pendiente · En curso · Hecha · Bloqueada, asignado a, fecha límite si hay, contador de comentarios); orden: pendientes del cliente primero.

**Acción primaria:** abrir una tarea. **Estados:** vacío → "No hay tareas todavía. Cuando arranquemos aparecerán aquí"; vacío por filtro → "Nada pendiente por tu parte"; carga → `Skeleton`; error → `ErrorState`.

```
┌──────────────────────────────────────┐
│  Tareas                              │
│  (Me tocan a mí) (Las de Jose)(Todas)│
│ ┌ Enviar logo · Pendiente · tú ────┐ │
│ │ límite 20 sep · 1 comentario     │ │
│ ┌ Revisar textos · Pendiente · tú ─┐ │
│ ┌ Diseño home · Hecha · Jose ──────┐ │
│ ┌ Formulario de citas · En curso ──┐ │
└──────────────────────────────────────┘
```

### 6.3 Detalle de tarea `/area-clientes/tareas/[id]`

**Objetivo:** entender qué se pide, adjuntar material, comentar y marcar como hecha (solo las asignadas al cliente).

**Componentes:** volver; título; `StatusBadge`; asignado a; fecha límite; descripción (markdown simple); adjuntos de la tarea (lista con descarga); comentarios (`client_task_comments`) con textarea + `[ Comentar ]`; subir material vinculado a la tarea (`[ Adjuntar archivo ]`, hasta 25 MB, tipos: imagen, pdf, doc, zip); si está asignada al cliente y no está hecha: `[[ Marcar como hecha ]]`.

**Acción primaria:** Marcar como hecha (tareas del cliente) / Comentar (tareas de Jose). **Estados:** subida con barra de progreso; archivo demasiado grande → error inline; éxito al marcar hecha → estado cambia y toast "Hecho. Se lo notifico a Jose"; error → toast; sesión caducada → toast con comentario conservado. Tarea ajena por URL → "Sin permisos".

```
┌──────────────────────────────────────┐
│ < Tareas                             │
│  Enviar logo en buena calidad        │
│  Pendiente · te toca a ti · 20 sep   │
│  Necesito el logo en vectorial (SVG  │
│  o PDF) o en PNG de al menos 2000 px.│
│  Adjuntos                            │
│  · (ninguno)                         │
│  [ Adjuntar archivo ]                │
│  Comentarios                         │
│  ┌ Jose · 12 sep: Si no lo tienes,  │
│  │ vale una foto del rótulo.        │
│  ┌──────────────────────────────┐   │
│  │ Escribe un comentario        │   │
│  └──────────────────────────────┘   │
│  [ Comentar ]                        │
│  [[ Marcar como hecha ]]             │
└──────────────────────────────────────┘
```

### 6.4 Material `/area-clientes/material`

**Objetivo:** ver y subir todo el material del proyecto (logos, textos, fotos del negocio, documentos) y descargar entregas de Jose.

**Componentes:** título; segmento "Todo · Lo que he subido · Entregas de Jose"; `[[ Subir material ]]` (abre `Sheet`: selector de archivos múltiple, nota opcional, tarea asociada opcional); rejilla/lista de `AssetCard` (nombre, tipo, tamaño, fecha, quién, acciones: descargar, eliminar si es propio y no está usado en una tarea hecha).

**Estados:** vacío → "Todavía no hay material. Sube el logo, textos o fotos de tu negocio y los uso en la web" + primaria; subiendo → tarjeta con progreso; error de subida → tarjeta en rojo con `[ Reintentar ]` y `[ Quitar ]`; tipo no permitido → mensaje inline; eliminar → confirmación en modal.

```
┌──────────────────────────────────────┐
│  Material                            │
│  (Todo) (Lo que he subido)(Entregas) │
│  [[ Subir material ]]                │
│ ┌ logo.svg · 120 KB · tú · 14 sep ─┐ │
│ │ [Descargar] [Eliminar]           │ │
│ ┌ textos-servicios.docx · tú ──────┐ │
│ ┌ propuesta-diseno-v1.pdf · Jose ──┐ │
└──────────────────────────────────────┘
```

### 6.5 Pack y extras `/area-clientes/pack`

**Objetivo:** ver qué contrató, qué incluye, extras activos y desde ahí pedir una ampliación.

**Componentes:** título; tarjeta del pack (nombre, incluye, precio pagado de lista, plazo, fecha de contratación); lista de extras contratados (`client_pack_extras`: nombre, precio, periodicidad, estado activo/finalizado); estado de solicitudes de ampliación previas (si hay: `StatusBadge` Pendiente · Aceptada · Rechazada, con fecha); `[[ Solicitar ampliación ]]`; nota "Precios de lista de `tarifas.md`; sin IVA".

**Estados:** sin extras → "No tienes extras contratados"; solicitud pendiente existente → botón sustituido por "Tienes una solicitud pendiente" + `> Ver`; error → `ErrorState`.

```
┌──────────────────────────────────────┐
│  Pack y extras                       │
│ ┌ P2 Pedidos / reservas · 1.400 € ─┐ │
│ │ Contratado el 1 sep · 2 semanas  │ │
│ │ Incluye: web, reservas, gestión  │ │
│ │ básica…                          │ │
│ └──────────────────────────────────┘ │
│  Extras contratados                  │
│  · Mantenimiento básico · 49 €/mes   │
│  Solicitudes                         │
│  · (ninguna)                         │
│  [[ Solicitar ampliación ]]          │
│  Precios sin IVA.                    │
└──────────────────────────────────────┘
```

### 6.6 Solicitar ampliación `/area-clientes/pack/ampliar`

**Objetivo:** el cliente elige un pack superior y/o extras nuevos y ve el precio calculado por regla (diferencia de lista; extras a precio de lista; plazo = plazo destino − plazo entregado, mínimo 1 semana) antes de enviar.

**Componentes:** volver; título; paso "Pack" (radio: pack actual marcado y desactivado; solo los superiores seleccionables, con "+ diferencia €"); paso "Extras" (checkbox por extra no contratado, con precio); **resumen fijo abajo**: "Ampliación a P3: 1.100 € · SEO básico: 250 € · Total 1.350 € sin IVA · Plazo estimado: 1 semana"; textarea "Cuéntame qué necesitas (opcional)"; `[[ Enviar solicitud ]]`; nota "Jose te confirma precio y plazo; no se cobra nada al enviar".

**Acción primaria:** Enviar solicitud. **Estados:** nada seleccionado → botón desactivado y resumen "Elige un pack superior o un extra"; P4 ya contratado → solo extras; enviado → vuelve a 6.5 con toast "Solicitud enviada. Te contesto en menos de 24 h laborables" y el estado Pendiente; error → toast con reintento; ya hay una pendiente → esta pantalla redirige a 6.5.

```
┌──────────────────────────────────────┐
│ < Pack y extras                      │
│  Solicitar ampliación                │
│  Pack                                │
│  (●) P2 Pedidos / reservas · actual  │
│  ( ) P3 Gestión         +1.100 €     │
│  ( ) P4 Gestión + autom. +2.800 €    │
│  Extras                              │
│  [x] Google básico (SEO)   250 €     │
│  [ ] Google completo (SEO) 600 €     │
│  [ ] Asistentes de IA (GEO) 300 €    │
│  [ ] Revisión de seguridad 250 €     │
│  [ ] Mant. extendido     149 €/mes   │
│  Cuéntame qué necesitas (opcional)   │
│  [______________________________]    │
├──────────────────────────────────────┤
│  P3: 1.100 € · SEO básico: 250 €     │ resumen fijo
│  Total 1.350 € sin IVA · ~1 semana   │
│  [[ Enviar solicitud ]]              │
└──────────────────────────────────────┘
```

**Escritorio:** formulario a la izquierda, resumen sticky a la derecha.

### 6.7 Recomiéndame `/area-clientes/recomiendame`

**Objetivo:** copiar el enlace, entender la recompensa según su nivel y seguir leads y recompensas.

**Componentes:** título; tarjeta "Tu enlace": código (p. ej. `MARTA-7F2K`), enlace `https://josecoded.com/?ref=MARTA-7F2K`, `[[ Copiar enlace ]]`, `[ Compartir por WhatsApp ]` (mensaje prellenado con el enlace); tarjeta "Qué ganas" según nivel: cliente → "2 meses de mantenimiento básico gratis por cada negocio que contrate"; no cliente → "10 % del primer pedido, sin IVA"; premium → "20 % del primer pedido, sin IVA"; nota "Se abona cuando el referido ha pagado el primer pedido completo. No incluye mantenimiento ni ampliaciones. Un lead, un afiliado"; **Leads atribuidos** (lista: fecha, origen (formulario / propuesta / chat), estado: Nuevo · En conversación · Cerrado · Descartado; sin datos personales del lead); **Recompensas** (lista: fecha, concepto, importe o "2 meses de mantenimiento", estado Pendiente · Abonada con fecha).

**Acción primaria:** Copiar enlace. **Estados:** sin leads → "Todavía nadie ha llegado por tu enlace. Compártelo con quien crea que necesita una web"; sin recompensas → "Sin recompensas todavía"; error → `ErrorState`; copiar → toast "Enlace copiado".

```
┌──────────────────────────────────────┐
│  Recomiéndame                        │
│ ┌ Tu enlace ───────────────────────┐ │
│ │ josecoded.com/?ref=MARTA-7F2K    │ │
│ │ [[ Copiar enlace ]]              │ │
│ │ [ Compartir por WhatsApp ]       │ │
│ └──────────────────────────────────┘ │
│ ┌ Qué ganas ───────────────────────┐ │
│ │ 2 meses de mantenimiento básico  │ │
│ │ por cada negocio que contrate.   │ │
│ │ Se abona cuando paga el primer   │ │
│ │ pedido completo.                 │ │
│ └──────────────────────────────────┘ │
│  Leads por tu enlace (2)             │
│  · 15 sep · Propuesta · En conversac.│
│  · 3 sep · Formulario · Cerrado      │
│  Recompensas (1)                     │
│  · 2 meses de mantenimiento · Pend.  │
└──────────────────────────────────────┘
```

---

## 7. Admin `/admin`

Guard server-side: sin sesión → login; sesión sin fila propia en `staff_members` con `role = 'admin'` (una fila: Jose; `admin_superusers` no existe en producción, H1) → "Sin permisos" (§8.4). Solo español. Todas las listas: filtro, orden, paginación de 25, búsqueda por texto; en móvil, tarjetas.

### 7.1 Resumen `/admin`

**Objetivo:** ver qué hay pendiente y saltar a ello.

**Componentes:** cuatro contadores con enlace: Leads nuevos · Comentarios pendientes · Ampliaciones pendientes · Chats sin leer; "Últimos leads" (5, con origen, pack propuesto, afiliado); "Recompensas pendientes de abonar" (importe total y número); estado de servicios (gateway, worker de Omen `system/status`, n8n): tres puntos con texto "OK / Sin respuesta" (no es un panel de infraestructura, solo aviso operativo).

**Acción primaria:** ninguna; es un índice. **Estados:** todo a cero → "Nada pendiente"; error de un widget → el widget muestra "Sin datos" sin romper el resto.

```
┌──────────────────────────────────────┐
│ josecoded · Admin           (avatar) │
│ ┌ Leads 3 ┐ ┌ Coment. 2 ┐            │
│ ┌ Ampl. 1 ┐ ┌ Chats 1  ┐            │
│  Últimos leads                       │
│  · Clínica García · Propuesta P2 ·   │
│    ref MARTA-7F2K · Nuevo            │
│  · …                                 │
│  Recompensas pendientes: 2 (420 €)   │
│  Servicios: gateway OK · Omen OK ·   │
│  n8n OK                              │
├──────────────────────────────────────┤
│ Leads Clientes Chat Más              │
└──────────────────────────────────────┘
```

### 7.2 Leads `/admin/leads`

**Componentes:** filtros (estado: Nuevo · En conversación · Cerrado · Descartado; origen: Formulario · Propuesta · Chat · WhatsApp; con afiliado; fecha); búsqueda; `[ Nuevo lead ]` (hoja: nombre, negocio o empresa, email o teléfono, origen "WhatsApp" por defecto, pack, código de afiliado si lo mencionó en el brief, notas) para los contactos que llegan por WhatsApp; `DataTable` (fecha, nombre y negocio/empresa, origen, pack propuesto y "desde", afiliado, estado, sin leer); acción por fila: abrir. Acciones masivas: marcar descartado.

**Acción primaria:** abrir lead. **Estados:** vacío → "No hay leads con estos filtros"; carga → `Skeleton` de filas; error → `ErrorState`.

### 7.3 Detalle de lead `/admin/leads/[id]`

**Objetivo:** todo lo del lead en una vista y las dos acciones que importan: cambiar estado y cerrar cobrado (que dispara la recompensa).

**Componentes:** volver; cabecera: nombre, negocio, `StatusBadge`, fecha, origen; datos de contacto con `[ WhatsApp ]`, `[ Email ]` (mailto), copiar; **Propuesta IA** (`ProposalCard` con las respuestas dadas y el JSON `ai_proposal` plegable); mensaje del formulario si lo hay; **Afiliado**: código, nombre del afiliado, nivel, aviso si el email/usuario coincide con el del afiliado ("Posible autoreferido: no genera recompensa"); notas internas (textarea con guardado); selector de estado; `[[ Marcar cerrado y cobrado ]]` → modal (§9.9); si ya está cerrado: tarjeta "Cerrado el 20 sep · base 1.400 € · recompensa 140 € para DANI-3B → Pendiente" con `> Ver afiliado`; `[ Crear cliente desde este lead ]` (prellena 7.5 con nombre, email, pack); `[ Descartar ]`.

**Estados:** lead ya cerrado → primaria desactivada con explicación; sin afiliado → sección "Sin afiliado"; error al guardar → toast; carga → `Skeleton`.

```
┌──────────────────────────────────────┐
│ < Leads                              │
│  Clínica Dental García · Nuevo       │
│  Marta García · 15 sep · Propuesta   │
│  612 345 678 [WhatsApp] marta@… [Mail]│
│ ┌ Propuesta IA ────────────────────┐ │
│ │ P2 Pedidos / reservas · 1.400 €  │ │
│ │ Extras: SEO básico               │ │
│ │ Respuestas: clínica · citas ·    │ │
│ │ reservas sí · en un mes          │ │
│ │ ▸ JSON                           │ │
│ └──────────────────────────────────┘ │
│ ┌ Afiliado ────────────────────────┐ │
│ │ MARTA-7F2K · Marta G. · cliente  │ │
│ └──────────────────────────────────┘ │
│  Notas [__________________________]  │
│  Estado (Nuevo ▾)                    │
│  [[ Marcar cerrado y cobrado ]]      │
│  [ Crear cliente ] [ Descartar ]     │
└──────────────────────────────────────┘
```

**Escritorio:** dos columnas: datos y propuesta a la izquierda; afiliado, notas y acciones a la derecha (sticky).

### 7.4 Comentarios `/admin/comentarios`

**Componentes:** segmento "Pendientes · Aprobados · Rechazados"; lista de `CommentModerationRow` (autor, email, artículo, fecha, texto completo, respuesta a); acciones por fila: `[[ Aprobar ]]` `[ Rechazar ]`; selección múltiple con las mismas acciones.

**Acción primaria:** Aprobar. **Estados:** sin pendientes → "Nada que moderar"; acción → la fila se desliza fuera con toast y `[ Deshacer ]` (10 s); error → la fila vuelve y toast.

```
┌──────────────────────────────────────┐
│  Comentarios                         │
│  (Pendientes 2) (Aprobados) (Rechaz.)│
│ ┌ Dani R. · dani@… · 16 sep ───────┐ │
│ │ en "Cómo está hecha josecoded"   │ │
│ │ "¿Por qué OpenNext y no…?"       │ │
│ │ [[ Aprobar ]]  [ Rechazar ]      │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 7.5 Clientes `/admin/clientes`

**Componentes:** búsqueda; filtro por fase y pack; `[[ Nuevo cliente ]]` (hoja: nombre, negocio, email del usuario (enlaza `user_id` si existe cuenta; si no, queda pendiente y se enlaza al registrarse con ese email), pack, fecha de inicio, entrega prevista); `DataTable` (negocio, contacto, pack, fase, tareas pendientes del cliente, última actividad).

**Estados:** vacío → "Todavía no hay clientes"; usuario sin cuenta enlazada → badge "Sin cuenta" en la fila.

### 7.6 Ficha de cliente `/admin/clientes/[id]`

**Pestañas:** Resumen · Tareas · Material · Pack y extras (no son niveles de navegación).

- **Resumen:** datos, `user_id` enlazado (o `[ Enlazar cuenta ]`), fase (selector con confirmación: cambia lo que ve el cliente), entrega prevista, notas internas, acceso a "Ver como cliente" (abre el área en solo lectura con aviso).
- **Tareas:** lista con filtros; `[[ Nueva tarea ]]` → hoja (`?tarea=nueva`): título, descripción, asignada a (Jose / cliente), fecha límite, adjuntos, estado. Editar → hoja (`?tarea=[id]`). Comentarios en la hoja.
- **Material:** lo mismo que 6.4 en modo admin, con subida de entregas marcadas como "Entrega de Jose".
- **Pack y extras:** pack actual (cambiar con confirmación), extras (añadir/quitar de `pack_extras` con fecha), solicitudes de ampliación de este cliente con `> Ver en Ampliaciones`.

**Acción primaria:** según pestaña (Nueva tarea en Tareas; Subir entrega en Material; ninguna en Resumen y Pack). **Estados:** cliente inexistente → 404; guardado → toast; error → toast.

```
┌──────────────────────────────────────┐
│ < Clientes                           │
│  Clínica Dental García · P2          │
│  (Resumen) (Tareas 4) (Material)(Pack)│
│  ── Tareas ──                        │
│  [[ Nueva tarea ]]                   │
│ ┌ Enviar logo · cliente · Pend. ───┐ │
│ ┌ Diseño home · Jose · Hecha ──────┐ │
└──────────────────────────────────────┘
Hoja "Nueva tarea":
│  Título      [_____________________] │
│  Descripción [_____________________] │
│  Asignada a  (Jose) (Cliente)        │
│  Fecha límite [__/__/____]           │
│  Adjuntos    [ Añadir ]              │
│  [[ Crear tarea ]]  [ Cancelar ]     │
```

### 7.7 Ampliaciones `/admin/ampliaciones`

**Componentes:** segmento "Pendientes · Aceptadas · Rechazadas"; lista (cliente, de → a, extras, precio calculado, plazo estimado, mensaje, fecha); por fila: `[[ Aceptar ]]` (modal: confirma precio y plazo, editables; al aceptar se actualiza el pack/extras del cliente y el cliente ve "Aceptada") y `[ Rechazar ]` (modal con motivo opcional que ve el cliente).

**Estados:** vacío → "Sin solicitudes pendientes"; acción → toast.

### 7.8 Afiliados `/admin/afiliados`

**Componentes:** búsqueda; `DataTable` (usuario, código, nivel `Estándar · Premium`, es cliente, leads atribuidos, recompensas pendientes, abonadas); por fila: cambiar nivel (selector con confirmación); abrir.

### 7.9 Detalle de afiliado `/admin/afiliados/[id]`

**Componentes:** cabecera (nombre, código, nivel, cliente sí/no, `[ Cambiar nivel ]`); leads atribuidos (fecha, nombre, estado, `> Ver lead`); **recompensas**: lista (lead, tipo, importe o meses, estado, fecha de creación, fecha de abono); por recompensa pendiente: `[[ Marcar abonada ]]` → modal con fecha y nota (p. ej. "transferencia 20 sep" o "mantenimiento oct–nov aplicado"); recompensa abonada muestra la nota.

**Acción primaria:** Marcar abonada. **Estados:** sin recompensas → "Sin recompensas"; error → toast.

```
┌──────────────────────────────────────┐
│ < Afiliados                          │
│  Dani Ruiz · DANI-3B · Estándar      │
│  No es cliente · [ Cambiar nivel ]   │
│  Leads (1)                           │
│  · 3 sep · Bar Lola · Cerrado > Ver  │
│  Recompensas (1)                     │
│ ┌ 10 % de 1.400 € = 140 € · Pend. ─┐ │
│ │ [[ Marcar abonada ]]             │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 7.10 Chat: conversaciones `/admin/chat`

**Componentes:** segmento "Sin leer · Con takeover · Todas"; lista (usuario, último mensaje, fecha, sin leer, badge "Takeover" si está activo); abrir.

**Estados:** vacío → "No hay conversaciones"; error → `ErrorState`.

### 7.11 Chat: conversación `/admin/chat/[id]`

**Objetivo:** leer el hilo y responder como Jose (takeover), o devolver el control al asistente.

**Componentes:** volver; cabecera (usuario, email, proveedor, `> Ver perfil`); hilo completo (usuario / asistente / Jose); **interruptor de takeover** con estado claro: "Responde el asistente" ↔ "Respondes tú"; campo + `[[ Enviar ]]` (`POST :id/messages`); `[ Pedir respuesta al asistente ]` (`POST :id/ai`, disponible en takeover para sugerir un borrador que Jose edita); marcar leído automático (`POST :id/read`) al abrir.

**Acción primaria:** Enviar (con takeover activo). Sin takeover el campo está desactivado con texto "Activa el takeover para responder". **Estados:** carga → `Skeleton`; error del gateway → banner "No puedo cargar el hilo" + `[ Reintentar ]`; envío fallido → burbuja en rojo con reintento.

```
┌──────────────────────────────────────┐
│ < Chat   Dani R. · dani@… · GitHub   │
│  [ Responde el asistente ] ⇄ (toggle)│
│  … hilo …                            │
│ ┌──────────────────────────────┐[[>]]│
│ └──────────────────────────────┘     │
│  [ Pedir respuesta al asistente ]    │
└──────────────────────────────────────┘
```

---

## 8. Páginas y estados de error

Plantilla común `ErrorPage`: dentro del shell correspondiente (público, área o admin), sin decoración, código en pequeño en la línea de estado y en el título, título, una frase, una acción primaria y una vía alternativa. Sin humor, sin ilustraciones de stock. Todas con `title` y `noindex` (salvo 410, que también lleva `noindex`).

```
┌──────────────────────────────────────┐
│ (shell: barra de título)             │
│  404                                 │
│  Esta página no existe.              │
│  Puede que el enlace esté mal o que  │
│  la haya movido.                     │
│  [[ Ir al inicio ]]                  │
│  > Proyectos   > Blog   > Contacto   │
└──────────────────────────────────────┘
```

| # | Caso | Dónde | Título | Frase | Primaria | Alternativa |
|---|---|---|---|---|---|---|
| 8.1 | 404 | ruta pública desconocida | Esta página no existe. | Puede que el enlace esté mal o que la haya movido. | Ir al inicio | Proyectos · Blog · Contacto |
| 8.2 | 410 | `/blog/<slug viejo>`, `/foro/*` | Este contenido ya no está. | El foro y los artículos antiguos se retiraron al rehacer la web. | Ver el blog actual | Contacto |
| 8.3 | 500 | `error.tsx` (global y por segmento; el segmento mantiene cabecera y pie) | Algo ha fallado. | Ya me ha llegado el aviso. Puedes reintentar o escribirme. | Reintentar | WhatsApp · Formulario |
| 8.4 | 403 sin permisos | `/admin/*` sin `staff_members.role = 'admin'`; recurso ajeno en `/area-clientes` | No tienes acceso a esta página. | Esta zona es privada. Si crees que deberías verla, escríbeme. | Ir a mi área (si tiene cuenta) / Ir al inicio | Contacto |
| 8.5 | Sesión caducada (SSR) | redirección a `/auth/login?reason=expired&next=` | Tu sesión ha caducado. | Entra de nuevo para continuar donde estabas. | Continuar con Google | GitHub · email |
| 8.6 | Sesión caducada (acción en cliente) | toast en comentarios, chat, área, admin | Tu sesión ha caducado. | (el contenido escrito se conserva) | Entrar | — |
| 8.7 | Sin conexión | `OfflineBanner` global + estados inline | Sin conexión. | Cuando vuelva la red, sigo donde estabas. | (auto) | — |
| 8.8 | Servicio no disponible (gateway o Workers AI 5xx) | inline en generador y chat | El asistente no está disponible ahora mismo. | Puedes reintentar o escribirme directamente. | Reintentar | WhatsApp (con respuestas) · Formulario |
| 8.9 | Omen caído (Telegram, Umami) | invisible para el visitante; en admin, "Servicios" en rojo | — | — | — | El lead se guarda igual; fallback email por Edge Function |
| 8.10 | 429 generador | inline en generador | Has pedido varias propuestas seguidas. | Prueba en unos minutos o escríbeme por WhatsApp. | WhatsApp | — |
| 8.11 | 429 chat | inline en chat | Has enviado muchos mensajes seguidos. | Espera un momento antes de seguir. | (campo se reactiva) | — |
| 8.12 | Turnstile fallido | bajo el botón de enviar | No he podido verificar que no eres un robot. | Recarga la página. Si sigue igual, escríbeme por WhatsApp. | Recargar | WhatsApp |
| 8.13 | Gateway o Supabase caídos | formularios y generador (`POST /api/v1/leads` responde 5xx), login, comentarios | No he podido guardar tus datos. | Te dejo el mensaje listo para enviarlo por email o WhatsApp. | WhatsApp | mailto con el contenido |
| 8.14 | Mantenimiento | página estática 503 (opcional, activada por variable) | Estoy actualizando la web. | Vuelve en unos minutos. Para urgencias, WhatsApp. | WhatsApp | — |
| 8.15 | Código de email caducado o incorrecto | `/auth/codigo` inline | El código ha caducado. / El código no es correcto. | Pide otro. / Revísalo o pide otro. | Reenviar código | Google · GitHub |
| 8.16 | OAuth cancelado o denegado | `/auth/login` con banner | No se ha completado el acceso. | Prueba de nuevo o entra con email. | Continuar con Google | email |

Estados vacíos y de carga de cada pantalla están en su ficha (§4–§7). Regla general: **toda pantalla que dependa de red tiene `Skeleton` (carga), `EmptyState` (vacío) y `ErrorState` con reintento (error)**; toda acción que escriba tiene confirmación (toast) y error con el contenido conservado.

---

## 9. Flujos

Notación: paso → decisión `◇` → salida. Cada flujo indica sistema implicado, eventos y errores.

### 9.1 Generador de propuesta (Marta)

1. Marta llega a `/propuesta` (desde `/negocios`, una `PackCard` con `?pack=`, la home o un enlace `?ref=`). Si hay `?ref=CODIGO` válido en cualquier ruta, se guarda cookie `ref` (30 días) y aparece `RefNotice` una sola vez ("Vienes por recomendación de Dani. Lo tengo en cuenta.", cerrable). Código inválido → sin cookie y sin aviso.
2. Ve la primera pregunta al instante (estática, sin red). Responde con chip o texto.
3. Preguntas 2 y 3. ◇ P2 ya deja claro pedidos/reservas → se salta P3 (3 preguntas en total).
4. Pregunta 4 (plazo). Al responder → estado "Generando": Turnstile invisible + `POST /api/v1/proposals/generate` con las respuestas y el idioma.
5. ◇ Respuesta OK → `ProposalCard` (pack, alcance, extras, "desde X €" de `pricing.json`, plazo; nota "orientativo"). Evento `proposal_generated {pack}`.
   ◇ 429 → estado 8.10. ◇ 5xx / timeout 20 s → 8.8 con WhatsApp que incluye las respuestas. ◇ Turnstile → 8.12.
6. Marta decide: ◇ "Cambiar respuestas" → vuelve a editar la burbuja elegida y regenera (cuenta para el rate limit). ◇ "WhatsApp con esta propuesta" → `wa.me` con texto "Hola Jose, he pedido una propuesta en tu web: P2 desde 1.400 €. Mi negocio: clínica…"; evento `whatsapp_click {origin: proposal}`; no crea lead (lo crea Jose al recibirlo, o lo hace la spec fuera del alcance). ◇ "Enviar a Jose" → paso 7.
7. El asistente pide nombre, negocio, email o teléfono, privacidad. ◇ Falta email y teléfono → error inline "Necesito un email o un teléfono para responderte".
8. `[[ Enviar ]]` → `POST /api/v1/leads` del gateway (Turnstile `proposal_send`; el navegador nunca inserta en `leads`: la tabla no tiene política de INSERT, H2) con `source='web_proposal'`, `proposalId`, contacto y `affiliateCode` de la cookie. El gateway inserta con service role (`estado='nuevo'`, `fuente='web_proposal'`, `ai_proposal`, `affiliate_code`, `monto` orientativo) y, si el email coincide con el del afiliado, guarda el lead igual con `meta.self_referral_suspect` para que el admin decida (§9.9). Después el gateway avisa (`notified`: Edge Function `notify` con evento `lead.created` como vía primaria; n8n opcional) → Telegram a Jose en < 1 min.
   ◇ El gateway o Supabase fallan (5xx) → 8.13 (la propuesta va en el `mailto`/WhatsApp). ◇ 429 del gateway → 8.10. ◇ `notify/lead` falla → reintento y fallback a email por Edge Function; Marta no lo nota.
9. Estado "Enviado": "Hecho. Te escribo en menos de 24 h laborables" + `[[ Abrir WhatsApp ]]`. Evento `proposal_sent`.
10. Salida: lead en `/admin/leads` con propuesta y afiliado; Jose recibe Telegram con enlace directo al lead.

### 9.2 Contacto de empresa (Dani)

1. Dani entra en `/contacto?via=empresa` desde `/empresas` o el menú. Segmento en "Somos una empresa".
2. ◇ Quiere hablar ya → `[ Reservar 20 min ]` → `CalEmbed` (modal en móvil, inline en escritorio) → reserva en Cal.com → confirmación de Cal.com por email; la web muestra "Reserva hecha. Te llega la invitación por email". ◇ El embed no carga → botón a Cal.com en nueva pestaña.
3. ◇ Prefiere escribir → `ContactForm`: nombre, empresa, email, teléfono opcional, qué necesitas (chips), mensaje, privacidad, Turnstile.
4. `[[ Enviar ]]` → validación inline → Server Action `submitContact` → `POST /api/v1/leads` del gateway (`source='web_form'`, Turnstile `contact`, `affiliateCode` si hay cookie); el gateway inserta con service role y avisa a Jose (Telegram vía Edge Function `notify`). El paso 2 (reserva en Cal.com) también crea el lead: el webhook `BOOKING_CREATED` de `apps/web` llama a `POST /api/v1/leads` con `source='calcom'` y clave de servidor.
5. Éxito: el formulario se sustituye por "Hecho. Te respondo en menos de 24 h laborables" + `[ Reservar 20 min ]`. Evento `contact_submit {via: company}`.
6. Errores: Turnstile 8.12; gateway o Supabase caídos 8.13 (mailto con el mensaje escrito); 429 del gateway → "Has enviado varios mensajes seguidos. Prueba en unos minutos o escríbeme por WhatsApp"; sin conexión 8.7.

### 9.3 Contacto de negocio (Marta) por WhatsApp

1. Marta pulsa `[[ Escribir por WhatsApp ]]` en `/negocios`, `/contacto`, la home o la propuesta.
2. Se abre `https://wa.me/<número>?text=` con mensaje prellenado según origen:
   - Negocios: "Hola Jose, tengo un negocio (…) y quiero una web. Vengo de josecoded.com."
   - Con pack: "…me interesa el pack P2 Pedidos / reservas."
   - Propuesta: incluye pack, precio "desde" y respuestas.
   - Con `ref`: se añade "Código: MARTA-7F2K" al final para que Jose atribuya el lead a mano en admin (D15 prevé atribución por mención en el brief).
3. Evento `whatsapp_click {origin, pack?}`. No se crea lead automático; Jose lo crea desde `/admin/leads` → `[ Nuevo lead ]` (hoja: nombre, negocio, contacto, origen "WhatsApp", pack, código de afiliado). Es el único insert en `leads` que no pasa por el gateway: Server Action `createManualLead` con la sesión de Jose y la política aditiva `admin insert leads` (`fuente='whatsapp'`; H7). Sin aviso por Telegram (lo crea él).
4. Salida: conversación en WhatsApp; lead manual en admin si prospera.

### 9.4 Registro / login (Google, GitHub, email)

1. Origen: cabecera "Entrar", `[[ Entrar para comentar ]]`, tarjeta del chat, guard del área/admin (con `next`).
2. `/auth/login` (o `/auth/registro`, misma lógica). ◇ Google / GitHub → OAuth de Supabase → `/auth/callback` → sesión → redirige a `next` (o destino por defecto: cliente → `/area-clientes`; si no, `/`).
   ◇ Email → "Enviarme un código" → `/auth/codigo` → Marta teclea el código de 6 cifras (puede leerlo en la notificación del correo sin salir del navegador) → sesión → redirige a `next`.
3. Primera vez: se crea el usuario; si su email coincide con un `clients.email` sin `user_id`, el enlace se hace automáticamente (regla del admin 7.5). Si venía con `?ref` propio o ajeno, no afecta a la cuenta.
4. Errores: OAuth cancelado 8.16; código caducado o incorrecto 8.15; Supabase caído → login desactivado con aviso; sesión caducada más tarde → 8.5 / 8.6.
5. Salida: cuenta única para chat, comentarios y área.

### 9.5 Comentar en el blog (cola de aprobación)

1. Dani lee `/blog/[slug]` y baja a comentarios. ◇ Sin cuenta → `[[ Entrar para comentar ]]` (`next=/blog/[slug]#comentarios`) → 9.4 → vuelve al ancla.
2. Escribe y pulsa `[[ Publicar comentario ]]` → insert `blog_comments` con `status=pending` (RLS: solo su propio insert).
3. Ve su comentario con "Pendiente de revisión" (solo él). Jose recibe aviso (Telegram vía `notify` o contador en admin).
4. Jose en `/admin/comentarios`: ◇ Aprobar → `approved` → visible para todos en la siguiente revalidación (caché corta) → el autor deja de ver el badge. ◇ Rechazar → `rejected` → desaparece de la vista del autor (sin notificación por email en v1).
5. Responder: `> Responder` bajo un comentario aprobado → mismo flujo con `parent_id` (un nivel).
6. Errores: sesión caducada 8.6 con texto conservado; Supabase 8.13 (texto conservado, sin mailto: se pide reintentar).

### 9.6 Chat IA con takeover

1. Usuario en `/chat`. ◇ Sin cuenta → antesala con demo de solo lectura y tarjeta con `AuthProviders` (`next=/chat`) → 9.4.
2. Con cuenta: `GET admin-chat/thread` → hilo o sugerencias. Escribe → `POST admin-chat/messages` → el gateway llama a Workers AI y responde. Evento `chat_started` en el primer mensaje.
3. Jose ve la conversación en `/admin/chat` (sin leer). Abre `/admin/chat/[id]` → `POST :id/read`.
4. ◇ Jose activa takeover → banda del usuario cambia a "Jose está respondiendo"; el asistente deja de responder automáticamente; Jose escribe (`POST :id/messages`) y puede pedir un borrador (`POST :id/ai`).
5. ◇ Jose desactiva takeover → vuelve el asistente. ◇ El usuario pide reunión (`POST admin-chat/meeting`) → hoja con fecha y motivo → Jose recibe aviso (n8n inbound) y lo ve en el hilo.
6. Errores: gateway 8.8 (alternativa: formulario); 429 8.11; sesión 8.6.

### 9.7 Solicitud de ampliación (cliente)

1. Marta (cliente con P2) en `/area-clientes/pack` → `[[ Solicitar ampliación ]]` → `/area-clientes/pack/ampliar`. ◇ Ya hay una pendiente → redirige a `/pack` con el estado visible.
2. Elige P3 (+1.100 €) y SEO básico (250 €). El resumen calcula 1.350 € sin IVA y plazo ≈ 1 semana (P3 2 sem − P2 2 sem = 0 → mínimo 1 semana) con la regla de `pricing.json`, en cliente y verificada en servidor.
3. `[[ Enviar solicitud ]]` → insert `upgrade_requests` (`from_pack`, `to_pack`, `extras[]`, `computed_price`, `status=pending`) → aviso a Jose (Telegram) → vuelve a `/pack` con toast y estado Pendiente.
4. Jose en `/admin/ampliaciones`: ◇ Aceptar → modal con precio y plazo editables → actualiza `clients` (pack) y `client_pack_extras`; la solicitud pasa a Aceptada; Marta ve "Aceptada" y el pack nuevo; el presupuesto formal sigue en Notion (`/presupuesto`). ◇ Rechazar → motivo opcional → Marta ve "Rechazada" y el motivo.
5. Errores: error al enviar → toast con reintento (selección conservada); sesión caducada 8.6.

### 9.8 Afiliado: del enlace a la recompensa

1. Dani (con cuenta, no cliente) entra en `/area-clientes/recomiendame`: ve su código `DANI-3B` (generado al primer acceso, `affiliates` con `level=standard`), su enlace y "10 % del primer pedido".
2. `[[ Copiar enlace ]]` o `[ Compartir por WhatsApp ]`. Lo manda a Lola, que tiene un bar.
3. Lola abre `https://josecoded.com/negocios?ref=DANI-3B` → cookie `ref=DANI-3B` (30 días) → `RefNotice` "Vienes por recomendación de Dani. Lo tengo en cuenta." (cerrable, una vez) → navega libremente. Si ya había otra cookie `ref`, se conserva la primera (un lead, un afiliado).
4. Lola crea un lead por cualquiera de las vías (9.1, 9.2, reserva en Cal.com o chat). El gateway (`POST /api/v1/leads`) comprueba que el código existe en `affiliates` y lo guarda como `affiliate_code=DANI-3B`. ◇ Sin cookie (30 días pasados o borrada) → sin atribución; queda la mención en el brief por WhatsApp (9.3) para atribución manual.
5. Dani ve en su área: "3 sep · Formulario · Nuevo" (sin datos de Lola). Cada cambio de estado del lead se refleja.
6. Jose cierra el lead cobrado (9.9) → `affiliate_rewards` con `type=percent`, `amount=140` (10 % de 1.400 €), `status=pending`. Dani ve "10 % de 1.400 € = 140 € · Pendiente".
7. Jose paga por transferencia y marca abonada (9.9) → Dani ve "Abonada · 25 sep".
8. Reglas visibles en la pantalla: un lead, un afiliado (el primero que se registra; sin sobrescritura); sin autoreferidos (mismo email/usuario → sin recompensa, con aviso en admin); base = pack + extras del primer pedido, sin IVA, sin mantenimiento ni ampliaciones. Cliente: `type=maintenance_months`, `amount=2`. Premium (asignado a mano): 20 %.

### 9.9 Admin: cerrar lead cobrado y abonar recompensa (Jose)

1. Telegram → enlace a `/admin/leads/[id]`. Jose contacta, envía propuesta y presupuesto desde Notion (skills comerciales; fuera de la web), cobra.
2. En el lead: `[[ Marcar cerrado y cobrado ]]` → modal:
   - Base del primer pedido sin IVA `[1.400]` (prellenado desde la propuesta IA si existe; editable).
   - Extras incluidos en el primer pedido (checkboxes, suman a la base; el mantenimiento recurrente no suma).
   - Bloque "Recompensa": ◇ sin afiliado → "Sin afiliado; no se genera recompensa". ◇ afiliado cliente → "2 meses de mantenimiento básico para Marta G.". ◇ estándar → "10 % de 1.400 € = 140 € para Dani R.". ◇ premium → "20 % = 280 €". ◇ posible autoreferido → aviso y casilla "Generar recompensa igualmente" desmarcada.
   - `[[ Confirmar cierre ]]` / `[ Cancelar ]`.
3. Confirmación → Server Action `closeLeadPaid` → RPC transaccional `public.admin_close_lead_paid(p_lead_id, p_base_amount, p_reward_type, p_reward_amount, p_reward_percent, p_pricing_version, p_generate_reward)` (SECURITY DEFINER, comprueba `staff_members.role = 'admin'`): pone `leads.monto = base`, `leads.estado = 'cerrado'` y `leads.paid_at = now()` (falla con `lead_already_closed_or_missing` si ya tenía `paid_at`) y, si `p_generate_reward`, inserta `affiliate_rewards` (`pending`, con `base_amount`, `percent` y `pricing_version`) en la misma transacción; los triggers heredados de `leads` crean el `client` al cerrar. El lead muestra la tarjeta de cierre. Toast "Lead cerrado. Recompensa pendiente: 140 € para Dani R." con `> Ver afiliado`.
4. Cuando paga: `/admin/afiliados/[id]` → `[[ Marcar abonada ]]` → modal (fecha, nota) → `status=paid`, `paid_at`. Toast. El afiliado lo ve como Abonada.
5. Irreversible salvo edición manual en Supabase: el modal lo advierte ("Esta acción no se deshace desde el admin").

---

## 10. Microcopy (español, voz de `Comercial/voz.md`)

Reglas: de tú, sobrio, sin exclamaciones ni emojis, frases cortas, primera persona del singular ("te respondo", "te escribo"). Nunca "¡", nunca "soluciones", nunca "llevar tu negocio al siguiente nivel". "Precio cerrado", "Hecho", "publicado", "Te resumo".

### 10.1 Navegación y globales

| Clave | Texto |
|---|---|
| nav.companies | Empresas |
| nav.business | Negocios |
| nav.projects | Proyectos |
| nav.blog | Blog |
| nav.about | Sobre mí |
| nav.contact | Contacto |
| nav.chat | Chat con el asistente |
| nav.area | Área de clientes |
| nav.login | Entrar |
| nav.logout | Salir |
| nav.account | Mi cuenta |
| nav.admin | Admin |
| nav.menu / nav.close | Menú / Cerrar |
| skip | Saltar al contenido |
| footer.made | Hecha por Jose con Next.js en Cloudflare Workers. Código en GitHub. |
| lang | ES · EN |
| offline.banner | Sin conexión. Cuando vuelva la red, sigo donde estabas. |
| ref.notice | Vienes por recomendación de {nombre}. Lo tengo en cuenta. |
| ref.notice.close | Cerrar |

### 10.2 Home y secciones

| Clave | Texto |
|---|---|
| hero.seed | build("{{DATO: nombre}}") |
| hero.title | {{DATO: nombre a mostrar}} |
| hero.role | Desarrollador full-stack. React Native, Next.js, TypeScript, Supabase. {{DATO: ciudad}}, España. |
| hero.fact1 | Apps propias: 3catinfo ({{DATO: rol exacto}}), HazmeFila ({{DATO: estado}}), Oportunix ({{DATO: estado}}). |
| hero.fact2 | Esta web: Next.js en Cloudflare Workers, gateway Hono propio, backend Fastify en servidor propio, Supabase. Datos del build abajo. |
| hero.fact3 | Formación: ITIL 4, DevOps & Cloud Computing (AWS), Professional Scrum Master. {{DATO: cuáles certificadas}} |
| hero.links | Proyectos · Contacto |
| hero.skip | Saltar |
| hero.replay | Repetir presentación |
| home.presentation.title | Presentación |
| home.sections.title | Secciones |
| home.section.companies | Trabajo con empresas — Por proyecto o por horas, 40 €/h. Web, móvil e IA integrada. |
| home.section.business | Webs para tu negocio — 4 packs, de 900 a 4.200 €, de 1 a 3 semanas. |
| home.section.projects | Proyectos — {n} apps y esta web, con enlaces a stores y código. |
| home.section.blog | Blog — {n} artículos; el último, {fecha}. |
| home.section.about | Sobre mí — {{DATO: años}} años, formación, cómo trabajo. |
| home.section.contact | Contacto — WhatsApp, formulario o 20 min por videollamada. |
| home.projects.title | Proyectos |
| home.thisweb.title | Cómo está hecha esta web |
| home.thisweb.facts | Next.js {v} en Cloudflare Workers (OpenNext) · Gateway Hono con {n} rutas · Backend Fastify en servidor propio · Supabase: {n} tablas, {n} políticas RLS · {n} tests · LCP {x} s en móvil |
| home.thisweb.metrics | Lighthouse {score} · LCP {lcp} s · INP {inp} ms, medidos en build |
| home.lastPost.title | Último artículo |
| home.contact.title | Contacto |
| status.build | {rama} · {commit} · publicado {fecha} · LCP {x} s |
| status.mobile | Menú · Contacto · Chat |
| business.h1 | Webs para tu negocio |
| business.lead | Hago la web de tu clínica, tienda, restaurante o taller con precio y plazo cerrados. Desde 900 €, sin IVA. Dominio y hosting a tu nombre. |
| business.packs.title | Cuatro packs, precio cerrado |
| business.pack.cta | Pedir propuesta con este pack |
| business.pack.note | Precios sin IVA. Dominio y hosting a tu nombre. |
| business.extras.title | Extras, aparte del pack |
| extras.maint.basic | Mantenimiento básico — Copias, actualizaciones y una tanda de cambios al mes. Sin hosting. |
| extras.maint.extended | Mantenimiento extendido — Lo básico, soporte en 24 h laborables, tres tandas de cambios, informe y 2 h de desarrollo al mes. |
| extras.seo.basic | Que te encuentren en Google, básico (SEO) — Textos para buscadores, ficha de Google, mapa del sitio y velocidad. |
| extras.seo.full | Que te encuentren en Google, completo (SEO) — Lo básico más palabras clave, cinco páginas trabajadas, enlaces internos e informe. |
| extras.geo | Que te encuentren los asistentes de IA (GEO) — Que ChatGPT, Perplexity o Google AI citen tu negocio: datos estructurados, contenido citable y directorios. |
| extras.security | Revisión de seguridad de tu web — Reviso cabeceras, dependencias, formularios, permisos y copias; te entrego informe con lo corregido. |
| business.process.title | Cómo es el proceso |
| business.process.steps | Hablamos por WhatsApp o pides una propuesta · Te mando presupuesto cerrado y firmamos · 40 % al empezar, 30 % al aprobar el diseño, 30 % a la entrega · Web publicada y 30 días de garantía |
| business.close | Te resumo: precio cerrado, plazo cerrado, sin permanencia. |
| companies.h1 | Trabajo con empresas |
| companies.lead | Desarrollador full-stack freelance en {{DATO: ciudad}}, España. Web con Next.js, móvil con React Native, IA integrada con Workers AI, Ollama y n8n. Por proyecto o por horas: 40 €/h; feature con alcance cerrado, 150 €. |
| companies.rates | Tarifa: 40 €/h. Feature con alcance cerrado: 150 €. |
| companies.cv | Descargar CV |
| companies.book | Reservar 20 min |
| companies.book.fallback | Si el calendario no carga, escríbeme y cuadramos hora. |
| projects.h1 / projects.lead | Proyectos / Apps y webs con enlace a stores, web o código. |
| projects.filter | Todos · Apps · Webs · Esta web |
| projects.empty | No hay proyectos de este tipo todavía. |
| project.store | Ver en App Store · Ver en Google Play · Ver la web · Ver el código |
| project.cta | Hablar de un proyecto así |
| project.nda | Proyecto bajo acuerdo de confidencialidad: muestro nombre y alcance. |
| blog.h1 / blog.lead | Blog / Cómo están hechos mis proyectos y esta web. {n} artículos. |
| blog.more | Cargar más |
| blog.empty.es | Todavía no hay artículos en español. Puedes leer los que hay en inglés. |
| blog.onlyEn | Solo en inglés |
| post.share | Si te sirve, compártelo. |
| post.copy / post.copied | Copiar enlace / Enlace copiado |
| about.h1 | Jose |
| about.role | Desarrollador full-stack freelance · {{DATO: ciudad}}, España |
| about.facts | {{DATO: años}} años haciendo webs y apps · React Native/Expo, Next.js, TypeScript, Supabase, Node (NestJS, Fastify), PostgreSQL · Formación: ITIL 4, DevOps & Cloud (AWS), Scrum Master {{DATO: obtenidas / en curso}} |
| about.how | Digo qué hago, cuánto cuesta y cuándo está. |

### 10.3 Generador de propuesta

| Clave | Texto |
|---|---|
| gen.title | Propuesta orientativa |
| gen.progress | 1 de 4 (o "de 3") |
| gen.intro | Te hago cuatro preguntas y te digo qué web te haría y desde cuánto. Sin compromiso. |
| gen.intro.pack | Vienes del pack P2. Te hago tres preguntas para ajustarlo. |
| gen.q1 | ¿Qué tipo de negocio tienes? |
| gen.q1.chips | Clínica o consulta · Restaurante o bar · Tienda · Taller o servicios · Otro |
| gen.q2 | ¿Qué tiene que hacer la web? Marca todo lo que aplique. |
| gen.q2.chips | Mostrar lo que hago · Que me llamen o escriban · Pedidos · Reservas o citas · Gestionar clientes o stock · Avisos automáticos · Aparecer en Google |
| gen.q2.more | Cuéntame más (opcional) |
| gen.q3 | ¿Vas a vender o reservar online? |
| gen.q3.chips | Sí, pedidos · Sí, reservas o citas · No · No lo sé |
| gen.q4 | ¿Para cuándo la necesitas? |
| gen.q4.chips | Cuanto antes · En un mes · Sin prisa |
| gen.input | Escribe aquí si prefieres |
| gen.generating | Preparando tu propuesta |
| gen.slow | Está tardando más de lo normal. |
| gen.result.intro | Con lo que me cuentas, te haría: |
| gen.result.from | Desde 1.400 € sin IVA |
| gen.result.term | Plazo: 2 semanas |
| gen.result.note | Orientativo. El precio cerrado va en la propuesta que te mando. |
| gen.result.extras | Extras que te recomiendo (opcionales, no incluidos en el desde) |
| gen.result.extra.tag | Opcional · no incluido |
| gen.send | Enviar a Jose |
| gen.edit | Cambiar respuestas |
| gen.whatsapp | Escribir por WhatsApp con esta propuesta |
| gen.form.intro | Para mandarte la propuesta cerrada necesito saber a quién escribo. |
| gen.form.name / business / contact | Tu nombre / Nombre del negocio / Email o teléfono |
| gen.form.contact.error | Necesito un email o un teléfono para responderte. |
| gen.form.privacy | He leído la política de privacidad. |
| gen.form.submit | Enviar |
| gen.done | Hecho. Te escribo en menos de 24 h laborables. |
| gen.done.whatsapp | Abrir WhatsApp |
| gen.error | No he podido preparar la propuesta. Puedes reintentar o escribirme por WhatsApp con tus respuestas. |
| gen.retry | Reintentar |
| gen.ratelimit | Has pedido varias propuestas seguidas. Prueba en unos minutos o escríbeme por WhatsApp. |
| gen.saveError | No he podido guardar tus datos. Te dejo la propuesta lista para WhatsApp o email. |

### 10.4 Contacto, chat y auth

| Clave | Texto |
|---|---|
| contact.h1 | Contacto |
| contact.segment | Tengo un negocio · Somos una empresa |
| contact.business.lead | Lo más rápido es WhatsApp. Te respondo yo. |
| contact.whatsapp | Escribir por WhatsApp |
| contact.proposal | Pedir propuesta orientativa |
| contact.form.toggle | Prefiero dejar mis datos |
| contact.form.fields | Nombre · Negocio o empresa · Email · Teléfono (opcional) · Qué necesitas · Mensaje |
| contact.form.needs | Web · App · IA · Puesto o colaboración · Otro |
| contact.form.submit / sending | Enviar / Enviando |
| contact.form.done | Hecho. Te respondo en menos de 24 h laborables. |
| contact.reply | Respondo en menos de 24 h laborables. |
| contact.copyEmail / copied | Copiar / Copiado |
| contact.error.required | Este campo es obligatorio. |
| contact.error.email | Revisa el email. |
| contact.error.long | Máximo 1.000 caracteres. |
| turnstile.error | No he podido verificar que no eres un robot. Recarga la página. Si sigue igual, escríbeme por WhatsApp. |
| supabase.down | No he podido guardar tus datos. Te dejo el mensaje listo para email o WhatsApp. (gateway o Supabase caídos) |
| contact.ratelimit | Has enviado varios mensajes seguidos. Prueba en unos minutos o escríbeme por WhatsApp. |
| chat.title | Asistente |
| chat.status.ai / chat.status.jose | Responde el asistente / Jose está respondiendo. Puede tardar unos minutos; te avisa aquí. |
| chat.welcome | Hola. Puedo contarte qué hace Jose, con qué stack, en qué proyectos ha trabajado y cómo contactar. No invento precios ni disponibilidad. |
| chat.suggestions | ¿Qué stack usas? · ¿Estás disponible? · ¿Cuánto cuesta una app? |
| chat.placeholder | Escribe tu pregunta |
| chat.send | Enviar |
| chat.meeting | Pedir una reunión |
| chat.demo.title | Así responde el asistente |
| chat.gate | Para preguntar necesitas una cuenta: así evito bots y Jose puede seguir la conversación y contestarte él si hace falta. Es un toque con Google. |
| chat.error | El asistente no está disponible ahora mismo. Puedes escribirme por el formulario. |
| chat.ratelimit | Has enviado muchos mensajes seguidos. Espera un momento. |
| auth.login.h1 / auth.signup.h1 | Entrar / Crear cuenta |
| auth.context.comment / chat / area | Para comentar. / Para chatear. / Para ver tu proyecto. |
| auth.google / github | Continuar con Google / Continuar con GitHub |
| auth.or | o con email |
| auth.email / name | Email / Nombre |
| auth.emailHint | Te envío un código de 6 cifras al email. Lo escribes aquí y entras. Sin contraseña. |
| auth.magic | Enviarme un código |
| auth.noAccount / hasAccount | ¿No tienes cuenta? Crear cuenta / ¿Ya tienes cuenta? Entrar |
| auth.legal | Al entrar aceptas la política de privacidad. |
| auth.code.h1 | Introduce el código |
| auth.sent | Te he enviado un código de 6 cifras a {email}. Caduca en 10 min. |
| auth.code.submit | Entrar |
| auth.resend | Reenviar código |
| auth.otherEmail | Usar otro email |
| auth.code.wrong | El código no es correcto. Revísalo o pide otro. |
| auth.expired | Tu sesión ha caducado. Entra de nuevo. |
| auth.code.expired | El código ha caducado. Pide otro. |
| auth.oauthError | No se ha completado el acceso. Prueba de nuevo o entra con email. |
| auth.down | El acceso no está disponible ahora mismo. Prueba en unos minutos. |
| auth.callback | Entrando |
| comments.title | Comentarios |
| comments.gate | Para comentar necesitas una cuenta. Es un clic con Google. |
| comments.login | Entrar para comentar |
| comments.placeholder | Escribe un comentario |
| comments.hint | Reviso cada comentario antes de publicarlo para evitar spam. Suele ser el mismo día. |
| comments.submit | Publicar comentario |
| comments.pending | Pendiente de revisión. Se publica cuando lo revise. Suele ser el mismo día. |
| comments.reply | Responder |
| comments.empty | Todavía no hay comentarios. |
| comments.error | No se ha publicado. Reintenta. |
| comments.loadError | No he podido cargar los comentarios. |
| profile.h1 | Mi cuenta |
| profile.save / saved | Guardar / Hecho |
| profile.logout | Cerrar sesión |
| profile.delete | Solicitar borrado |
| profile.delete.confirm | Te borro la cuenta y tus comentarios en menos de 7 días. Los datos de tu proyecto, si eres cliente, los conservo el tiempo que exige la ley. ¿Seguimos? |

### 10.5 Área de clientes

| Clave | Texto |
|---|---|
| area.tabs | Proyecto · Tareas · Material · Pack · Recomiéndame |
| area.hello | Hola, {nombre} |
| area.phases | Inicio · Diseño · Desarrollo · Revisión · Publicada |
| area.delivery | Entrega prevista: {fecha} |
| area.yours | Te toca a ti |
| area.yours.empty | No tienes nada pendiente. Estoy en la fase de {fase}. |
| area.news | Novedades |
| area.talk | Hablar con Jose |
| area.notClient | Todavía no tienes ningún proyecto conmigo. Si quieres una web, pide una propuesta orientativa o escríbeme. |
| area.notClient.referral | Puedes recomendarme igualmente: 10 % del primer pedido de quien venga por tu enlace. |
| area.loadError | No he podido cargar tu proyecto. |
| tasks.h1 | Tareas |
| tasks.filter | Me tocan a mí · Las de Jose · Todas |
| tasks.status | Pendiente · En curso · Hecha · Bloqueada |
| tasks.empty | No hay tareas todavía. Cuando arranquemos aparecerán aquí. |
| tasks.empty.mine | Nada pendiente por tu parte. |
| task.due | Límite {fecha} |
| task.attach | Adjuntar archivo |
| task.attach.limit | Hasta 25 MB. Imágenes, PDF, documentos o ZIP. |
| task.comment | Comentar |
| task.done | Marcar como hecha |
| task.done.toast | Hecho. Se lo notifico a Jose. |
| files.h1 | Material |
| files.filter | Todo · Lo que he subido · Entregas de Jose |
| files.upload | Subir material |
| files.empty | Todavía no hay material. Sube el logo, textos o fotos de tu negocio y los uso en la web. |
| files.download / delete | Descargar / Eliminar |
| files.delete.confirm | ¿Eliminar {nombre}? No se puede deshacer. |
| files.error.type | Este tipo de archivo no está permitido. |
| files.error.size | El archivo supera 25 MB. |
| plan.h1 | Pack y extras |
| plan.contracted | Contratado el {fecha} · {plazo} |
| plan.extras | Extras contratados |
| plan.extras.empty | No tienes extras contratados. |
| plan.requests | Solicitudes |
| plan.upgrade | Solicitar ampliación |
| plan.upgrade.pending | Tienes una solicitud pendiente. |
| plan.note | Precios sin IVA. |
| upgrade.h1 | Solicitar ampliación |
| upgrade.pack / extras | Pack / Extras |
| upgrade.current | actual |
| upgrade.message | Cuéntame qué necesitas (opcional) |
| upgrade.summary | {pack}: {diff} € · {extras} · Total {total} € sin IVA · Plazo estimado: {semanas} |
| upgrade.summary.empty | Elige un pack superior o un extra. |
| upgrade.submit | Enviar solicitud |
| upgrade.note | Te confirmo precio y plazo. No se cobra nada al enviar. |
| upgrade.done | Solicitud enviada. Te contesto en menos de 24 h laborables. |
| upgrade.status | Pendiente · Aceptada · Rechazada |
| ref.h1 | Recomiéndame |
| ref.link | Tu enlace |
| ref.copy / copied | Copiar enlace / Enlace copiado |
| ref.share | Compartir por WhatsApp |
| ref.share.text | Si necesitas una web para tu negocio, Jose la hace con precio cerrado: {enlace} |
| ref.earn.client | 2 meses de mantenimiento básico gratis por cada negocio que contrate. |
| ref.earn.standard | 10 % del primer pedido, sin IVA, por cada negocio que contrate. |
| ref.earn.premium | 20 % del primer pedido, sin IVA, por cada negocio que contrate. |
| ref.rules | Se abona cuando el referido ha pagado el primer pedido completo. No incluye mantenimiento ni ampliaciones. Un lead, un afiliado. |
| ref.leads | Leads por tu enlace |
| ref.leads.empty | Todavía nadie ha llegado por tu enlace. Compártelo con quien crea que necesita una web. |
| ref.lead.status | Nuevo · En conversación · Cerrado · Descartado |
| ref.rewards | Recompensas |
| ref.rewards.empty | Sin recompensas todavía. |
| ref.reward.status | Pendiente · Abonada el {fecha} |
| ref.reward.maintenance | 2 meses de mantenimiento básico |

### 10.6 Admin

| Clave | Texto |
|---|---|
| admin.nav | Resumen · Leads · Comentarios · Clientes · Ampliaciones · Afiliados · Chat |
| admin.empty.all | Nada pendiente. |
| admin.services | Servicios: gateway · Omen · n8n — OK / Sin respuesta |
| leads.filters | Estado · Origen · Con afiliado · Fecha |
| leads.new | Nuevo lead |
| leads.empty | No hay leads con estos filtros. |
| lead.status | Nuevo · En conversación · Cerrado · Descartado |
| lead.source | Formulario · Propuesta · Chat · WhatsApp |
| lead.proposal | Propuesta IA |
| lead.affiliate / none | Afiliado / Sin afiliado |
| lead.selfReferral | Posible autoreferido: mismo email o usuario que el afiliado. No genera recompensa. |
| lead.notes | Notas |
| lead.close | Marcar cerrado y cobrado |
| lead.close.base | Base del primer pedido sin IVA |
| lead.close.extras | Extras incluidos en el primer pedido |
| lead.close.reward.none | Sin afiliado; no se genera recompensa. |
| lead.close.reward.client | 2 meses de mantenimiento básico para {afiliado}. |
| lead.close.reward.percent | {pct} % de {base} € = {importe} € para {afiliado}. |
| lead.close.force | Generar recompensa igualmente |
| lead.close.warn | Esta acción no se deshace desde el admin. |
| lead.close.confirm | Confirmar cierre |
| lead.close.toast | Lead cerrado. Recompensa pendiente: {importe} para {afiliado}. |
| lead.closed | Cerrado el {paid_at} · base {monto} € · recompensa {importe} → Pendiente |
| lead.createClient | Crear cliente desde este lead |
| lead.discard | Descartar |
| mod.filter | Pendientes · Aprobados · Rechazados |
| mod.approve / reject | Aprobar / Rechazar |
| mod.empty | Nada que moderar. |
| mod.undo | Deshacer |
| clients.new | Nuevo cliente |
| clients.empty | Todavía no hay clientes. |
| client.noAccount | Sin cuenta |
| client.link | Enlazar cuenta |
| client.tabs | Resumen · Tareas · Material · Pack y extras |
| client.phase.confirm | El cliente verá la fase nueva en su área. ¿Cambiar a {fase}? |
| client.viewAs | Ver como cliente |
| task.new / edit / create | Nueva tarea / Editar tarea / Crear tarea |
| task.assignee | Asignada a: Jose · Cliente |
| upgrades.filter | Pendientes · Aceptadas · Rechazadas |
| upgrades.accept / reject | Aceptar / Rechazar |
| upgrades.accept.note | Confirma precio y plazo. Se actualiza el pack del cliente. |
| upgrades.reject.reason | Motivo (lo ve el cliente, opcional) |
| upgrades.empty | Sin solicitudes pendientes. |
| affiliates.level | Estándar · Premium |
| affiliates.level.confirm | ¿Cambiar a {nivel}? Aplica a recompensas futuras. |
| affiliates.rewards.empty | Sin recompensas. |
| reward.pay | Marcar abonada |
| reward.pay.date / note | Fecha de abono / Nota (transferencia, meses aplicados…) |
| reward.paid | Abonada el {fecha} · {nota} |
| chat.admin.filter | Sin leer · Con takeover · Todas |
| chat.admin.empty | No hay conversaciones. |
| chat.takeover.off / on | Responde el asistente / Respondes tú |
| chat.takeover.hint | Activa el takeover para responder. |
| chat.draft | Pedir respuesta al asistente |
| chat.loadError | No puedo cargar el hilo. |

### 10.7 Errores de página

| Clave | Texto |
|---|---|
| 404.title / body | Esta página no existe. / Puede que el enlace esté mal o que la haya movido. |
| 404.cta | Ir al inicio |
| 410.title / body | Este contenido ya no está. / El foro y los artículos antiguos se retiraron al rehacer la web. |
| 410.cta | Ver el blog actual |
| 500.title / body | Algo ha fallado. / Ya me ha llegado el aviso. Puedes reintentar o escribirme. |
| 500.cta | Reintentar |
| 403.title / body | No tienes acceso a esta página. / Esta zona es privada. Si crees que deberías verla, escríbeme. |
| 403.cta.user / anon | Ir a mi área / Ir al inicio |
| 503.title / body | Estoy actualizando la web. / Vuelve en unos minutos. Para urgencias, WhatsApp. |
| generic.retry / back / home | Reintentar / Volver / Ir al inicio |

---

## 11. Eventos de analítica por pantalla (Umami)

| Evento (D11) | Dónde | Propiedades |
|---|---|---|
| `whatsapp_click` | home, negocios, contacto, propuesta, área, recomiéndame (compartir) | `origin`, `pack?`, `ref?` |
| `contact_submit` | contacto | `via` |
| `proposal_generated` | generador | `pack`, `questions` (3/4) |
| `proposal_sent` | generador | `pack`, `has_ref` |
| `chat_started` | chat | — |
| Propuestos (§13): `hero_played {skipped, ms}`, `section_open {section}` (home), `booking_open` (Cal.com), `referral_copy` (recomiéndame) | | |

---

## 12. Reglas de accesibilidad y motion que condicionan la UI

- Un `h1` por página; landmarks `header`, `nav`, `main`, `footer`; "Saltar al contenido".
- Chips del generador y segmentos son `radio`/`checkbox` reales o `button` con `aria-pressed`; navegables por teclado; el foco se mueve a la nueva pregunta al responder y se anuncia (`aria-live="polite"`) la llegada de la propuesta.
- `HeroIntro`: el título compilando lleva `aria-label` con el nombre final desde el inicio; los caracteres intermedios no se anuncian; "Saltar" es el primer elemento enfocable. `FocusLight` es `aria-hidden` y nunca porta información.
- Árbol del sitio: `nav` con lista anidada, `aria-current="page"`, flechas para moverse, plegado con estado accesible; pestañas con `role="tablist"` solo si se implementan como tal; si no, son enlaces.
- Scroll personalizado (Lenis o similar): desactivado con `prefers-reduced-motion`; anclas (`#comentarios`) y foco por teclado funcionan igual; sin secuestro del scroll en móvil. El panel central es el único contenedor con scroll en escritorio (árbol y línea de estado fijos).
- Objetivos táctiles ≥ 44 px; barra inferior del área y del admin con etiquetas de texto, no solo iconos.
- Estados nunca solo por color: `StatusBadge` siempre con texto.
- Modales con foco atrapado y cierre con Escape; `Sheet` en móvil ocupa ≤ 90 % de alto y se cierra deslizando o con botón.
- Toasts con tiempo suficiente (≥ 6 s) y accesibles por `aria-live`; los que llevan acción (Deshacer, Entrar) no se cierran solos.

---

## 13. Decisiones abiertas para `ui` (y para Jose donde se indica)

1. **Acento y paleta oscura**: 3 propuestas; Jose elige viendo muestras (spec §12).
2. **Tres familias tipográficas** (titulares / texto / UI y menús) fuera de la lista negra (sin Inter con degradado).
3. **Parámetros de `CompileReveal` y `FocusLight`**: tipografía monoespaciada del estado "compilando" y curva de convergencia del scramble; radio, intensidad y color del foco; presupuesto de rendimiento para CWV en verde en móvil 4G. Sin partículas, ondas ni retículas.
4. **Retrato en Sobre mí** (Jose decide): la única foto del sitio, o un avatar generativo. Para Marta, una cara real aumenta la confianza; para la dirección visual, rompe la regla "sin fotos". Recomendación de `ux`: una foto, tratada con la misma estética (recorte y color de la paleta), solo en Sobre mí y en la tarjeta de datos de Contacto.
5. **Capturas de producto en Proyectos**: son de producto, no fotos; `ui` define el marco de móvil y el tratamiento (sin mockups brillantes).
6. **Tratamiento de precio** (`PriceTag`): tamaño, "sin IVA" secundario, sin tachados ni "recomendado".
7. **Barra fija móvil de `/negocios`**: `ui` decide altura y si se oculta al hacer scroll hacia abajo.
8. **Densidad del admin**: tablas compactas en escritorio, tarjetas en móvil; `ui` define los componentes de `DataTable` y `Sheet` sobre shadcn.
9. **Iconografía**: set único y sobrio (sin iconos brillantes ni duotono de plantilla); usos concretos: proveedores de auth, stores, WhatsApp, estados.
10. **Estados vacíos**: si llevan motivo generativo pequeño o solo texto.
11. **Transiciones de página** (GSAP): las de §3.7 (120/160 ms); `ui` ajusta valores, no el tipo.
11b. **Árbol y pestañas**: densidad del árbol, tratamiento del nodo activo, estado plegado, aspecto de las pestañas (y si se degradan a migas); que en 375 px la hoja del menú no parezca un IDE.
11c. **Barra de título y línea de estado**: tamaño del nombre minimizado, qué datos del build caben en escritorio, y cómo se ven los tres accesos móviles (Menú · Contacto · Chat).
12. **`ProposalCard`**: es la pieza que Marta va a mirar más tiempo; merece una composición propia (pack, incluye, precio, plazo, nota) legible en 390 px.
13. **Eventos extra de Umami** (`path_companies`, `path_business`, `booking_open`, `referral_copy`): confirmar con Jose; no cuestan nada.
14. **Chat: página completa o panel lateral**: `ux` fija página completa (`/chat`) para que sea indexable como funcionalidad y simple en móvil; `ui` puede añadir un acceso flotante discreto solo en escritorio (no en móvil, donde compite con WhatsApp).
15. **Nombre a mostrar en el hero** (Jose decide, §18): "Jose", "Jose Carlos Sánchez" o "José Carlos Sánchez García"; afecta al tamaño del titular compilado y a la barra de título en 375 px.

---

## 14. Decisiones de `ux` tomadas dentro del margen de la spec

| Decisión | Razón |
|---|---|
| Email con código de 6 cifras (OTP), sin contraseña ni enlace | Marta no recuerda nada ni sale del navegador; el enlace mágico con PKCE obliga a abrirlo en el mismo navegador y rompía el flujo en móvil (§16). La spec dejaba "magic link o password" |
| Cualquier usuario con cuenta entra en `/area-clientes`; sin proyecto ve estado "no cliente" + afiliados | D15: "todo usuario del área puede ser afiliado" y "no cliente: 10 %" solo tiene sentido si el no cliente puede entrar |
| `/contacto` con segmento negocio/empresa en vez de dos páginas; segmento inicial por `?via` → recuerdo de sesión → negocio | Una URL, una primaria por vía (§12), menos rutas que mantener; Dani no ve WhatsApp como primaria si viene de Empresas (§16) |
| WhatsApp no crea lead automático; Jose lo crea desde admin | No hay webhook de WhatsApp en el alcance; el evento `whatsapp_click` mide el embudo |
| Barra fija móvil solo en `/negocios` | Es la única página donde Marta compara y decide; en el resto competiría con el contenido |
| Admin solo en español | Un solo operador |
| Leads atribuidos sin datos personales del referido | Privacidad: el afiliado ve fecha, origen y estado |
| Rechazo de comentario sin email al autor | Simplicidad en v1; el autor deja de verlo |
| Ampliación: una solicitud pendiente a la vez | Evita colisiones de precio y estado |
| Cierre de lead cobrado irreversible desde el admin (RPC `admin_close_lead_paid`, una sola vez por lead) | La recompensa nace de ese acto en la misma transacción; revertir exigiría anular recompensas (fuera de v1) |
| El árbol sustituye al menú de cinco; en móvil vive en la hoja "Menú" y la home lleva un índice de secciones | Una sola navegación; el índice da el acceso de un toque que Marta necesita sin abrir el menú (decisión de Jose: IDE-lite, 2026-09-17) |
| Pestañas solo en escritorio, degradables a migas | En 375 px no caben y el botón atrás cumple la función |
| Hero de presentación una vez al día (`localStorage`), máximo 3,5 s en escritorio y 2,4 s en móvil, saltable con cualquier interacción | Decisión de Jose; los tiempos y el salto evitan que la animación cueste a Marta más de lo que aporta |
| Datos del build en la línea de estado (escritorio) y en "Cómo está hecha esta web" | Son los únicos datos "en vivo" permitidos por la spec (generados en build, no en tiempo real) |
| La barra fija de `/negocios` sustituye a la línea de estado en esa página | Evita dos barras inferiores en móvil |

---

## 15. Validación

`usuario-ejemplo` recorrió la v1.0 de este documento el 2026-09-17 como Marta (§4.1, §4.3, §4.4, §4.10, §6, §9.1/9.3/9.7/9.8) y como Dani (§4.2, §4.5–4.9, §4.11, §9.2/9.5/9.6). Ambas personas PASAN. Las fricciones y su tratamiento están en §16.

## 16. Validación con usuario-ejemplo (2026-09-17)

### 16.1 Marta — cambios incorporados

| # | Fricción | Cambio | Dónde |
|---|---|---|---|
| M1 | El enlace mágico obliga a salir al correo y volver; en móvil rompe el flujo | Google y GitHub a un toque, mismo tamaño y zona (Google con estilo primario). La vía email pasa de enlace a **código de 6 cifras** que se teclea en la misma pantalla, con explicación antes de pedir el email. Nota técnica: se pidió "abrir el enlace en cualquier dispositivo"; con el flujo PKCE de Supabase el enlace solo vale en el navegador que lo pidió, así que el código cumple mejor el objetivo (no salir del navegador, cualquier dispositivo) | §2.1, §3.5, §5.1–5.4, §8.15, §9.4, §10.4, §14 |
| M2 | "Afiliados" en la pestaña frente a "Recomiéndame" en el título | Unificado en "Recomiéndame" en menú, barra inferior, tarjeta del inicio, título y ruta `/area-clientes/recomiendame`. "Afiliados" solo en el admin | §2.2, §3.3, §6.1, §6.7, §9.8 |
| M3 | Llegar con `?ref` sin ninguna señal | Componente `RefNotice`: aviso discreto, no bloqueante y cerrable, una sola vez por cookie: "Vienes por recomendación de {nombre}. Lo tengo en cuenta." | §3.5, §9.1, §9.8, §10.1 |
| M4 | "GEO 300 €" y "SEO" sin explicación | Extras renombrados en lenguaje llano con la sigla entre paréntesis y una línea de qué es: "Que te encuentren en Google (SEO)", "Que te encuentren los asistentes de IA (GEO)", "Revisión de seguridad de tu web". Los nombres de `tarifas.md` siguen como identificadores internos, en `pricing.json` y en el admin | §3.5, §4.3, §6.6, §10.2 |
| M5 | "Lighthouse 9x" no le dice nada | `ProofStrip` de la home pasa a "Esta web carga en menos de 1 s" (derivado del LCP medido en build, con frase alternativa si no se cumple); Lighthouse, LCP e INP se quedan en "Cómo está hecha esta web" | §3.5, §4.1, §10.2 |
| M6 | No estaba claro si los extras recomendados estaban sumados al "desde" | `ProposalCard` separa los extras en un bloque propio "opcionales, no incluidos en el desde", cada uno con etiqueta "Opcional · no incluido" y precio aparte; el "desde" es solo el pack | §4.4, §10.3 |

### 16.2 Dani — cambios incorporados

| # | Fricción | Cambio | Dónde |
|---|---|---|---|
| D1 | El chat pide cuenta antes de poder probarlo | Exigir cuenta es decisión de Jose (Q1/D6) y no se toca. Se mejora la antesala: demo de solo lectura con 2–3 intercambios reales y una frase de por qué se pide la cuenta (bots y que Jose pueda seguir y contestar). **Alternativa que Jose puede reabrir:** chat anónimo con límite (p. ej. 3 mensajes por IP y día) y cuenta a partir del cuarto; exigiría un modelo de conversación anónima en el gateway (descartado en Q1) | §4.11, §9.6, §10.4 |
| D2 | 3catinfo destacado en primer lugar sin stack ni resultados (NDA) | Orden por verificabilidad (número de pruebas por ficha, calculado en build); 3catinfo con ficha reducida nunca en primera posición. v2: qué proyectos están publicados es `{{DATO}}` (§18); no se asume que HazmeFila u Oportunix estén en las stores | §4.1, §4.5 |
| D3 | `/contacto` abría siempre en "Tengo un negocio" | Segmento inicial por origen: `?via` como override, recuerdo en `sessionStorage` fijado al visitar Empresas, Negocios o una ficha con `audience`, y `negocio` solo como último recurso | §4.10, §14 |
| D4 | La cola de aprobación no explica por qué | Nota fija bajo el campo de comentario, visible antes de escribir: motivo (spam) y plazo (mismo día) | §4.8, §10.4 |
| D5 | El CTA de la ficha de proyecto dependía del tipo de proyecto | Depende del segmento recordado (D3), no del tipo; el frontmatter `audience` solo fija el recuerdo si no había ninguno | §4.6 |

### 16.3 Descartado y por qué

| Propuesta | Motivo |
|---|---|
| Chat anónimo con límite (implícito en D1) | Contradice Q1/D6, decisión explícita de Jose; queda registrada como alternativa reabrible, con su coste (modelo de conversación anónima en el gateway) |
| Renombrar también los packs a lenguaje llano | Los nombres P1–P4 ya son llanos ("Web básica", "Pedidos / reservas", "Gestión", "Gestión + automatizaciones") y son los que usan las propuestas de Notion; cambiarlos rompería la trazabilidad entre web, generador y presupuesto |
| Abrir el enlace mágico "en cualquier dispositivo" tal cual | No es posible con el flujo PKCE de Supabase sin bajar la seguridad; el código de 6 cifras resuelve el problema real (no salir del navegador en móvil) |

## 17. Recuento de pantallas

- Público: 19 (home, empresas, negocios, generador [5 estados], proyectos, ficha, blog, artículo, sobre mí, contacto, chat, 3 legales, perfil, login, registro, código, callback).
- Área de clientes: 7 (inicio, tareas, detalle de tarea, material, pack y extras, solicitar ampliación, recomiéndame).
- Admin: 12 (incluida la hoja de tarea como subpantalla).
- Error/estado: 16 casos, 6 son páginas completas (404, 410, 500, 403, 503, login con banner) y 10 estados inline.
- Total: 38 pantallas + 16 casos de error/estado. v2 añade dentro del shell la hoja "Menú" (móvil) y los seis estados del hero de presentación (`boot`, `compiling`, `typing`, `hold`, `minimizing`, `ready`), que no cuentan como pantallas.

## 18. Hechos a confirmar por Jose (`{{DATO}}`)

Fuentes consultadas: `josedev/src/lib/literals.json` (solo hechos; el copy de marketing se descarta), `site-metrics.json` (2026-08-15: 25 migraciones, 21 tablas, 73 políticas RLS, 27 rutas del gateway, 72 componentes, 235 tests, 2 idiomas; se regeneran en el build nuevo), `sobre-mi-stack-config.ts`, `josecoded-api/src/knowledge/knowledge.json`, repos `hazmeFila` y `oportunix`, vault (`ITIL/`, `DEVOPS & CLOUD COMPUTING/`, `PROFESIONAL SCRUM MASTER/`, `Proyectos/josecoded.md`, `JOSE.canvas`).

Hechos que sí constan y se usan sin marcar: stack (React Native/Expo, React, Next.js, TypeScript, Tailwind, Node.js, NestJS, Fastify, Supabase, Firebase, PostgreSQL, MongoDB, Redis, Docker, n8n, Ollama, Cloudflare, Jest, Git, Jira, Agile/Scrum, ITIL v4); 3catinfo es una app de noticias de 3Cat con secciones portada, 3 minuts, vídeo, El temps, El meu 3CatInfo (NDA: solo nombre y stores); HazmeFila es una app Expo SDK 56 + Supabase para contratar a alguien que haga cola por ti (primer commit 2026-06-06); Oportunix es una web Next.js 16 + Firebase de mystery boxes y subastas (primer commit 2026-02-16, dominio oportunix.com); esta web: Next.js en Cloudflare Workers vía OpenNext, gateway Hono, backend Fastify en el servidor "Omen", Supabase, n8n, Umami; tarifas de `tarifas.md`; LinkedIn `josé-carlos-sánchez-garcía-7019072a9`.

| # | Dato | Dónde se usa | Qué necesito |
|---|---|---|---|
| 1 | `{{DATO: nombre a mostrar}}` | hero, barra de título, Sobre mí, JSON-LD `Person` | Elegir: "Jose", "Jose Carlos Sánchez" o "José Carlos Sánchez García" (con o sin tildes; josedev usa "Jose Carlos Sanchez Garcia") |
| 2 | `{{DATO: ciudad}}` | hero, Empresas, Sobre mí | Ciudad de residencia (la spec fija `areaServed: ES`, pero la ciudad aparece como dato de la persona, no como página local) |
| 3 | `{{DATO: años}}` | índice de secciones, Sobre mí | Años haciendo webs y apps, y desde cuándo eres freelance |
| 4 | `{{DATO: 3catinfo rol exacto y año}}` | hero, Proyectos, trayectoria | Qué hiciste exactamente (desarrollo de la app y rendimiento, según voz.md), en qué año, y si puedes enlazar App Store / Google Play |
| 5 | `{{DATO: HazmeFila estado}}` | hero, Proyectos, orden de fichas | ¿Publicada en stores? Enlaces. ¿Repo público? |
| 6 | `{{DATO: Oportunix estado}}` | hero, Proyectos, orden de fichas | ¿oportunix.com está en producción? ¿Repo público? |
| 7 | `{{DATO: proyecto 1 / proyecto 2}}` | árbol, home, Proyectos | Cuáles son los dos proyectos con más pruebas verificables (depende de 4–6) |
| 8 | `{{DATO: webs de comercios}}` | Negocios, Proyectos | Nombres y URLs de webs hechas para negocios, si las hay; si no, el bloque no se publica |
| 9 | `{{DATO: certificaciones}}` | hero, Sobre mí | ITIL 4, DevOps & Cloud Computing (AWS), Professional Scrum Master: cuáles están certificadas (organismo y año) y cuáles en curso |
| 10 | `{{DATO: empleos anteriores}}` | trayectoria de Sobre mí, CV | Empresas, puestos y años que quieres mostrar |
| 11 | `{{DATO: disponibilidad}}` | barra de título (opcional), Empresas, chat | Disponible / no disponible, y desde cuándo; si prefieres no mostrarlo, se omite |
| 12 | `{{DATO: repo público sí/no}}` | pie, "Cómo está hecha esta web" | Si el repo de josecoded será público (enlace "Código en GitHub") |
| 13 | `{{DATO: número de WhatsApp y email}}` | contacto, WhatsAppButton | Número en formato internacional y email de contacto (hola@josecoded.com es un supuesto) |
| 14 | `{{DATO: usuario de GitHub}}` | GitHubActivity, JSON-LD `sameAs` | Usuario exacto |
| 15 | `{{DATO: cuentas de desarrollador en stores}}` | StoreBadges, pie | Enlaces al perfil de desarrollador en App Store y Google Play |

Regla: mientras un `{{DATO}}` no esté cubierto, el bloque que lo necesita no se publica (spec §1: nada publicado sin contenido real). `redactor` no inventa nada para rellenarlos.
