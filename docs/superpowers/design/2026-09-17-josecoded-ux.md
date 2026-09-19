# joseCoded — diseño de experiencia (UX) v3

**Fecha:** 2026-09-17 · **Versión:** 3.2 (2026-09-19: validación de v3.1 con `usuario-ejemplo` como Jose operador, reclutadora y Marta —los tres PASAN—; confirmación por Telegram con bloqueos, "visto" y segundo paso; pausa con fecha; edición de material en móvil; vinculación de correo por enlace de Gmail; control de plantilla; etiqueta de la escena fuera de producción; dos alternativas de hero para Jose; §16.4 y §21 con los cambios; v3.1: **Radar** en `/admin` —bandeja, detalle, plataformas, perfil, calendario y confirmación por Telegram— según spec v1.5 §13, y **hero en móvil** alineado con D16 —vídeo/poster de la misma escena e intro reducida—; §1.3, §2.3, §3.6, §3.7, §3.9, §3.10, §4.1, §7.12–7.18, §9.10–9.14, §10.8 y §20 con los cambios; v3.0: navegación clásica y hero split con partículas-glifo según el prototipo aprobado `ref/hero-lab-3/`; se retira el shell IDE-lite; §3, §3.6, §3.7, §4.1 reescritos, resto ajustado, §19 con los cambios; v2.1: alineada con el esquema real de Supabase, diseño técnico v1.1 §0 H1–H8 y §3.3; v2.0: shell IDE-lite, hero de presentación, textos con hechos; v1.1 validada con `usuario-ejemplo`, §16) · **Perfil:** web · **Spec:** `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` (v1.5) · **Precios:** `Comercial/tarifas.md` (v2, vigencia 2026-09-14) · **Voz:** `Comercial/voz.md`.

Este documento describe todas las pantallas, subpantallas, componentes, estados, páginas de error, flujos y textos de interfaz de josecoded v1, para que `ui` defina el sistema visual y el `arquitecto` escriba el plan sin adivinar. Respeta las decisiones de §11, §12 (D16) y §13 (D18–D26) de la spec y la decisión del hero del 2026-09-19 (`ESTADO.md`); no las reabre.

Convenciones:
- **Mobile-first.** Cada wireframe es la vista móvil (≈ 390 px); la nota "Escritorio" indica cómo se reorganiza a partir de ≈ 1024 px.
- **Una acción primaria por pantalla**, marcada como `[[ Primaria ]]`. Secundarias como `[ Secundaria ]`. Enlaces como `> enlace`.
- **Sin fotos** (salvo la decisión abierta del retrato, §13.4) **y sin decoración generativa fuera del lenguaje del hero.** La única "decoración" es la escena de partículas-glifo del hero y sus miniaturas (§3.7, §4.1), más el fondo fijo de grano y rayo. Sin retículas, sin parallax. El motion se limita a cinco recursos con sentido técnico (§3.7). Los bloques marcados `== bloque ==` son secciones de scroll con `CompileReveal` en su `h2`.
- **Navegación clásica** (§3): cabecera fija con cinco enlaces + Entrar + Contacto, hoja "Menú" en móvil, pie común. Los wireframes de §4 muestran la línea `(cabecera)` como abreviatura de la cabecera de §3.2.
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
| M1 | Entender en menos de un minuto qué le harían, desde cuánto y si Jose es de fiar | En la home ve quién es Jose (hero), "desde 900 €" en la franja de prueba y el panel "Webs para tu negocio: 4 packs, de 900 a 4.200 €"; en `/negocios` ve los cuatro precios "desde" antes del segundo scroll |
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
No es audiencia, pero usa `/admin` a diario desde móvil y escritorio. Radar (§7.12–7.17) lo trabaja sobre todo en escritorio (revisar material, plataformas, perfil) y **decide desde el teléfono** (Telegram o el detalle en 375 px).

| # | Tarea | Éxito |
|---|---|---|
| J1 | Atender un lead nuevo en < 1 min desde el aviso de Telegram | Abre el lead desde el enlace, ve propuesta IA y afiliado, cambia el estado |
| J2 | Moderar comentarios | Aprueba o rechaza desde una lista, sin abrir el artículo |
| J3 | Gestionar clientes: tareas, assets, pack, ampliaciones | Todo en la ficha del cliente, sin saltar entre secciones |
| J4 | Cerrar un lead cobrado y abonar la recompensa al afiliado | Dos acciones explícitas con confirmación; la regla calcula el importe |
| J5 | Tomar el control de una conversación del chat | Ve la lista, entra, activa takeover y responde |
| J6 | Decidir sobre una candidatura preparada en ≤ 3 min, desde Telegram o desde admin | Ve oferta, puntuación con motivos y material tal como saldrá; confirma, pospone o descarta; sabe exactamente qué va a pasar al confirmar (enviar por API o abrir el enlace con todo listo) |
| J7 | Ver de un vistazo qué le toca, qué vence y qué ha llegado por correo | Bandeja con "Pendientes de ti", indicadores de plazo y de correo nuevo, contadores por estado; nada enviado sin su clic |
| J8 | Seguir una candidatura después de enviarla | Correos vinculados con enlace al hilo, estado que cambia solo cuando la confianza es alta (y se revierte en un clic), entrevistas propuestas que él confirma al calendario |
| J9 | Mantener el Radar: saber si cada conector funciona, pausar, añadir una plataforma, ajustar el perfil | Plataformas con última pasada y error legible; pausa global y por conector; alta de plataforma sin tocar el núcleo; umbral y exclusiones a mano |

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
| Radar: bandeja de candidaturas (filtros en la URL; hoja "Correos por revisar" `?correos=revisar`) | `/admin/radar` |
| Radar: detalle de candidatura (oferta, puntuación, materiales, decisión, calendario, correos, historial) | `/admin/radar/[id]` |
| Radar: plataformas (conectores) · alta y edición en hoja | `/admin/radar/plataformas` · `?nueva=1` · `?plataforma=[code]` |
| Radar: perfil de búsqueda y materiales base | `/admin/radar/perfil` |
| Radar: calendario (mes, semana, agenda) | `/admin/radar/calendario` |

Radar cuelga de `/admin` con una subnavegación por segmento (Bandeja · Calendario · Plataformas · Perfil) que no cuenta como nivel: admin → Radar → detalle son los tres niveles. Telegram (§7.17) no es una pantalla: cada mensaje enlaza a una de estas rutas.

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
| Radar: conector detenido, captcha, correo sin vincular, Omen apagado, Mac dormido, IA sin respuesta, acceso a Google caducado, envío fallido, oferta caducada | estados inline en `/admin/radar/*` (§7.18) | — |

---

## 3. Shell público: navegación clásica, hero split y estructura común

Decisión de Jose (2026-09-19): **hero split tipo Resend con escena de partículas-glifo y navegación clásica**. Se descarta el shell IDE-lite de v2 (árbol, pestañas, barra de título como hero minimizado, línea de estado). Prototipo aprobado: `ref/hero-lab-3/` (`index.html`, `styles.css`, `app.js`). Una sola interfaz para Marta y Dani; no se divide a las audiencias: cada bloque de la home habla a las dos.

### 3.1 Qué se conserva del IDE-lite y qué no

| Pieza de v2 | v3 | Motivo |
|---|---|---|
| Árbol del sitio | Fuera. Cabecera con cinco enlaces + Entrar + Contacto; en móvil, hoja "Menú" | Cinco secciones no necesitan árbol; Marta reconoce una cabecera normal sin aprender nada |
| Pestañas de rutas abiertas | Fuera | Solo tenían sentido dentro de la metáfora |
| Barra de título = hero minimizado | Fuera. La marca `josecoded` en la cabecera lleva a Inicio | El hero ya no se minimiza; vive solo en la home |
| Línea de estado (datos del build) | Los datos pasan al bloque "Cómo está hecha esta web" (§4.1) y a la columna "Esta web" del pie (§3.5) | Siguen siendo la única "prueba en vivo" permitida por la spec; ahora están donde Dani los busca, no en una barra permanente |
| Línea de estado móvil (Menú · Contacto · Chat) | **Fuera, sin sustituto fijo.** | Ver justificación abajo |
| Hoja "Menú" en móvil | Se conserva, sin árbol: lista plana | Es la navegación móvil normal |
| `CompileReveal`, transición de página | Se conservan, retocados (§3.7) | Encajan con el lenguaje de glifos del hero |
| `FocusLight` | Fuera. Lo sustituyen el rayo de luz estático y el grano del fondo (§3.7) | Jose rechazó el foco de luz dinámico (spec §12 R14) |
| Hero "compilar → minimizar" | Fuera. Intro de caída y aterrizaje (§3.6) | Decisión del 2026-09-19 |

**Por qué no hay barra inferior fija en móvil.** Marta gana con una acción de contacto siempre visible, y eso ya lo da la cabecera fija: `[Contacto]` está en la esquina superior derecha en todas las páginas. Una barra inferior permanente (a) quitaría 52–56 px del primer viewport en 375×667 en todas las páginas, justo donde el hero tiene que caber sin scroll; (b) colisionaría con la barra fija de `/negocios` (WhatsApp + Propuesta), que es la única barra inferior que Marta necesita y que se mantiene; (c) "Chat" exige cuenta y no es la vía de Marta (su vía es WhatsApp) ni la de Dani en móvil. **Prueba de uso para Marta (375 px):** Home → `> Una web para mi negocio →` en el hero (1) → `[[ WhatsApp ]]` en la barra fija de Negocios (2); o Home → `[Contacto]` en la cabecera (1) → `[[ Escribir por WhatsApp ]]` (2); o Home → panel "Webs para tu negocio" (1) → `[ Propuesta ]` (2). Se cumple sin barra inferior.

### 3.2 Cabecera (`SiteHeader`)

Fija arriba, 64 px de alto, en todas las páginas públicas (también en `/perfil` y en las de auth, reducida). Sobre el hero es transparente; a partir de 80 px de scroll gana fondo translúcido con desenfoque y una línea inferior de 1 px. Nunca se oculta al hacer scroll.

```
Escritorio (≥ 1024 px)
┌──────────────────────────────────────────────────────────────────────────┐
│ josecoded    Empresas  Negocios  Proyectos  Blog  Sobre mí    ES · Entrar · [Contacto] │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Marca** `josecoded` en monoespaciada (única monoespaciada de la cabecera); lleva a `/` (o `/en`). No es el nombre de Jose: el nombre va en el hero y en Sobre mí.
- **Cinco enlaces** (spec §12): Empresas · Negocios · Proyectos · Blog · Sobre mí. Etiquetas cortas; los `h1` de cada página llevan el nombre largo ("Trabajo con empresas", "Webs para tu negocio"). El enlace activo lleva `aria-current="page"` y un indicador visible además del color (subrayado o punto; lo define `ui`).
- **Derecha:** `LangSwitch` (ES/EN), `Entrar` (o avatar con menú: Mi cuenta · Área de clientes · Admin si procede · Salir) y `[Contacto]`, botón primario pequeño (38 px). Contacto es la **CTA global**; nunca compite con la primaria de cada página porque no está en el flujo de lectura.
- **Chat con el asistente** y **Área de clientes** no están en la cabecera de escritorio (spec: accesos secundarios): viven en el menú del avatar, en el pie y en las páginas donde tienen sentido (Empresas, Sobre mí, Contacto).
- Orden de tabulación: "Saltar al contenido" (oculto hasta foco) → marca → enlaces → idioma → Entrar → Contacto.

```
Móvil (< 900 px)
┌──────────────────────────────────────┐
│ josecoded          [Contacto]  Menú  │  64 px
└──────────────────────────────────────┘
```

- `[Contacto]` visible siempre (objetivo ≥ 44 px). "Menú" es un botón de texto con icono; abre `MobileMenuSheet`.
- Al hacer scroll la cabecera se queda; no se reduce (64 px es asumible, y evita saltos de layout).

```
Hoja "Menú" (móvil, pantalla completa)
┌──────────────────────────────────────┐
│ josecoded                   [Cerrar] │
│                                      │
│ Empresas                             │
│ Negocios                             │
│ Proyectos                            │
│ Blog                                 │
│ Sobre mí                             │
│ ─────────────────────────────────    │
│ [[ Contacto ]]                       │
│ Chat con el asistente                │
│ Área de clientes                     │
│ Entrar                 ES · EN       │
└──────────────────────────────────────┘
```

Lista plana, tipografía normal, sin iconos de fichero ni sangrías. Cierra con "Cerrar", Escape, deslizando o al elegir un enlace. Foco atrapado dentro; al cerrar vuelve a "Menú". El enlace de la página actual lleva `aria-current="page"`. La hoja no anima letras: entra con la transición de página (§3.7).

### 3.3 Escritorio: composición de página

```
┌──────────────────────────────────────────────────────────────────────────┐
│ cabecera fija (64 px)                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   contenido de la página: una columna de lectura (≤ 72 caracteres)      │
│   para texto; las composiciones grandes (hero, paneles de vías, packs,   │
│   proyectos) usan el ancho de 1.440 px con márgenes clamp(20px, 4vw, 56px)│
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ pie (§3.5): secciones · contacto · legal · esta web (datos del build)    │
└──────────────────────────────────────────────────────────────────────────┘
```

El fondo (`Backdrop`, §3.7) es fijo y común a todas las páginas públicas: grano fino + rayo de luz suave. El canvas de partículas solo existe en la home.

### 3.4 Móvil (375 px): composición de página

```
┌──────────────────────────────────────┐
│ josecoded          [Contacto]  Menú  │
├──────────────────────────────────────┤
│                                      │
│  contenido de la página              │
│  (una columna, 16 px de margen)      │
│                                      │
│  pie                                 │
└──────────────────────────────────────┘
```

Sin barra inferior global. La única barra inferior fija del sitio es la de `/negocios` (WhatsApp + Propuesta, §4.3).

### 3.5 Pie (`SiteFooter`)

Al final de cada página pública. Cuatro grupos (cuatro columnas en escritorio, apilados en móvil):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Secciones          Contacto              Legal            Esta web        │
│ Empresas           WhatsApp              Aviso legal      main · a1b2c3d  │
│ Negocios           {{DATO: email}}       Privacidad       publicado 19 sep│
│ Proyectos          LinkedIn              Cookies          LCP 1,1 s móvil │
│ Blog               GitHub                                 Next.js en      │
│ Sobre mí           App Store · Play                       Cloudflare      │
│ Chat con el asist.                                        Workers ·       │
│ Área de clientes                                          Supabase ·      │
│                                                           servidor propio │
│                                                           > Código en GitHub {{DATO 12}} │
│                                                           > Cómo está hecha│
│ © {{DATO: nombre}} · {{DATO: ciudad}}, España                             │
└──────────────────────────────────────────────────────────────────────────┘
```

"Esta web" es la heredera de la línea de estado: rama, commit corto, fecha de publicación y LCP medido, generados en CI (nunca en vivo), en monoespaciada. Sin newsletter, sin frases de cierre.

### 3.6 Flujo de entrada: intro de caída y aterrizaje (`IntroFall`)

Descripción del prototipo aprobado (`ref/hero-lab-3/app.js`, `playIntro`, `prepareChars`, `tickChars` y el vertex shader con `uIntroT`).

**Cuándo.** Solo en `/` y `/en`, **una vez por sesión de navegador**: clave `sessionStorage.intro_seen = '1'`, escrita al arrancar la intro. Si la clave existe, si se entra por una ruta interior, o si `prefers-reduced-motion: reduce`, no hay intro. `?intro=1` la fuerza (QA y Jose). Si `sessionStorage` no está disponible, la intro se reproduce en cada carga de `/` (coste: 1,2 s), nunca en rutas interiores.

**Qué cae.** Todo el texto visible del primer viewport: marca y enlaces de la cabecera, `Entrar`/`Contacto`, badge, título, subtítulo y los dos CTA. Cada carácter se envuelve en un `span` (las palabras se mantienen indivisibles con un `span.w` para que el salto de línea no cambie). Fondos y bordes de badge y botones están apagados (`is-forming`) hasta que aterriza su último carácter.

**Cómo cae.** Cada carácter arranca entre 0,35 y 1,10 alturas de viewport por encima de su sitio y cae a velocidad constante para **aterrizar entre 0,4 y 1,2 s** (tiempo de aterrizaje por carácter: 0,4 + aleatorio × 0,8). Mientras cae muestra glifos de código aleatorios (`{}[]()<>=;:/*+-_$#@!?&|0-9a-z`) en color de acento al 80 %, cambiando de glifo en ~30 % de los frames; al aterrizar destella en verde con halo (`is-wet`, 0,14–0,30 s) y se fija su letra definitiva. Nada rebota ni se pasa de sitio.

**Partículas.** En el mismo instante, las 5.000 (móvil) o 9.000 (escritorio) partículas-glifo de la escena caen desde arriba con la misma regla (cada una aterriza entre 0,4 y 1,2 s; cabeza brillante durante la caída y destello al clavarse). Durante los primeros 1,5 s la escena mantiene el estado "móvil"; el ciclo de morph (§3.7) empieza después. El canvas entra con opacidad 0 → 1 en 1 s. **Solo donde hay escena viva** (escritorio; móvil únicamente con `HERO_LIVE_MOBILE`, §4.1): con vídeo o poster la intro es **reducida** (caen solo las letras; §4.1, "Intro reducida").

**Línea temporal (idéntica en móvil y escritorio):**

| t | Qué se ve |
|---|---|
| 0 ms | Página pintada con su layout final; caracteres y partículas fuera de pantalla (arriba). Fondo (grano + rayo) ya visible. Sin salto de layout: cada carácter ocupa su sitio desde 0 ms (solo se transforma). |
| 0–400 ms | Lluvia: primeros caracteres y partículas cruzando el viewport. Nada legible todavía. |
| 400–1.200 ms | Aterrizajes escalonados con destellos verdes; el título y los CTA se vuelven legibles según aterrizan; badge y botones recuperan fondo al completarse. |
| ≈ 1.500 ms | Estado final. Empieza el ciclo de la escena (hold 3,5 s → morph 1,6 s). |

**Saltar.** Cualquier tecla (incluida Tab), clic, toque o scroll durante la intro lleva al estado final en ≤ 200 ms (todos los caracteres a su letra, partículas a su sitio). No hay enlace "Saltar" visible: la intro dura 1,2 s y el "Saltar al contenido" de la cabecera cumple esa función (es el primer elemento enfocable).

**Visitas siguientes en la misma sesión (y rutas interiores).** Sin intro: texto en su sitio desde el primer frame; la escena aparece con el fundido de 1 s y empieza directamente en el ciclo de morph. Cerrar el navegador (nueva sesión) vuelve a mostrarla.

**`prefers-reduced-motion`.** Estado final directo: sin caída, sin canvas, sin vídeo. La columna muestra el **poster estático** de la escena (estado "móvil", generado en build a partir de la misma nube; `HeroMedia`, §4.1). Sin respiración ni ondas. Se escribe `intro_seen` igual.

**Sin WebGL, `deviceMemory < 4` o móvil por defecto (D16).** Vídeo en bucle con poster de la misma escena (`HeroMedia`, §4.1) e intro reducida (solo letras). **Con `saveData`:** solo el poster, sin descargar el vídeo, e intro reducida. **Sin JS:** poster y sin intro. Nunca una columna vacía.

**Accesibilidad.** Los `span` de caracteres van en un contenedor `aria-hidden="true"`; cada elemento animado (h1, p, a, button) lleva su texto real en un `span` visualmente oculto (o `aria-label`), así el lector de pantalla lee el texto final desde 0 ms y nunca los glifos intermedios. El `h1` es un solo elemento. Los botones son enfocables desde 0 ms. La escena lleva `aria-label` descriptivo ("Partículas de código que forman un móvil, una web y un chip de IA") y `role="img"`.

**Eventos.** `intro_played {skipped: bool, reduced: bool}`.

### 3.7 Vocabulario de motion (para toda la web)

Cinco recursos, todos derivados del hero, todos con `prefers-reduced-motion` resuelto. Prohibido: retícula decorativa (existe en el prototipo, queda apagada), deriva de brillo (apagada), parallax de fondo, gradientes animados, inclinaciones o escalas al hover.

| Recurso | Qué es | Dónde | Reduced motion |
|---|---|---|---|
| **Caída y aterrizaje** (`IntroFall`) | §3.6: caracteres y partículas caen y se clavan con destello verde | Solo en la intro de la home, una vez por sesión | Sin intro |
| **Morph de partículas** (`GlyphScene`) | Nube de 5.000/9.000 glifos de código (JetBrains Mono, morado con un 14 % de verdes) que cicla **móvil → web → chip IA** (chip con cerebro de nodos dentro): hold 3,5 s, morph 1,6 s con dispersión 0,6 y desfase por partícula (la transición "recorre" la nube). Rotación lenta continua (0,18 rad/s); el chip se queda de frente con un vaivén suave. Arrastre con el puntero para girar (inercia); paralaje leve siguiendo el puntero (0,25 / 0,18 rad). Etiqueta monoespaciada "móvil · web · IA · chip" bajo la escena con el estado activo en verde | Hero de la home en escritorio (en móvil, vídeo/poster de la misma escena, §4.1); miniaturas en los paneles de vías (§4.1, solo escritorio) | Poster estático |
| **Respiración y ondas de código** | Respiración: escala ±2,5 % a 1,25 rad/s. Ondas: un 28 % de las partículas, en tres fases, se expanden desde la forma y se desvanecen (periodo 4 s, amplitud 0,6). Es el "código que se sobreescribe lento" que pedía la spec, llevado a la escena | Hero y miniaturas | Fuera |
| `CompileReveal` (v3) | El `h2` de cada bloque entra con sus letras como glifos de código que se resuelven de izquierda a derecha a la letra definitiva, con el mismo destello verde del aterrizaje, en ≤ 300 ms, una vez, al entrar en viewport. **Sin caída**: la caída es solo de la intro | Home y páginas públicas; no en área, admin ni auth | El `h2` aparece sin animación |
| Transición de página | El contenido saliente se atenúa 120 ms; el entrante sube 8 px y aparece en 160 ms. La cabecera no se mueve. La hoja "Menú" usa la misma curva | Público | Cambio directo |

**Fondo (`Backdrop`), sustituto de `FocusLight`:** dos capas fijas, comunes a todas las páginas públicas y sin scroll-driven: **grano fino** (ruido SVG, 180 px, opacidad 3,5 %, `mix-blend-mode: overlay`) y **rayo de luz** (gradiente lineal a 214°, anchura 14 %, desenfoque 48 px, opacidad 10 %, enmascarado para desvanecerse en el 55 % inferior). Además, dos radiales suaves de acento (arriba a la derecha) y verde (abajo a la izquierda) en el `body`. Nada de esto se mueve.

**Detalle microscópico (hover, foco, pulsación).** El puntero solo resalta: borde y halo de acento en badge, botones y paneles (`box-shadow` inset 1 px + halo), texto secundario que sube a texto pleno, `translateY(1px)` al pulsar. En los paneles de vías, el hover o el foco adelantan un morph de su miniatura (§4.1). Nada cambia de significado con el hover.

"El scroll explica, el puntero solo resalta" se mantiene: el scroll revela en orden de lectura (`CompileReveal`), el puntero da feedback local.

**Presupuesto (spec §12 D16).** CWV en verde en móvil 4G (spec §1). Reglas: el HTML del hero (texto, badge, CTA y, en móvil, el poster) se sirve estático y es el LCP; Three.js se importa en diferido tras el LCP (`import()` en idle, chunk con `preload`), una sola instancia de WebGL por página; bundle de la escena ≤ 200 KB gz fuera del camino crítico y JS de la home ≤ 350 KB gz sin la escena; en móvil, sin WebGL, con `deviceMemory < 4`, `saveData` o `prefers-reduced-motion`, vídeo/poster según la tabla de §4.1; la escena y el vídeo se pausan fuera del viewport y con la pestaña oculta; las miniaturas de §4.1 comparten renderer o se sirven como imagen. La escena viva en móvil solo se activa si la tarea de medición del plan demuestra CWV en verde en 4G con ella (`HERO_LIVE_MOBILE`).

### 3.8 Shell del área de clientes

Sin cambios respecto a v1.1: cabecera reducida + barra inferior (Proyecto · Tareas · Material · Pack · Recomiéndame) en móvil; barra lateral en escritorio. La barra inferior del área es legítima porque el área es una app con cinco secciones de uso repetido; la web pública no la necesita (§3.1). `ui` alinea su aspecto con la cabecera pública.

### 3.9 Shell del admin

Barra lateral con contadores en escritorio: Resumen · Leads · **Radar** (pendientes de ti) · Comentarios · Clientes · Ampliaciones · Afiliados · Chat. En móvil, barra inferior **Leads · Radar · Clientes · Más** (Más: Resumen, Comentarios, Ampliaciones, Afiliados, Chat). Cambio respecto a v1.1: Radar entra en la barra móvil y Chat pasa a "Más", porque decidir candidaturas es diario y el takeover del chat es ocasional (§14). Dentro de Radar, subnavegación por segmento (Bandeja · Calendario · Plataformas · Perfil) bajo el título, común a §7.12–7.16; no es un nivel de navegación. El detalle de candidatura en móvil lleva una barra de decisión fija abajo (§7.13), legítima porque el admin es una app de trabajo y la barra solo existe en esa pantalla.

### 3.10 Componentes transversales (catálogo)

| Componente | Uso | Notas para `ui` |
|---|---|---|
| `SiteHeader` | Cabecera fija: marca, cinco enlaces, idioma, Entrar/avatar, Contacto | Transparente sobre el hero; fondo translúcido tras 80 px |
| `MobileMenuSheet` | Hoja "Menú" a pantalla completa (< 900 px) | Lista plana; foco atrapado |
| `SiteFooter` | Pie de cuatro grupos, con "Esta web" (datos del build) | Monoespaciada permitida en "Esta web" |
| `Backdrop` | Grano + rayo de luz fijos (§3.7) | Sustituye a `FocusLight`; parámetros del prototipo |
| `HeroSplit` | Hero de la home: badge, título, subtítulo, CTA + enlace; escena a la derecha | §4.1; prototipo `hero-lab-3` |
| `GlyphScene` | Escena Three.js de partículas-glifo con morph, respiración y ondas | Parámetros del prototipo; `HeroMedia` como respaldo (D16) |
| `HeroMedia` | Respaldo de la escena: vídeo en bucle (≤ 400 KB, sin audio, `muted playsinline loop`, con `poster`) o poster estático (≤ 60 KB), renderizados en build desde la misma nube, en la misma caja que `GlyphScene` | Por defecto en móvil, sin WebGL y con `deviceMemory < 4`; solo poster con `saveData`, `prefers-reduced-motion` o sin JS (§4.1); etiqueta de estado sincronizable con `currentTime` |
| `IntroFall` | Intro de caída y aterrizaje (§3.6) | Una vez por sesión; `sessionStorage.intro_seen` |
| `ProofStrip` | Franja de hechos verificables bajo el hero (§4.1) | Datos de build o `{{DATO}}`; nunca inventados |
| `PathPanel` | Panel interactivo de vía (Empresas / Negocios): título, tres hechos, enlace principal, enlace secundario, miniatura de escena | El panel entero es enlace; el secundario es un enlace independiente por encima |
| `BuildFacts` | Bloque "Cómo está hecha esta web": esquema de arquitectura en texto + datos del build | Heredero de la línea de estado |
| `CompileReveal`, `PageTransition` | Motion (§3.7) | Parámetros por `ui` |
| `FactList` | Lista de hechos verificables (tres a cinco líneas, cada una con su prueba o enlace) | Sustituye a los párrafos de presentación |
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
| `RadarSubnav` | Segmento Bandeja · Calendario · Plataformas · Perfil bajo el título de Radar, con contador en Bandeja | No es navegación de nivel; `aria-current` |
| `RadarPauseSwitch` | Interruptor "Radar activo / En pausa hasta el {fecha}" con modal de pausa: duración rápida (3 días · 1 semana · 2 semanas · Fecha · Sin fecha) y reanudación automática (§9.14) | Visible en bandeja, plataformas y perfil |
| `RadarAlerts` | Banners apilados con una acción cada uno: conector detenido, correos por clasificar, plazos < 24 h, Omen sin respuesta, Google caducado, Telegram sin entregar (§7.18) | Nunca más de tres visibles; el resto plegado en "y {n} más" |
| `StatusCounters` | Chips-contador por estado que filtran la bandeja; siempre con número | "Pendientes de ti" primero y destacado |
| `ScoreBadge` | Puntuación 0–100 + tramo con texto (alto ≥ 80 · medio 60–79 · bajo < 60) | Nunca solo color; tamaño grande en el detalle |
| `DeadlineTag` | "Vence en 2 d" · "Vence hoy" · "Vence en 5 h" · "Caducada" · "Sin plazo" | Ámbar < 48 h, rojo < 24 h, siempre con texto |
| `MailTag` | "1 correo nuevo" · "Correo por clasificar" | Se apaga al abrir el detalle |
| `RadarRow` / `RadarCard` | Fila (escritorio) o tarjeta (móvil) de candidatura con acciones rápidas | Acciones ≥ 44 px en móvil |
| `ConfirmSendModal` | Confirmación con lo que va a pasar exactamente (enviar por API con qué material, o abrir enlace) | Mismo modal en bandeja, detalle y flujo asistido |
| `SnoozeSheet`, `DiscardSheet` | Posponer (Mañana · 3 días · Lunes · Fecha) y descartar con motivo (chips) | Deshacer en toast 10 s |
| `ScoreReasons` | Motivos con signo y peso, reglas aplicadas, versión de perfil y modelo | Texto llano, sin barras decorativas |
| `MaterialEditor` | Pestañas CV · Carta/Propuesta · Formulario · Respuestas; editor Markdown + previsualización; versiones; control de plantilla (referencias concretas resaltadas); Regenerar, Copiar, Descargar PDF, Guardar; en móvil, acción recomendada "Editar en el portátil" | Escritorio lado a lado; móvil editor con previsualización plegable debajo (§13.17) |
| `FormPayloadTable` | Tabla campo → valor editable del formulario prellenado; obligatorios y vacíos marcados | Campos sin mapear al final |
| `DecisionCard` | Bloque de decisión por estado: texto de consecuencia + primaria; en móvil, barra fija inferior | Una sola primaria |
| `EventProposalCard` | Evento propuesto (discontinuo) o confirmado, con crear/editar/descartar y enlace a Google | Crear = confirmar (D23) |
| `EmailList`, `LinkEmailSheet` | Correos vinculados (clasificación, confianza, enlace al hilo) y hoja para vincular a mano (§9.12) | Solo asunto y extracto; nunca el cuerpo |
| `EventTimeline` | Historial de `radar_application_events` con "No era esto" en transiciones de correo o regla | Errores plegables |
| `ConnectorCard`, `ConnectorSheet`, `SecretRef` | Tarjeta de plataforma (estado, última pasada, límites, acciones), hoja de alta/edición, referencia a un secreto (nombre, dónde vive, configurado/falta; nunca el valor) | §7.14 |
| `ProfileView` | Perfil de búsqueda en solo lectura desde `profile.json` + ajustes rápidos editables (umbral, exclusiones, disponibilidad) | §7.15 |
| `RadarCalendar` | Mes · Semana · Agenda con entrevistas, llamadas, plazos, seguimientos y propuestos | Agenda por defecto en móvil (§13.18) |

---

## 4. Pantallas públicas

Formato por pantalla: objetivo · jerarquía · componentes · acción primaria única · secundarias · estados · wireframe móvil · escritorio · eventos. Todas las páginas públicas comparten `SiteHeader`, `Backdrop` y `SiteFooter` (§3); el `GlyphScene` solo existe en la home.

### 4.1 Home `/` (Inicio)

**Objetivo:** que sin scroll se entienda quién es Jose, qué hace y cómo hablar con él (spec §1), y que con scroll cada audiencia encuentre su vía sin que la página se parta en dos. Marta: vía Negocios y WhatsApp en dos toques. Dani: proyectos verificables, cómo está hecha esta web, cómo trabaja Jose.

**Jerarquía (orden de bloques):**

| # | Bloque | Para quién | Por qué va aquí |
|---|---|---|---|
| 1 | Hero split (`HeroSplit` + `GlyphScene`) | Ambas | Tesis, nombre, dos salidas (Proyectos / Una web para mi negocio) |
| 2 | Franja de prueba real (`ProofStrip`) | Ambas | Cinco hechos verificables antes de cualquier explicación |
| 3 | Dos vías (`PathPanel` × 2) | Ambas, cada una con su panel | La spec pide "dos vías con el mismo peso"; el hero las apunta, aquí se explican |
| 4 | Proyectos (`ProjectCard` × 3) | Dani primero, Marta como prueba | Lo que existe y se puede comprobar |
| 5 | Cómo está hecha esta web (`BuildFacts`) | Dani; Marta lee "esta web la he hecho yo" | Demostración con la propia web (spec §1 A) |
| 6 | Último artículo (`PostCard`) | Dani | Señal de actividad |
| 7 | Contacto + "Quién te responde" | Ambas | Cierre con las dos vías y una cara real antes de escribir |
| 8 | Pie | — | §3.5 |

Todos los bloques comparten el lenguaje del hero: mismo fondo (grano + rayo), `h2` con `CompileReveal`, superficies con borde fino y halo de acento al hover, monoespaciada solo en etiquetas cortas (`proof`, `estado de la escena`, datos del build). **Nada de "índice de secciones"**: la navegación es la cabecera; los bloques son contenido.

**Acción primaria:** `[[ Ver proyectos ]]` en el hero (única primaria de la página). El resto son secundarias o enlaces: `> Una web para mi negocio →` (hero), badge "Disponible para proyectos" (→ `/contacto`), enlaces de cada panel, `[ Ver todos ]`, `[ Escribir por WhatsApp ]` y `[ Reservar 20 min ]` en el cierre.

#### Bloque 1 — Hero split

Contenido (prototipo aprobado):
- **Badge** con punto verde: "Disponible para proyectos ›" → `/contacto` (hereda segmento, §4.10). Si `{{DATO: disponibilidad}}` es "no disponible", el badge dice "Agenda completa hasta {mes}" con punto ámbar y sigue enlazando a Contacto; si Jose no quiere mostrarlo, el badge no se renderiza y el título sube.
- **Título** (`h1`): `{{DATO: nombre a mostrar}}` (el prototipo usa "Jose Carlos Sánchez" en dos líneas).
- **Subtítulo:** "Desarrollador full-stack. Apps móviles, webs y sistemas con IA que se publican y se usan. React Native, Next.js, TypeScript, Supabase." (≤ 48 caracteres por línea; 3 líneas en móvil).
- **CTA:** `[[ Ver proyectos ]]` → `/proyectos`; `> Una web para mi negocio →` → `/negocios`. Los dos con el mismo alto de línea; el segundo es enlace de texto, no botón, para que solo haya una primaria y aun así Marta lo vea al lado.
- **Escena** (`GlyphScene`) **y su respaldo** (`HeroMedia`, spec §12 D16): en escritorio, columna derecha cuadrada (≤ 78 svh) con la escena viva. En móvil la columna va **encima** del texto, con altura máxima 38 svh (el prototipo usa 52; se reduce para que título y CTA queden por encima del pliegue en 375×667; presupuesto abajo) y **por defecto muestra un vídeo en bucle o el poster de la misma escena**, no la escena viva. La etiqueta "móvil · web · IA · chip" del prototipo es **interna** (sirve para afinar la escena) y **no se muestra en producción**; como mucho, un indicador sin palabras (tres puntos o una línea de progreso del ciclo) que `ui` decide (§13.3); Marta no debe leer "chip" bajo una animación (§16.4). La escena viva se arrastra con el puntero (en móvil, si se activa, el arrastre horizontal gira y el vertical hace scroll); el vídeo y el poster no se arrastran.

Intro y estados de la escena: §3.6 y §3.7.

**Qué muestra la columna de escena según el dispositivo (D16):**

| Condición | Columna de escena | Intro (primera visita de sesión) |
|---|---|---|
| Escritorio con WebGL, sin `prefers-reduced-motion`, sin `saveData`, `deviceMemory ≥ 4` | Escena viva (9.000 partículas) | Completa: letras + partículas (§3.6) |
| **Móvil (< 900 px), por defecto** | **Vídeo en bucle con poster** | **Reducida: solo letras** |
| Sin WebGL (cualquier tamaño) | Vídeo con poster | Reducida |
| `deviceMemory < 4` | Vídeo con poster | Reducida |
| `saveData` | Poster (no se descarga el vídeo) | Reducida |
| `prefers-reduced-motion` | Poster | Ninguna |
| Sin JS | Poster | Ninguna |
| Móvil con `HERO_LIVE_MOBILE` activo y el resto de condiciones de escritorio | Escena viva (5.000 partículas) | Completa |

- **Vídeo:** ≤ 400 KB, sin audio, `muted playsinline loop autoplay`, `preload="none"`; generado en build desde la misma nube con el ciclo completo (móvil → web → chip IA con respiración y ondas; 15,3 s = 3 × (3,5 + 1,6) s) para que el bucle no salte. **Poster:** fotograma del estado "móvil", ≤ 60 KB (AVIF con respaldo WebP), en el HTML estático con `fetchpriority="high"` y `preload`; en móvil es, junto con el título, candidato a LCP y se pinta en el primer render. El vídeo se carga tras el LCP (`load()` en idle) y sustituye al poster **sin fundido** en cuanto puede reproducirse; se pausa fuera del viewport y con la pestaña oculta.
- **Sin salto de layout:** la columna reserva `aspect-ratio: 1 / 1` y su alto máximo desde el HTML; poster, vídeo y canvas ocupan exactamente la misma caja.
- **Indicador de estado (si `ui` lo mantiene, sin palabras):** con vídeo, se sincroniza con `currentTime` según los tiempos del ciclo; con poster, fijo en el primer estado; sin JS, no se pinta. La etiqueta con texto del prototipo queda solo en `ref/hero-lab-3/`.
- **Accesibilidad:** poster con `role="img"` y el mismo `aria-label` que la escena; vídeo con `aria-label`, sin controles y sin `autoplay` bajo `prefers-reduced-motion`; el texto del hero nunca depende de la columna.
- **`HERO_LIVE_MOBILE`:** flag que solo se activa si la tarea de medición del plan demuestra CWV en verde en 4G con la escena viva en móvil; hasta entonces, móvil = vídeo/poster.

**Layout móvil del split (375 px).** Orden: columna de escena (`order: -1`) → badge → título → subtítulo → fila de CTA. Presupuesto vertical hasta el pliegue en 375×667, con los márgenes del prototipo ajustados para móvil:

| Pieza | Alto |
|---|---|
| Cabecera fija + margen superior del hero | 88 px |
| Columna de escena (≤ 38 svh; cuadrada, 253 × 253) con la etiqueta dentro | 253 px |
| Separación | 24 px |
| Badge | 34 px |
| Título `h1` (2 líneas a 41 px × 0,98) + margen superior 20 px | 100 px |
| Subtítulo (3 líneas × 24 px) + margen 16 px | 88 px |
| Fila de CTA (botón 50 px) + margen 24 px | 74 px |
| **Total** | **661 px ≤ 667** |

Reglas: `[[ Ver proyectos ]]` y `> Una web para mi negocio →` van **en la misma fila** en móvil (botón con padding horizontal 20 px ≈ 140 px; enlace a 14 px ≈ 175 px; gap 16 px; caben en 343 px), así la salida de Marta queda sobre el pliegue. Si el nombre a mostrar (§18, dato 1) ocupa tres líneas o el idioma alarga los textos, el enlace baja de línea y la columna de escena se reduce a **34 svh** en alturas ≤ 700 px (`@media (max-height: 700px)`) para que la fila de CTA siga por encima del pliegue. `ui` lo verifica en 375×667 y 390×844 (§13.3).

**Alternativas de titular y CTA para Jose (§16.4, M7; no se cambia nada hasta que decida).** `usuario-ejemplo` como Marta señala que el subtítulo actual habla a Dani (nombres de tecnologías) y que `[[ Ver proyectos ]]` domina sobre su salida. Es decisión de Jose (§13.20); `ux` deja dos opciones listas, ambas dentro del presupuesto vertical de arriba:

**(A) Dos CTA con el mismo peso.** Texto como ahora; `[[ Ver proyectos ]]` y `[[ Una web para mi negocio ]]` como dos botones iguales (mismo tamaño y estilo, el segundo sin relleno pero con borde). Rompe la regla "una primaria por pantalla" de forma deliberada: la spec pide dos vías con el mismo peso y el hero es la única pantalla donde las dos audiencias llegan a la vez. En móvil, apilados (50 + 12 + 50 px → +38 px sobre el presupuesto: se compensa con la columna de escena a 34 svh en alturas ≤ 700 px).

```
(A) Móvil 375 px
│      (vídeo/poster de la escena)     │ ≤ 34 svh si alto ≤ 700
│  (● Disponible para proyectos ›)     │
│  Jose Carlos                         │
│  Sánchez                             │
│  Desarrollador full-stack. Apps      │
│  móviles, webs y sistemas con IA que │
│  se publican y se usan. React Native,│
│  Next.js, TypeScript, Supabase.      │
│  [[ Ver proyectos ]]                 │
│  [[ Una web para mi negocio ]]       │ ← mismo peso, con borde
```

**(B) Subtítulo para las dos audiencias, CTA como ahora.** Subtítulo sin nombres de tecnologías, una frase por audiencia (≤ 48 caracteres por línea, 3 líneas): "Hago apps y webs que se publican y se usan. Para empresas: desarrollo web, móvil e IA. Para tu negocio: una web con precio cerrado." Las tecnologías bajan a la franja de prueba y a `/empresas`, donde Dani las busca. CTA `[[ Ver proyectos ]]` + `> Una web para mi negocio →` en la misma fila, como ahora.

```
(B) Móvil 375 px
│      (vídeo/poster de la escena)     │ ≤ 38 svh
│  (● Disponible para proyectos ›)     │
│  Jose Carlos                         │
│  Sánchez                             │
│  Hago apps y webs que se publican y  │
│  se usan. Para empresas: web, móvil e│
│  IA. Para tu negocio: una web con    │
│  precio cerrado.                     │
│  [[ Ver proyectos ]] Una web para mi │
│                      negocio →       │
```

Recomendación de `ux`: **B**, porque resuelve la fricción de Marta sin dos primarias y mantiene el prototipo aprobado; A solo si Jose quiere que Marta vea un botón. Se puede combinar (B + A). El texto de B es una propuesta; la frase final la fija `redactor` con `voz.md`.

**Intro reducida (móvil sin escena viva, primera visita de sesión).** Caen solo las letras del primer viewport (cabecera, badge, título, subtítulo, CTA) con las mismas reglas de §3.6: aterrizan entre 0,4 y 1,2 s, muestran glifos de código mientras caen, destellan en verde al fijarse y cualquier toque, tecla o scroll las lleva al estado final en ≤ 200 ms. El poster o el vídeo está visible desde 0 ms y no participa: sin lluvia de partículas y sin fundido del canvas; a 1,2 s la composición está completa (no hay espera de 1,5 s ni ciclo que arrancar, salvo el propio bucle del vídeo). Se escribe `intro_seen` igual. Con `prefers-reduced-motion` no hay intro reducida.

Descartado: un vídeo que incluya la caída de partículas en sus primeros 1,2 s (exigiría dos codificaciones o un `seek` antes de reproducir en visitas sin intro, y el poster de "partículas cayendo" perjudicaría el LCP); y un fundido del poster después de que aterricen las letras (un elemento grande que aparece a 1,6 s se convierte en el LCP y lo empeora).

#### Bloque 2 — Franja de prueba real (`ProofStrip`)

Una fila (escritorio) o rejilla 2×3 (móvil) de cinco hechos cortos, cada uno con etiqueta monoespaciada pequeña arriba y valor en tipografía de texto. Solo datos que constan; el que falte, no se pinta y la fila se reparte.

| Etiqueta | Valor | Fuente |
|---|---|---|
| apps publicadas | `{n}` en App Store y Google Play (enlace a `/proyectos?tipo=apps`) | `{{DATO 4–6}}` |
| esta web | carga en menos de 1 s (o "LCP {x} s") | LCP medido en CI |
| código público | `{n}` repos en GitHub | API GitHub en build |
| precio cerrado | webs para negocios desde 900 € | `pricing.json` |
| respuesta | en menos de 24 h laborables | `voz.md` |

Sin motion propio (entra con la página). Cada celda es enlace si tiene destino; si no, texto.

#### Bloque 3 — Dos vías (`PathPanel` × 2)

Dos paneles del mismo tamaño, lado a lado en escritorio (50/50) y apilados en móvil (Negocios primero, porque Marta entra desde el móvil; en escritorio Empresas a la izquierda, porque Dani entra desde escritorio). Cada panel: etiqueta monoespaciada arriba (`empresas` / `negocios`), título, tres hechos, enlace principal con flecha y un enlace secundario. **El panel entero es el enlace principal** (el `a` del título se extiende con un pseudoelemento); el secundario es un `a` independiente con `z-index` por encima, para no anidar enlaces. Foco visible en el panel completo.

**Miniatura de escena:** en escritorio, la esquina derecha de cada panel muestra una miniatura de partículas-glifo en su estado (Empresas: **chip IA**; Negocios: **móvil** con una web sencilla). Respiran; al hover o foco del panel hacen un morph corto hacia el siguiente estado y vuelven. Comparten renderer con el hero (una sola instancia de WebGL) o se sirven como sprite de fotogramas: lo decide `ui` con el implementador (§13.3). **En móvil, y con reduced motion, la miniatura es una imagen estática** generada en build desde la misma nube. Si no hay imagen, el panel funciona igual sin miniatura: el contenido es el texto.

```
┌ empresas ─────────────────────────┐  ┌ negocios ────────────────────────┐
│ Trabajo con empresas       [chip] │  │ Webs para tu negocio     [móvil] │
│ · Web (Next.js), móvil (React     │  │ · 4 packs, de 900 a 4.200 €,     │
│   Native) e IA integrada          │  │   sin IVA                        │
│ · 40 €/h o feature cerrada 150 €  │  │ · De 1 a 3 semanas, precio y     │
│ · {{DATO: disponibilidad}}        │  │   plazo cerrados                 │
│                                   │  │ · Dominio y hosting a tu nombre  │
│ Ver cómo trabajo →                │  │ Ver packs y precios →            │
│ > Reservar 20 min                 │  │ > Escribir por WhatsApp          │
└───────────────────────────────────┘  └──────────────────────────────────┘
```

Enlaces: Empresas → `/empresas`; secundario → `/empresas#hablamos` (abre `CalEmbed`). Negocios → `/negocios`; secundario → `wa.me` con el mensaje de origen `home` (§9.3). Evento `path_open {path: companies|business}` y `whatsapp_click {origin: home}`.

#### Bloque 4 — Proyectos

`h2` "Proyectos" + una línea: "Apps y webs con enlace a stores, web o código." + `ProjectCard` × 3 ordenadas por número de pruebas verificables (§4.5; 3catinfo nunca la primera) + `[ Ver todos ]`. Tarjetas en tres columnas (escritorio) o una (móvil); la captura va en marco de móvil y, en escritorio, hace scroll al pasar el puntero. Sin proyectos con pruebas → el bloque no se renderiza.

#### Bloque 5 — Cómo está hecha esta web (`BuildFacts`)

`h2` "Cómo está hecha esta web" + dos columnas en escritorio (esquema | hechos), una en móvil (esquema arriba).

**Esquema de arquitectura en texto** (cuatro nodos, monoespaciada, sin gráficos decorativos):

```
navegador ──▶ Cloudflare Workers (Next.js, OpenNext)
                  │
                  ├─▶ gateway Hono (api.josecoded.com, {n} rutas)
                  │       ├─▶ Supabase (Postgres + Auth, {n} tablas, {n} RLS)
                  │       └─▶ servidor propio (Fastify: IA, n8n, storage)
                  └─▶ Umami (analítica sin cookies)
```

**Hechos** (`FactList`, datos generados en CI; si falta uno, la build falla, nunca placeholders): Next.js {v} en Cloudflare Workers · Gateway Hono con {n} rutas · Backend Fastify en servidor propio · Supabase: {n} tablas, {n} políticas RLS · {n} tests (Vitest, Playwright) · Lighthouse {score} · LCP {lcp} s · INP {inp} ms, medidos en build · rama `{rama}` · commit `{commit}` · publicado {fecha}. Enlaces: `> Leer cómo está hecha` (artículo del blog) y `> Código en GitHub` (`{{DATO 12}}`, solo si el repo es público).

Para Marta, una frase antes del esquema: "Esta web la he hecho yo con las mismas herramientas que uso en los proyectos." (hecho, no promesa).

#### Bloque 6 — Último artículo

`h2` "Último artículo" + un `PostCard` + `> Ver el blog`. Solo si hay al menos un artículo en el idioma; si no, el bloque no se renderiza (nunca "próximamente").

#### Bloque 7 — Contacto y "Quién te responde"

`h2` "Hablamos" + dos columnas en escritorio, apiladas en móvil:
- **Vías:** `[ Escribir por WhatsApp ]` (secundaria fuerte; para Marta) y `[ Reservar 20 min ]` (para Dani), `> Formulario` (`/contacto`), `> Preguntar al asistente` (`/chat`). Texto: "Respondo en menos de 24 h laborables."
- **Quién te responde:** retrato pequeño (decisión abierta §13.4: es la única foto del sitio; si no hay foto, se omite el retrato y queda el texto) + `{{DATO: nombre}}` · Desarrollador full-stack freelance · `{{DATO: ciudad}}`, España + `> Sobre mí`.

**Estados de la página:** primera visita de la sesión → intro completa (escritorio con escena viva) o reducida (móvil, sin WebGL, `deviceMemory < 4`, `saveData`); resto → estado final. `prefers-reduced-motion` o sin JS → poster estático, sin intro, mismo contenido. La tabla de condiciones está en el bloque 1. Sin datos de build → la build falla. Sin proyectos con pruebas / sin artículos / sin `{{DATO}}` cubierto → el bloque afectado no se renderiza (spec §1). Sin conexión → la home es estática y se sirve igual; solo `RefNotice` y eventos dejan de funcionar.

```
Móvil (375 px), estado final
┌──────────────────────────────────────┐
│ josecoded          [Contacto]  Menú  │
├──────────────────────────────────────┤
│                                      │
│      (vídeo/poster de la escena;     │ ≤ 38 svh (34 si alto ≤ 700)
│       escena viva solo con flag)     │
│       (indicador sin palabras, opc.) │
│  (● Disponible para proyectos ›)     │
│  Jose Carlos                         │ h1
│  Sánchez                             │
│  Desarrollador full-stack. Apps      │
│  móviles, webs y sistemas con IA que │
│  se publican y se usan. React Native,│
│  Next.js, TypeScript, Supabase.      │
│  [[ Ver proyectos ]] Una web para mi │ ← misma fila; Marta: 1 toque
│                      negocio →       │   (≈ 661 px hasta aquí en 375×667)
├──────────────────────────────────────┤
│  apps publicadas   esta web          │ ProofStrip 2×3
│  {n} en stores     carga en < 1 s    │
│  código público    precio cerrado    │
│  {n} repos         desde 900 €       │
│  respuesta                           │
│  en < 24 h laborables                │
├──────────────────────────────────────┤
│ ┌ negocios ────────────────────────┐ │ PathPanel (Negocios primero)
│ │ Webs para tu negocio    [imagen] │ │
│ │ · 4 packs, de 900 a 4.200 €      │ │
│ │ · 1 a 3 semanas, precio cerrado  │ │
│ │ · Dominio y hosting a tu nombre  │ │
│ │ Ver packs y precios →            │ │
│ │ > Escribir por WhatsApp          │ │
│ └──────────────────────────────────┘ │
│ ┌ empresas ────────────────────────┐ │
│ │ Trabajo con empresas    [imagen] │ │
│ │ · Web, móvil e IA integrada      │ │
│ │ · 40 €/h · feature cerrada 150 € │ │
│ │ · {{DATO: disponibilidad}}       │ │
│ │ Ver cómo trabajo →               │ │
│ │ > Reservar 20 min                │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│  Proyectos                           │ h2 CompileReveal
│  Apps y webs con enlace a stores,    │
│  web o código.                       │
│  [ProjectCard 1]                     │
│  [ProjectCard 2]                     │
│  [ProjectCard 3]                     │
│  [ Ver todos ]                       │
├──────────────────────────────────────┤
│  Cómo está hecha esta web            │
│  Esta web la he hecho yo con las     │
│  mismas herramientas que uso en los  │
│  proyectos.                          │
│  navegador ─▶ Workers (Next.js)      │ esquema mono
│    ├─▶ gateway Hono ({n} rutas)      │
│    │    ├─▶ Supabase ({n} tablas)    │
│    │    └─▶ servidor propio (Fastify)│
│    └─▶ Umami                         │
│  · {n} tests · LCP {x} s · INP {y} ms│
│  · main · a1b2c3d · publicado {fecha}│
│  > Leer cómo está hecha              │
│  > Código en GitHub                  │
├──────────────────────────────────────┤
│  Último artículo                     │
│  [PostCard]          > Ver el blog   │
├──────────────────────────────────────┤
│  Hablamos                            │
│  [ Escribir por WhatsApp ]           │
│  [ Reservar 20 min ]                 │
│  > Formulario  > Preguntar al asist. │
│  Respondo en menos de 24 h laborables│
│  ┌────┐ Jose Carlos Sánchez          │ Quién te responde
│  │foto│ Full-stack freelance ·       │
│  └────┘ {{DATO: ciudad}}  > Sobre mí │
├──────────────────────────────────────┤
│  pie (§3.5)                          │
└──────────────────────────────────────┘
```

```
Escritorio (≥ 1024 px), estado final
┌──────────────────────────────────────────────────────────────────────────┐
│ josecoded   Empresas Negocios Proyectos Blog Sobre mí     ES · Entrar · [Contacto] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  (● Disponible para proyectos ›)        ┌──────────────────────────────┐ │
│                                         │                              │ │
│  Jose Carlos                            │     escena de partículas     │ │
│  Sánchez                                │     (móvil → web → chip IA)  │ │
│                                         │                              │ │
│  Desarrollador full-stack. Apps         │                              │ │
│  móviles, webs y sistemas con IA que    │                              │ │
│  se publican y se usan. React Native,   │      móvil · web · IA · chip │ │
│  Next.js, TypeScript, Supabase.         └──────────────────────────────┘ │
│  [[ Ver proyectos ]]  Una web para mi negocio →                          │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  apps publicadas   esta web          código público   precio cerrado   respuesta │
│  {n} en stores     carga en < 1 s    {n} repos        desde 900 €      < 24 h lab.│
├──────────────────────────────────────────────────────────────────────────┤
│ ┌ empresas ──────────────────────┐  ┌ negocios ──────────────────────┐   │
│ │ Trabajo con empresas    (chip) │  │ Webs para tu negocio   (móvil) │   │
│ │ · Web, móvil e IA integrada    │  │ · 4 packs, 900–4.200 € sin IVA │   │
│ │ · 40 €/h · feature 150 €       │  │ · 1–3 semanas, precio cerrado  │   │
│ │ · {{DATO: disponibilidad}}     │  │ · Dominio y hosting a tu nombre│   │
│ │ Ver cómo trabajo →             │  │ Ver packs y precios →          │   │
│ │ > Reservar 20 min              │  │ > Escribir por WhatsApp        │   │
│ └────────────────────────────────┘  └────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────┤
│  Proyectos                                                               │
│  [ProjectCard 1]      [ProjectCard 2]      [ProjectCard 3]   [ Ver todos]│
├──────────────────────────────────────────────────────────────────────────┤
│  Cómo está hecha esta web                                                │
│  navegador ─▶ Workers (Next.js)          · Next.js {v} en Cloudflare     │
│    ├─▶ gateway Hono ({n} rutas)          · Gateway Hono, {n} rutas       │
│    │    ├─▶ Supabase ({n} tablas, RLS)   · Supabase: {n} tablas, {n} RLS │
│    │    └─▶ servidor propio (Fastify)    · {n} tests · Lighthouse {s}    │
│    └─▶ Umami                             · LCP {x} s · INP {y} ms        │
│                                          · main · a1b2c3d · {fecha}      │
│                                          > Leer cómo está hecha          │
│                                          > Código en GitHub              │
├──────────────────────────────────────────────────────────────────────────┤
│  Último artículo        [PostCard]                          > Ver el blog│
├──────────────────────────────────────────────────────────────────────────┤
│  Hablamos                                  ┌────┐ Jose Carlos Sánchez    │
│  [ Escribir por WhatsApp ] [ Reservar 20 ] │foto│ Full-stack freelance   │
│  > Formulario  > Preguntar al asistente    └────┘ {{DATO: ciudad}}       │
│  Respondo en menos de 24 h laborables.            > Sobre mí             │
├──────────────────────────────────────────────────────────────────────────┤
│  pie: Secciones · Contacto · Legal · Esta web                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Eventos:** `intro_played`, `path_open {path}`, `whatsapp_click {origin: home}`, `booking_open {origin: home}`, `scene_drag` (una vez por sesión, para saber si alguien toca la escena).

### 4.2 Trabajo con empresas `/empresas`

**Objetivo:** que Dani sepa qué contrata (web, móvil, IA integrada), con qué stack, cómo trabaja Jose y cómo hablar; descargar CV.

**Jerarquía:** 1) párrafo citable (quién, qué, para quién, dónde); 2) tres servicios; 3) stack y forma de trabajar; 4) pruebas (GitHub, stores, esta web); 5) preguntas frecuentes; 6) contacto: formulario/email y reserva de llamada.

**Componentes:** h1 + `FactList` citable (quién, qué, para quién, tarifa); `ServiceCard` × 3 (Web, Móvil, IA integrada: qué incluye, tecnologías reales, un proyecto de ejemplo con enlace); bloque "Cómo trabajo" (pasos: descubrimiento, propuesta con precio cerrado, iteraciones, entrega y garantía; tarifa hora 40 €/h y 150 €/feature con alcance cerrado); `GitHubActivity`; `StoreBadges`; `ProofStrip` de esta web; FAQ (acordeón, 5–7 preguntas: disponibilidad, remoto, contrato/puesto, plazos, facturación); bloque final `#hablamos` (destino del enlace secundario del panel Empresas de la home) con `[[ Reservar 20 min ]]` (`CalEmbed` en modal o inline) y `> Escribir por formulario` / `> Descargar CV`; pie.

**Acción primaria:** Reservar 20 min. **Secundarias:** formulario de contacto (`/contacto?via=empresa`), descargar CV (PDF), chat.

**Estados:** `GitHubActivity` sin datos (fallo de API en build) → no se renderiza. `CalEmbed` bloqueado o caído → botón lleva a la URL de Cal.com en nueva pestaña y texto "Si el calendario no carga, escríbeme y cuadramos hora".

```
┌──────────────────────────────────────┐
│ (cabecera)                           │
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

**Escritorio:** servicios en tres columnas; "Cómo trabajo" con pinning y pasos que se marcan como activos al hacer scroll (texto e indicador, sin foco de luz); pruebas en dos columnas (stores + GitHub); `CalEmbed` inline en el cierre, a la derecha del texto.

### 4.3 Webs para tu negocio `/negocios`

**Objetivo:** que Marta vea en el primer scroll los cuatro packs con precio "desde", entienda el proceso y elija entre generar una propuesta o escribir por WhatsApp.

**Jerarquía:** 1) párrafo citable + dos CTA; 2) cuatro packs; 3) extras; 4) proceso y condiciones; 5) ejemplos (webs de comercios); 6) preguntas; 7) cierre con WhatsApp.

**Componentes:** h1 + párrafo citable con hechos; `[[ WhatsApp ]]` + `[ Pedir propuesta orientativa ]`; `PackCard` × 4 (P1 900 € / 1 sem, P2 1.400 € / 2 sem, P3 2.500 € / 2 sem, P4 4.200 € / 3 sem; "Dominio y hosting a tu nombre", sin regalos); `ExtraCard` × 6 con nombre llano y sigla entre paréntesis (§10.2 `extras.*`): Mantenimiento básico 49 €/mes · Mantenimiento extendido 149 €/mes · Que te encuentren en Google, básico (SEO) 250 € · Que te encuentren en Google, completo (SEO) 600 € · Que te encuentren los asistentes de IA (GEO) 300 € · Revisión de seguridad de tu web 250 €; cada tarjeta lleva una línea llana de qué es; "Cómo es el proceso" (hablamos → propuesta y presupuesto → 40 / 30 / 30 → entrega y 30 días de garantía); `ProjectCard` × N (webs de comercios); FAQ (`FAQPage`: cuánto tarda, qué necesito darte, dominio y hosting, qué pasa después, se puede ampliar); **barra inferior fija en móvil** con `[[ WhatsApp ]]` y `[ Propuesta ]` (la única barra inferior fija del sitio público, §3.4; `ui` decide si se oculta al hacer scroll hacia abajo, §13.7); pie.

**Acción primaria:** WhatsApp con mensaje prellenado (spec §12). **Secundarias:** generador de propuesta; cada `PackCard` tiene `> Pedir propuesta con este pack` que abre el generador con el pack preseleccionado (`/propuesta?pack=P2`).

**Estados:** precios leídos de `pricing.json` en build; si un pack no existe en el JSON, la build falla (nunca una tarjeta sin precio). Sin ejemplos de comercios reales aún → el bloque "Ejemplos" no se renderiza (spec: nada publicado sin contenido real).

```
┌──────────────────────────────────────┐
│ (cabecera)                           │
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
│ (cabecera)                           │
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

**Escritorio:** la conversación ocupa una columna central de ancho de lectura; a la derecha, un panel fijo con el resumen de respuestas (editable) y, cuando existe, la `ProposalCard`. La cabecera se mantiene; el pie queda fuera de la vista hasta terminar (la conversación ocupa el alto del viewport).

**Eventos:** `proposal_generated` (con pack), `proposal_sent`, `whatsapp_click` (origen `proposal`).

### 4.5 Proyectos `/proyectos`

**Objetivo:** Dani verifica trabajo real; Marta ve que Jose ha hecho cosas que existen.

**Componentes:** cabecera; h1 + párrafo citable; filtro por tipo (Todos · Apps · Webs · Esta web) como chips; `ProjectCard` × N (nombre, tipo, una frase, badges de prueba: stores con valoración, "Código", "Web publicada"); pie. **Orden:** por número de pruebas verificables de cada ficha (enlace a store, web publicada, código público, valoración), calculado en build desde el frontmatter; a igualdad, el más reciente. 3catinfo, con ficha reducida por confidencialidad (solo nombre y stores), no ocupa la primera posición de la home ni de Proyectos. Qué proyectos están publicados y con qué enlaces es `{{DATO}}` (§18): HazmeFila (Expo + Supabase, primer commit junio 2026) y Oportunix (Next.js 16 + Firebase, web de mystery boxes y subastas, febrero 2026) constan en los repos, no su publicación.

**Acción primaria:** abrir una ficha (la tarjeta entera es el enlace). **Secundarias:** filtros.

**Estados:** vacío por filtro → "No hay proyectos de este tipo todavía" + `[ Ver todos ]`. Carga: estático. `StoreBadges` sin valoración (API sin datos) → solo el enlace, sin número.

```
┌──────────────────────────────────────┐
│ (cabecera)                           │
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
│ (cabecera)                           │
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
│ (cabecera)                           │
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
│ (cabecera)                           │
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

**Componentes:** cabecera y pie públicos; tarjeta de cuenta (avatar, nombre editable, email solo lectura, proveedor); idioma; enlaces a Área de clientes y Chat; `[[ Guardar ]]`; `[ Cerrar sesión ]`; zona final "Borrar cuenta" → modal de confirmación (envía solicitud; el borrado lo ejecuta Jose por la RLS de datos de cliente).

**Estados:** sin cambios → Guardar desactivado; guardado → toast "Hecho"; error → toast con reintento; sesión caducada → redirección a login con `next=/perfil`.

```
┌──────────────────────────────────────┐
│ (cabecera)                           │
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

**Escritorio:** tarjeta centrada bajo una cabecera reducida (marca, idioma y `< Volver`); sin pie completo, solo enlaces legales.

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

**Componentes:** cinco contadores con enlace: Leads nuevos · **Radar: pendientes de ti** · Comentarios pendientes · Ampliaciones pendientes · Chats sin leer; "Últimos leads" (5, con origen, pack propuesto, afiliado); "Radar hoy" (entrevistas de hoy, plazos en < 24 h, conectores con error; enlaza a §7.12); "Recompensas pendientes de abonar" (importe total y número); estado de servicios (gateway, worker de Omen `system/status`, n8n, conectores de Radar): puntos con texto "OK / Sin respuesta / {n} con error" (no es un panel de infraestructura, solo aviso operativo).

**Acción primaria:** ninguna; es un índice. **Estados:** todo a cero → "Nada pendiente"; error de un widget → el widget muestra "Sin datos" sin romper el resto.

```
┌──────────────────────────────────────┐
│ josecoded · Admin           (avatar) │
│ ┌ Leads 3 ┐ ┌ Radar 4  ┐            │
│ ┌ Coment. 2┐ ┌ Ampl. 1 ┐ ┌ Chats 1 ┐│
│  Radar hoy: entrevista 10:00 Acme ·  │
│  2 plazos · LinkedIn detenido > Ver  │
│  Últimos leads                       │
│  · Clínica García · Propuesta P2 ·   │
│    ref MARTA-7F2K · Nuevo            │
│  · …                                 │
│  Recompensas pendientes: 2 (420 €)   │
│  Servicios: gateway OK · Omen OK ·   │
│  n8n OK · Radar: 1 conector con error│
├──────────────────────────────────────┤
│ Leads Radar Clientes Más             │
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

### 7.12 Radar: bandeja `/admin/radar`

**Objetivo:** que Jose vea en un vistazo qué le toca decidir (candidaturas preparadas), qué vence y qué ha llegado por correo, y que decida desde la fila sin abrir el detalle cuando la puntuación y el resumen le bastan. Prioridad escritorio; usable en 375 px para confirmar desde el teléfono.

**Componentes:**
- Cabecera: título "Radar", `RadarPauseSwitch` ("Radar activo" / "En pausa desde el 18 sep") y línea de última actividad: "Última pasada: InfoJobs hace 2 h · Tecnoempleo hace 2 h · LinkedIn hace 3 h · Indeed hace 26 h". `RadarSubnav` (Bandeja · Calendario · Plataformas · Perfil).
- `RadarAlerts` (§7.18): conector detenido, correos por clasificar ("3 correos por clasificar" → hoja `?correos=revisar`), plazos < 24 h, Omen sin respuesta, Google caducado, Telegram sin entregar. Cada banner con una acción.
- `StatusCounters` (chips que filtran; siempre con número): **Pendientes de ti {n}** (Preparada + Por confirmar, sin las pospuestas hasta su fecha) · Descubiertas {n} · Enviadas {n} · En contacto {n} · Entrevistas {n} · Ofertas {n} · Cerradas {n} (Rechazadas + Descartadas, plegado).
- Filtros (`FilterBar`; en móvil, hoja "Filtros" con contador de activos): Tipo (Todo · Empleo · Freelance) · Plataforma (multi) · Estado (multi; por defecto oculta Cerradas) · Puntuación (Todas · ≥ 60 · ≥ 80 · Bajo umbral) · Descubierta (Hoy · 7 días · 30 días · Rango) · Con correo nuevo · Incluir pospuestas. Búsqueda por título o empresa. **Los filtros van a la URL** (`?estado=prepared&min=60&plataforma=infojobs`) para que un enlace de Telegram o del resumen abra la vista exacta.
- Ordenación: Puntuación ↓ (por defecto) · Plazo ↑ (sin plazo al final) · Más recientes · Última actividad.
- `DataTable` (escritorio) / `RadarCard` (móvil), una fila por candidatura. Las ofertas bajo umbral (sin candidatura) solo aparecen con el filtro "Bajo umbral", con `[ Preparar de todos modos ]` (spec §13.3, "Jose 'preparar' a mano"):
  - `ScoreBadge` (número + tramo con texto).
  - Título (enlace al detalle) · empresa o cliente · chips: plataforma, Empleo/Freelance, modalidad (Remoto · Híbrido · Presencial · Sin dato), salario o tarifa en formato corto ("45–55 k€", "60 €/h", "1.200 € fijo"), "Dup." si tiene `duplicate_of` (`title` con la plataforma original).
  - `StatusBadge` + subestado derivado de los eventos: "Confirmada · por marcar enviada" (asistida), "Pospuesta hasta el 22 sep", "Enviando…", "Error de envío", "Preparando…".
  - `DeadlineTag` y `MailTag`.
  - Última actividad ("hace 3 h"; `title` con fecha y hora).
  - Acciones rápidas por fila, solo en Preparada y Por confirmar: `[[ Confirmar ]]` · `[ Posponer ]` · `[ Descartar ]`. En el resto: `[ Abrir ]` y, si hay correo por clasificar, `[ Clasificar ]`. En móvil, la tarjeta muestra las acciones bajo el resumen, ≥ 44 px.
- Paginación de 25. Selección múltiple **solo** para Descartar (motivo común) y Posponer; **nunca para Confirmar** (D18: cada candidatura se confirma una a una, viéndola).

**Acción primaria:** `[[ Confirmar ]]` en las filas Preparada / Por confirmar. El título es el enlace al detalle.

**Confirmar desde la fila** (`ConfirmSendModal`, el mismo de §7.13): enseña exactamente lo que va a pasar antes de hacerlo.

```
┌ Confirmar envío ─────────────────────┐
│ Senior React Native · Acme           │
│ InfoJobs · 82/100 · vence 24 sep     │
│                                      │
│ Al confirmar se enviará por la API   │
│ de InfoJobs con:                     │
│ · CV adaptado v1 (IA, hace 3 h) → PDF│
│ · Carta v1 (IA)                      │
│ · Formulario: 8 campos, 0 sin valor  │
│ No se puede deshacer en la           │
│ plataforma.                          │
│ > Ver el material antes              │
│ [[ Confirmar y enviar ]] [ Cancelar ]│
└──────────────────────────────────────┘
```

Variante asistida (LinkedIn, Indeed, Tecnoempleo, Upwork, Workana): "Al confirmar se abrirá la oferta en {plataforma} en una pestaña nueva y el material queda listo para copiar en el detalle. Cuando la hayas enviado, márcala como enviada." → `[[ Confirmar y abrir ]]`. Con material sin guardar, campos obligatorios o "Rellénalo tú" sin valor, hechos "no consta en el CV maestro" sin aprobar o **control de plantilla en 0** (§7.13), la primaria de **envío por API** está desactivada con el motivo ("2 campos sin valor · 1 dato por confirmar · sin referencias a la oferta · > Completar en el detalle"); en modo asistido los mismos avisos se muestran pero no bloquean (Jose va a copiar el material a mano y lo ve).

**Posponer** (`SnoozeSheet`): "¿Hasta cuándo?" con chips Mañana 08:00 · 3 días · Lunes · Fecha…; aviso si el plazo vence antes ("La oferta vence el 21 sep, antes de esa fecha."). Guarda `next_action_at` y un evento (§13.19b); la fila sale de "Pendientes de ti" hasta esa fecha y ese día a las 08:00 vuelve con aviso por Telegram.

**Descartar** (`DiscardSheet`): motivo con chips No me interesa · Salario/tarifa · Presencial/zona · Ya enviada por otra vía · Duplicada · Otra (texto); con "No me interesa", casilla "No volver a mostrar ofertas de {empresa}" (alimenta las exclusiones rápidas, §7.15). Toast "Descartada." con `[ Deshacer ]` (10 s).

**Hoja "Correos por revisar"** (`?correos=revisar`): lista de `radar_emails` con `application_id` nulo o confianza < 0,8 y `reviewed_by_jose = false`: fecha, cuenta, remitente, asunto, extracto, sugerencia de la IA ("¿Acme · Senior React Native? 0,55"); por correo: selector de candidatura (búsqueda por empresa o título, con la sugerida preseleccionada), chips de clasificación (Contactado · Entrevista · Oferta · Rechazo · Info) y `[[ Vincular ]]` o `[ No es de Radar ]` (→ `unrelated`, no vuelve a aparecer). Detalle del flujo en §9.12.

**Estados:** carga → `Skeleton` de 6 filas; sin ninguna pasada → "Aún no hay ofertas. Radar hará la primera pasada a las 07:00, o ejecuta una plataforma ahora." `[ Ir a Plataformas ]`; vacío con filtros → "No hay candidaturas con estos filtros." `[ Quitar filtros ]`; "Pendientes de ti" vacío → "Nada que decidir. {n} candidaturas en curso."; Radar en pausa → banner "Radar en pausa desde el {fecha}: no rastrea ni prepara. Correo, calendario y avisos siguen." `[ Reanudar ]`; error de carga → `ErrorState`; acción fallida → la fila vuelve a su estado y toast con motivo.

```
Móvil (375 px)
┌──────────────────────────────────────┐
│ < Admin   Radar          (● activo)  │
│ (Bandeja 4) Calendario Plataf. Perfil│
│ ▲ LinkedIn detenido: verificación de │
│   seguridad.               > Ver     │
│ ▲ 3 correos por clasificar > Revisar │
│ (Pendientes de ti 4) (Descub. 12)    │
│ (Enviadas 6) (Contacto 2) (Entrev. 1)│
│ [ Filtros · 2 ]   Orden: Puntuación ▾│
│ ┌ 82 alto ─────────────────────────┐ │
│ │ Senior React Native              │ │
│ │ Acme · InfoJobs · Empleo · Remoto│ │
│ │ 45–55 k€                         │ │
│ │ Preparada · Vence en 2 d         │ │
│ │ 1 correo nuevo · hace 3 h        │ │
│ │ [[ Confirmar ]] [Posponer][Desc.]│ │
│ └──────────────────────────────────┘ │
│ ┌ 74 medio ────────────────────────┐ │
│ │ App Expo para reservas · cliente │ │
│ │ Workana · Freelance · 1.200 €    │ │
│ │ Confirmada · por marcar enviada  │ │
│ │ [[ Marcar enviada ]] [ Abrir ]   │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Leads Radar Clientes Más             │
└──────────────────────────────────────┘
```

```
Escritorio (≥ 1024 px)
┌──────────────────────────────────────────────────────────────────────────┐
│ Radar                              (● Radar activo)  Última pasada: InfoJobs 2 h · LinkedIn 3 h · Indeed 26 h │
│ (Bandeja 4)  Calendario  Plataformas  Perfil                             │
│ ▲ LinkedIn detenido: verificación de seguridad a las 07:31.   [ Ver plataforma ] │
│ ▲ 3 correos por clasificar.                                    [ Revisar ]       │
│ (Pendientes de ti 4) (Descubiertas 12) (Enviadas 6) (En contacto 2) (Entrevistas 1) (Ofertas 0) (Cerradas 9) │
│ Tipo ▾  Plataforma ▾  Estado ▾  Puntuación ≥ 60 ▾  Descubierta 7 días ▾  ☐ Con correo nuevo   Buscar [____]   Orden: Puntuación ▾ │
├────┬───────────────────────────────┬──────────┬────────┬────────────┬──────────────┬──────────────┬──────────────┬─────────────────────────┤
│ 82 │ Senior React Native · Acme    │ InfoJobs │ Empleo │ 45–55 k€   │ Preparada    │ Vence en 2 d │ 1 correo nvo │ [[Confirmar]] [Posponer] [Descartar] │
│ 79 │ Full-stack Next.js · Beta SL  │ LinkedIn │ Empleo │ 50 k€      │ Por confirmar│ Sin plazo    │ —            │ [[Confirmar]] [Posponer] [Descartar] │
│ 74 │ App Expo reservas · cliente   │ Workana  │ Freel. │ 1.200 €    │ Confirmada · por marcar │ Vence hoy │ — │ [[Marcar enviada]] [Abrir]         │
│ 71 │ Dev móvil · Gamma             │ Tecnoemp.│ Empleo │ —          │ Enviada 17 sep│ —           │ Por clasificar│ [Clasificar] [Abrir]              │
└────┴───────────────────────────────┴──────────┴────────┴────────────┴──────────────┴──────────────┴──────────────┴─────────────────────────┘
```

### 7.13 Radar: detalle de candidatura `/admin/radar/[id]`

**Objetivo:** decidir con todo a la vista (oferta, por qué puntúa así, el material tal como saldrá y qué va a pasar exactamente al confirmar) y, después, seguir la candidatura (correos, eventos, historial, notas) sin salir de la pantalla.

**Jerarquía.** Móvil: bloques apilados en este orden y barra de decisión fija abajo. Escritorio: dos columnas; izquierda (oferta, puntuación, materiales), derecha sticky (decisión, plazo y seguimiento, calendario, correos, notas); historial abajo a todo el ancho.

1. **Cabecera:** `< Radar`; título; empresa o cliente; `StatusBadge` + subestado; `ScoreBadge` grande; chips: plataforma, Empleo/Freelance, modalidad, ubicación, salario o tarifa, "publicada hace 3 d", `DeadlineTag`; `> Ver la oferta en {plataforma} ↗` (pestaña nueva); si hay duplicado: "La misma oferta está en LinkedIn · > ver".
2. **Por qué {score}/100** (`ScoreReasons`): motivos con signo y peso ("+ React Native, 4 años (pide 3)", "+ remoto", "− pide inglés C1; perfil B2", "− sector banca, no excluido"); reglas duras aplicadas (`rule_hits`); "puntuada con perfil v4 · Llama 3.3 70B · 18 sep 07:12". Acciones: `[ Repuntuar ]` (si el perfil cambió: "Perfil v5 disponible") · `[ No me interesa ]` (→ `DiscardSheet` con exclusión marcada) · `> Ajustar umbral` (§7.15).
3. **Oferta:** descripción plegada a 12 líneas con `[ Ver completa ]`; requisitos en lista; "Datos originales" plegable (`raw` recortado).
4. **Materiales** (`MaterialEditor`; pestañas: CV adaptado · Carta (empleo) o Propuesta (freelance) · Formulario (si el conector tiene `prepareForm`) · Respuestas (preguntas de texto del formulario)):
   - Barra de versión: "v2 · tú · hace 10 min" con selector de historial ("v1 · IA · hace 3 h"; cualquier versión se puede ver y restaurar como vN+1); `[ Regenerar ]` (hoja: instrucción opcional —"más corta", "destaca Supabase"—, idioma; crea vN+1 con `generated_by = ai`, no borra nada) · `[ Copiar ]` · `[ Descargar PDF ]` (CV; si el gateway no puede generarlo: "Genera el PDF desde el navegador" → vista de impresión con la misma hoja de estilos) · `[[ Guardar ]]` (vN+1, `generated_by = jose`, `approved = true`).
   - Cuerpo: editor Markdown y previsualización lado a lado (escritorio); en móvil, editor arriba y **previsualización plegable debajo** ("Ver cómo queda ▾"), no un segmento excluyente, para corregir una frase mirando el resultado. La previsualización del CV usa el mismo estilo que el PDF. ⌘S guarda; con cambios sin guardar, aviso al salir y confirmación desactivada.
   - **En móvil (≤ 900 px), acción recomendada "Editar en el portátil"** (destacada en la cabecera de Materiales, no primaria): abre `SnoozeSheet` en modo recordatorio con hora concreta (Hoy 18:00 · Mañana 09:00 · Hora…) → `next_action_at` + aviso de Telegram a esa hora con el enlace al detalle ("Te pusiste editar Senior React Native · Acme a las 18:00 → {enlace}"); la candidatura queda "Pospuesta hasta hoy 18:00 · para editar" y no sale de "Pendientes de ti" más allá de ese día. Cambios pequeños (una frase, un campo) se hacen en el móvil igual.
   - **Control de plantilla** (`TemplateCheck`, visible siempre encima del botón de guardar y en `ConfirmSendModal`): la IA marca en el material (CV adaptado, carta o propuesta) las **referencias concretas a la oferta o a la empresa** (nombre de la empresa, producto, requisito citado, sector, cifra o dato de la oferta) y las resalta en la previsualización; el control dice "{n} referencias concretas a Acme / a la oferta" con la lista. **Mínimo 2** para enviar por API; con 0 o 1, el envío por API se bloquea con el motivo ("Sin referencias concretas a la oferta: la carta parece una plantilla. Regenera con 'destaca X' o edítala.") y `[ Regenerar ]` preseleccionado; en modo asistido se avisa pero no bloquea. Jose puede marcar a mano una frase como referencia (selección → "Marcar como referencia") si la IA no la ha detectado. Las referencias a la oferta también son hechos: si citan algo que no está en la oferta, se marcan "no consta en la oferta" y bloquean igual.
   - "Qué cambió respecto al CV maestro": lista de secciones reordenadas y destacadas. La IA no inventa: cualquier hecho que no conste en el maestro aparece marcado "no consta en el CV maestro" y **bloquea la confirmación** hasta que Jose lo edite o lo apruebe con una casilla.
   - Formulario (`FormPayloadTable`): campo → valor editable; "obligatorio" y "sin valor" marcados; campos que el conector no ha podido mapear van al final bajo "Rellénalo tú"; adjuntos (CV PDF) con su versión. **Cualquier campo "Rellénalo tú" vacío bloquea el envío por API** (no solo los obligatorios): si el conector no supo mapearlo, no se sabe si la plataforma lo exige.
   - **Visto:** abrir la pestaña Materiales del detalle escribe `last_viewed_at` y la versión vista (§13.19h). Telegram solo ofrece "Confirmar" para envío por API si Jose ya vio el material y no ha cambiado desde entonces (§7.17, §9.11).
5. **Decisión** (`DecisionCard`; en móvil ≤ 900 px es una barra fija inferior con `[[ Confirmar envío ]]` · `[ Posponer ]` · `[ Descartar ]` y el contenido lleva `padding-bottom` para no quedar tapado):
   - Preparada, envío propio: "Al confirmar se enviará por la API de InfoJobs con CV v2 (PDF), carta v2 y formulario (8 campos). No se puede deshacer en la plataforma." `[[ Confirmar y enviar ]]`.
   - Preparada, asistida: "Al confirmar se abrirá la oferta en LinkedIn y el material queda listo aquí para copiar. Cuando la envíes, márcala." `[[ Confirmar y abrir ]]`. Tras confirmar: tarjeta "Confirmada a las 09:12 · por marcar enviada" con `[ Copiar carta ]` `[ Descargar CV ]` `> Abrir la oferta de nuevo` y `[[ Marcar enviada ]]` (hoja: fecha y hora, nota opcional).
   - Enviando: "Enviando por InfoJobs…" (≤ 30 s, botones desactivados). OK → "Enviada el 19 sep 09:13 · recibo 4F7Q · > Ver en InfoJobs". Error → "No se ha enviado: {motivo}. Puedes reintentar o pasar a modo asistido." `[ Reintentar ]` `[ Abrir la oferta ]`.
   - Enviada y siguientes: selector de estado manual (Contactada · Entrevista · Oferta · Rechazada) con confirmación en texto ("Marcar como Rechazada. No avisa a nadie; solo cambia el estado."); en Oferta, resultado (Aceptada · Declinada · Sin decidir); Rechazada o Descartada → `[ Reabrir ]` (vuelve a Preparada si había material; si no, a Descubierta).
   - Siempre: `DeadlineTag` editable, "Seguimiento: 26 sep" (`next_action_at`, editable) y `[ Preparar borrador de seguimiento ]` → borrador en Gmail con la voz de Jose y `> Abrir borrador en Gmail`; **nunca envía** (regla global).
6. **Calendario** (`EventProposalCard` × n): propuestos con borde discontinuo ("Entrevista técnica · jue 25 sep 10:00 · 45 min · Meet · propuesto por el correo del 19 sep") y `[[ Crear en el calendario Radar ]]` · `[ Editar ]` · `[ Descartar ]`; confirmados con `> Ver en Google Calendar` y `[ Proponer cambio ]` (edita y vuelve a pedir confirmación); `[ Nuevo evento ]` → formulario (tipo Entrevista · Llamada · Plazo; fecha, hora, duración, enlace) cuyo botón de envío es la confirmación. Nada se crea, mueve ni borra en Google sin ese clic (D23).
7. **Correos** (`EmailList`): por correo: fecha, cuenta (Gmail · Proton), remitente, asunto, extracto (≤ 500 caracteres), clasificación con confianza ("Entrevista · 0,92" / "Por clasificar · 0,55"), `> Abrir hilo` (Gmail) o referencia (Proton); acciones: chips de clasificación y `[ No era esto ]` (→ `unrelated`; si el correo provocó un cambio de estado, lo revierte con `actor = jose` y queda en el historial). `[ Vincular correo ]` → `LinkEmailSheet` (§9.12): pestañas "Buscar" (remitente o asunto, sin necesidad de ID; últimos 30 días de los correos que pasaron filtros y, si no aparece, búsqueda acotada en Gmail por `from:`/`subject:` con fecha) y "Pegar enlace" (acepta el enlace del hilo en escritorio `mail.google.com/mail/u/0/#inbox/{id}`, el enlace que comparte la app de Gmail en el móvil `mail.google.com/mail/?...#{id}` o `https://mail.google.com/mail/u/0/#all/{id}`, y un `message-id`; muestra un ejemplo del formato bajo el campo: "Ejemplo: https://mail.google.com/mail/u/0/#inbox/18f3c2…"). Marca "Nuevo" hasta que Jose abre el detalle.
8. **Notas:** textarea con guardado automático (2 s tras dejar de escribir; "Guardado 09:14").
9. **Historial** (`EventTimeline`, orden inverso): "19 sep 09:13 · Enviada por conector · recibo 4F7Q" · "19 sep 09:12 · Confirmada por Jose desde Telegram" · "18 sep 07:15 · Preparada (IA: CV v1, carta v1)" · "18 sep 07:12 · Descubierta en InfoJobs · 82/100"; las transiciones por `email` o `rule` llevan `[ No era esto ]` en la misma línea; errores (`kind = error`) con el mensaje completo plegable.

**Acción primaria (una por estado):** Confirmar (Preparada / Por confirmar) · Marcar enviada (asistida ya confirmada) · Crear en el calendario Radar (si hay evento propuesto y la candidatura ya está enviada) · ninguna en estados terminales.

**Estados:** carga → `Skeleton` por bloques; id inexistente → 404 del admin; oferta caducada → banner "La oferta caducó el 20 sep. La candidatura se descartó sola." `[ Reabrir ]`; material en preparación → "Preparando CV y carta… suele tardar 1–2 min." y `[ Reintentar ahora ]` si pasan 10 min; IA sin respuesta → "La IA no responde; Radar reintenta cada 10 min. Puedes escribir el material a mano." (editor vacío habilitado); PDF no disponible → vía impresión; envío en curso → botones desactivados; Google caducado → tarjeta Calendario con `[ Volver a autorizar Google ]`; Gmail sin acceso → "No puedo leer Gmail desde las 08:30." en la cabecera de Correos, lista intacta; Proton sin Bridge → "Proton no está conectado (Bridge apagado)."; sin conexión → `OfflineBanner`, notas se conservan localmente hasta que vuelva la red.

```
Móvil (375 px), estado Preparada (asistida)
┌──────────────────────────────────────┐
│ < Radar                              │
│  Full-stack Next.js                  │
│  Beta SL · Preparada       79 medio  │
│  LinkedIn · Empleo · Híbrido Madrid ·│
│  50 k€ · publicada hace 2 d · Sin    │
│  plazo                               │
│  > Ver la oferta en LinkedIn ↗       │
│ ── Por qué 79/100 ──                 │
│  + Next.js y TypeScript, 3 proyectos │
│  + salario sobre el mínimo (45 k€)   │
│  − híbrido: 2 días en Madrid         │
│  perfil v4 · 18 sep  [Repuntuar]     │
│  [ No me interesa ]                  │
│ ── Oferta ──                         │
│  (descripción, 12 líneas)  [Ver más] │
│ ── Materiales ──                     │
│  (CV) (Carta) (Respuestas)           │
│  v1 · IA · hace 3 h ▾  (Editar)(Ver) │
│  ┌──────────────────────────────┐    │
│  │ # Carta                      │    │
│  │ Hola, …                      │    │
│  └──────────────────────────────┘    │
│  [Regenerar] [Copiar] [[ Guardar ]]  │
│ ── Correos (0) ──  [ Vincular correo]│
│ ── Notas ──  [__________________]    │
│ ── Historial ──                      │
│  18 sep 07:15 Preparada (IA)         │
│  18 sep 07:12 Descubierta · 79       │
├──────────────────────────────────────┤
│ Al confirmar se abrirá la oferta y   │
│ el material queda listo para copiar. │
│ [[ Confirmar y abrir ]] [Posp.][Desc.]│  barra fija
└──────────────────────────────────────┘
```

```
Escritorio (≥ 1024 px), estado Enviada con correo y evento propuesto
┌──────────────────────────────────────────────────────────────────────────┐
│ < Radar                                                                  │
│ Senior React Native · Acme                       Enviada 19 sep · 82 alto│
│ InfoJobs · Empleo · Remoto · 45–55 k€ · Vence 24 sep   > Ver en InfoJobs ↗│
├───────────────────────────────────────────┬──────────────────────────────┤
│ Por qué 82/100                            │ Decisión                     │
│  + React Native, 4 años (pide 3)          │ Enviada 19 sep 09:13 ·       │
│  + remoto · + salario 45–55 k€            │ recibo 4F7Q · > Ver          │
│  − pide inglés C1; perfil B2              │ Estado (Enviada ▾)           │
│  perfil v4 · Llama 3.3 · 18 sep  [Repunt.]│ Plazo: 24 sep · Seguimiento: │
│ Oferta                                    │ 26 sep  [ Preparar borrador ]│
│  (descripción)                [Ver completa]│ Calendario                 │
│ Materiales  (CV) (Carta) (Formulario)     │ ┌╌ Entrevista técnica ╌╌╌╌╌┐│
│  v2 · tú · hace 10 min ▾  [Regenerar]     │ ┆ jue 25 sep 10:00 · 45 min┆│
│ ┌ editor ─────────┐ ┌ previsualización ─┐ │ ┆ Meet · del correo 19 sep ┆│
│ │ # Jose Carlos … │ │ (CV renderizado)  │ │ ┆ [[ Crear en el calendario┆│
│ │                 │ │                   │ │ ┆    Radar ]] [Editar][Desc]┆│
│ └─────────────────┘ └───────────────────┘ │ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘│
│  [Copiar] [Descargar PDF] [[ Guardar ]]   │ [ Nuevo evento ]             │
│  Qué cambió respecto al CV maestro ▸      │ Correos (1)  [Vincular correo]│
│                                           │ · Nuevo · 19 sep · Gmail ·   │
│                                           │   rrhh@acme.es · "Entrevista │
│                                           │   técnica" · Entrevista 0,92 │
│                                           │   > Abrir hilo  [No era esto]│
│                                           │ Notas [___________________]  │
├───────────────────────────────────────────┴──────────────────────────────┤
│ Historial                                                                │
│ 19 sep 11:02 · Entrevista (correo, 0,92) · evento propuesto  [No era esto]│
│ 19 sep 09:13 · Enviada por conector · recibo 4F7Q                        │
│ 19 sep 09:12 · Confirmada por Jose desde Telegram                        │
│ 18 sep 07:15 · Preparada (IA: CV v1, carta v1)                           │
│ 18 sep 07:12 · Descubierta en InfoJobs · 82/100 · perfil v4              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.14 Radar: plataformas `/admin/radar/plataformas`

**Objetivo:** saber si cada conector funciona, cuándo pasó y por qué se detuvo; pausar o reactivar; dar de alta una plataforma sin tocar el núcleo (D19). Las credenciales se **refieren**, nunca se muestran ni se escriben aquí.

**Componentes:**
- Cabecera: `RadarPauseSwitch` global y "Próximas pasadas: InfoJobs 07:00 · Tecnoempleo 07:10 · LinkedIn 07:30 (Omen) · Indeed 08:00 (Mac)".
- `ConnectorCard` × n (tarjetas en móvil; tabla en escritorio):
  - Nombre · tipo (Empleo · Freelance · Ambos) · acceso (API · MCP · Feed · Scraping · Correo) · dónde corre (Gateway · Omen · Mac) · envío (Propio · Asistido).
  - Estado (`StatusBadge` con texto): Activo · Pausado · Pausado (Radar en pausa) · Detenido por error · Detenido: verificación de seguridad · Sin credenciales · Esperando al Mac.
  - Última pasada: "hace 2 h · OK · 14 ofertas, 3 nuevas" / "hace 26 h · sin respuesta (el Mac estaba dormido)" / "hace 3 h · error HTTP 429 · reintento a las 13:00".
  - Límites: "1 pasada/día · ≤ 30 ofertas · pausas 3–12 s" (LinkedIn) / "cada 6 h · ≤ 50" (InfoJobs); uso de hoy "1/1".
  - Dominios de correo que vincula (chips).
  - Acciones: interruptor Activo/Pausado (en LinkedIn, con nota: "La alternativa por correo `linkedin-email` sigue activa."); `[ Ejecutar ahora ]` (Gateway y Omen; en Mac desactivado con "Se ejecuta desde el Mac a su hora"); `[ Reactivar ]` tras captcha (exige la casilla "He comprobado la sesión a mano"); `[ Editar ]`; `> Ver sus ofertas` (bandeja filtrada).
- `[[ Añadir plataforma ]]` → `ConnectorSheet` (`?nueva=1`; edición con `?plataforma=[code]`):
  - **Conector** (selector con los conectores del paquete `radar-connectors` aún no configurados: "InfoJobs (API, gateway)", "Upwork (API, gateway)", "Workana (scraping, Omen)", "LinkedIn alertas por correo (`linkedin-email`)", …). Si la plataforma que Jose quiere no está: "Primero hay que añadir su conector al paquete `radar-connectors`; el núcleo no cambia (D19)."
  - Nombre · Tipo · Horario (presets: Cada día 07:00 · Cada 6 h · Cada hora · Cron…) · Límites (pasadas/día, ofertas/pasada; en scraping, mínimo fijado por D20 y no editable hacia arriba) · Consultas (por defecto las del perfil; override opcional de roles y zona) · Dominios de correo · Runtime (lo fija el conector; solo lectura).
  - **Credenciales referidas** (`SecretRef`): por cada secreto que declara el conector, nombre, dónde vive y si está: "`INFOJOBS_CLIENT_SECRET` · wrangler secret (`apps/api`) · configurado" / "`LINKEDIN_SESSION` · credential store de n8n (Omen) · falta". Texto de ayuda con el comando o el sitio ("`wrangler secret put INFOJOBS_CLIENT_SECRET`"). **Ningún campo de valor.** Sin credenciales se guarda como "Sin credenciales" y no se ejecuta.
  - `[[ Guardar plataforma ]]` · `[ Probar ]` (ejecuta `discover` limitado a 3 resultados y muestra los títulos; no ingesta) · `[ Cancelar ]`.

**Acción primaria:** Añadir plataforma (lista) · Guardar plataforma (hoja).

**Estados:** sin plataformas → "Sin plataformas. Añade la primera; Tecnoempleo e InfoJobs son las de menos riesgo."; error → tarjeta con el error completo plegable y "Radar reintenta a las {hora}"; captcha → tarjeta en rojo: "Detenido: verificación de seguridad en LinkedIn a las 07:31. No se resuelve sola. Entra en LinkedIn a mano, comprueba tu sesión y reactiva el conector."; Omen sin respuesta → todas las de Omen con "Omen sin respuesta desde las 14:02" y `[ Ejecutar ahora ]` desactivado; Mac dormido → "Esperando al Mac"; prueba fallida → resultado inline con el error; guardado → toast.

```
Móvil (375 px)
┌──────────────────────────────────────┐
│ < Admin   Radar          (● activo)  │
│ Bandeja Calendario (Plataformas) Perfil│
│ [[ Añadir plataforma ]]              │
│ ┌ LinkedIn · Empleo+Freel. · Scraping│
│ │ Omen · Asistido                    │
│ │ ● Detenido: verificación de        │
│ │   seguridad · 07:31                │
│ │ Última OK: ayer 07:32 · 22 ofertas │
│ │ 1/día · ≤ 30 · pausas 3–12 s       │
│ │ linkedin.com · linkedin.es         │
│ │ ☐ He comprobado la sesión a mano   │
│ │ [ Reactivar ] [ Editar ] [ Pausar ]│
│ └──────────────────────────────────┘ │
│ ┌ InfoJobs · Empleo · API · Gateway  │
│ │ Envío propio · ● Activo            │
│ │ Hace 2 h · OK · 14 ofertas, 3 nuevas│
│ │ [ Ejecutar ahora ] [ Editar ] (on) │
│ └──────────────────────────────────┘ │
│ ┌ Indeed · Empleo · MCP · Mac        │
│ │ ● Esperando al Mac · hace 26 h     │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
Hoja "Añadir plataforma":
│  Conector   (Upwork (API, gateway) ▾)│
│  Nombre     [Upwork_______________]  │
│  Tipo       (Freelance)              │
│  Horario    (Cada 6 h ▾)             │
│  Límites    pasadas/día [4] ofertas [50]│
│  Consultas  (● del perfil) (○ propias)│
│  Correo     [upwork.com] [+]         │
│  Credenciales                        │
│   UPWORK_CLIENT_ID · wrangler · falta│
│   UPWORK_REFRESH_TOKEN · wrangler ·  │
│   falta  → `wrangler secret put …`   │
│  [[ Guardar plataforma ]] [ Probar ] │
```

### 7.15 Radar: perfil `/admin/radar/perfil`

**Objetivo:** ver con qué perfil puntúa Radar y ajustar lo que cambia a menudo (umbral, exclusiones, disponibilidad) sin romper la regla de la spec: el perfil (`content/radar/profile.json`) y los CV maestros son la **única fuente de hechos** para la IA y viven versionados en el repo.

**Componentes:**
- Cabecera: "Perfil v5 · desde el 18 sep · `content/radar/profile.json`" · "Ofertas activas puntuadas con una versión anterior: 12" `[ Repuntuar las activas ]` (aviso de coste: "≈ 12 llamadas a la IA").
- **Búsqueda** (`ProfileView`, solo lectura, con `> Editar en el repo` que abre el fichero en GitHub): Roles (es/en) · Palabras clave · Modalidad y zona (Remoto · Híbrido {ciudad, radio} · Presencial {zona}) · Salario mínimo bruto anual (empleo) · Tarifa mínima por hora y presupuesto mínimo por encargo (freelance) · Idiomas con nivel · Sectores y empresas excluidos · Disponibilidad · Datos de contacto y enlaces para formularios (teléfono, portfolio, GitHub, LinkedIn).
- **Ajustes rápidos** (editables aquí, guardados en Supabase y aplicados encima del JSON): **Umbral de preparación** (control deslizante 40–90 con valor visible; por defecto 60; texto de ayuda con hechos: "Con 60 se habrían preparado 9 de las 31 ofertas de la última semana; con 70, 5."), **Exclusiones rápidas** (empresas y palabras marcadas con "No me interesa"; quitar una las readmite en la próxima pasada), **Disponibilidad** (fecha; el badge del hero la refleja solo si Jose lo decide, §18 dato 11), **Radar en pausa** (`RadarPauseSwitch`).
- **Materiales base:** CV maestro es · en en pestañas con previsualización renderizada, versión (commit corto y fecha), `[ Descargar PDF ]`, `> Editar en el repo`; contraste informativo con Indeed (`get_resume`): "Indeed tiene tu CV del {fecha}; el maestro es del {fecha}." Voz: "Cartas y propuestas usan `Comercial/voz.md` en registro formal-cercano" `> Ver`.
- Al guardar umbral o exclusiones → toast "Guardado. Se aplica a las ofertas nuevas; para las activas, Repuntuar."

**Acción primaria:** `[[ Guardar ajustes ]]`, visible solo con cambios en los ajustes rápidos.

**Estados:** JSON ausente o inválido → "No hay perfil. Radar no puntúa hasta que exista `content/radar/profile.json`." `> Ver plantilla`; CV maestro ausente en un idioma → "Sin CV maestro en {idioma}: no se preparan candidaturas en ese idioma."; repuntuando → barra "Repuntuando 12 ofertas… 4/12"; guardado fallido → toast, valores conservados.

Decisión para `arquitecto` (§13.19a): la edición completa del perfil desde admin (escribir `radar_profile_versions` y que la IA lea la última versión) queda fuera de v1; `ux` recomienda solo lectura + ajustes rápidos para que el JSON del repo siga siendo la verdad.

```
Móvil (375 px)
┌──────────────────────────────────────┐
│ < Admin   Radar          (● activo)  │
│ Bandeja Calendario Plataformas (Perfil)│
│  Perfil v5 · 18 sep · profile.json   │
│  12 ofertas con perfil anterior      │
│  [ Repuntuar las activas ]           │
│ ── Búsqueda ──        > Editar en repo│
│  Roles: React Native dev, full-stack │
│  Next.js, mobile lead                │
│  Modalidad: remoto; híbrido ≤ 2 d en │
│  {{DATO: ciudad}}                    │
│  Mínimos: 45.000 € bruto · 40 €/h ·  │
│  600 €/encargo                       │
│  Idiomas: es nativo · en B2 · ca B1  │
│  Excluye: banca, apuestas            │
│ ── Ajustes rápidos ──                │
│  Umbral  [====●=====] 60             │
│  Con 60: 9 de 31 la última semana    │
│  Exclusiones: Acme ×  "junior" ×     │
│  Disponibilidad [15/10/2026]         │
│  [[ Guardar ajustes ]]               │
│ ── Materiales base ──                │
│  (CV es) (CV en)  a1b2c3d · 12 sep   │
│  (previsualización)                  │
│  [ Descargar PDF ]  > Editar en repo │
└──────────────────────────────────────┘
```

### 7.16 Radar: calendario `/admin/radar/calendario`

**Objetivo:** ver entrevistas, llamadas, plazos y seguimientos en el tiempo; confirmar eventos propuestos; crear uno a mano. Todo lo que llega a Google lo crea Jose con un clic (D23); el resto es lectura.

**Componentes:**
- Cabecera: segmento Mes · Semana · Agenda (móvil: Agenda por defecto); navegación ‹ Hoy ›; "Sincronizado con Google hace 12 min"; filtros por tipo (Entrevistas · Llamadas · Plazos · Seguimientos · Propuestos).
- `RadarCalendar`: eventos con tipo en texto; propuestos con borde discontinuo y etiqueta "Propuesto"; plazos como marcas de día (no ocupan hora); seguimientos (`next_action_at`) como "Seguir: {empresa}"; eventos del calendario "Radar" movidos a mano en Google se reflejan en la siguiente lectura con la nota "Movido en Google el 19 sep".
- Clic en un evento → popover (escritorio) u hoja (móvil): título, candidatura (`> Abrir`), hora, duración, enlace de videollamada, origen ("del correo del 19 sep" / "creado por ti"), `> Ver en Google Calendar`; en propuestos: `[[ Crear en el calendario Radar ]]` `[ Editar ]` `[ Descartar ]`.
- `[ Nuevo evento ]` → formulario (candidatura, tipo, fecha, hora, duración, enlace) con `[[ Crear en el calendario Radar ]]` como confirmación.

**Acción primaria:** Crear en el calendario Radar (en propuestos y en el formulario).

**Estados:** sin eventos → "Sin eventos en {periodo}."; Google sin acceso → banner "No puedo leer Google Calendar ({motivo}). Muestro lo que Radar ya conoce." y `[ Volver a autorizar ]` si es caducidad; creación fallida → toast con motivo, el evento sigue como propuesto; solapamiento con otro evento de Radar → "Coincide con {evento}" antes de crear.

```
Móvil (375 px), Agenda
┌──────────────────────────────────────┐
│ < Admin   Radar          (● activo)  │
│ Bandeja (Calendario) Plataformas Perfil│
│ (Agenda) Semana Mes    ‹ Hoy ›       │
│ Sincronizado hace 12 min             │
│ ── Jue 25 sep ──                     │
│ ┌╌ Propuesto ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐│
│ ┆ 10:00 · Entrevista técnica · Acme ┆│
│ ┆ 45 min · Meet · del correo 19 sep ┆│
│ ┆ [[ Crear en el calendario Radar ]]┆│
│ ┆ [ Editar ] [ Descartar ]          ┆│
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘│
│  Vence · Full-stack Next.js · Beta SL│
│ ── Vie 26 sep ──                     │
│  Seguir · Dev móvil · Gamma          │
│  [ Preparar borrador ]               │
│ ── Lun 29 sep ──                     │
│  12:30 · Llamada · Delta · 20 min    │
│  > Ver en Google Calendar            │
│ [ Nuevo evento ]                     │
└──────────────────────────────────────┘
```

```
Escritorio, Semana
┌──────────────────────────────────────────────────────────────────────────┐
│ Radar · Calendario     Mes (Semana) Agenda   ‹ Hoy ›   22–28 sep   Sincronizado hace 12 min   [ Nuevo evento ] │
│ ☑ Entrevistas ☑ Llamadas ☑ Plazos ☑ Seguimientos ☑ Propuestos            │
├────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│        │ Lun 22   │ Mar 23   │ Mié 24   │ Jue 25   │ Vie 26   │ Sáb 27   │
│ plazos │          │          │ Vence:   │          │ Seguir:  │          │
│        │          │          │ Acme     │          │ Gamma    │          │
│ 09:00  │          │          │          │          │          │          │
│ 10:00  │          │          │          │╌Entrev.╌ │          │          │
│        │          │          │          │╌Acme 45'╌│          │          │
│ 12:00  │          │ Llamada  │          │          │          │          │
│        │          │ Delta    │          │          │          │          │
└────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 7.17 Radar en Telegram (mensajes y botones)

No es una pantalla: cada mensaje enlaza a una ruta de §2.3. Reglas: ≤ 8 líneas, sin emojis, español sobrio; los botones son `callback_data` con id y acción firmados, y solo se aceptan del `chat_id` de Jose (spec §13.6); ningún botón dispara un envío sin registrar `confirmed_by_jose`; ningún mensaje incluye el cuerpo de un correo (solo asunto y extracto ≤ 140 caracteres); los enlaces al admin exigen sesión (sin ella, login con `next`). Al actuar, el mensaje **se edita** (los botones desaparecen o cambian): nunca hay dos mensajes con botones vivos para la misma decisión.

**Aviso "candidatura preparada"** (`radar.prepared`):

```
Radar · candidatura preparada · 82/100
Senior React Native — Acme
InfoJobs · empleo · remoto · 45–55 k€ · vence 24 sep
Por qué: + React Native 4 años · + remoto · − pide inglés C1
Envío: por API de InfoJobs (CV v1, carta v1, formulario 8 campos)
Material: visto ayer · 3 referencias a Acme · sin bloqueos
Ver y editar → josecoded.com/admin/radar/{id}

[ Confirmar ]   [ Posponer ]   [ Descartar ]
```

El enlace "Ver y editar" es el "Editar" de la spec §13.2: editar se hace en el detalle (§7.13), no en Telegram. En modo asistido la línea de envío dice "Envío: asistido (se abre el enlace con todo preparado)".

**Qué botones aparecen (regla de seguridad del envío, §16.4 J1).** La línea "Material:" siempre dice si Jose lo ha visto, cuántas referencias concretas tiene y si hay bloqueos. Los botones dependen del caso:

| Caso | Línea "Material:" | Botones |
|---|---|---|
| Envío por API, material visto por Jose (o sin cambios desde la última vista), sin bloqueos | "visto ayer · 3 referencias a Acme · sin bloqueos" | `[ Confirmar ]` `[ Posponer ]` `[ Descartar ]` |
| Envío por API, **nunca visto** (o cambiado desde la última vista) | "no lo has visto · 3 referencias a Acme" | `[ Ver material ]` (abre el detalle) `[ Posponer ]` `[ Descartar ]`. **Sin Confirmar**: un envío irreversible no se confirma a ciegas |
| Envío por API, con bloqueos (dato "no consta en el CV maestro", campo "Rellénalo tú" vacío, < 2 referencias concretas, material sin guardar) | "1 dato por confirmar · no se puede enviar desde aquí" | `[ Ver y editar ]` `[ Posponer ]` `[ Descartar ]`. **Sin Confirmar** |
| Modo asistido (abrir enlace), con o sin vista previa | "asistido · 2 referencias · 1 aviso" | `[ Confirmar ]` `[ Posponer ]` `[ Descartar ]` (abrir un enlace no es irreversible; Jose verá el material al copiarlo) |

**Segundo paso para envío por API.** Al pulsar `[ Confirmar ]` en un envío por API, el mensaje se edita a "Enviar a Acme por InfoJobs (CV v1, carta v1, 8 campos). ¿Seguro?" con `[ Sí, enviar ]` `[ No ]`; caduca a los **10 min** ("Confirmación caducada. Vuelve a pulsar Confirmar." y el mensaje recupera los botones originales). Solo `[ Sí, enviar ]` registra `confirmed_by_jose`. En modo asistido no hay segundo paso.

**Qué ve Jose al pulsar:**

| Botón | El mensaje pasa a | Después |
|---|---|---|
| Confirmar (envío por API) | "Enviar a Acme por InfoJobs (CV v1, carta v1, 8 campos). ¿Seguro?" + `[ Sí, enviar ]` `[ No ]` (caduca en 10 min) | Sí → "Confirmada 09:12 · Enviando…" → "Enviada 09:13 · recibo 4F7Q · Ver → {enlace detalle}" (sin botones). No o caducidad → vuelve al mensaje original |
| Ver material / Ver y editar | Abre el detalle (login con `next` si hace falta); el mensaje no cambia | Al ver el material (o al resolver los bloqueos) el mensaje se edita y aparece `[ Confirmar ]`; si Jose decide en admin, el mensaje se edita ("Confirmada desde admin 09:12") |
| Confirmar (asistida) | "Confirmada 09:12. Abre la oferta y envía el material: {url oferta} · Material listo → {enlace detalle}" + `[ Marcar enviada ]` | Al pulsar: "Enviada 09:40 · Ver → {enlace}". El botón vive hasta marcar o descartar |
| Confirmar, envío falla | "No se ha podido enviar: {motivo}. Paso a modo asistido: {url oferta} · Material → {enlace}" + `[ Marcar enviada ]` `[ Reintentar ]` | Igual que asistida |
| Posponer | "¿Hasta cuándo?" + `[ Mañana 08:00 ]` `[ 3 días ]` `[ Lunes ]` | "Pospuesta hasta el {fecha}." A esa hora llega de nuevo el aviso completo |
| Descartar | "Descartada." + `[ Deshacer ]` (10 min) | Deshacer → "Recuperada." y vuelve a Preparada |
| Cualquiera, si la candidatura ya cambió | "Esta candidatura ya está {estado}." | Sin cambios |

Al abrir el enlace tras confirmar desde Telegram, el detalle muestra en Historial "Confirmada por Jose desde Telegram 09:12" y la `DecisionCard` en el estado que toque (Enviada con recibo, o "Confirmada · por marcar enviada" con `[[ Marcar enviada ]]`).

**Otros avisos:**

| Evento | Mensaje | Botones |
|---|---|---|
| `radar.deadline` (24 h antes) | "Vence mañana 10:00: Senior React Native · Acme · Preparada → {enlace}" | `[ Confirmar ]` `[ Descartar ]` si está pendiente de decisión |
| `radar.followup_due` (7 días sin novedad) | "7 días sin novedad: Dev móvil · Gamma. Borrador de seguimiento listo en Gmail → {enlace borrador}" | `[ Ver candidatura ]` |
| `radar.email_linked` (confianza ≥ 0,8) | "Correo de Acme: «Entrevista técnica» · clasificado como Entrevista (0,92) → {enlace}" | `[ No era esto ]` |
| `radar.email_linked` (confianza < 0,8) | "Correo de rrhh@beta.es: «Sobre tu candidatura» · ¿Qué es?" | `[ Contactado ]` `[ Entrevista ]` `[ Rechazo ]` `[ No es de Radar ]` |
| Evento propuesto | "Entrevista propuesta: jue 25 sep 10:00, 45 min, Meet · Acme. ¿La creo en el calendario Radar?" | `[ Crear ]` `[ Ver ]` `[ Descartar ]` |
| `radar.connector_error` | "LinkedIn detenido: verificación de seguridad a las 07:31. No se reintenta hasta que lo reactives → {enlace plataformas}" / "Omen sin respuesta desde las 14:02: LinkedIn, Workana y Proton parados; el resto sigue." | `[ Pausar LinkedIn ]` (solo si sigue activo) |
| Resumen diario 08:00 | "Hoy: entrevista 10:00 Acme · 2 plazos · 3 pendientes de ti → {enlace bandeja}" | — |
| Resumen semanal (lunes) | "Semana: 23 ofertas ≥ 60 · 6 enviadas · 2 en contacto · 1 entrevista. InfoJobs 11 · LinkedIn 8 · Tecnoempleo 4." | — |
| Radar en pausa / reanudado | "Radar en pausa: no rastrea ni prepara. Correo, calendario y avisos siguen." / "Radar reanudado. Próxima pasada: InfoJobs 07:00." | `[ Reanudar ]` |

### 7.18 Radar: estados de error y vacíos

Regla: cada caso tiene texto con hechos (qué pasó, desde cuándo, qué sigue funcionando) y una sola acción. Nunca se resuelve un captcha ni se reintenta un envío sin Jose.

| # | Caso | Dónde se ve | Texto | Acción |
|---|---|---|---|---|
| R1 | Conector con error (HTTP, timeout, cuota) | `ConnectorCard`, `RadarAlerts`, Telegram | "InfoJobs: error HTTP 429 a las 10:02. Radar reintenta a las 13:00." | `[ Ejecutar ahora ]` · `[ Ver error ]` |
| R2 | Captcha o verificación de seguridad | `ConnectorCard` en rojo, `RadarAlerts`, Telegram | "Detenido: verificación de seguridad en LinkedIn a las 07:31. No se resuelve sola. Entra en LinkedIn a mano, comprueba tu sesión y reactiva el conector." | `[ Reactivar ]` con casilla "He comprobado la sesión a mano" |
| R3 | Correo sin vincular (confianza < 0,8 o sin candidatura) | `RadarAlerts`, hoja "Correos por revisar", Telegram | "3 correos por clasificar." | `[ Revisar ]` |
| R4 | Correo vinculado por error | `EmailList`, `EventTimeline`, Telegram | "Vinculado como Entrevista (0,92)." | `[ No era esto ]` (revierte el estado) |
| R5 | Omen sin respuesta | `RadarAlerts`, `ConnectorCard` (Omen), Resumen del admin, Telegram | "Omen sin respuesta desde las 14:02: LinkedIn, Workana y Proton no rastrean; el resto sigue." | `[ Ver plataformas ]` |
| R6 | Mac dormido o apagado (Indeed) | `ConnectorCard` | "Indeed: última pasada hace 26 h. Se ejecuta desde el Mac cuando despierte." | — |
| R7 | IA sin respuesta (Workers AI y respaldo de Omen) | Detalle (Materiales), bandeja ("Preparando…" > 10 min) | "La IA no responde; Radar reintenta cada 10 min. Puedes escribir el material a mano." | `[ Reintentar ahora ]` |
| R8 | Acceso a Google caducado (app en modo prueba, 7 días) | `RadarAlerts`, Calendario, Correos del detalle | "El acceso a Gmail y Google Calendar caducó el 18 sep. Radar no lee correo ni calendario hasta que lo autorices de nuevo." | `[ Volver a autorizar Google ]` (lo hace Jose en su navegador) |
| R9 | Gmail sin acceso (error de API) | Correos del detalle, `RadarAlerts` | "No puedo leer Gmail desde las 08:30. Reintento cada 30 min." | — |
| R10 | Proton sin Bridge | Correos del detalle, `ConnectorCard` de correo | "Proton no está conectado (Bridge apagado en Omen)." | `> Cómo activar Bridge` |
| R11 | Envío fallido | `DecisionCard`, bandeja (subestado), Telegram | "No se ha enviado: {motivo}. Puedes reintentar o pasar a modo asistido." | `[ Reintentar ]` · `[ Abrir la oferta ]` |
| R12 | Oferta caducada | Detalle (banner), bandeja (`DeadlineTag` "Caducada") | "La oferta caducó el 20 sep. La candidatura se descartó sola." | `[ Reabrir ]` |
| R13 | Oferta duplicada | Cabecera del detalle, chip "Dup." | "La misma oferta está en LinkedIn." | `> Ver` |
| R14 | Aviso de Telegram sin entregar | `RadarAlerts`, Resumen | "2 avisos de Telegram sin entregar desde las 09:00. Las candidaturas están en la bandeja." | `[ Reintentar ]` |
| R15 | Sin perfil o sin CV maestro | Perfil, bandeja (banner) | "No hay perfil. Radar no puntúa hasta que exista `content/radar/profile.json`." / "Sin CV maestro en inglés: no se preparan candidaturas en inglés." | `> Ver plantilla` |
| R16 | Radar en pausa | Bandeja, plataformas, perfil | "Radar en pausa desde el 18 sep: no rastrea ni prepara. Correo, calendario y avisos siguen." | `[ Reanudar ]` |
| R17 | Sin permisos | `/admin/radar/*` | §8.4 | — |

---

## 8. Páginas y estados de error

Plantilla común `ErrorPage`: con la cabecera y el pie correspondientes (público, área o admin), sin decoración (el fondo de grano y rayo sí), código en pequeño en monoespaciada sobre el título y en el `title`, título, una frase, una acción primaria y una vía alternativa. Sin humor, sin ilustraciones de stock. Todas con `title` y `noindex` (salvo 410, que también lleva `noindex`).

```
┌──────────────────────────────────────┐
│ (cabecera)                           │
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
| 8.17 | Radar (conector caído, captcha, correo sin vincular, Omen apagado, Mac dormido, IA sin respuesta, Google caducado, envío fallido, oferta caducada, Telegram sin entregar, sin perfil, en pausa) | inline en `/admin/radar/*` y Telegram | §7.18 (R1–R17) | | | |

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

### 9.10 Radar de principio a fin (conector → núcleo → IA → Jose → correo → calendario → avisos)

Actores: conector (una plataforma), núcleo (gateway + Supabase), IA (Workers AI; respaldo Omen), Jose (admin o Telegram), correo (Gmail; Proton si hay Bridge), calendario (Google, calendario "Radar"), avisos (Telegram). Invariante en todos los pasos: **ninguna transición a Enviada sin `confirmed_by_jose`** (D18) y **ningún evento en Google sin clic de Jose** (D23).

1. **Descubrir.** A su hora, cada conector activo ejecuta `discover` con las consultas del perfil y entrega ofertas normalizadas por `POST /api/v1/radar/ingest`. El núcleo hace upsert por (plataforma, `external_id`), marca duplicados entre plataformas (`duplicate_of`) y deja la oferta en `active`. La plataforma actualiza "última pasada" (§7.14). ◇ error o captcha → el conector se detiene, `last_error`, aviso `radar.connector_error` (R1/R2). ◇ Omen o Mac sin respuesta → el conector queda "Esperando" (R5/R6); los demás siguen.
2. **Puntuar.** Reglas duras primero (exclusiones del perfil: presencial fuera de zona, salario bajo mínimo, sectores, idiomas) → `discarded` con `rule:<nombre>`, sin coste. El resto pasa a la IA con perfil + CV maestro → `score` y `reasons[]` (≥ 3). ◇ `score ≥ umbral` (60 por defecto, §7.15) → se crea la candidatura en `discovered`. ◇ bajo umbral → la oferta queda visible solo con el filtro "Bajo umbral" y `[ Preparar de todos modos ]` (§7.12). ◇ IA sin respuesta → reintento cada 10 min; la oferta espera en "Puntuando…".
3. **Preparar.** La IA genera CV adaptado (reordena y destaca desde el maestro; no inventa), carta (empleo) o propuesta (freelance, con tarifa del perfil) y, si el conector tiene `prepareForm`, el formulario prellenado. Todo en `radar_materials` v1 (`generated_by = ai`). Estado → `prepared`. Aviso `radar.prepared` por Telegram (§7.17) y fila en "Pendientes de ti" (§7.12). ◇ hecho no presente en el maestro → marcado "no consta en el CV maestro"; bloquea la confirmación hasta que Jose lo edite o lo apruebe (§7.13). ◇ IA sin respuesta → R7, editor manual habilitado.
4. **Decidir.** Jose, en Telegram (§9.11) o en admin (§7.12 fila, §7.13 detalle):
   - ◇ Confirmar → `ConfirmSendModal` (en Telegram, el propio mensaje lo resume) enseña **qué va a pasar** → evento `confirmed_by_jose` (`source = telegram|admin`) → paso 5.
   - ◇ Editar (abrir el detalle y tocar material) → al guardar, `pending_confirm`; sigue en "Pendientes de ti" hasta confirmar.
   - ◇ Posponer → `next_action_at` + evento; sale de "Pendientes de ti" y vuelve a las 08:00 de ese día con aviso. Si el plazo vence antes, se avisa al posponer.
   - ◇ Descartar → `discarded` con motivo; con "No me interesa" y la casilla, la empresa entra en exclusiones rápidas. Deshacer 10 s (admin) / 10 min (Telegram).
5. **Enviar o asistir.**
   - ◇ conector con `submit` (InfoJobs si la verificación de la tarea 0 lo confirma) → el núcleo llama a `submit()` con el material aprobado → OK → `sent` (`submitted_via = connector`, `receipt`) → el detalle muestra recibo y enlace; Telegram edita el mensaje a "Enviada". ◇ falla → sigue `prepared` con `last_error`, aviso R11 y paso a asistido.
   - ◇ asistido (LinkedIn, Indeed, Tecnoempleo, Upwork, Workana) → se abre la oferta en pestaña nueva (admin) o se manda el enlace (Telegram); el detalle enseña `[ Copiar carta ]` `[ Descargar CV ]` y `[[ Marcar enviada ]]`; hasta marcarla, subestado "Confirmada · por marcar enviada" → al marcar, `sent` (`submitted_via = assisted`).
6. **Seguir por correo.** Cada 30 min el núcleo lee Gmail con filtros (dominios de plataformas, dominios de empresas con candidatura abierta, hilos de candidatura, asuntos con referencia) y, si hay Bridge, n8n lee Proton. La IA clasifica con el extracto y la lista de candidaturas abiertas → `{application_id, kind, confidence}`. ◇ `confidence ≥ 0,8` → se vincula y se aplica la transición (`actor = email`): `contacted`, `interview`, `offer`, `rejected`; aviso `radar.email_linked` con `[ No era esto ]`. ◇ `< 0,8` → se vincula como `info` y entra en "Correos por revisar" (§9.12); aviso con botones de clasificación. ◇ Jose ve un correo que Radar no ha captado → lo vincula a mano (§9.12). Se guardan referencia, asunto, extracto y enlace al hilo; nunca el cuerpo ni adjuntos.
7. **Calendario.** Un correo con fecha (entrevista, llamada) o Jose desde el detalle generan un **evento propuesto** (`EventProposalCard`, §7.13; también en §7.16 y por Telegram). ◇ Jose pulsa "Crear en el calendario Radar" → evento en Google (calendario secundario "Radar") + `radar_application_events` con `google_event_id`. ◇ Descartar → queda en el historial. Cada hora se leen los eventos del calendario "Radar" para reflejar cambios hechos a mano. ◇ Google caducado → R8; los propuestos esperan.
8. **Avisos.** Cron diario 08:00 (Europe/Madrid): plazos en < 24 h (`radar.deadline`), seguimientos vencidos (`sent`/`contacted` sin novedad 7 días → borrador en Gmail, nunca enviado, aviso `radar.followup_due`), entrevistas de hoy y, los lunes, resumen semanal (§7.17). Silencio > 45 días → `rejected` (`actor = rule`, reversible con "No era esto"). Todo aviso enlaza a su pantalla.

Errores transversales: sin Omen, todo lo del gateway sigue (ingesta de conectores de gateway y Mac, puntuación, preparación, confirmación, envío, Gmail, calendario, Telegram); sin Mac, solo Indeed espera; sin Google, correo y calendario esperan y el resto sigue; sin Telegram, la bandeja sigue siendo la fuente (R14).

### 9.11 Confirmar desde Telegram (Jose)

1. Llega el aviso `radar.prepared` (§7.17) con resumen, puntuación, motivos, modo de envío, línea "Material:" (visto / no visto, referencias concretas, bloqueos) y enlace al detalle. El núcleo decide los botones al enviar el aviso y los recalcula al editar el mensaje:
   - ◇ **asistido** → `[ Confirmar ] [ Posponer ] [ Descartar ]`.
   - ◇ **API, visto y sin bloqueos** (Jose abrió Materiales de esa candidatura y la versión no ha cambiado) → `[ Confirmar ] [ Posponer ] [ Descartar ]`.
   - ◇ **API, nunca visto o cambiado desde la vista** → `[ Ver material ] [ Posponer ] [ Descartar ]`; sin Confirmar.
   - ◇ **API con bloqueos** (dato "no consta en el CV maestro", "Rellénalo tú" vacío, < 2 referencias concretas, sin guardar) → línea "1 dato por confirmar · no se puede enviar desde aquí" y `[ Ver y editar ] [ Posponer ] [ Descartar ]`; sin Confirmar.
2. ◇ `[ Ver material ]` / `[ Ver y editar ]` / enlace → login si no hay sesión (`next` al detalle) → §7.13 en 375 px. Abrir Materiales escribe `last_viewed_at`; resolver los bloqueos (aprobar el dato, rellenar el campo, regenerar con referencias, guardar) los quita. ◇ Jose decide en admin desde la barra fija → el mensaje se edita ("Confirmada desde admin 09:12"). ◇ Jose vuelve a Telegram sin decidir → el mensaje ya se ha editado y muestra `[ Confirmar ]` si ahora procede (visto y sin bloqueos). ◇ En móvil prefiere no editar → "Editar en el portátil" (§7.13) → recordatorio a una hora concreta.
3. ◇ `[ Confirmar ]` en **modo asistido** → el webhook (`POST /api/v1/radar/telegram`, secreto de cabecera, `chat_id` verificado) registra `confirmed_by_jose` (`source = telegram`) → mensaje con el enlace de la oferta, el material y `[ Marcar enviada ]`.
   ◇ `[ Confirmar ]` en **envío por API** → **segundo paso** en el mismo mensaje: "Enviar a Acme por InfoJobs (CV v1, carta v1, 8 campos). ¿Seguro?" `[ Sí, enviar ] [ No ]`, con caducidad de 10 min. ◇ `[ Sí, enviar ]` → el webhook comprueba de nuevo visto + sin bloqueos + versión de material igual (si algo cambió entre medias: "El material ha cambiado. Míralo antes de enviar." y `[ Ver material ]`) → registra `confirmed_by_jose` → "Confirmada 09:12 · Enviando…". ◇ `[ No ]` o caducidad → el mensaje vuelve a los botones originales; no se registra nada.
4. ◇ envío por API OK → "Enviada 09:13 · recibo 4F7Q · Ver → {enlace}"; ◇ falla → "No se ha podido enviar: {motivo}. Paso a modo asistido: {url}" con `[ Marcar enviada ] [ Reintentar ]` (Reintentar repite el segundo paso).
5. ◇ asistido → Jose abre la oferta en el móvil, pega la carta (desde el detalle, `[ Copiar carta ]`) o lo hace luego en escritorio; cuando la envía, `[ Marcar enviada ]` en Telegram o `[[ Marcar enviada ]]` en el detalle → `sent`.
6. ◇ Posponer → "¿Hasta cuándo?" → chip → "Pospuesta hasta el {fecha}"; ◇ Descartar → "Descartada." con `[ Deshacer ]` 10 min.
7. Callback tardío (la candidatura ya cambió por otra vía) → "Esta candidatura ya está {estado}." sin efecto. Callback de otro `chat_id` → se ignora y se registra (seguridad).
8. Al abrir el detalle después, el historial muestra la confirmación con origen Telegram y hora.

### 9.12 Vincular un correo a mano (Jose)

Entradas: (a) aviso "¿Qué es?" con confianza baja (Telegram) o banner "3 correos por clasificar" (bandeja); (b) Jose ve en Gmail o Proton un correo de una candidatura que Radar no ha captado.

1. **Desde la hoja "Correos por revisar"** (`/admin/radar?correos=revisar`): por correo, candidatura sugerida preseleccionada (o buscador por empresa/título), chips de clasificación, `[[ Vincular ]]` o `[ No es de Radar ]`. ◇ Vincular → `radar_emails.application_id`, `classification`, `confidence = 1`, `reviewed_by_jose = true`; ◇ la clasificación implica transición (Contactado, Entrevista, Oferta, Rechazo) → se aplica con `actor = jose`; ◇ el correo trae fecha y hora → evento propuesto (§9.10 paso 7). ◇ No es de Radar → `unrelated`, no vuelve a aparecer; si el remitente se repite tres veces como `unrelated`, se propone excluir su dominio de los filtros.
2. **Desde el detalle** (`[ Vincular correo ]` → `LinkEmailSheet`), dos pestañas, la primera por defecto:
   - **Buscar** (sin ID): remitente o asunto. Primero entre los correos de los últimos 30 días que pasaron los filtros (sin candidatura o `unrelated`); ◇ no aparece → `[ Buscar en Gmail ]` hace una consulta acotada (`from:`/`subject:` + `newer_than:30d`, `messages.list` con `q`) y muestra hasta 10 resultados con fecha, remitente y asunto; para Proton, n8n busca por IMAP con los mismos criterios. Se elige uno → clasificación → `[[ Vincular ]]`.
   - **Pegar enlace**: acepta el enlace del hilo de Gmail en escritorio (`https://mail.google.com/mail/u/0/#inbox/{id}`), el que comparte la app de Gmail en el móvil (`https://mail.google.com/mail/?...#{id}` o `#all/{id}`) y un `message-id` (`<…@…>`); bajo el campo, un ejemplo del formato y "En el móvil: abre el correo en Gmail → ⋮ → Compartir → pega aquí". El núcleo extrae el id, lo obtiene por `messages.get` (`metadata` + `snippet`) y guarda solo referencia, asunto y extracto. ◇ enlace no reconocido → "No reconozco este enlace. Prueba a buscar por remitente o asunto." con la pestaña Buscar.
   Nunca se lee el buzón entero; cada búsqueda acotada queda en el historial ("Buscado en Gmail: from:rrhh@acme.es").
3. Telegram con confianza baja: los botones `[ Contactado ] [ Entrevista ] [ Rechazo ] [ No es de Radar ]` hacen lo mismo que la hoja para la candidatura sugerida; si la sugerencia es nula, el botón lleva a la hoja.
4. Deshacer: `[ No era esto ]` en el correo o en el historial revierte vínculo y transición (`actor = jose`).

### 9.13 Añadir una plataforma (Jose)

1. `/admin/radar/plataformas` → `[[ Añadir plataforma ]]` → `ConnectorSheet`.
2. Elige el conector entre los del paquete aún no configurados. ◇ no existe → mensaje "Primero hay que añadir su conector al paquete `radar-connectors`; el núcleo no cambia (D19)" y la hoja se cierra; añadirlo es una tarea del plan (fichero nuevo + fixtures), no de admin.
3. Rellena nombre, tipo, horario, límites (en scraping, mínimos de D20 no editables hacia arriba), consultas (perfil o propias), dominios de correo. Runtime fijado por el conector.
4. `SecretRef` muestra los secretos que el conector declara, dónde viven y si están. ◇ falta alguno → la hoja lo indica con el comando; se puede guardar igual como "Sin credenciales" (no se ejecuta).
5. `[ Probar ]` → `discover` con 3 resultados → títulos inline. ◇ error → texto del error inline (credenciales, red, captcha).
6. `[[ Guardar plataforma ]]` → fila en `radar_platforms` (`enabled = true` si hay credenciales y la prueba fue bien; si no, pausada) → toast "Plataforma guardada. Próxima pasada: {hora}." → tarjeta en la lista. ◇ Omen o Mac → nota "Se ejecuta en {runtime}; comprueba que su workflow o su tarea de launchd existen" con enlace a la nota técnica.

### 9.14 Pausar y reanudar el Radar (Jose)

1. `RadarPauseSwitch` (bandeja, plataformas o perfil) → modal: "Pausar Radar: deja de rastrear y de preparar. Las candidaturas abiertas siguen: correo, calendario y avisos de plazos continúan." + **"¿Hasta cuándo?"** con chips 3 días · 1 semana · 2 semanas · Fecha… · Sin fecha (por defecto, 1 semana) + casilla "Pausar también el seguimiento de correo" → `[[ Pausar hasta el {fecha} ]]` (o `[[ Pausar ]]` sin fecha).
2. Efectos: conectores → "Pausado (Radar en pausa)"; cola de preparación detenida; aviso por Telegram "Radar en pausa…"; banner R16 en bandeja, plataformas y perfil; resumen diario reducido a plazos y entrevistas (si el correo sigue).
3. Reanudar: ◇ con fecha → **se reanuda solo** ese día a las 07:00 (antes de la primera pasada); el día anterior a las 08:00 llega el aviso "Radar se reanuda mañana a las 07:00. ¿Sigue bien?" con `[ Sí ] [ Otra semana ] [ Sin fecha ]`. ◇ a mano → `[ Reanudar ]` en el banner o el interruptor. En ambos casos los conectores vuelven a su horario (o `[ Ejecutar ahora ]`) y llega "Radar reanudado. Próxima pasada: {plataforma} {hora}." El banner R16 dice "En pausa hasta el {fecha}" y el interruptor también.
4. Pausa de un solo conector: interruptor en su `ConnectorCard` (§7.14); no afecta al resto ni al correo.

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
| nav.contact.button | Contacto (botón de la cabecera) |
| skip | Saltar al contenido |
| footer.groups | Secciones · Contacto · Legal · Esta web |
| lang | ES · EN |
| offline.banner | Sin conexión. Cuando vuelva la red, sigo donde estabas. |
| ref.notice | Vienes por recomendación de {nombre}. Lo tengo en cuenta. |
| ref.notice.close | Cerrar |

### 10.2 Home y secciones

| Clave | Texto |
|---|---|
| hero.badge | Disponible para proyectos |
| hero.badge.busy | Agenda completa hasta {mes} |
| hero.title | {{DATO: nombre a mostrar}} (prototipo: "Jose Carlos Sánchez") |
| hero.sub | Desarrollador full-stack. Apps móviles, webs y sistemas con IA que se publican y se usan. React Native, Next.js, TypeScript, Supabase. |
| hero.cta | Ver proyectos |
| hero.link | Una web para mi negocio → |
| hero.scene.labels | móvil · web · IA · chip |
| hero.scene.aria | Partículas de código que forman un móvil, una web y un chip de IA. |
| proof.apps | apps publicadas — {n} en App Store y Google Play |
| proof.web | esta web — carga en menos de 1 s (alternativa: LCP {x} s) |
| proof.code | código público — {n} repos en GitHub |
| proof.price | precio cerrado — webs para negocios desde 900 € |
| proof.reply | respuesta — en menos de 24 h laborables |
| path.companies.label / title | empresas / Trabajo con empresas |
| path.companies.facts | Web (Next.js), móvil (React Native) e IA integrada · 40 €/h o feature con alcance cerrado, 150 € · {{DATO: disponibilidad}} |
| path.companies.cta / secondary | Ver cómo trabajo → / Reservar 20 min |
| path.business.label / title | negocios / Webs para tu negocio |
| path.business.facts | 4 packs, de 900 a 4.200 €, sin IVA · De 1 a 3 semanas, precio y plazo cerrados · Dominio y hosting a tu nombre |
| path.business.cta / secondary | Ver packs y precios → / Escribir por WhatsApp |
| home.projects.title / lead | Proyectos / Apps y webs con enlace a stores, web o código. |
| home.projects.all | Ver todos |
| home.thisweb.title | Cómo está hecha esta web |
| home.thisweb.lead | Esta web la he hecho yo con las mismas herramientas que uso en los proyectos. |
| home.thisweb.facts | Next.js {v} en Cloudflare Workers (OpenNext) · Gateway Hono con {n} rutas · Backend Fastify en servidor propio · Supabase: {n} tablas, {n} políticas RLS · {n} tests (Vitest, Playwright) |
| home.thisweb.metrics | Lighthouse {score} · LCP {lcp} s · INP {inp} ms, medidos en build |
| home.thisweb.build | {rama} · {commit} · publicado {fecha} |
| home.thisweb.read / code | Leer cómo está hecha / Código en GitHub |
| home.lastPost.title / all | Último artículo / Ver el blog |
| home.contact.title | Hablamos |
| home.contact.whatsapp / book | Escribir por WhatsApp / Reservar 20 min |
| home.contact.form / chat | Formulario / Preguntar al asistente |
| home.who.title | Quién te responde |
| home.who.role | Desarrollador full-stack freelance · {{DATO: ciudad}}, España |
| home.who.about | Sobre mí |
| footer.thisweb.title | Esta web |
| footer.build | {rama} · {commit} · publicado {fecha} · LCP {x} s en móvil |
| footer.stack | Next.js en Cloudflare Workers · gateway Hono · Fastify en servidor propio · Supabase |
| footer.code / how | Código en GitHub / Cómo está hecha |
| footer.copyright | © {año} {{DATO: nombre}} · {{DATO: ciudad}}, España |
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
| admin.nav | Resumen · Leads · Radar · Comentarios · Clientes · Ampliaciones · Afiliados · Chat (móvil: Leads · Radar · Clientes · Más) |
| admin.radar.today | Radar hoy: {entrevistas} · {plazos} · {conectores con error} |
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

### 10.8 Radar (admin y Telegram)

| Clave | Texto |
|---|---|
| radar.title | Radar |
| radar.subnav | Bandeja · Calendario · Plataformas · Perfil |
| radar.active / paused | Radar activo / En pausa desde el {fecha} |
| radar.lastRun | Última pasada: {plataforma} hace {t} · … |
| radar.counters | Pendientes de ti · Descubiertas · Enviadas · En contacto · Entrevistas · Ofertas · Cerradas |
| radar.status | Descubierta · Preparada · Por confirmar · Enviada · En contacto · Entrevista · Oferta · Rechazada · Descartada |
| radar.substatus | Preparando… · Confirmada · por marcar enviada · Pospuesta hasta el {fecha} · Enviando… · Error de envío |
| radar.filters | Tipo · Plataforma · Estado · Puntuación · Descubierta · Con correo nuevo · Incluir pospuestas |
| radar.type | Todo · Empleo · Freelance |
| radar.remote | Remoto · Híbrido · Presencial · Sin dato |
| radar.score.band | alto · medio · bajo |
| radar.sort | Puntuación · Plazo · Más recientes · Última actividad |
| radar.deadline | Vence en {n} d · Vence hoy · Vence en {n} h · Caducada · Sin plazo |
| radar.mail | {n} correo nuevo / {n} correos nuevos · Correo por clasificar |
| radar.row.actions | Confirmar · Posponer · Descartar · Abrir · Clasificar · Marcar enviada · Preparar de todos modos |
| radar.empty.first | Aún no hay ofertas. Radar hará la primera pasada a las {hora}, o ejecuta una plataforma ahora. |
| radar.empty.filters | No hay candidaturas con estos filtros. |
| radar.empty.pending | Nada que decidir. {n} candidaturas en curso. |
| radar.confirm.title | Confirmar envío |
| radar.confirm.connector | Al confirmar se enviará por la API de {plataforma} con: {materiales}. No se puede deshacer en la plataforma. |
| radar.confirm.assisted | Al confirmar se abrirá la oferta en {plataforma} en una pestaña nueva y el material queda listo para copiar. Cuando la hayas enviado, márcala como enviada. |
| radar.confirm.cta.connector / assisted | Confirmar y enviar / Confirmar y abrir |
| radar.confirm.blocked | {n} campos sin valor · {m} datos por confirmar · sin referencias a la oferta · Completar en el detalle / Guarda o descarta los cambios antes de confirmar. / Hay hechos que no constan en el CV maestro. |
| radar.template.count | {n} referencias concretas a {empresa} / a la oferta |
| radar.template.zero | Sin referencias concretas a la oferta: la carta parece una plantilla. Regenera con "destaca X" o edítala. |
| radar.template.mark | Marcar como referencia |
| radar.template.unknown | No consta en la oferta |
| radar.form.unmapped.block | Hay campos "Rellénalo tú" vacíos: no se puede enviar por API. |
| radar.editLater | Editar en el portátil |
| radar.editLater.options | Hoy 18:00 · Mañana 09:00 · Hora… |
| radar.editLater.state | Pospuesta hasta {hora} · para editar |
| radar.preview.toggle | Ver cómo queda |
| radar.email.link.tabs | Buscar · Pegar enlace |
| radar.email.link.example | Ejemplo: https://mail.google.com/mail/u/0/#inbox/18f3c2… |
| radar.email.link.mobileHint | En el móvil: abre el correo en Gmail → ⋮ → Compartir → pega aquí. |
| radar.email.link.gmailSearch | Buscar en Gmail |
| radar.email.link.bad | No reconozco este enlace. Prueba a buscar por remitente o asunto. |
| radar.confirm.seeMaterial | Ver el material antes |
| radar.sending / sent | Enviando por {plataforma}… / Enviada el {fecha} · recibo {recibo} |
| radar.sendError | No se ha enviado: {motivo}. Puedes reintentar o pasar a modo asistido. |
| radar.assisted.done | Confirmada a las {hora} · por marcar enviada |
| radar.markSent | Marcar enviada |
| radar.snooze.title | ¿Hasta cuándo? |
| radar.snooze.options | Mañana 08:00 · 3 días · Lunes · Fecha… |
| radar.snooze.warn | La oferta vence el {fecha}, antes de esa fecha. |
| radar.snooze.done | Pospuesta hasta el {fecha}. |
| radar.discard.reasons | No me interesa · Salario/tarifa · Presencial/zona · Ya enviada por otra vía · Duplicada · Otra |
| radar.discard.exclude | No volver a mostrar ofertas de {empresa} |
| radar.discard.done / undo | Descartada. / Deshacer |
| radar.why | Por qué {score}/100 |
| radar.why.meta | puntuada con perfil v{n} · {modelo} · {fecha} |
| radar.rescore / newProfile | Repuntuar / Perfil v{n} disponible |
| radar.notInterested | No me interesa |
| radar.offer.open | Ver la oferta en {plataforma} |
| radar.offer.dup | La misma oferta está en {plataforma}. |
| radar.offer.expired | La oferta caducó el {fecha}. La candidatura se descartó sola. |
| radar.materials.tabs | CV adaptado · Carta · Propuesta · Formulario · Respuestas |
| radar.materials.version | v{n} · {IA / tú} · hace {t} |
| radar.materials.actions | Regenerar · Copiar · Descargar PDF · Guardar |
| radar.materials.regen.hint | Instrucción opcional (más corta, destaca X…) |
| radar.materials.diff | Qué cambió respecto al CV maestro |
| radar.materials.unknownFact | No consta en el CV maestro |
| radar.materials.preparing | Preparando CV y carta… suele tardar 1–2 min. |
| radar.materials.aiDown | La IA no responde; Radar reintenta cada 10 min. Puedes escribir el material a mano. |
| radar.materials.pdfFallback | Genera el PDF desde el navegador |
| radar.materials.unsaved | Tienes cambios sin guardar. |
| radar.form.required / empty / unmapped | obligatorio / sin valor / Rellénalo tú |
| radar.state.change | Marcar como {estado}. No avisa a nadie; solo cambia el estado. |
| radar.outcome | Aceptada · Declinada · Sin decidir |
| radar.reopen | Reabrir |
| radar.followup | Seguimiento: {fecha} |
| radar.followup.draft | Preparar borrador de seguimiento |
| radar.followup.open | Abrir borrador en Gmail |
| radar.event.proposed | Propuesto |
| radar.event.create | Crear en el calendario Radar |
| radar.event.new / edit / discard | Nuevo evento / Editar / Descartar |
| radar.event.types | Entrevista · Llamada · Plazo |
| radar.event.google | Ver en Google Calendar |
| radar.event.moved | Movido en Google el {fecha} |
| radar.event.overlap | Coincide con {evento}. |
| radar.email.new | Nuevo |
| radar.email.kinds | Contactado · Entrevista · Oferta · Rechazo · Info |
| radar.email.confidence | {clasificación} · {confianza} · Por clasificar |
| radar.email.open | Abrir hilo |
| radar.email.wrong | No era esto |
| radar.email.link | Vincular correo |
| radar.email.link.tabs | Recibidos sin vincular · Por enlace o ID |
| radar.email.notRadar | No es de Radar |
| radar.email.review | {n} correos por clasificar. |
| radar.notes.saved | Guardado {hora} |
| radar.history | Historial |
| radar.history.confirmed | Confirmada por Jose desde {Telegram / admin} |
| platforms.next | Próximas pasadas: {lista} |
| platforms.access | API · MCP · Feed · Scraping · Correo |
| platforms.runtime | Gateway · Omen · Mac |
| platforms.submit | Propio · Asistido |
| platforms.status | Activo · Pausado · Pausado (Radar en pausa) · Detenido por error · Detenido: verificación de seguridad · Sin credenciales · Esperando al Mac |
| platforms.lastRun | hace {t} · OK · {n} ofertas, {m} nuevas / hace {t} · error {detalle} · reintento a las {hora} |
| platforms.limits | {n} pasada/día · ≤ {m} ofertas · pausas {a}–{b} s |
| platforms.run / edit / reactivate / pause | Ejecutar ahora / Editar / Reactivar / Pausar |
| platforms.run.mac | Se ejecuta desde el Mac a su hora. |
| platforms.captcha | Detenido: verificación de seguridad en {plataforma} a las {hora}. No se resuelve sola. Entra en {plataforma} a mano, comprueba tu sesión y reactiva el conector. |
| platforms.captcha.check | He comprobado la sesión a mano |
| platforms.linkedin.note | La alternativa por correo `linkedin-email` sigue activa. |
| platforms.add / save / test | Añadir plataforma / Guardar plataforma / Probar |
| platforms.connector.missing | Primero hay que añadir su conector al paquete `radar-connectors`; el núcleo no cambia. |
| platforms.schedule | Cada día 07:00 · Cada 6 h · Cada hora · Cron… |
| platforms.secrets | Credenciales |
| platforms.secret.ok / missing | configurado / falta |
| platforms.secret.hint | Ponla con `{comando}`; aquí nunca se escribe el valor. |
| platforms.saved | Plataforma guardada. Próxima pasada: {hora}. |
| platforms.empty | Sin plataformas. Añade la primera; Tecnoempleo e InfoJobs son las de menos riesgo. |
| platforms.omenDown | Omen sin respuesta desde las {hora} |
| profile.title | Perfil v{n} · desde el {fecha} · `content/radar/profile.json` |
| profile.stale | Ofertas activas puntuadas con una versión anterior: {n} |
| profile.rescoreAll | Repuntuar las activas |
| profile.editRepo | Editar en el repo |
| profile.sections | Roles · Palabras clave · Modalidad y zona · Mínimos · Idiomas · Exclusiones · Disponibilidad · Contacto y enlaces |
| profile.quick | Ajustes rápidos |
| profile.threshold | Umbral de preparación |
| profile.threshold.hint | Con {umbral} se habrían preparado {n} de las {m} ofertas de la última semana. |
| profile.exclusions | Exclusiones rápidas |
| profile.availability | Disponibilidad |
| profile.save | Guardar ajustes |
| profile.saved | Guardado. Se aplica a las ofertas nuevas; para las activas, Repuntuar. |
| profile.cv | CV maestro |
| profile.cv.indeed | Indeed tiene tu CV del {fecha}; el maestro es del {fecha}. |
| profile.voice | Cartas y propuestas usan `Comercial/voz.md` en registro formal-cercano. |
| profile.missing | No hay perfil. Radar no puntúa hasta que exista `content/radar/profile.json`. |
| profile.cv.missing | Sin CV maestro en {idioma}: no se preparan candidaturas en ese idioma. |
| calendar.views | Mes · Semana · Agenda |
| calendar.synced | Sincronizado con Google hace {t} |
| calendar.filters | Entrevistas · Llamadas · Plazos · Seguimientos · Propuestos |
| calendar.deadline / followup | Vence: {empresa} / Seguir: {empresa} |
| calendar.empty | Sin eventos en {periodo}. |
| calendar.googleDown | No puedo leer Google Calendar ({motivo}). Muestro lo que Radar ya conoce. |
| radar.google.expired | El acceso a Gmail y Google Calendar caducó el {fecha}. Radar no lee correo ni calendario hasta que lo autorices de nuevo. |
| radar.google.reauth | Volver a autorizar Google |
| radar.gmailDown | No puedo leer Gmail desde las {hora}. Reintento cada 30 min. |
| radar.protonDown | Proton no está conectado (Bridge apagado en Omen). |
| radar.omenDown | Omen sin respuesta desde las {hora}: {plataformas} no rastrean; el resto sigue. |
| radar.telegramDown | {n} avisos de Telegram sin entregar desde las {hora}. Las candidaturas están en la bandeja. |
| radar.pause.title | Pausar Radar |
| radar.pause.until | ¿Hasta cuándo? · 3 días · 1 semana · 2 semanas · Fecha… · Sin fecha |
| radar.pause.cta | Pausar hasta el {fecha} / Pausar |
| radar.pause.bannerUntil | Radar en pausa hasta el {fecha}: no rastrea ni prepara. Correo, calendario y avisos siguen. |
| tg.resumeTomorrow | Radar se reanuda mañana a las 07:00. ¿Sigue bien? · Sí · Otra semana · Sin fecha |
| radar.pause.body | Deja de rastrear y de preparar. Las candidaturas abiertas siguen: correo, calendario y avisos de plazos continúan. |
| radar.pause.mail | Pausar también el seguimiento de correo |
| radar.pause.banner | Radar en pausa desde el {fecha}: no rastrea ni prepara. Correo, calendario y avisos siguen. |
| radar.resume / resumed | Reanudar / Radar reanudado. Próxima pasada: {plataforma} {hora}. |
| tg.prepared | Radar · candidatura preparada · {score}/100 |
| tg.why / send | Por qué: {motivos} / Envío: por API de {plataforma} ({materiales}) · Envío: asistido (se abre el enlace con todo preparado) |
| tg.link | Ver y editar → {enlace} |
| tg.buttons | Confirmar · Posponer · Descartar · Ver material · Ver y editar |
| tg.material | Material: visto {cuándo} · {n} referencias a {empresa} · sin bloqueos / no lo has visto · {n} referencias / {m} datos por confirmar · no se puede enviar desde aquí / asistido · {n} referencias · {k} avisos |
| tg.secondStep | Enviar a {empresa} por {plataforma} ({materiales}). ¿Seguro? · Sí, enviar · No |
| tg.secondStep.expired | Confirmación caducada. Vuelve a pulsar Confirmar. |
| tg.changed | El material ha cambiado. Míralo antes de enviar. |
| tg.editReminder | Te pusiste editar {título} · {empresa} a las {hora} → {enlace} |
| tg.confirmed.sending | Confirmada {hora} · Enviando… |
| tg.sent | Enviada {hora} · recibo {recibo} · Ver → {enlace} |
| tg.assisted | Confirmada {hora}. Abre la oferta y envía el material: {url} · Material listo → {enlace} |
| tg.markSent | Marcar enviada |
| tg.sendError | No se ha podido enviar: {motivo}. Paso a modo asistido: {url} |
| tg.snooze | ¿Hasta cuándo? · Mañana 08:00 · 3 días · Lunes |
| tg.snoozed | Pospuesta hasta el {fecha}. |
| tg.discarded / undo / restored | Descartada. / Deshacer / Recuperada. |
| tg.stale | Esta candidatura ya está {estado}. |
| tg.deadline | Vence mañana {hora}: {título} · {empresa} · {estado} → {enlace} |
| tg.followup | 7 días sin novedad: {título} · {empresa}. Borrador de seguimiento listo en Gmail → {enlace} |
| tg.email.linked | Correo de {empresa}: «{asunto}» · clasificado como {kind} ({confianza}) → {enlace} |
| tg.email.ask | Correo de {remitente}: «{asunto}» · ¿Qué es? |
| tg.email.buttons | Contactado · Entrevista · Rechazo · No es de Radar |
| tg.event | {tipo} propuesta: {fecha} {hora}, {duración}, {enlace} · {empresa}. ¿La creo en el calendario Radar? |
| tg.event.buttons | Crear · Ver · Descartar |
| tg.connector | {plataforma} detenido: {motivo} a las {hora}. No se reintenta hasta que lo reactives → {enlace} |
| tg.daily | Hoy: {entrevistas} · {plazos} · {pendientes} pendientes de ti → {enlace} |
| tg.weekly | Semana: {n} ofertas ≥ {umbral} · {enviadas} enviadas · {contacto} en contacto · {entrevistas} entrevistas. {desglose por plataforma}. |

---

## 11. Eventos de analítica por pantalla (Umami)

| Evento (D11) | Dónde | Propiedades |
|---|---|---|
| `whatsapp_click` | home, negocios, contacto, propuesta, área, recomiéndame (compartir) | `origin`, `pack?`, `ref?` |
| `contact_submit` | contacto | `via` |
| `proposal_generated` | generador | `pack`, `questions` (3/4) |
| `proposal_sent` | generador | `pack`, `has_ref` |
| `chat_started` | chat | — |
| Propuestos (§13): `intro_played {skipped, reduced}`, `path_open {path}` (home), `scene_drag` (home, una vez por sesión), `booking_open {origin}` (Cal.com), `referral_copy` (recomiéndame) | | |
| `intro_played` añade `mode` (`live` · `video` · `poster`) para saber qué respaldo vio cada visita (§4.1) | home | `mode` |

Radar no se mide con Umami (es admin): sus métricas (ofertas/semana, tiempo hasta confirmar, correos vinculados, envíos sin confirmación = 0, plazos avisados) salen de `radar_*` (spec §13.1) y se muestran en el resumen semanal de Telegram.

---

## 12. Reglas de accesibilidad y motion que condicionan la UI

- Un `h1` por página; landmarks `header`, `nav`, `main`, `footer`; "Saltar al contenido".
- Chips del generador y segmentos son `radio`/`checkbox` reales o `button` con `aria-pressed`; navegables por teclado; el foco se mueve a la nueva pregunta al responder y se anuncia (`aria-live="polite"`) la llegada de la propuesta.
- `IntroFall`: los `span` de caracteres van en contenedores `aria-hidden`; cada elemento animado expone su texto final desde 0 ms (texto oculto visualmente o `aria-label`); los glifos intermedios no se anuncian; "Saltar al contenido" es el primer elemento enfocable y cualquier tecla termina la intro. `GlyphScene` lleva `role="img"` y `aria-label`; `Backdrop` es `aria-hidden` y nunca porta información. `CompileReveal` no toca el texto accesible del `h2`.
- Cabecera: `nav` con lista plana, `aria-current="page"`, indicador de activo visible además del color; hoja "Menú" con foco atrapado, cierre con Escape y retorno del foco al botón "Menú".
- Scroll personalizado (Lenis o similar): desactivado con `prefers-reduced-motion`; anclas (`#comentarios`, `#hablamos`) y foco por teclado funcionan igual; sin secuestro del scroll en móvil. La escena del hero no captura el scroll vertical (solo el arrastre horizontal gira).
- La escena y las miniaturas se pausan fuera del viewport y con la pestaña oculta (`visibilitychange`); nunca animan por debajo del pliegue si no se ven.
- Objetivos táctiles ≥ 44 px; barra inferior del área y del admin con etiquetas de texto, no solo iconos.
- Estados nunca solo por color: `StatusBadge` siempre con texto.
- Modales con foco atrapado y cierre con Escape; `Sheet` en móvil ocupa ≤ 90 % de alto y se cierra deslizando o con botón.
- Toasts con tiempo suficiente (≥ 6 s) y accesibles por `aria-live`; los que llevan acción (Deshacer, Entrar) no se cierran solos.
- `HeroMedia`: el poster lleva `role="img"` y el `aria-label` de la escena; el vídeo lleva `aria-label`, sin controles, `muted`, y **no se reproduce con `prefers-reduced-motion`** (queda el poster); se pausa fuera del viewport. La intro reducida sigue las reglas de `IntroFall` (texto accesible desde 0 ms).
- Radar: la bandeja es una tabla real (`table` con `th`/`scope`) en escritorio y una lista de tarjetas en móvil; las acciones rápidas por fila tienen nombre accesible con el título de la oferta ("Confirmar Senior React Native en Acme"). `ScoreBadge`, `DeadlineTag`, `MailTag` y `StatusBadge` siempre con texto. Los contadores anuncian cambios con `aria-live="polite"` solo al aplicar un filtro.
- Radar: la barra de decisión fija del detalle en móvil no tapa contenido (`padding-bottom`) y sus tres botones tienen ≥ 44 px; el editor de materiales es un `textarea` etiquetado con atajo ⌘S anunciado; la previsualización no es `aria-live` y en móvil es un `details`/`summary` ("Ver cómo queda"); las referencias concretas resaltadas llevan marca de texto (`mark` con `title`), no solo color; el selector de versión es un `select` real.
- Radar: el calendario ofrece siempre la vista Agenda (lista por día, navegable por teclado) como alternativa a la rejilla; cada evento es un botón con nombre completo (tipo, empresa, hora); los eventos propuestos se distinguen por el texto "Propuesto", no solo por el borde.
- Radar: los modales de confirmación (`ConfirmSendModal`, pausa, cambio de estado) llevan el texto de consecuencia dentro del diálogo (`aria-describedby`); Escape cancela, nunca confirma.

---

## 13. Decisiones abiertas para `ui` (y para Jose donde se indica)

1. **Acento y paleta oscura**: 3 propuestas; Jose elige viendo muestras (spec §12).
2. **Tres familias tipográficas** (titulares / texto / UI y menús) fuera de la lista negra (sin Inter con degradado).
3. **Escena, intro, `HeroMedia` y miniaturas**: partir de los parámetros del prototipo `hero-lab-3` (hold 3,5 s, morph 1,6 s, tamaño de glifo 16, brillo 0,8, verde 14 %, respiración 0,025, ondas 4 s / 0,6, dispersión 0,6; grano 3,5 % / 180 px; rayo 10 % / 14 % / 214° / 48 px) y ajustar con Jose; altura de la columna en móvil (≤ 38 svh; 34 svh en alturas ≤ 700 px) verificando el presupuesto de §4.1 (CTA y enlace en la misma fila sobre el pliegue) en 375×667 y 390×844; cómo se producen el **poster** (≤ 60 KB, estado "móvil") y el **vídeo** (≤ 400 KB, 15,3 s, sin audio, ciclo completo) de `HeroMedia` en build desde la misma nube, y si la etiqueta de estado se sincroniza con `currentTime`; las **miniaturas** de los paneles (renderer compartido o sprite); `CompileReveal` v3 (duración ≤ 300 ms, curva de resolución); presupuesto de rendimiento para CWV en verde en móvil 4G (D16).
4. **Retrato en Sobre mí** (Jose decide): la única foto del sitio, o un avatar generativo. Para Marta, una cara real aumenta la confianza; para la dirección visual, rompe la regla "sin fotos". Recomendación de `ux`: una foto, tratada con la misma estética (recorte y color de la paleta), solo en Sobre mí y en la tarjeta de datos de Contacto.
5. **Capturas de producto en Proyectos**: son de producto, no fotos; `ui` define el marco de móvil y el tratamiento (sin mockups brillantes).
6. **Tratamiento de precio** (`PriceTag`): tamaño, "sin IVA" secundario, sin tachados ni "recomendado".
7. **Barra fija móvil de `/negocios`**: `ui` decide altura y si se oculta al hacer scroll hacia abajo.
8. **Densidad del admin**: tablas compactas en escritorio, tarjetas en móvil; `ui` define los componentes de `DataTable` y `Sheet` sobre shadcn.
9. **Iconografía**: set único y sobrio (sin iconos brillantes ni duotono de plantilla); usos concretos: proveedores de auth, stores, WhatsApp, estados.
10. **Estados vacíos**: si llevan motivo generativo pequeño o solo texto.
11. **Transiciones de página** (GSAP): las de §3.7 (120/160 ms); `ui` ajusta valores, no el tipo.
11b. **Cabecera**: indicador del enlace activo, aspecto del botón `[Contacto]` (primario pequeño) frente al primario grande del hero, comportamiento del fondo translúcido tras 80 px, menú del avatar; en 375 px, que `[Contacto]` y "Menú" no se toquen (≥ 44 px cada uno).
11c. **Pie y `BuildFacts`**: qué datos del build caben en la columna "Esta web" y cómo se compone el esquema de arquitectura en texto (monoespaciada, sin gráficos) en móvil y escritorio.
11d. **`PathPanel`**: composición del panel-enlace con enlace secundario independiente; foco visible en el panel entero; tamaño y posición de la miniatura; estado hover (halo + morph corto).
12. **`ProposalCard`**: es la pieza que Marta va a mirar más tiempo; merece una composición propia (pack, incluye, precio, plazo, nota) legible en 390 px.
13. **Eventos extra de Umami** (`path_companies`, `path_business`, `booking_open`, `referral_copy`): confirmar con Jose; no cuestan nada.
14. **Chat: página completa o panel lateral**: `ux` fija página completa (`/chat`) para que sea indexable como funcionalidad y simple en móvil; `ui` puede añadir un acceso flotante discreto solo en escritorio (no en móvil, donde compite con WhatsApp).
15. **Nombre a mostrar en el hero** (Jose decide, §18): el prototipo aprobado usa "Jose Carlos Sánchez" en dos líneas; confirmar tildes y si va el segundo apellido (afecta al tamaño del `h1` en 375 px, al presupuesto móvil de §4.1 y al JSON-LD `Person`).
16. **Radar, piezas de la bandeja**: `ScoreBadge` (número + tramo con texto; tamaño en fila y en detalle), `DeadlineTag` (ámbar < 48 h, rojo < 24 h, siempre con texto), `MailTag`, `StatusCounters`; densidad de la tabla en escritorio (una línea por candidatura con acciones a la derecha) y tarjeta en móvil; barra de decisión fija del detalle en móvil (tres acciones, ≥ 44 px, sin tapar contenido).
17. **Editor de materiales** (`MaterialEditor`): editor Markdown + previsualización (textarea con vista renderizada; no WYSIWYG); previsualización del CV con la hoja de estilos del PDF (misma para impresión); selector de versiones; `FormPayloadTable`.
18. **Calendario** (`RadarCalendar`): shadcn no trae vista mensual ni semanal; elegir una librería ligera o construir Agenda (lista por día) + rejilla simple; Agenda por defecto en móvil; estilo de los eventos propuestos (borde discontinuo + texto "Propuesto").
19. **Para `arquitecto` (no `ui`)**, decisiones que este documento asume y el plan debe confirmar: (a) perfil de Radar en admin **solo lectura + ajustes rápidos** (umbral, exclusiones, disponibilidad en Supabase) y edición del resto en el repo; alternativa: edición completa escribiendo `radar_profile_versions`; (b) "posponer" como `next_action_at` + evento `kind = 'note'` con `payload.snoozed_until`, o nuevo `kind = 'snoozed'`; (c) flag `HERO_LIVE_MOBILE` y tarea de medición CWV en 4G (D16); (d) reautorización de Google desde admin (`/admin/radar/plataformas?google=reauth` → consentimiento → vuelta con toast); (e) hoja "Correos por revisar" como `?correos=revisar` en la bandeja en vez de ruta propia; (f) PDF del CV en el gateway (Browser Rendering) o impresión en el navegador como respaldo; (g) botones de Telegram: Confirmar · Posponer · Descartar + enlace "Ver y editar" (o botón "Ver material") en vez de "Confirmar · Editar · Descartar" de la spec §13.2; el enlace cumple el "Editar"; (h) `radar_applications.last_viewed_at` y `last_viewed_material_version` (o evento `kind = 'viewed'`) para la regla "visto" de Telegram, y el segundo paso con caducidad de 10 min guardado como `pending_second_step` en KV o en el evento; (i) `radar_platforms`/ajustes: `paused_until` para la pausa con fecha y el cron que reanuda; (j) marcas de referencias concretas de la IA en `radar_materials` (`payload.references[]` con offsets) para el control de plantilla.
20. **Titular y CTA del hero** (Jose decide, §4.1 "Alternativas"): mantener el prototipo, (A) dos CTA con el mismo peso, (B) subtítulo para las dos audiencias sin tecnologías, o B + A. `ux` recomienda B. Afecta a `hero.sub`, `hero.link` y al presupuesto móvil.
21. **Indicador de estado de la escena**: la etiqueta con texto del prototipo no va a producción; `ui` decide si hay un indicador sin palabras o nada (§4.1).

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
| Navegación clásica: cabecera fija con cinco enlaces + Entrar + Contacto; hoja "Menú" plana en móvil; sin árbol ni pestañas | Decisión de Jose (2026-09-19) al descartar el IDE-lite; cinco secciones no necesitan árbol y Marta reconoce una cabecera normal |
| Sin barra inferior fija global en móvil | `[Contacto]` fijo en la cabecera ya da la acción permanente; una barra inferior restaría 52–56 px al hero en 375×667 y chocaría con la barra fija de `/negocios`; Chat exige cuenta y no es vía de Marta (§3.1) |
| Intro de caída y aterrizaje una vez por sesión (`sessionStorage.intro_seen`), 0,4–1,2 s, sin enlace "Saltar" visible | Prototipo aprobado; dura menos que un scroll y cualquier interacción la termina; `sessionStorage` en vez de `localStorage` porque Jose quiere verla en cada sesión nueva, no una vez al día |
| Datos del build en el pie ("Esta web") y en "Cómo está hecha esta web" | Son los únicos datos "en vivo" permitidos por la spec (generados en build, no en tiempo real); heredan el sitio de la línea de estado |
| La única barra inferior fija del sitio público es la de `/negocios` | Es la página donde Marta compara y decide; sin línea de estado ya no hay conflicto |
| Home: hero split + franja de prueba + dos paneles de vía + proyectos + cómo está hecha + último artículo + contacto con "Quién te responde"; sin índice de secciones | La spec pide "dos vías con el mismo peso" y "home sin scroll" para la tesis: el hero da la tesis y las dos salidas; los paneles explican las vías sin partir la página; el índice era un artefacto del IDE-lite |
| Miniaturas de partículas en los paneles de vía solo en escritorio; imagen estática en móvil | Presupuesto CWV en móvil 4G con la escena del hero ya activa (spec §1) |
| Móvil: vídeo/poster de la escena por defecto (`HeroMedia`), escena viva solo con `HERO_LIVE_MOBILE`; poster en el HTML como candidato a LCP; vídeo tras el LCP sin fundido | Spec §12 D16 (patrón Resend); un elemento grande que aparece tarde empeora el LCP; el vídeo decodifica barato donde WebGL no |
| Móvil: `[[ Ver proyectos ]]` y `> Una web para mi negocio →` en la misma fila; columna de escena a 34 svh en alturas ≤ 700 px | Presupuesto de §4.1: con el enlace en línea propia la salida de Marta caía bajo el pliegue en 375×667 |
| Intro reducida (solo letras) donde no hay escena viva; el vídeo no incluye la caída de partículas | Spec D16 ("las letras caen igual"); dos codificaciones o un `seek` inicial no compensan 1,2 s |
| Radar como sección de `/admin` con subnavegación por segmento (Bandeja · Calendario · Plataformas · Perfil); admin → Radar → detalle como tres niveles | Regla de tres niveles; el segmento no es navegación |
| Barra inferior móvil del admin pasa a Leads · Radar · Clientes · Más (Chat a "Más") | Decidir candidaturas es diario; el takeover del chat es ocasional |
| Confirmar desde la fila y desde Telegram sin abrir el detalle, pero **siempre** con el texto de lo que va a pasar (`ConfirmSendModal` o el propio mensaje); selección múltiple nunca para Confirmar | D18: confirmación de un clic por candidatura, sin lotes; "≤ 3 min por candidatura" exige no abrir el detalle cuando el resumen basta |
| Posponer como tercera decisión (además de Confirmar y Descartar) en admin y Telegram; enlace "Ver y editar" hace de "Editar" | Jose decide desde el teléfono y no siempre puede editar; posponer evita descartar por falta de tiempo; editar en Telegram no es viable |
| Modo asistido con subestado "Confirmada · por marcar enviada" visible en bandeja, detalle y Telegram | Sin él, una candidatura confirmada pero no enviada se pierde entre Preparadas |
| Materiales: la IA no inventa; hechos ausentes del CV maestro bloquean la confirmación hasta que Jose los edita o aprueba | Spec §13.7: "una carta genérica hace más daño que no enviar"; el reclutador de `usuario-ejemplo` lo evalúa |
| Perfil en admin solo lectura + ajustes rápidos (umbral, exclusiones, disponibilidad) | El JSON del repo es la única fuente de hechos para la IA (spec §13.4); lo que cambia a diario sí se edita en admin (§13.19a) |
| Credenciales de plataformas solo referidas (nombre, dónde vive, configurado/falta); nunca un campo de valor | Regla global de secretos; el admin no es un gestor de secretos |
| Correo: solo asunto, extracto y enlace al hilo en todas las pantallas y avisos; vinculación manual por lista filtrada o por id, nunca leyendo el buzón | Spec §13.7 privacidad del correo |
| Calendario: crear = confirmar (el botón "Crear en el calendario Radar" es la confirmación); nada se mueve ni borra desde admin sin ese clic; cambios a mano se hacen en Google y se leen cada hora | D23 y regla global de Calendar |
| Pausa del Radar detiene rastreo y preparación, no el seguimiento de correo ni el calendario (salvo casilla) | Pausar la búsqueda no debe dejar sin seguimiento las candidaturas ya enviadas |
| Telegram: "Confirmar" para envío por API solo si el material está visto y sin bloqueos, con segundo paso "¿Seguro?" que caduca en 10 min; sin ver, "Ver material"; con bloqueos, "Ver y editar"; asistido confirma directo | §16.4 J1: un envío irreversible no se confirma a ciegas; abrir un enlace sí |
| Control de plantilla: ≥ 2 referencias concretas a la oferta o empresa, resaltadas, para enviar por API; "Rellénalo tú" vacíos bloquean el envío por API; en asistido se avisa sin bloquear | §16.4 R1 (reclutadora): una carta genérica hace más daño que no enviar (spec §13.7); en asistido Jose ve el material al copiarlo |
| Pausa con fecha (3 días · 1 semana · 2 semanas · Fecha · Sin fecha), reanudación automática y aviso el día anterior | §16.4 J2: una pausa sin fecha se olvida |
| Móvil: "Editar en el portátil" como acción recomendada (recordatorio a una hora) y previsualización plegable bajo el editor, no segmento excluyente | §16.4 J3: editar un CV a 375 px no es razonable; corregir una frase sí |
| Vincular correo por enlace compartido desde la app de Gmail o por búsqueda por remitente/asunto sin ID, con ejemplo del formato | §16.4 J4: el `message-id` no está a mano en el móvil |
| La etiqueta "móvil · web · IA · chip" no se muestra en producción (indicador sin palabras o nada) | §16.4 M6: es una herramienta del prototipo; a Marta "chip" no le dice nada |
| Titular y CTA del hero: dos alternativas (A, B) preparadas para Jose sin cambiar el prototipo | §16.4 M7: decisión de Jose |

---

## 15. Validación

`usuario-ejemplo` recorrió la v1.0 de este documento el 2026-09-17 como Marta (§4.1, §4.3, §4.4, §4.10, §6, §9.1/9.3/9.7/9.8) y como Dani (§4.2, §4.5–4.9, §4.11, §9.2/9.5/9.6). Ambas personas PASAN. Las fricciones y su tratamiento están en §16.

**Pendiente en v3:** recorrer de nuevo §3 y §4.1 (cabecera, hoja "Menú", hero split, intro, franja de prueba, paneles de vía, contacto con "Quién te responde") como Marta en 375 px y como Dani en escritorio. Las pantallas interiores no cambian de contenido y no necesitan nueva pasada.

**Hecho en v3.2** (§16.4): las tres pasadas de v3.1 se hicieron el 2026-09-19 y los tres PASAN; cambios incorporados abajo. Queda pendiente para v3.3 volver a pasar §7.17 y §9.11 (Telegram con "visto", bloqueos y segundo paso) como Jose operador cuando `arquitecto` cierre §13.19h.

**Pasada de v3.1 (2026-09-19):** (1) como **Jose operador**: decidir una candidatura en ≤ 3 min desde Telegram (§7.17, §9.11) y desde el detalle en 375 px (§7.13), vincular un correo a mano (§9.12), añadir una plataforma sin credenciales (§9.13), pausar y reanudar (§9.14), y entender cada estado de error de §7.18 sin leer la spec; (2) como **reclutador** que recibe el material (spec §13.9): evaluar 5 candidaturas preparadas (CV adaptado, carta o propuesta) y marcar cualquier frase que suene genérica o no verificable; (3) como **Marta en 375 px con vídeo/poster** (§4.1): que el hero con la intro reducida siga dando la salida `> Una web para mi negocio →` sobre el pliegue en 375×667.

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

### 16.4 Validación de v3.1 (2026-09-19): Jose operador, reclutadora y Marta — los tres PASAN

**Jose operador — cambios incorporados**

| # | Fricción | Cambio | Dónde |
|---|---|---|---|
| J1 (grave) | Confirmar desde Telegram era un envío por API irreversible sin haber visto el material completo, y no se decía qué pasaba con un dato "no consta en el CV maestro" pendiente | (a) El mensaje lleva una línea "Material:" con visto / no visto, referencias concretas y bloqueos; con bloqueos dice "1 dato por confirmar · no se puede enviar desde aquí" y **no hay botón Confirmar**, solo "Ver y editar". (b) Para envío por API, "Confirmar" solo aparece si Jose ya abrió Materiales de esa candidatura y la versión no cambió desde entonces (`last_viewed_at`); si no, el botón es "Ver material" y se confirma en el detalle. Modo asistido confirma directo. (c) Envío por API: segundo paso en el propio mensaje ("Enviar a {empresa} por {plataforma}: Sí / No") con caducidad de 10 min y recomprobación de visto + bloqueos + versión al pulsar Sí | §7.13 (Visto), §7.17 (tabla de casos, segundo paso), §9.11 reescrito, §10.8 (`tg.material`, `tg.secondStep`), §13.19h, §14 |
| J2 | La pausa no tenía fecha y se olvidaría | `RadarPauseSwitch` con "¿Hasta cuándo?" (3 días · 1 semana · 2 semanas · Fecha · Sin fecha; por defecto 1 semana), reanudación automática a las 07:00 del día y aviso de Telegram el día anterior con "Sí · Otra semana · Sin fecha" | §3.10, §9.14, §10.8, §13.19i |
| J3 | Editar un CV a 375 px con un segmento Editar/Ver excluyente no es razonable | Acción recomendada "Editar en el portátil" en móvil (recordatorio a hora concreta: Hoy 18:00 · Mañana 09:00 · Hora…, con aviso de Telegram y subestado "Pospuesta hasta {hora} · para editar"); previsualización plegable "Ver cómo queda" bajo el editor; los cambios pequeños siguen siendo posibles en el móvil | §3.10, §7.13, §10.8, §12 |
| J4 | Vincular un correo a mano pedía un `message-id` que en el móvil no está a mano | `LinkEmailSheet` con pestaña "Buscar" por remitente/asunto sin ID (primero en lo filtrado, luego búsqueda acotada en Gmail) y pestaña "Pegar enlace" que acepta el enlace de escritorio, el que comparte la app de Gmail y un `message-id`, con ejemplo del formato y pista "⋮ → Compartir" | §7.13, §9.12, §10.8 |

**Reclutadora — cambios incorporados**

| # | Fricción | Cambio | Dónde |
|---|---|---|---|
| R1 | Una carta que solo reordena el CV maestro puede leerse como plantilla | **Control de plantilla** (`TemplateCheck`): la IA marca y resalta las referencias concretas a la oferta o la empresa; mínimo 2 para enviar por API (con 0 o 1 se bloquea con el motivo y "Regenerar" preseleccionado); Jose puede marcar una frase a mano; referencias que no constan en la oferta bloquean igual. Los campos "Rellénalo tú" vacíos también bloquean el envío por API. En asistido se avisa sin bloquear | §3.10, §7.12 (modal), §7.13, §7.17 (línea "Material:"), §10.8, §12, §13.19j, §14 |

**Marta — cambios incorporados**

| # | Fricción | Cambio | Dónde |
|---|---|---|---|
| M6 | La etiqueta "móvil · web · IA · chip" bajo la escena no le dice nada | Es interna del prototipo; en producción no se muestra (como mucho, un indicador sin palabras que decide `ui`) | §4.1, §13.21 |
| M7 | El subtítulo habla a Dani (tecnologías) y `[[ Ver proyectos ]]` domina sobre su salida | **No se cambia**: es decisión de Jose. Preparadas dos alternativas con wireframe móvil: (A) dos CTA con el mismo peso; (B) subtítulo con una frase por audiencia, sin tecnologías, y CTA como ahora. `ux` recomienda B | §4.1 "Alternativas", §13.20 |

**Descartado o matizado en esta pasada, y por qué**

| Propuesta | Motivo |
|---|---|
| "Editar en el portátil" como acción primaria del detalle en móvil | Se incorpora como **acción recomendada** (destacada) pero no primaria: la primaria sigue siendo Confirmar (una por pantalla) y desde el móvil se puede confirmar lo asistido y lo ya visto |
| Segundo paso "¿Seguro?" también en modo asistido | Abrir un enlace no es irreversible; añadir un paso ahí subiría el tiempo por candidatura sin proteger nada. Se mantiene solo para envío por API |
| "Visto" válido para siempre | Se limita a "visto **y sin cambios de material desde entonces**": una regeneración posterior invalida la vista, porque lo que se enviaría ya no es lo que Jose leyó |
| Mostrar el indicador de estado con palabras cortas ("1/3") | Sigue siendo texto sin significado para Marta; queda como indicador sin palabras o nada, a decisión de `ui` |
| Cambiar ya el subtítulo del hero a la opción B | El hero es el prototipo aprobado por Jose el 2026-09-19; `ux` no lo reabre, solo prepara la elección |

## 17. Recuento de pantallas

- Público: 19 (home, empresas, negocios, generador [5 estados], proyectos, ficha, blog, artículo, sobre mí, contacto, chat, 3 legales, perfil, login, registro, código, callback).
- Área de clientes: 7 (inicio, tareas, detalle de tarea, material, pack y extras, solicitar ampliación, recomiéndame).
- Admin: 19 (12 de v3 + Radar: bandeja, hoja "Correos por revisar", detalle de candidatura, plataformas, hoja de alta/edición de plataforma, perfil, calendario). Los modales de Radar (`ConfirmSendModal`, `SnoozeSheet`, `DiscardSheet`, `LinkEmailSheet`, nuevo evento, pausa) son subpantallas y no cuentan; los mensajes de Telegram (§7.17) tampoco.
- Error/estado: 16 casos de §8 (6 páginas completas, 10 inline) + 17 de Radar (§7.18, todos inline salvo R17 = 403).
- Total: 45 pantallas + 33 casos de error/estado. La hoja "Menú" (móvil), la intro (`IntroFall`), los tres estados de la escena (móvil, web, chip IA) y el respaldo `HeroMedia` (vídeo/poster) no cuentan como pantallas.

## 18. Hechos a confirmar por Jose (`{{DATO}}`)

Fuentes consultadas: `josedev/src/lib/literals.json` (solo hechos; el copy de marketing se descarta), `site-metrics.json` (2026-08-15: 25 migraciones, 21 tablas, 73 políticas RLS, 27 rutas del gateway, 72 componentes, 235 tests, 2 idiomas; se regeneran en el build nuevo), `sobre-mi-stack-config.ts`, `josecoded-api/src/knowledge/knowledge.json`, repos `hazmeFila` y `oportunix`, vault (`ITIL/`, `DEVOPS & CLOUD COMPUTING/`, `PROFESIONAL SCRUM MASTER/`, `Proyectos/josecoded.md`, `JOSE.canvas`).

Hechos que sí constan y se usan sin marcar: stack (React Native/Expo, React, Next.js, TypeScript, Tailwind, Node.js, NestJS, Fastify, Supabase, Firebase, PostgreSQL, MongoDB, Redis, Docker, n8n, Ollama, Cloudflare, Jest, Git, Jira, Agile/Scrum, ITIL v4); 3catinfo es una app de noticias de 3Cat con secciones portada, 3 minuts, vídeo, El temps, El meu 3CatInfo (NDA: solo nombre y stores); HazmeFila es una app Expo SDK 56 + Supabase para contratar a alguien que haga cola por ti (primer commit 2026-06-06); Oportunix es una web Next.js 16 + Firebase de mystery boxes y subastas (primer commit 2026-02-16, dominio oportunix.com); esta web: Next.js en Cloudflare Workers vía OpenNext, gateway Hono, backend Fastify en el servidor "Omen", Supabase, n8n, Umami; tarifas de `tarifas.md`; LinkedIn `josé-carlos-sánchez-garcía-7019072a9`.

| # | Dato | Dónde se usa | Qué necesito |
|---|---|---|---|
| 1 | `{{DATO: nombre a mostrar}}` | hero, "Quién te responde", pie, Sobre mí, JSON-LD `Person` | El prototipo aprobado usa "Jose Carlos Sánchez"; confirmar tildes y segundo apellido (josedev usa "Jose Carlos Sanchez Garcia") |
| 2 | `{{DATO: ciudad}}` | hero, Empresas, Sobre mí | Ciudad de residencia (la spec fija `areaServed: ES`, pero la ciudad aparece como dato de la persona, no como página local) |
| 3 | `{{DATO: años}}` | Sobre mí | Años haciendo webs y apps, y desde cuándo eres freelance |
| 4 | `{{DATO: 3catinfo rol exacto y año}}` | hero, Proyectos, trayectoria | Qué hiciste exactamente (desarrollo de la app y rendimiento, según voz.md), en qué año, y si puedes enlazar App Store / Google Play |
| 5 | `{{DATO: HazmeFila estado}}` | hero, Proyectos, orden de fichas | ¿Publicada en stores? Enlaces. ¿Repo público? |
| 6 | `{{DATO: Oportunix estado}}` | hero, Proyectos, orden de fichas | ¿oportunix.com está en producción? ¿Repo público? |
| 7 | `{{DATO: proyecto 1 / proyecto 2}}` | home (3 tarjetas), Proyectos | Cuáles son los dos proyectos con más pruebas verificables (depende de 4–6) |
| 8 | `{{DATO: webs de comercios}}` | Negocios, Proyectos | Nombres y URLs de webs hechas para negocios, si las hay; si no, el bloque no se publica |
| 9 | `{{DATO: certificaciones}}` | hero, Sobre mí | ITIL 4, DevOps & Cloud Computing (AWS), Professional Scrum Master: cuáles están certificadas (organismo y año) y cuáles en curso |
| 10 | `{{DATO: empleos anteriores}}` | trayectoria de Sobre mí, CV | Empresas, puestos y años que quieres mostrar |
| 11 | `{{DATO: disponibilidad}}` | badge del hero ("Disponible para proyectos"), panel Empresas, `/empresas`, chat | Disponible / no disponible, y desde cuándo; si prefieres no mostrarlo, el badge no se renderiza |
| 12 | `{{DATO: repo público sí/no}}` | pie ("Esta web"), "Cómo está hecha esta web", franja de prueba ("código público") | Si el repo de josecoded será público (enlace "Código en GitHub") |
| 13 | `{{DATO: número de WhatsApp y email}}` | contacto, WhatsAppButton | Número en formato internacional y email de contacto (hola@josecoded.com es un supuesto) |
| 14 | `{{DATO: usuario de GitHub}}` | GitHubActivity, JSON-LD `sameAs` | Usuario exacto |
| 15 | `{{DATO: cuentas de desarrollador en stores}}` | StoreBadges, pie | Enlaces al perfil de desarrollador en App Store y Google Play |

Regla: mientras un `{{DATO}}` no esté cubierto, el bloque que lo necesita no se publica (spec §1: nada publicado sin contenido real). `redactor` no inventa nada para rellenarlos.

## 19. Cambios v3 (2026-09-19)

Origen: decisión de Jose del 2026-09-19 (`ESTADO.md`): hero split tipo Resend con escena de partículas-glifo (prototipo `ref/hero-lab-3/`) y navegación clásica; descarte del shell IDE-lite.

| Qué cambia | Antes (v2.1) | Ahora (v3) | Por qué |
|---|---|---|---|
| Navegación (§3.2) | Árbol de tres niveles fijo en escritorio, hoja en móvil; pestañas de rutas abiertas | Cabecera fija: marca · Empresas · Negocios · Proyectos · Blog · Sobre mí · ES · Entrar · `[Contacto]`; hoja "Menú" plana en móvil | Cinco secciones no justifican un árbol; Marta no debe aprender una metáfora; la spec §12 ya pedía este menú |
| Barra de título (§3.3) | Hero minimizado con nombre y rol | Fuera; la marca `josecoded` va a Inicio | El hero ya no se minimiza |
| Línea de estado (§3.3–3.5) | Datos del build en escritorio; Menú · Contacto · Chat en móvil | Datos del build en el pie ("Esta web") y en `BuildFacts`; sin barra inferior global | Los datos siguen visibles donde Dani los busca; la barra móvil restaba viewport al hero y chocaba con la de `/negocios` (§3.1) |
| Intro (§3.6) | Compilación del título (scramble) → typing → hold → minimización, 3,5 s escritorio / 2,4 s móvil, una vez al día (`localStorage.hero_seen`), enlace "Saltar", "Repetir presentación" | Caída y aterrizaje de todas las letras del primer viewport y de las partículas, 0,4–1,2 s, una vez por sesión (`sessionStorage.intro_seen`), cualquier interacción la termina, sin enlace visible ni repetición | Prototipo aprobado; una intro de 1,2 s no necesita salto visible ni repetición manual |
| Motion (§3.7) | `CompileReveal`, `FocusLight`, transición de página; prohibidas partículas y ondas | Caída/aterrizaje, morph de partículas, respiración y ondas de código, `CompileReveal` v3 (glifos que se resuelven, sin caída), transición de página; `FocusLight` sustituido por rayo de luz estático + grano (`Backdrop`) | Jose aprobó la escena de partículas el 2026-09-19 y había rechazado el foco de luz (spec §12 R14); el resto del vocabulario se deriva del hero para que la web sea una sola pieza |
| Home (§4.1) | Presentación compacta + índice de seis secciones + proyectos + cómo está hecha + último artículo + contacto | Hero split + franja de prueba real + dos paneles de vía (Empresas / Negocios) con miniaturas de partículas en escritorio + proyectos + cómo está hecha (con esquema de arquitectura) + último artículo + contacto con "Quién te responde" | Sin índice tipo IDE; la spec pide "dos vías con el mismo peso"; los paneles las explican sin partir la página; "Quién te responde" da a Marta una cara antes de escribir |
| Acción primaria de la home | Ninguna (el índice) | `[[ Ver proyectos ]]` en el hero; `> Una web para mi negocio →` como salida de Marta | Prototipo aprobado; una sola primaria |
| Componentes (§3.10) | `AppShell`, `SiteTree`, `TitleBar`, `StatusLine`, `Tabs`, `HeroIntro`, `SectionIndex`, `FocusLight` | `SiteHeader`, `MobileMenuSheet`, `SiteFooter`, `Backdrop`, `HeroSplit`, `GlyphScene`, `IntroFall`, `ProofStrip`, `PathPanel`, `BuildFacts`, `CompileReveal`, `PageTransition` | Reflejo de lo anterior |
| Pantallas interiores (§4.2–§4.13, §5, §8) | "(shell: barra de título)", árbol y línea de estado atenuados en generador y login | "(cabecera)"; generador con cabecera normal y conversación a alto de viewport; login con cabecera reducida; `ErrorPage` con el código sobre el título | Solo lo que dependía del shell; contenido, estados y flujos intactos |
| Accesibilidad (§12) | Reglas del árbol y del título compilando | Reglas de `IntroFall` (texto accesible desde 0 ms), `GlyphScene` (`role="img"`), cabecera y hoja "Menú", pausa fuera de viewport | Reflejo de lo anterior |
| Decisiones abiertas (§13) | 3, 11b, 11c, 15 sobre el IDE-lite | 3 (escena, intro, miniaturas, fotogramas estáticos), 11b (cabecera), 11c (pie y `BuildFacts`), 11d (`PathPanel`), 15 (nombre según prototipo) | Reflejo de lo anterior |
| Microcopy (§10.1–10.2) | `hero.seed`, `hero.fact*`, `hero.replay`, `home.section.*`, `status.*` | `hero.badge`, `hero.sub`, `hero.cta`, `hero.link`, `hero.scene.*`, `proof.*`, `path.*`, `home.thisweb.*`, `home.who.*`, `footer.*` | Reflejo de lo anterior |
| Eventos (§11) | `hero_played`, `section_open` | `intro_played {skipped, reduced}`, `path_open {path}`, `scene_drag`, `booking_open {origin}` | Reflejo de lo anterior |

**No cambia:** mapa de sitio (§2), personas y tareas (§1, salvo el éxito de M1), pantallas interiores en contenido y estados, área de clientes (§6), admin (§7), errores (§8, salvo la plantilla), flujos (§9), microcopy de generador, contacto, chat, auth, área y admin (§10.3–10.7), reglas de accesibilidad no ligadas al shell, validación previa (§16) y hechos a confirmar (§18, con los usos actualizados).

**Para el controlador:** la spec §12 (v1.4) sigue diciendo "rechazado: partículas, ondas" y "prototipo único de la home (IDE-lite)"; la decisión del 2026-09-19 lo supera. Conviene que `arquitecto` anote en la spec una v1.5 con esa decisión, sin reabrirla. `2026-09-17-josecoded-ui.md` queda superado en shell y motion (ya previsto en `ESTADO.md`). *(Resuelto en spec v1.5: §12 D16 y §13.)*

## 20. Cambios v3.1 (2026-09-19)

Origen: spec v1.5 — §13 Radar (D18–D26) y §12 D16 (respaldo vídeo/poster del hero en móvil).

| Qué cambia | Antes (v3.0) | Ahora (v3.1) | Por qué |
|---|---|---|---|
| Personas (§1.3) | J1–J5 | + J6 decidir candidatura ≤ 3 min, J7 bandeja de un vistazo, J8 seguir por correo y calendario, J9 mantener conectores y perfil | Spec §13.1 (métricas de Radar) |
| Mapa de sitio (§2.3, §2.4) | 12 rutas de admin | + `/admin/radar`, `/admin/radar/[id]`, `/admin/radar/plataformas` (+ hoja), `/admin/radar/perfil`, `/admin/radar/calendario`; hoja `?correos=revisar`; subnavegación por segmento; fila de errores de Radar | Spec §13.5 (bandeja, detalle, plataformas) ampliada con perfil y calendario para cubrir §13.2 pasos 2 y 7 |
| Hero móvil (§3.6, §3.7, §4.1, §3.10) | Escena viva en móvil (5.000 partículas) con "fotograma estático" solo para reduced motion / sin WebGL | `HeroMedia`: vídeo en bucle (≤ 400 KB) con poster (≤ 60 KB) por defecto en móvil, sin WebGL y con `deviceMemory < 4`; solo poster con `saveData`, reduced motion o sin JS; escena viva en móvil solo con `HERO_LIVE_MOBILE`; tabla de condiciones; presupuesto vertical en 375×667 (661 px) con CTA y enlace en la misma fila y 34 svh en alturas ≤ 700 px; intro reducida (solo letras) donde no hay escena viva; poster en el HTML como candidato a LCP, vídeo tras el LCP sin fundido | Spec §12 D16 (requisitos 1–5) |
| Shell del admin (§3.9, §7.1) | Barra móvil Leads · Clientes · Chat · Más; 4 contadores | Barra móvil Leads · Radar · Clientes · Más; 5 contadores + "Radar hoy" + conectores en Servicios | Radar es de uso diario |
| Catálogo (§3.10) | — | + `HeroMedia` y 20 componentes de Radar (`RadarSubnav`, `RadarPauseSwitch`, `RadarAlerts`, `StatusCounters`, `ScoreBadge`, `DeadlineTag`, `MailTag`, `RadarRow/Card`, `ConfirmSendModal`, `SnoozeSheet`, `DiscardSheet`, `ScoreReasons`, `MaterialEditor`, `FormPayloadTable`, `DecisionCard`, `EventProposalCard`, `EmailList`/`LinkEmailSheet`, `EventTimeline`, `ConnectorCard`/`ConnectorSheet`/`SecretRef`, `ProfileView`, `RadarCalendar`) | Reflejo de §7.12–7.17 |
| Pantallas de admin (§7.12–7.18) | — | Bandeja con filtros en URL, contadores, indicadores de plazo y correo, acciones rápidas y confirmación con consecuencia; detalle con puntuación explicada, materiales editables con previsualización y versiones, decisión por estado (envío propio / asistido), calendario, correos, notas e historial reversible; plataformas con salud, límites, credenciales referidas y alta; perfil solo lectura + ajustes rápidos y CV maestro; calendario mes/semana/agenda; Telegram (mensaje, botones, qué ve Jose al pulsar, otros avisos); 17 estados de error y vacíos | Spec §13.2–13.7 |
| Errores (§8) | 16 casos | + 8.17 que remite a §7.18 | — |
| Flujos (§9.10–9.14) | 9 flujos | + Radar de principio a fin, confirmar desde Telegram, vincular un correo a mano, añadir una plataforma, pausar y reanudar | Spec §13.2 |
| Microcopy (§10.6, §10.8) | — | `admin.nav` con Radar; §10.8 con ~130 claves de admin y Telegram en voz sobria | — |
| Eventos (§11) | — | `intro_played.mode`; nota: Radar se mide desde `radar_*`, no con Umami | D16, spec §13.1 |
| Accesibilidad (§12) | — | `HeroMedia` (poster `role="img"`, vídeo sin autoplay con reduced motion), tabla de la bandeja, barra de decisión móvil, editor, calendario con Agenda, diálogos con consecuencia | — |
| Decisiones abiertas (§13) | 15 | 3 y 15 actualizados; + 16 (piezas de bandeja), 17 (editor), 18 (calendario), 19 (para `arquitecto`: perfil, posponer, `HERO_LIVE_MOBILE`, reautorización Google, hoja de correos, PDF, botones de Telegram) | — |
| Decisiones de ux (§14) | — | + 15 filas (hero móvil ×4, Radar ×11) | — |
| Validación (§15) | Pendiente v3 | + pendiente v3.1: Jose operador, reclutador, Marta con vídeo/poster | Spec §13.9 |
| Recuento (§17) | 38 + 16 | 45 + 33 | — |

**No cambia:** pantallas públicas salvo el bloque 1 de la home (§4.2–§4.13), auth (§5), área de clientes (§6), admin heredado (§7.2–§7.11 en contenido), flujos 9.1–9.9, microcopy 10.1–10.7 (salvo `admin.nav`), hechos a confirmar (§18) y validación previa (§16). Los prototipos de `ref/hero-lab-3/` siguen siendo la referencia de la escena viva; el vídeo y el poster se producen a partir de ellos.

**Para el controlador:** (1) `usuario-ejemplo` debe recorrer §7.12–7.18 y §9.10–9.14 como Jose operador y como reclutador (§15) *(hecho en v3.2, §16.4)*; (2) `ui` tiene en §13.16–13.18 lo que le toca de Radar y en §13.3 lo del vídeo/poster; (3) `arquitecto` debe cerrar §13.19 (a–j) en el plan; (4) las preguntas Q10–Q15 de la spec siguen abiertas y condicionan el perfil (§7.15), los CV maestros y las credenciales de §7.14.

## 21. Cambios v3.2 (2026-09-19)

Origen: validación de v3.1 con `usuario-ejemplo` (§16.4). Sin pantallas nuevas; el recuento de §17 no cambia.

| Qué cambia | Dónde | Resumen |
|---|---|---|
| Confirmación por Telegram | §7.13, §7.17, §9.11, §10.8, §13.19h, §14 | Línea "Material:" (visto, referencias, bloqueos); "Confirmar" para API solo con material visto y sin cambios; "Ver material" / "Ver y editar" en su lugar; segundo paso "¿Seguro?" con caducidad de 10 min; asistido confirma directo |
| Control de plantilla | §3.10, §7.12, §7.13, §7.17, §10.8, §12, §13.19j, §14 | ≥ 2 referencias concretas resaltadas para enviar por API; "Rellénalo tú" vacíos bloquean API; en asistido, aviso |
| Pausa con fecha | §3.10, §9.14, §10.8, §13.19i, §14 | Duración rápida, reanudación automática, aviso el día anterior |
| Edición en móvil | §3.10, §7.13, §10.8, §12, §14 | "Editar en el portátil" (recordatorio a hora concreta) y previsualización plegable |
| Vincular correo | §7.13, §9.12, §10.8, §14 | Buscar por remitente/asunto sin ID; enlace compartido desde la app de Gmail; ejemplo del formato |
| Hero | §4.1, §13.20, §13.21, §14 | Etiqueta de estado fuera de producción; alternativas A y B para Jose con wireframe móvil (sin cambiar el prototipo) |
| Validación | §15, §16.4 | Tres pasadas PASAN; cambios y descartes registrados |

**Para el controlador:** `arquitecto` cierra §13.19 (a–j); Jose decide §13.20 (hero A / B / nada) y §13.21 (indicador); `ui` recoge §13.16–13.18 y §13.21; tras el plan, `usuario-ejemplo` vuelve a pasar §7.17 y §9.11 como Jose operador.

