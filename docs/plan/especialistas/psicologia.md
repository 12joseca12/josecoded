# Psicología del comprador y persuasión ética — josecoded

**2026-11-05 · asesor de psicología del comprador y UX persuasiva.** Parte de `docs/brief.md`, `docs/arquitectura/{division-pantallas,valor-pantallas,ofertas,decisiones}.md`, `messages/es.json` y las páginas de `src/app/[locale]/(site)/` (hoy la home solo tiene `Hero`; `servicios`, `a-medida`, `freelance`, `contacto` y `proyectos` con vacío «Pronto»). No toca código: propone componentes, ubicación y microcopy. Los textos finales pasan por `redactor` (Mac). Principio rector, alineado con la regla de valor 1: **cada palanca de persuasión debe ser verificable con un clic o desaparece.**

---

## 0. Diagnóstico en ocho líneas

1. La web ya hace bien lo difícil: precio «desde» visible, «No incluye» en cada nivel, 30 días de garantía (2.27), recomendador que explica «por qué» y confiesa «He supuesto algo por ti». Eso es reversión de riesgo y transparencia reales.
2. El mayor hueco de confianza es **la prueba**: `/proyectos` está en «Pronto» y la home solo tiene el hero. Sin casos, la autoridad descansa en esta web como proyecto insignia (2.11/2.20) y en el repo.
3. Las cifras del hero (1.284 pedidos, valoración 4,8, 99,8 % sin fallos) son de una demo: sin una marca «ejemplo» se pueden leer como resultados de un cliente. Riesgo de prueba social falsa por omisión.
4. Hay dos patrones oscuros latentes en `ofertas.md`/copy: `maintenance` **premarcado** con `kind = both` (R9) y Nexo invitando a marcar extras «aunque sea por si acaso» (infla el ancla).
5. Voz incoherente: «**Nuestro** asistente te responde **al momento**» cuando Jose es una persona y Omen puede estar dormido. Se corrige a primera persona y promesa condicionada.
6. Cinco niveles + doce extras rozan la paradoja de la elección; las pestañas Web/App y el recomendador como camino por defecto la resuelven si los extras se filtran y agrupan.
7. El precio provisional (`000 €`) sin explicación funciona como anti-ancla: parece oculto. Mostrarlo como rango o como «precio en revisión, fecha» y nunca como ceros sueltos.
8. En privado la palanca es la **transparencia operativa** (cliente) y la **previsibilidad de la recompensa** (closer), no la gamificación (descartada en `valor-pantallas.md` §8).

---

## 1. Audiencias

### 1.1 Recruiter / tech lead que contrata
- **Trabajo a resolver:** filtrar en 2 min si Jose encaja en una vacante React Native/full stack y justificarlo ante su equipo («¿por qué este candidato?»).
- **Miedos y objeciones:** que infle su nivel; que sea «freelance de corazón» y se vaya en seis meses; que no sepa trabajar en equipo (PR, revisión, CI); nivel de inglés; disponibilidad y modalidad (remoto/Madrid).
- **Disparadores:** código abierto que puede leer; una app publicada con enlace a tienda; decisiones escritas; CV descargable sin formulario; respuesta concreta a «¿disponible?» (Nexo, 2.8).
- **Momento de la verdad:** abrir el repo o la ficha de esta web y encontrar orden (commits, tests, a11y). Segundo: el CV en un clic.
- **Lo que le convence es autoridad verificable,** no adjetivos. Nada de «apasionado», «senior» sin años, barras de nivel.

### 1.2 Dueño de pequeño negocio (Desarrollo a medida)
- **Trabajo a resolver:** tener su web/app publicada sin gestionar piezas ni aprender jerga, y sin que el presupuesto se dispare.
- **Miedos:** que le engañen o le cobren de más; costes ocultos (tiendas, dominio, IVA, Stripe); que el proyecto no termine o quede a medias; quedar atado (no poder irse con su código, cuentas a nombre del desarrollador); no entender lo que compra; elegir mal el nivel y «pagar de más»; desaparición tras la entrega.
- **Objeciones típicas:** «¿cuánto me va a costar de verdad?», «¿y si quiero algo más luego?», «¿qué tengo que hacer yo?», «¿esto es mío?».
- **Disparadores:** precio y plazo cerrados por escrito; «qué no incluye» visible; garantía de 30 días; publicación «con tus cuentas»; pago por fases; un caso parecido al suyo.
- **Momento de la verdad:** la tarjeta de resultado del recomendador (precio + por qué + no incluye) y, después, la **primera respuesta humana** (plazo prometido cumplido).

### 1.3 CTO / responsable técnico que busca refuerzo freelance
- **Trabajo a resolver:** cubrir una carga puntual (funcionalidad, auditoría, rescate) sin coste de contratación y sin riesgo para su base de código.
- **Miedos:** coste de onboarding; que rompa algo o deje deuda; comunicación lenta; facturación y legal (IVA, NDA, propiedad intelectual); horas que crecen sin control.
- **Disparadores:** tarifa publicada; ejemplos de tareas con tamaño (`TaskExamples`); «el alcance crece → lo acordamos antes» (ya en FAQ); entregas cortas probables; cuándo puede empezar.
- **Momento de la verdad:** la propuesta (horas o precio cerrado por tarea) y la primera PR.

### 1.4 Usuarios privados
- **Cliente (área):** quiere saber en qué punto está, qué le toca y cuánto le cuesta lo que pide fuera de alcance. Miedo: caja negra, sorpresas en la factura.
- **Closer / subcloser:** quiere leads justos, saber cuánto cobra y cuándo, y no quedar mal con su contacto. Miedo: que le «quiten» un contacto, cifras que cambian, prometer lo que Jose no hará.
- **Freelance delegado:** quiere el brief y nada más. Miedo: ambigüedad y ver cosas que no le tocan.

---

## 2. Palancas permitidas y su forma honesta

| Palanca | Forma honesta en josecoded | Forma prohibida |
|---|---|---|
| Prueba social | Casos con enlace a tienda/web, cifra con fuente y fecha; esta web como caso | Testimonios sin nombre, logos, «+50 proyectos», cifras de demo sin marcar |
| Autoridad | Repo, decisiones escritas, Lighthouse medido, stack con «en producción en: X» | Títulos inflados, «experto», sellos inventados |
| Reversión de riesgo | 30 días de corrección incluidos, precio cerrado por escrito, pago por fases, sin permanencia | «Satisfacción garantizada» sin condiciones |
| Anclaje | «desde» por nivel en orden ascendente, qué mueve el precio, rango orientativo | Precio tachado, nivel señuelo creado para que otro parezca barato |
| Compromiso y coherencia | Recomendador paso a paso → resultado con sus respuestas → contacto prefijado | Pedir email antes de dar el resultado |
| Reciprocidad | Resultado y «por qué» gratis sin datos; guías de precio del blog; Nexo responde sin registro | Guía «gratis» tras formulario; regalo condicionado |
| Escasez | Disponibilidad real («Próximo hueco: enero») solo si se actualiza sola o con fecha | Contadores, «quedan 2 plazas», ofertas que caducan |
| Arquitectura de elección | Pestañas Web/App, recomendador por defecto, extras filtrados por nivel | Premarcados de pago, opciones escondidas |

---

## 3. Por pantalla

### 3.1 Home `/`
- **Hero (hecho):** añadir en la ventana del teléfono/navegador una etiqueta discreta `DemoTag` («App de ejemplo», Geist Mono pequeña, `aria-label` completo) en la esquina del dispositivo. Mantiene el deleite y evita leer 1.284 pedidos como resultado real.
- **`ServicesStrip` como enrutador por situación** (P1 §3): es el mayor reductor de carga cognitiva. El texto empieza por la situación del visitante («¿Necesitas una web o app a medida?») y termina en un beneficio verificable, nunca en un adjetivo.
- **`ProofStrip` (nuevo, tras el enrutador):** tres pruebas con enlace, no tres logos: «Esta web: código abierto · Lighthouse ≥ 95 · ver cómo está hecha», la primera app publicada (cuando exista), «Respondo en 1–2 días laborables». Si no hay app publicada todavía, solo dos pruebas; nunca relleno.
- **`ChatInvite`:** arranques por audiencia («¿Estás disponible para contratación?», «¿Qué nivel me conviene?», «¿Cuánto cuesta una tarea de…?»). Reciprocidad: el visitante obtiene una respuesta antes de dar nada.
- **Una sola primaria** («Pide propuesta»); el cierre con `QuickContact` en `ghost`.

### 3.2 Servicios (hub) `/servicios`
- `ServiceBento` + `NeedTile` (hecho) ya enruta. Añadir en cada tile una **línea de expectativa** (qué recibes tras contactar): contratación → «CV y respuesta sobre disponibilidad»; freelance → «propuesta con horas o precio por tarea»; a medida → «presupuesto cerrado por escrito».
- «Cómo trabajo» (5 fases, 2.14) es el **mapa del futuro**: reduce la incertidumbre del no técnico. Cada fase con «qué ves tú» y «qué necesito de ti» (dos líneas, no párrafos).
- FAQ del hub: la pregunta de tiempo de respuesta es una promesa; debe coincidir en todas las pantallas (hoy FAQ dice «uno o dos días laborables»; usar exactamente eso en contacto y Nexo).

### 3.3 Desarrollo a medida `/servicios/a-medida` (el corazón comercial)
**Orden psicológico recomendado:** H1 con precio → recomendador visible arriba como enlace («Encuentra el tuyo en un minuto», hecho) → `OfferCompare` → `WarrantyPlans` → `WhatINeedFromYou` → FAQ → cierre.

- **Arquitectura de elección en `OfferCompare`:** las pestañas Web (3) / App (2) son correctas; nunca más de 3 tarjetas a la vista. No destacar un nivel como «el más elegido» hasta tener datos; si se destaca, que sea «lo más habitual en negocios como el tuyo» y basado en leads reales. Sin nivel señuelo.
- **Ancla honesta:** orden ascendente de precio; bajo el «desde», una línea `PriceDrivers` («Sube con: cuentas, cobros, idiomas») que explica qué mueve la cifra. Mientras sea provisional, no mostrar `000 €`: mostrar «Precio en revisión · se publica en {mes}» o un rango orientativo, con el `scopeNote` actual. Ceros sueltos se leen como «precio escondido».
- **`CostsDisclosure` (nuevo, bajo la comparativa, cuatro líneas):** IVA aparte, cuotas de Apple (99 $/año) y Google (25 $), dominio, comisión de Stripe. Nombrar los costes de terceros antes de que el cliente los descubra es la mayor fuente de confianza en este público.
- **`OwnershipNote` (nuevo, una línea con icono de llave en cada tarjeta o en `WhatINeedFromYou`):** «El código, el dominio y las cuentas de tienda son tuyos». Desactiva el miedo al bloqueo.
- **`PaymentSchedule` (nuevo, si Jose cierra la forma de pago):** barra segmentada con el anillo/borde coral (T3) «40 % al empezar · 40 % al entregar el diseño · 20 % al publicar». Pagar por hitos es reversión de riesgo.
- **Extras (`ExtraList`):** mostrar primero los que aplican al nivel activo (filtrar por `applies`), el resto plegado en «Ver todos los extras». Cada extra con una frase de **para quién** («Si vas a cobrar dentro…»), no de qué tecnología. Nunca premarcado.
- **Garantía (`WarrantyPlans`, hecho):** el texto es bueno porque nombra límites («No cubre cambios nuevos ni fallos de servicios de terceros»). Repetir el sello «30 días de corrección incluidos» como `Chip` en cada tarjeta de nivel y en el `OfferResult`, cerca del precio: la reversión de riesgo pesa más donde aparece el coste.
- **Mantenimiento:** «sin permanencia» debe ser literal en la propuesta (hoy «sin permanencia en el texto de la propuesta» es ambiguo: decir «Sin permanencia: lo das de baja cuando quieras, con un mes de aviso» o lo que Jose fije).

### 3.4 Recomendador (`OfferRecommender` + `OfferResult` + `NexoGuideBubble`)
- **Compromiso y coherencia:** cada respuesta es una microdecisión; el resultado repite las palabras del visitante («Quieres una web para tu negocio…»). Hecho en `reasons.*`; mantenerlo literal.
- **Progreso y cierre:** `ProgressRing` «Paso 2 de 6», «Atrás» siempre, URL compartible. Añadir en el último paso una **pre-revisión** de una línea («Web · cuentas básicas · panel · 2 extras») antes de «Ver mi recomendación»: el visitante confirma lo que dijo y el resultado no sorprende.
- **Reciprocidad:** el resultado se entrega **sin email**. Solo después, «Pedir esta propuesta» lleva al formulario con la selección (`contactPage.form.selection`, hecho).
- **Transparencia de supuestos:** «He supuesto algo por ti» (hecho) es excelente: listar *qué* supuso, no solo que supuso.
- **`maintenance` nunca premarcado** (cambiar R9 de `ofertas.md`): mostrarlo desmarcado con la razón «Con web y app a la vez, lo más recomendable». Premarcar un pago recurrente es *sneak into basket*.
- **Cambiar `nexoGuide.ask.more`:** de «Marca los que te suenen, aunque sea por si acaso» a «Marca solo lo que sepas que necesitas; lo que dudes lo vemos hablando». Inflar el ancla por miedo genera arrepentimiento y lead peor cualificado.
- **Salida de baja presión:** «Prefiero hablarlo primero» (hecho) como `ghost` junto a la primaria; respeta al que no está listo.
- **Ruta freelance (R1):** decir que no es un proyecto nuevo es honestidad que genera confianza: «No te vendo un proyecto que no necesitas».

### 3.5 Nexo: tono y cuándo hablar
- **Persona:** asistente de Jose, en primera persona sobre sí mismo y en tercera sobre Jose («Jose responde en 1–2 días»). Cercano, breve (≤ 2 frases), sin exclamaciones en serie, sin emojis, sin vender. Siempre se declara asistente (`nexoGuide.disclosure`, hecho). Corregir «Nuestro asistente te responde al momento» → «Mi asistente, Nexo, responde al momento cuando está despierto» o, con Omen dormido, «Nexo está desconectado; Jose te responde por correo».
- **Habla:** al entrar en cada paso para explicar **por qué se pregunta** (los `ask.*` actuales: reducen la sensación de interrogatorio); cuando el visitante elige «no lo sé» (tranquilizar); al resultado (una frase); cuando hay error o 429 (ofrecer alternativa); cuando detecta intención de compra en el chat (ofrecer `HandoffCard`, una vez).
- **Calla:** mientras el visitante elige o escribe (estado `listening`, sin burbujas nuevas); tras dos pasos seguidos sin «no lo sé» puede reducirse a la línea de ayuda plegable; nunca reabre el panel solo, nunca aparece por temporizador ni por intención de salida (*exit intent*), nunca insiste tras un «no» al handoff.
- **Honestidad técnica:** sin «escribiendo…» falso con retardo; `thinking` solo cuando hay trabajo real (5.9). Citar fuente («Servicios › A medida») en cada cifra. Si no sabe: `nexoChat.fallback` (hecho, bien).
- **Salas privadas:** con el cliente, solo con consentimiento (5.14) y anunciando «Nexo responde porque nadie ha contestado en 10 min» en la primera intervención: el cliente debe saber siempre quién le habla.

### 3.6 Freelance `/servicios/freelance`
- `RateFigure` con cifra y fecha; añadir `TaskExamples` con rango («Pantalla nueva con API: 1–2 días») para que el CTO traduzca tarifa a coste.
- **`StartAvailability` (nuevo, una línea bajo la tarifa):** «Próxima disponibilidad: {fecha}» solo si Jose la mantiene (campo en `site_settings` con fecha de actualización; si caduca > 30 días, se oculta). Escasez real, no fabricada.
- **`TermsStrip` (nuevo, cuatro chips):** «Factura con IVA · NDA si lo necesitas · El código es tuyo · Entregas por PR». Responde las objeciones legales del CTO sin que tenga que preguntar.
- Cierre «Pedir propuesta» → `?via=freelance`; promesa de respuesta idéntica a la FAQ.

### 3.7 Proyectos y ficha
- Mientras no haya casos: no enseñar «Pronto» como callejón; mostrar la ficha de **esta web** como primer caso y un enlace a «Cómo trabajo». El vacío honesto vale más que proyectos de relleno.
- `ProjectCard`: estado honesto (`live/wip`), una cifra con fuente, enlace directo a tienda/web. En la ficha, «¿Necesitas algo así?» enlaza al servicio que la vendió (prueba → acción).
- Testimonios: solo con nombre, cargo, enlace (LinkedIn o web del cliente) y permiso escrito; si no, ninguno.

### 3.8 Contacto `/contacto`
- **`WhatHappensNext` (pendiente en P6):** tres pasos con plazo bajo el título del formulario: «Lo leo yo» · «Te respondo en 1–2 días laborables» · «Propuesta por escrito o llamada de 20 min». Es el mayor reductor de ansiedad en formularios.
- **Formulario corto** (nombre, email, mensaje + uno por vía; hecho). Ayuda del mensaje como andamio: «Cuéntame el contexto, el plazo y lo que necesitas» (hecho); añadir un ejemplo plegable por vía.
- **Selección arrastrada del recomendador** (`selection`, hecho): mostrar también «30 días de garantía incluidos» y «Sin compromiso: es una propuesta». Coherencia con lo que acaba de decidir.
- **Consentimiento** sin premarcar (correcto). Turnstile invisible salvo reto.
- **Cierre:** el éxito sustituye al formulario con número de pasos y plazo, el email de la vía y «mientras tanto: ver proyectos / guía de precios». Enviar un acuse por email con copia de lo enviado y la selección (Resend): cierra el bucle y reduce el «¿le ha llegado?».
- **Microcopy de error:** dice qué pasó y qué hacer (hecho). Nunca culpar al usuario.

### 3.9 Sobre mí y Cómo trabajo
- `HowIWork` con hechos enlazados (PR por bloque, CI, a11y por componente, decisiones escritas). Autoridad por evidencia.
- Retrato real, ciudad (Madrid, 2.13), idiomas, trayectoria con fechas. La foto humana reduce el riesgo percibido del freelance «anónimo».
- CV en un clic, sin formulario (reciprocidad para el recruiter).

---

## 4. Zonas privadas

### 4.1 Área de clientes `/area`
- **Transparencia como producto:** `ProjectHeader` con fase y anillo calculado de tareas reales; nunca porcentaje a mano. Si el anillo no se mueve en 7 días, mostrar el porqué («Esperando tus textos desde el 3 nov») en vez de ocultarlo.
- **`TodoForYou` primero:** el cliente ve lo que bloquea por su lado; reduce culpas mutuas y retrasos (la fecha cerrada depende de `response_days`, decirlo aquí).
- **`RecentUpdates` en vivo** con autor y hora: prueba continua de que se trabaja.
- **Historias fuera de alcance (6.8):** estado `quoted` con importe y botón «Aceptar presupuesto» del cliente; nada se factura sin su clic. Mostrar acumulado «Fuera de alcance aceptado: X €» junto al precio cerrado: cero sorpresas en factura.
- **`WarrantyCountdown`:** tras publicar, «Garantía activa hasta el {fecha}» con el anillo coral. Es una fecha real, no urgencia: informa y anima a reportar errores a tiempo.
- **Quién está:** miembros de la sala visibles (Jose, el closer); cada alta o Nexo activado deja mensaje `system` (5.14, 5.16).

### 4.2 CRM de closers `/crm`
- **Previsibilidad de la recompensa:** «Marcar ganada» enseña la comisión exacta antes de confirmar (K3); `CommissionTotals` por estado con fechas; importes congelados. La motivación sostenible viene de saber cuánto y cuándo, no de rankings.
- **Justicia percibida:** el «reclamar» atómico y la regla «el contacto con dueño no entra en la bandeja» (7.8) se explican en una línea en la bandeja: «Primero que reclama. Tus contactos nunca entran aquí».
- **Progreso personal, no competitivo:** «Este mes: 3 ganadas · 1.200 € pendientes de aprobar». Sin tablas de líderes entre closers (presión y conflicto con subclosers).
- **Kit de venta honesta (`SalesKit`, nuevo en K6 o en el resumen):** enlace personal al recomendador con atribución (`?ref=`), los mismos textos públicos y una lista «Qué no prometemos» (plazos sin `response_days`, precios por debajo del «desde», funciones fuera de alcance). Protege la reputación de Jose y del closer.
- **Siguiente acción visible** (`NextActionField`): reduce la fricción diaria más que cualquier incentivo.

### 4.3 Freelance delegado
- Brief primero, solo sus tareas, sin importes ni cliente (6.7). Motivación por claridad: criterios de hecho en cada tarea y `done_note`.

---

## 5. Patrones de microcopy

- **Primera persona singular** en toda la web pública («Te respondo», «Corrijo»); Nexo habla de Jose en tercera. Eliminar «nuestro».
- **Promesas con número y condición:** «Te respondo en 1–2 días laborables», «30 días tras la entrega», «Si respondes a cada entrega en ≤ N días, la fecha se mantiene».
- **Nombra el límite junto al beneficio:** «Incluye publicación con tus cuentas · No incluye alta de cuentas de tienda».
- **Botones con resultado, no con esfuerzo:** «Ver mi recomendación», «Pedir esta propuesta», «Descargar CV»; nunca «Enviar» a secas si se puede decir qué se envía.
- **Sin compromiso explícito** donde hay riesgo percibido: «Es una propuesta, no un contrato».
- **Opción de salida sin vergüenza:** «Prefiero hablarlo primero», «Ahora no». Nunca *confirmshaming* («No, no quiero crecer»).
- **Estados honestos:** «Nexo está desconectado» antes que un spinner eterno; «Precio en revisión» antes que `000`.

---

## 6. Qué evitar (lista de bloqueo para `revisor` y `/puerta-calidad`)

1. Urgencia falsa: contadores, «oferta hasta», «solo 2 plazas» sin dato real fechado.
2. Premarcados de pago (mantenimiento, extras) y extras añadidos por Nexo sin acción del usuario.
3. Prueba social sin fuente: testimonios anónimos, logos, contadores, cifras de demo sin `DemoTag`.
4. Email antes del resultado del recomendador o de una guía (*gated content*).
5. Precios tachados, niveles señuelo, «el más popular» sin datos.
6. Nexo proactivo: apariciones por temporizador, *exit intent*, insistencia tras «no», «escribiendo…» simulado, hacerse pasar por Jose.
7. Costes de terceros descubiertos tarde (IVA, tiendas, Stripe) o «sin permanencia» ambiguo.
8. Rankings entre closers y metas impuestas; comisiones que cambian tras ganar.
9. Progreso inflado en el área o retrasos ocultos.
10. Cambio de idioma de voz (nosotros/yo) y promesas incoherentes entre FAQ, contacto y Nexo.

---

## 7. Componentes nuevos propuestos (resumen y ubicación)

| Componente | Dónde | Palanca | Coste |
|---|---|---|---|
| `DemoTag` (variante de `Chip`) | Dispositivos del hero | Verdad en la prueba | S |
| `ProofStrip` | Home, tras `ServicesStrip` | Autoridad verificable | S |
| `PriceDrivers` | Bajo cada «desde» en `OfferCompare` | Ancla honesta | S |
| `CostsDisclosure` | Tras `OfferCompare` | Transparencia | S |
| `OwnershipNote` | Tarjetas de nivel / `WhatINeedFromYou` | Anti bloqueo | S |
| `PaymentSchedule` | A medida, junto a garantía | Reversión de riesgo | S (tras decisión de Jose) |
| Sello garantía (`Chip` `tone=warranty`) | Tarjetas, `OfferResult`, selección en contacto | Reversión de riesgo | S |
| Pre-revisión del paso 6 | `OfferRecommender` | Coherencia, cierre | S |
| `WhatHappensNext` | `/contacto` y estado de éxito | Cierre, ansiedad | S |
| `StartAvailability` | Freelance (y Nexo) | Escasez real | S + `site_settings` |
| `TermsStrip` | Freelance | Objeciones legales | S |
| `WarrantyCountdown` (`ProgressRing`) | Área, tras publicar | Transparencia | S |
| Acumulado fuera de alcance | Área, `ProjectHeader` | Cero sorpresas | S |
| `SalesKit` con `?ref=` | CRM | Motivación honesta, atribución | M (dato nuevo: `leads.ref_closer_id`) |

Todos son variantes de componentes existentes (`Chip`, `ProgressRing`, `Steps`) salvo `SalesKit`; ninguno pide dependencia nueva.

## 8. Para Jose

1. ¿Forma de pago por hitos (p. ej. 40/40/20)? Desbloquea `PaymentSchedule`.
2. ¿Publicar «Próxima disponibilidad» y mantenerla al día? Si no, no se muestra escasez.
3. ¿Quitar el premarcado de mantenimiento en Web y app (R9)? Recomendado: sí.
4. ¿Precio provisional como rango o como «en revisión»? Recomendado: «en revisión» hasta la ronda (2.23).
5. ¿Enlace personal de closer al recomendador con atribución? Requiere migración (OK de Jose).
