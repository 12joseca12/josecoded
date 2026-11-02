# Mapa de pantallas

**2026-11-02 · `arquitecto` · propuesta para que Jose la revise.** Zonas en el orden de construcción (decisión 10.6). Por pantalla: para qué sirve, componentes principales, acciones, datos que lee y escribe (entidades de `datos.md`), estados y quién la ve. Lo que necesita respuesta de Jose va marcado **Pregunta**. Reutiliza del documento de la v1 (`archivo/decisiones-pantallas/2026-09-29-pantallas-y-contenidos.md`) lo que sigue valiendo: estructura de las páginas interiores, historias de usuario, comisiones con porcentaje congelado, importación con cola de conflictos, regla de «sin inventar nada».

Reglas que aplican a todas:

- Transición de pantalla con View Transitions; esqueleto en todo lo que carga desde cero; estado de carga en todo botón que lanza una acción; vacío, error y «sin conexión» diseñados una vez y reutilizados (`Skeleton`, `EmptyState`, `ErrorState`, `OfflineBanner`, `Toast`).
- Una acción primaria por pantalla. Rutas en español; el segmento de idioma existe aunque solo se publique `es`.
- Público: cabecera `SiteHeader` (marca · Servicios · Proyectos · Sobre mí · Blog · Chat · Entrar), `MobileMenu`, `ChatPanel` lateral, `SiteFooter`, `Scrollbar` personalizada. Blog y Lab desaparecen de la navegación si el interruptor de sección está apagado.
- Zonas privadas: `AppShell` (lateral en escritorio, barra inferior de cuatro en móvil), `NotificationBell`, `UserMenu`. Sin métricas ni gráficas: cifras en celdas y listas densas.
- Roles: `admin` ve todo; `closer` solo `/crm`; `client` solo `/area`; `freelance` solo `/freelance`. Entrar en una zona ajena devuelve 404.

Componentes base que se hacen una vez, antes de la primera pantalla que los use: `Button`, `Link`, `Heading` (dos tonos), `Field`, `Form`, `Dialog`, `Sheet`, `Tabs`, `Badge`, `Table`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `PageHead`, `Prose`, `Faq`, `Steps`.

---

## 1. Público

### P1 Home `/`
- **Para:** decir en diez segundos quién es Jose, qué hace y por dónde contratarle; es la muestra del estilo.
- **Componentes:** `Hero` (animado: «la app transformándose», CSS + SVG/Canvas, vídeo de reserva), `ServicesStrip` (tres vías), `ProjectGrid` (3 destacados), `StackRow`, `PackTeaser` (packs visibles con precio «desde»), `ChatInvite` (abre `ChatPanel`), `Closing` (contacto).
- **Acciones:** ir a `/servicios`, `/proyectos`, `/contacto`; abrir el chat.
- **Datos:** lee `packs` visibles y `site_settings` (interruptores). No escribe.
- **Estados:** `PackTeaser` con esqueleto y, si falla la lectura, se oculta sin romper la página; hero estático con `reduced-motion`.
- **Roles:** todos.

### P2 Servicios `/servicios` (`#contratacion`, `#freelance`, `#packs`)
- **Para:** explicar las tres vías y cerrar la decisión de contacto.
- **Componentes:** `PageHead`, `WayNav` (pegajosa, `aria-current`), `WaySection` ×3, `RateFigure` (tarifa por hora y por tarea), `PackCompare` (columnas en escritorio, un pack por vista en móvil), `ExtraList`, `Steps` (cómo trabajo), `Faq` (con `FAQPage`), `Closing`.
- **Acciones:** «Hablamos» por vía → `/contacto?via=…`; «Pedir este pack» → `/contacto?pack=…`; descargar CV (vía contratación).
- **Datos:** lee `packs`, `extras`, `rates` visibles. No escribe.
- **Estados:** esqueleto en precios; si la lectura falla, las vías se muestran sin importes y un aviso discreto.
- **Roles:** todos.
- **Pregunta:** ¿la vía «contratación» publica disponibilidad (plantilla, remoto, ciudad) o solo el CV y el chat? Reco: solo CV y chat; la disponibilidad la dice el asistente.

### P3 Proyectos `/proyectos`
- **Para:** prueba de oficio con enlaces verificables.
- **Componentes:** `PageHead`, `FilterTabs` (Todos · Apps · Webs), `ProjectCard` apilada, `EmptyState`.
- **Acciones:** filtrar; abrir ficha.
- **Datos:** MDX del repo (`content/projects/*.mdx`, frontmatter zod). No escribe.
- **Estados:** vacío por filtro; sin esqueleto (estático).
- **Roles:** todos.

### P4 Ficha de proyecto `/proyectos/[slug]`
- **Para:** caso medio de dos minutos: reto, qué hice, stack, resultado verificable.
- **Componentes:** `ProjectHead` (nombre, tipo, estado, enlace principal), `ScreenGallery`, `CaseSection` ×3, `Chip` (stack), `StoreLinks`, `PrevNext`, `Closing`.
- **Acciones:** abrir store/web; «Hablar de un proyecto así» → `/contacto`.
- **Datos:** MDX. No escribe.
- **Estados:** 404 propia si el slug no existe; galería omitida si no hay capturas.
- **Roles:** todos.

### P5 Sobre mí `/sobre-mi` (`#stack`)
- **Para:** confianza y perfil: historia corta, trayectoria, stack y formación, CV.
- **Componentes:** `PageHead` con retrato, `Timeline`, `PrinciplesList`, `StackGroups`, `CredentialList`, `LinkRow` (LinkedIn, GitHub, CV es/en), `Closing`.
- **Acciones:** descargar CV; ir a contacto.
- **Datos:** `content/about.mdx` y `content/cv.json` (una fuente para la sección, el PDF y Radar). No escribe.
- **Estados:** estático.
- **Roles:** todos.

### P6 Contacto `/contacto` (`?via=hiring|freelance|pack&pack=…`)
- **Para:** salida de todas las páginas; una vía por tipo de visitante.
- **Componentes:** `PageHead`, `ViaSelector` (segmentado), `ContactForm` (nombre, email, mensaje, vía, pack; Turnstile), `QuickContact` (email con copiar, LinkedIn, WhatsApp si Jose lo da), `CalEmbed` (si hay Cal.com).
- **Acciones:** enviar (Server Action) → crea contacto `kind=lead` sin dueño y notifica a Jose; copiar email; reservar.
- **Datos:** escribe `contacts` (+ `activities` «form_submitted`) vía RPC `public_submit_contact`; lee `packs` para el selector.
- **Estados:** botón con carga; error de validación en línea; error de servidor con reintento; éxito con mensaje y siguiente paso; cuota superada (429) con vías alternativas.
- **Roles:** todos.
- **Pregunta:** ¿WhatsApp y Cal.com públicos? Reco: email y chat ahora; WhatsApp y Cal.com cuando Jose dé los datos (`{{DATO}}`).

### P7 Chat `/chat` y `ChatPanel` (panel lateral global)
- **Para:** hablar con el asistente (visitantes) o con Jose (usuarios con cuenta) desde cualquier página.
- **Componentes:** `ChatThread`, `ChatBubble` (etiqueta «Asistente de Jose» / «Jose»), `ChatComposer` (Turnstile invisible en el primer envío), `QuotaNotice`, `TakeoverBand` («Jose ha entrado»), `OfflineNotice` («Jose te responde en cuanto pueda» si Omen duerme), `SaveThreadHint` (entrar para guardar).
- **Acciones:** enviar mensaje; abrir a pantalla completa; entrar.
- **Datos:** lee y escribe `chat_threads`, `chat_messages` (Realtime); escribe `private.chat_quota`; lee `private.heartbeat` vía RPC para el aviso de Omen.
- **Estados:** esqueleto del hilo; enviando; respuesta en curso (indicador); cuota; sin conexión; Omen apagado.
- **Roles:** todos (anónimo con cookie firmada); con cuenta, el hilo es el suyo con Jose.

### P8 Blog `/blog` y artículo `/blog/[slug]`
- **Para:** contenido orgánico (SEO y GEO).
- **Componentes:** índice: `PageHead`, `PostTeaser`, `Chip`, `LoadMore`; artículo: `Prose`, `Toc`, `CodeBlock` (copiar), `ReadingProgress`, `ShareRow`, `PostTeaser` (relacionados).
- **Acciones:** leer; compartir; ir al lab si hay demo relacionada.
- **Datos:** MDX del repo. No escribe. Sin comentarios en esta fase.
- **Estados:** sección oculta y `/blog` 404 si el interruptor está apagado; vacío si no hay artículos.
- **Roles:** todos.
- **Pregunta:** ¿comentarios en los artículos? Reco: no en el lanzamiento (moderación y spam); se revisa con el blog vivo.

### P9 Legales `/legal/aviso`, `/legal/privacidad`, `/legal/cookies`
- **Para:** obligatorios; privacidad recoge chat anónimo, cuota por IP, CRM, Groq y Resend como encargados.
- **Componentes:** `Prose`, `Toc`.
- **Datos:** MDX. **`{{DATO}}`:** nombre legal, NIF, domicilio, email.
- **Roles:** todos.

### P10 Errores y estados de página
- **Para:** una pantalla propia por tipo: 404, 500, 403 no existe (se responde 404), 429 (cuota), mantenimiento (interruptor), sin conexión.
- **Componentes:** `ErrorPage` con variante por código, `OfflineBanner`.
- **Acciones:** volver al inicio, abrir el chat, contacto.
- **Datos:** `site_settings.maintenance`.
- **Roles:** todos.

---

## 2. Auth y admin base

### U1 Entrar `/entrar`
- **Para:** acceso sin contraseña.
- **Componentes:** `AuthCard`, `Field` email, `AuthProviders` (Google), `Banner`.
- **Acciones:** pedir código (Server Action) → Supabase OTP; entrar con Google.
- **Datos:** Supabase Auth. Solo cuentas invitadas: un email sin `profiles` recibe el mismo mensaje neutro que uno válido (no se revela si existe).
- **Estados:** enviando; código enviado; error de proveedor; demasiados intentos.
- **Roles:** cualquiera; redirige a su zona si ya está dentro.

### U2 Código `/entrar/codigo`
- **Componentes:** `OtpInput` (6 casillas, pegar), reenviar con cuenta atrás.
- **Acciones:** verificar; reenviar.
- **Estados:** verificando; código incorrecto o caducado; bloqueado por intentos.
- Tras entrar: si el rol exige TOTP y no está configurado → U4; si está, pide el TOTP (`aal2`) → U3; luego a `next` o a su zona.

### U3 Segundo factor `/entrar/totp`
- **Componentes:** `OtpInput`, enlace «He perdido el dispositivo» (escribe a Jose; el admin lo restablece desde `/admin/usuarios`).
- **Datos:** Supabase MFA.
- **Roles:** admin, closer, freelance.

### U4 Invitación `/invitacion/[token]`
- **Para:** primera entrada de un usuario invitado: nombre, idioma y, si es personal, alta del autenticador.
- **Componentes:** `AuthCard`, `Field`, `TotpEnroll` (QR + código de confirmación), `Steps`.
- **Acciones:** aceptar invitación (RPC `accept_invitation`), configurar TOTP.
- **Datos:** lee `invitations` por token hash; escribe `profiles`; Supabase MFA.
- **Estados:** token caducado o usado (pantalla propia con «pide una nueva invitación»).
- **Roles:** cualquiera con enlace válido.

### U5 Mi cuenta `/cuenta`
- **Para:** nombre, idioma, seguridad, sesiones, borrar cuenta.
- **Componentes:** `AccountCard`, `Field`, `TotpManage` (cambiar dispositivo), `SessionList`, `ConfirmDialog`.
- **Acciones:** guardar; regenerar TOTP; cerrar otras sesiones; solicitar borrado (crea trabajo para el admin).
- **Datos:** `profiles` (propio), Supabase Auth.
- **Roles:** cualquier usuario con cuenta.

### D1 Resumen del admin `/admin`
- **Para:** ver en una pantalla qué requiere a Jose y si Omen vive.
- **Componentes:** `AppShell`, `CounterCell` ×n (leads sin dueño, hilos sin leer, historias por decidir, comisiones pendientes, conflictos de importación, hallazgos de Radar nuevos), `OmenStatus` (semáforo, último latido, cola de trabajos), `RecentActivity`.
- **Acciones:** cada celda enlaza a su lista filtrada.
- **Datos:** RPC `admin_counters()`, `private.heartbeat`, `private.jobs` (contadores).
- **Estados:** esqueleto por celda; Omen sin latido en más de 2 min → rojo.
- **Roles:** admin.

### D2 Usuarios `/admin/usuarios`
- **Para:** invitar, desactivar, reasignar cartera, fijar tasas, restablecer TOTP.
- **Componentes:** `Table` (nombre, email, rol, estado, closer padre, tasas, TOTP, contactos, comisiones pendientes), `InviteSheet` (email, rol, closer padre si subcloser, `closer_rate`, `parent_rate`, proyecto si cliente, nota), `UserSheet` (editar), `ReassignSheet`, `ConfirmDialog`, lista de invitaciones pendientes (reenviar, anular).
- **Acciones:** invitar (RPC `invite_user` → `invitations` + `private.outbox` email), editar tasas, desactivar, reasignar, restablecer TOTP.
- **Datos:** `profiles`, `invitations`, `contacts` (contadores), `private.outbox`, `private.audit_log`.
- **Estados:** vacío inicial con «Invita al primer closer»; cada acción con confirmación y carga.
- **Roles:** admin.

### D3 Precios `/admin/precios`
- **Para:** packs, extras y tarifa por hora sin desplegar.
- **Componentes:** `Tabs` (Packs · Extras · Tarifas), `PriceTable`, `PriceItemSheet` (nombre es/en, precio, semanas, incluye, visible, orden), `PriceHistory` desplegable, `ConfirmDialog` (archivar).
- **Acciones:** crear, editar, archivar (lógico), reordenar, ocultar.
- **Datos:** `packs`, `extras`, `rates`, `price_changes` (trigger). La web pública los lee con caché; cambiar un precio invalida la caché (tag).
- **Roles:** admin.

### D4 Secciones y sistema `/admin/sistema`
- **Para:** interruptores (blog, lab, chat público, precios visibles, mantenimiento), estado de Omen con detalle, cola de trabajos, reintentos.
- **Componentes:** `SwitchList`, `OmenStatus` ampliado, `JobTable` (kind, estado, intentos, error), `ConfirmDialog`.
- **Acciones:** cambiar interruptor; reintentar o cancelar trabajo.
- **Datos:** `site_settings`, `private.heartbeat`, `private.jobs` vía RPC.
- **Roles:** admin.

### D5 Notificaciones `/admin/notificaciones`
- **Para:** vincular Telegram y elegir qué le llega a Jose.
- **Componentes:** `TelegramLinkCard` (código, caducidad, estado), `SwitchList` por evento (lead nuevo, mensaje sin leer, historia propuesta, comisión pendiente, importación con conflictos, hallazgo de Radar, Omen caído), botón «Enviar prueba».
- **Datos:** `profiles.telegram_chat_id` (vía `private`), `notification_prefs`.
- **Roles:** admin.

### D6 Bandeja de chat `/admin/chat`, `/admin/chat/[id]`
- **Para:** ver todos los hilos (anónimos y de usuarios), responder, encender o apagar la IA por hilo, convertir un hilo en contacto.
- **Componentes:** `ThreadList` (tipo, usuario o «anónimo», último mensaje, sin leer, IA on/off), `ChatThread`, `ChatComposer`, `AiSwitch`, `CreateContactSheet`, `LinkContactSheet`.
- **Acciones:** responder como Jose; `ai_enabled`; crear o enlazar contacto; archivar.
- **Datos:** `chat_threads`, `chat_messages`, `contacts`.
- **Estados:** vacío; esqueleto; hilo archivado en lectura.
- **Roles:** admin.

---

## 3. CRM `/crm` (admin y closers; el alcance lo da RLS)

### K1 Resumen `/crm`
- **Para:** lo que tengo que hacer hoy.
- **Componentes:** `CounterCell` (acciones vencidas, oportunidades abiertas por fase, comisiones pendientes y aprobadas con importe, última importación), `TeamCell` (closer: agregados de sus subclosers sin nombres), `DueList`.
- **Acciones:** «Ver vencidas» → K2 filtrada.
- **Datos:** RPC `crm_counters()` (respeta la cartera).
- **Roles:** admin, closer.

### K2 Contactos `/crm/contactos` (`?kind&stage&due=1&q&owner`)
- **Para:** la cartera en una tabla densa con filtros en la URL.
- **Componentes:** `ContactTable` (nombre, organización, tipo, fase de su oportunidad abierta, siguiente acción y fecha, último contacto, origen; admin: dueño), `FilterBar`, `OwnerFilter` (admin), `NewContactSheet`, `StageSheet` (cambio rápido), `EmptyState`.
- **Acciones:** crear; abrir; cambiar fase; fijar siguiente acción; importar (→ K5).
- **Datos:** `contacts`, `deals`, `profiles` (dueños). Escribe `contacts`, `activities`.
- **Estados:** esqueleto de tabla; vacío por filtro; vacío inicial («Añade o importa tu primer contacto»).
- **Roles:** admin, closer.

### K3 Contacto `/crm/contactos/[id]`
- **Para:** todo lo de una persona: datos, oportunidad, historial, siguiente acción.
- **Componentes:** `ContactHead` (datos, enlaces, email con copiar, dueño; admin: `ReassignSheet`), `NextActionField`, `DealCard` (fase, vía, pack, importe; «Marcar ganada» pide importe cobrado), `ActivityTimeline` (notas, llamadas, reuniones, cambios de fase, formulario, chat), `ActivityComposer`, `Tabs` (Actividad · Oportunidades · Comisión), `InviteClientSheet` (admin, cuando la oportunidad se gana: crea invitación `client` y proyecto).
- **Acciones:** editar; nota; nueva oportunidad; cambiar fase; ganar (crea `commissions`); perder (motivo); reasignar (admin); invitar al área (admin).
- **Datos:** `contacts`, `deals`, `activities`, `commissions`, `chat_threads` enlazados. Escribe `deals`, `activities`, `commissions` (RPC `win_deal`).
- **Estados:** esqueleto; 404 si no es de mi cartera; conflicto si otro cambió la fase (recarga).
- **Roles:** admin, closer.
- **Pregunta:** ¿la comisión se crea al marcar «ganada» con el importe o al registrar el cobro? Reco: al marcar ganada (estado `pending`); el admin la aprueba cuando ha cobrado.

### K4 Comisiones `/crm/comisiones` (`?status&closer`)
- **Para:** ver qué me deben y qué está pagado; el admin aprueba y registra pagos.
- **Componentes:** `CommissionTotals` (celdas por estado), `CommissionTable` (fecha, contacto, vía o pack, importe base, % y comisión del closer, % y comisión del subcloser si lo hay, estado, fecha de pago), `ConfirmDialog` (aprobar, rechazar con motivo, marcar pagada con fecha y nota).
- **Acciones:** admin: aprobar, rechazar, marcar pagada. Closer: solo lectura.
- **Datos:** `commissions`, `deals`, `profiles`. Escribe `commissions` (RPC `set_commission_status`).
- **Roles:** admin (acciones), closer (su parte: un closer ve también las comisiones de sus subclosers).
- **Pregunta:** ver `datos.md` (reparto de tasas).

### K5 Importar `/crm/importar`
- **Para:** subir un CSV con la plantilla fija.
- **Componentes:** `CsvDropzone` (fichero o pegar; ≤ 1 MB, ≤ 500 filas), `ImportPreview` (20 primeras filas con veredicto), `ImportResult` (creados, actualizados, inválidos, pendientes de revisión), `ImportHistory`; admin: `Tabs` «Conflictos» con `ConflictQueue` (fila importada y contacto existente lado a lado; mantener, asignar, fusionar, descartar).
- **Acciones:** importar (RPC `import_contacts`); descargar plantilla; resolver conflicto (admin).
- **Datos:** `imports`, `import_conflicts`, `contacts`.
- **Estados:** validación local; importando; resultado; «ya importado» por hash.
- **Roles:** admin, closer. Bloque posterior al CRM básico (7.5).

### K6 Ajustes `/crm/ajustes`
- **Para:** Telegram del closer, mi tasa (lectura), seguridad.
- **Componentes:** `TelegramLinkCard`, `RateCard` («la fijó Jose al darte de alta»), enlace a `/cuenta`.
- **Datos:** `profiles`, `notification_prefs`.
- **Roles:** admin, closer.

### K7 Chat con Jose `/crm/chat`
- **Para:** el hilo privado del closer con Jose (decisión del brief).
- **Componentes:** los de P7 con `AiSwitch` solo visible para el admin.
- **Datos:** `chat_threads` (`kind=user`, uno por usuario).
- **Roles:** closer; el admin responde desde D6.
- **Pregunta:** ¿un hilo por usuario o también por proyecto en el área? Reco: uno por usuario; el área enlaza al proyecto desde el mensaje.

---

## 4. Área de clientes `/area` (y su lado de admin)

### A1 Inicio `/area`
- **Para:** «en qué punto está mi proyecto y qué me toca».
- **Componentes:** `ProjectHeader` (nombre, pack, fase, avance %), `PhaseSteps`, `TodoForYou` (historias pendientes de completar, documentos que pide Jose), `RecentUpdates`, `ProjectSwitcher` si tiene más de uno.
- **Datos:** `projects`, `tasks` (porcentaje calculado), `stories`, `documents`.
- **Estados:** esqueleto; sin proyecto aún («Jose está preparando tu proyecto»); con varios proyectos.
- **Roles:** client.
- **Pregunta:** ¿un cliente puede tener varios proyectos? Reco: sí (`projects.client_id`); selector solo si hay más de uno.

### A2 Tareas `/area/tareas`, `/area/tareas/[id]`
- **Para:** ver el desarrollo: tablero por fases, tareas hechas y pendientes.
- **Componentes:** `PhaseBoard` (columnas por fase; en móvil, lista agrupada), `TaskRow` (estado, título, «De tu historia: …»), `TaskDetail` (descripción, estado, fecha, enlace a la historia).
- **Datos:** `tasks` (lectura). No escribe.
- **Estados:** vacío por fase; esqueleto.
- **Roles:** client.

### A3 Documentos `/area/documentos`
- **Para:** compartir archivos con Jose y descargar entregables.
- **Componentes:** `FileList` (nombre, tipo, tamaño, quién, fecha), `Uploader` (arrastrar, progreso, límites), `ConfirmDialog` (borrar los propios).
- **Acciones:** subir (URL firmada), descargar (URL firmada), borrar los propios.
- **Datos:** `documents` + Storage `project-documents`.
- **Estados:** subiendo con progreso; tipo o tamaño no permitido; vacío.
- **Roles:** client (los de visibilidad `client`), admin, freelance asignado (visibilidad `team`).
- **Pregunta:** límites. Reco: 25 MB por fichero, 1 GB por proyecto; PDF, imágenes, vídeo corto, zip, Office.

### A4 Historias `/area/historias`, `/area/historias/[id]`, `?nueva=1`
- **Para:** proponer «Como… quiero… para…» con criterios y seguir su decisión.
- **Componentes:** `StoryList` (estado, estimación, fecha), `StoryForm` (título, como, quiero, para, criterios hasta 12), `StoryCard` (veredicto: horas, importe orientativo, nota, enlace a tarea).
- **Acciones:** crear; editar o borrar mientras está `proposed`.
- **Datos:** `stories`. Escribe `stories`; notifica al admin.
- **Estados:** vacío con ejemplo relleno; enviando; decidida (solo lectura).
- **Roles:** client.

### A5 Chat `/area/chat`
- Igual que K7 para el cliente. **Roles:** client.

### D7 Proyectos `/admin/proyectos`, `/admin/proyectos/[id]`
- **Para:** el lado de Jose del área: crear el proyecto, fases, tareas, documentos, decidir historias, asignar freelance.
- **Componentes:** `Table` de proyectos (cliente, pack, fase, avance, historias por decidir), `ProjectSheet` (cliente, contacto origen, pack, fechas, freelance asignado), `Tabs` (Tareas · Historias · Documentos · Equipo), `PhaseBoard` editable (`TaskSheet`: título, descripción, fase, estado, asignado, historia), `StoryDecisionSheet` (aceptar con horas, importe y nota + «crear tarea»; rechazar con motivo; convertir), `FileList` + `Uploader` (visibilidad `client`/`team`), `MemberList`.
- **Acciones:** crear proyecto; mover tarea; decidir historia (RPC `decide_story`); subir; asignar freelance.
- **Datos:** `projects`, `tasks`, `stories`, `documents`, `profiles`.
- **Roles:** admin.

---

## 5. Freelance `/freelance` (se deja preparada)

### F1 Inicio `/freelance`
- **Para:** proyectos en los que Jose ha delegado, con su brief.
- **Componentes:** `ProjectList` (nombre, fase, mis tareas pendientes), `EmptyState` («Jose aún no te ha asignado ningún proyecto»).
- **Datos:** `projects` donde `freelance_id = uid`.
- **Roles:** freelance.

### F2 Proyecto `/freelance/proyectos/[id]`
- **Para:** brief, tareas asignadas, documentos `team`, chat con Jose.
- **Componentes:** `ProjectHeader`, `Prose` (brief), `PhaseBoard` (solo mover las propias), `FileList`, enlace a `/freelance/chat`.
- **Datos:** `projects`, `tasks`, `documents` (`team`).
- **Roles:** freelance asignado.
- **Pregunta:** ¿el freelance ve importes, cliente y contacto? Reco: no; ve brief, tareas, documentos `team` y el nombre del proyecto.

### F3 Chat `/freelance/chat`
- Igual que K7. **Roles:** freelance.

---

## 6. Radar `/admin/radar` (admin)

### R1 Resumen `/admin/radar`
- **Para:** qué ha encontrado Radar y qué espera decisión.
- **Componentes:** `CounterCell` por tipo (ofertas, negocios, proyectos) y estado (nuevos, preseleccionados, con borrador, enviados, convertidos), `SourceStatus` (última ejecución por fuente, errores), `OmenStatus`.
- **Datos:** `radar_findings`, `radar_sources`, `private.jobs`.
- **Roles:** admin.

### R2 Hallazgos `/admin/radar/hallazgos` (`?kind&status&min_score`), `/admin/radar/hallazgos/[id]`
- **Para:** revisar, descartar, preparar el envío y convertir en contacto.
- **Componentes:** `FindingTable` (tipo, título, fuente, puntuación, motivos, estado, fecha), `FindingDetail` (resumen, enlace original, motivos del encaje, `DraftEditor` con el borrador de propuesta o mensaje, `SendPanel`: «Copiar» siempre; «Enviar» solo si la fuente tiene API oficial autorizada; «Marcar enviado»), `ConvertSheet` (crear `contact` + `deal`, asignar dueño).
- **Acciones:** preseleccionar; descartar (motivo, alimenta el criterio); regenerar borrador (job); enviar o marcar enviado; convertir.
- **Datos:** `radar_findings`, `radar_drafts`, `contacts`, `deals`; escribe `private.jobs` (`radar.draft`, `radar.send`).
- **Estados:** borrador generándose; Omen apagado (acciones de IA deshabilitadas con aviso); enviado; convertido.
- **Roles:** admin.
- **Pregunta:** decisión 8.3 (versión segura). El botón «Enviar» automático solo existe si Jose acepta una fuente con API oficial.

### R3 Fuentes y criterio `/admin/radar/fuentes`
- **Para:** activar fuentes, frecuencia, y el criterio de encaje (stack, tarifas mínimas, ciudad, remoto, lo que no).
- **Componentes:** `SourceList` (tipo, estado, credenciales presentes sí/no, frecuencia, última ejecución), `SourceSheet`, `CriteriaForm` (lee `content/cv.json` como base y añade reglas).
- **Datos:** `radar_sources`, `radar_profile` (criterio), `private.secrets` no: las credenciales de API van al `.env` de Omen, aquí solo «configurada».
- **Roles:** admin.

---

## 7. Lab `/lab`, `/lab/[slug]` (se estudia al final)

- **Para:** ver las apps móviles en la web.
- **Componentes:** `DemoCard`, `DemoFrame` (marco de teléfono con la app: Expo web, vídeo interactivo o iframe según cada app), `DemoMeta`.
- **Datos:** MDX + assets en el repo. Interruptor `site_settings.lab`.
- **Roles:** todos.
- **Pregunta:** se decide cuando lleguen: qué apps y en qué formato (Expo web real, vídeo o capturas navegables).

---

## Resumen de preguntas de este documento

| # | Pantalla | Pregunta | Recomendación |
|---|---|---|---|
| 1 | P2 | ¿Publicar disponibilidad en la vía contratación? | Solo CV y chat |
| 2 | P6 | ¿WhatsApp y Cal.com públicos? | Cuando Jose dé los datos; ahora email y chat |
| 3 | P8 | ¿Comentarios en el blog? | No en el lanzamiento |
| 4 | K3 | ¿Comisión al ganar o al cobrar? | Al ganar (`pending`); se aprueba al cobrar |
| 5 | K7/A5/F3 | ¿Hilo por usuario o por proyecto? | Por usuario |
| 6 | A1 | ¿Varios proyectos por cliente? | Sí, con selector |
| 7 | A3 | Límites de documentos | 25 MB/fichero, 1 GB/proyecto, tipos cerrados |
| 8 | F2 | ¿Qué ve el freelance? | Brief, tareas, documentos `team`; sin importes ni cliente |
| 9 | R2 | «Operar por mí» | Decisión 8.3: borrador + clic de Jose |
