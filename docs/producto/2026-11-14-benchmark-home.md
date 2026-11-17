# Benchmark y auditoría de la home y las páginas públicas de josecoded

Fecha: 2026-11-14 · Autor: `analista-web` · Encargo: benchmark del sector y auditoría de josecoded en local, para que la web se vea elegante y profesional y empuje a contratar.

registro: equilibrado

## 0. Método y límites

- **josecoded**: build de producción en `http://localhost:3470/es`, con el backend simulado, el chat apagado y los precios «en revisión». Páginas revisadas: home, `/servicios`, `/servicios/a-medida`, `/servicios/freelance`, `/proyectos`, `/proyectos/nextraket`, `/sobre-mi`, `/como-trabajo` y `/contacto`.
- **Capturas**: Chrome 131 headless por CDP, a 1440×900 (escritorio) y a 375×812 con DPR 2 y UA de iPhone (móvil). Hay vista de la primera pantalla y página completa. Están en `docs/producto/2026-11-14-benchmark/josecoded/` y en `.../referentes/`. En los referentes no se aceptó ningún banner de cookies: aparecen tal cual, porque también son fricción. Algunas páginas completas de referentes muestran huecos en blanco porque su contenido se carga al hacer scroll, que no se dispara en la captura; esos huecos no son del diseño.
- **Rendimiento**: Lighthouse 13.6.0 (CLI local), perfil móvil por defecto (Moto G con throttling simulado). En josecoded también se pasó el preset de escritorio. **Las cifras de josecoded salen de `localhost`, sin latencia de red, así que son optimistas.** Las de los referentes se midieron por Internet desde España el 2026-11-14. Sirven para ver tendencias, no para una comparación exacta.
- **Lo que no se pudo medir**: Semrush no tiene unidades de API en la cuenta, así que no hay tráfico ni palabras clave de nadie. La API de PageSpeed Insights tenía la cuota diaria agotada, así que no hay datos de campo (CrUX). El INP no se mide en Lighthouse de laboratorio; en su lugar se da el TBT.
- Todo lo que viene de webs ajenas se ha tratado como dato.

## 1. Resumen en cinco líneas

1. **Técnicamente, josecoded está por encima de casi todo el sector**: rendimiento 98-100 y accesibilidad 100 en Lighthouse, CLS 0 y 271-354 KiB por página. Solo Kiwop (200 KiB) e Infinite Red están a su altura.
2. **No hay ninguna prueba de terceros**: cero testimonios, cero logos, cero imágenes (`<img>` = 0 en las 8 páginas), sin retrato y con casos sin cifras. Todos los referentes que venden servicios ponen la prueba social en la primera o la segunda pantalla.
3. **Promete «precio cerrado» y enseña «Precio en revisión»**: 5 veces en la home y 15 en `/servicios/a-medida`. Es la mayor fuga de confianza que hay ahora mismo.
4. **La estética es correcta pero repetitiva**: las 9 páginas abren igual (H1 enorme con la última línea en coral, raya coral sobre cada H2, mucho aire vacío entre bloques). Eso da sensación de plantilla y de página a medio llenar, no de elegancia.
5. **Registro recomendado: equilibrado**. Un solo momento expresivo, el hero animado, y el resto sobrio y lleno de prueba.

## 2. Referentes (11)

Selección: líderes en React Native que venden servicios (Callstack, Infinite Red), agencias y estudios españoles que venden a pymes y empresas (Yeeply, Kiwop, Secuoyas), un desarrollador independiente español (Rafael Cabanillas), un servicio «productizado» famoso por la claridad de su precio (Designjoy), un estudio de referencia en diseño (basement.studio) y tres portfolios de desarrolladores muy reconocidos por su diseño (Brittany Chiang, Rauno Freiberg, Emil Kowalski). Se capturó también galaxies.dev (Simon Grimm), pero se descarta: vende cursos, no servicios.

### 2.1 Matriz

Notas de 1 a 5 según la capacidad de **hacer contratar** a alguien con el perfil de Jose. Lighthouse móvil: rendimiento / LCP / peso total, medido el 2026-11-14.

| Referente | Tipo | Primera pantalla (propuesta) | Prueba social | Precios | CTA y fricción | Tono y confianza | LH móvil | Nota | Captura |
|---|---|---|---|---|---|---|---|---|---|
| **Callstack** (callstack.com) | Consultora RN, internacional | «Bring your next engineering challenge» + subtítulo de quiénes son. La prueba arranca en la primera pantalla: tarjeta de Expensify con «5x» | Logos enterprise; casos con cifras (Expensify 5× más rápido, Questrade −33 % re-renders); testimonios de AWS, Meta…; ISO 27001; 50M+ descargas OSS | No (solo su producto de IA) | «Book consultation» fijo en la cabecera, 1 clic | Técnico, directo, cifras primero | 89 / 3,2 s / 1,2 MB | 5 | `referentes/callstack-1440.jpg` |
| **Infinite Red** (infinite.red) | Agencia RN, EE. UU. | «Building your software. Anywhere it needs to be.» + 15 años de media del equipo | Franja de logos justo bajo el hero (Amazon, Starbucks, Microsoft, Expensify…); testimonios; comunidad (Chain React, podcast) | No | «Let's talk about your project →», el único botón del hero | Cercano y seguro | 100 / 1,0 s / 732 KB | 4 | `referentes/infinitered-1440.jpg` |
| **Designjoy** (designjoy.co) | Servicio «productizado», una persona | «Design subscriptions for everyone» + «Pause or cancel anytime» | Logos (Laravel, Buy Me a Coffee…), cita de un famoso, premios | **Un único precio público** (4.995 $/mes) y garantía de una semana | «See pricing» y «Book a 15-min intro call» en el hero; compra directa | Lúdico y muy seguro; resuelve la objeción del riesgo | 71 / 5,3 s / 9,9 MB | 4 | `referentes/designjoy-1440.jpg` |
| **Yeeply** (yeeply.com) | Intermediario de apps y webs, España | «De tu idea al proyecto digital que necesitas» + **formulario de 3 campos en el propio hero** | Más de 113 reseñas en Trustpilot; testimonios (LaLiga, Aquaservice); casos (LaLiga Fantasy, +1,5 M descargas) | **«Desde» públicos**: landing 2.000 €, web 4.500 €, app 8.000 € | «Solicitar presupuesto» en cabecera y hero; 3 campos | Comercial y de tú; «Sin compromiso y 100 % confidencial» | 79 / 3,2 s / 1,9 MB | 4 | `referentes/yeeply-1440.jpg` |
| **Kiwop** (kiwop.com) | Agencia de web, IA y growth, España (Reus) | «Tus datos.» en tipo gigante + una línea de qué hacen | Logos (Allianz, Sabadell, TMB…); casos con métricas (TNC −37 % LCP); 5,0 en Clutch; ISO 27001/42001 y ENS | No en la home | «Hablar con un arquitecto» + «Hablemos» en la cabecera; asistente de IA | Técnico y de negocio; «sin intermediarios comerciales» | **100 / 1,3 s / 200 KB** | 4 | `referentes/kiwop-1440.jpg` |
| **Secuoyas** (secuoyas.com) | Estudio de producto digital, Madrid | «Innovación para humanistas digitales» | Logos (Inditex, Bankinter, Comillas), casos sin cifras | No | «Ver proyectos» y «Agenda un café» | Humano, de marca | 90 / 1,4 s / 18,9 MB | 3 | `referentes/secuoyas-1440.jpg` |
| **basement.studio** | Estudio de diseño y desarrollo, internacional | Escena 3D a pantalla completa; el mensaje queda debajo | Clientes de primera fila (Vercel, Linear, Cursor…), Awwwards, FWA, Webby | No | «Contact Us» en la cabecera; dos correos | Atrevido («cool shit that performs») | 69 / 1,2 s / **15,2 MB, TBT 1.060 ms** | 3 (para Jose) | `referentes/basement-1440.jpg` |
| **Rafael Cabanillas** (rafacmur.com) | Desarrollador independiente, España | «Full-stack Product Engineer» + **foto** | Cifras propias (más de 3.000 usuarios activos y más de 7.000 descargas), apps en tiendas, empresas en las que ha trabajado | No | «Resume» y «About me»; el contacto queda en una página aparte | Cercano, con emojis | 72 / **38 s** / 9,4 MB | 2 | `referentes/rafacmur-1440.jpg` |
| **Brittany Chiang** | Portfolio de desarrolladora (empleo) | Nombre, rol y una línea; dos columnas con índice fijo | Empresas, proyectos con capturas y alguna cifra (100k+ instalaciones) | — | Ningún CTA de contratación, solo CV en PDF | Personal y pulido | 69 / 10 s / 1,5 MB | 3 (empleo), 1 (servicios) | `referentes/brittanychiang-1440.jpg` |
| **Rauno Freiberg** | Portfolio de diseñador de interacción | Frase-manifiesto tipográfica con forma amarilla; galería horizontal | Vercel como empleador | — | Correo con botón «copiar» | Mínimo y con criterio | 88 / 4,0 s / 637 KB | 2 (servicios) | `referentes/rauno-1440.jpg` |
| **Emil Kowalski** | Portfolio de design engineer | Nombre, rol y «Today» en texto; banner de su curso | Linear, Vercel, librerías propias (Sonner, Vaul) | Curso (enlace) | Inscripción al curso | Sobrio, casi editorial | 97 / 1,0 s / 2,1 MB | 2 (servicios) | `referentes/emilkowalski-1440.jpg` |

Hay capturas de móvil de todos en `referentes/<nombre>-375.jpg` y páginas completas de escritorio en `referentes/<nombre>-1440-full.jpg`.

### 2.2 Patrones que funcionan (para adoptar como patrón, no como copia)

1. **Prueba en la primera o la segunda pantalla.** Callstack mete un caso con cifra en el propio hero; Infinite Red pone una franja de logos justo debajo; Yeeply, reseñas. Ninguno de los que venden obliga a buscar la prueba.
2. **Cifras de resultado por caso** («5×», «−37 % LCP», «+1,5 M descargas»), siempre con el nombre del cliente o del producto.
3. **Precio visible, al menos un «desde».** Yeeply publica 2.000, 4.500 y 8.000 €; Designjoy, un único precio con garantía. Quien no publica precio (Callstack, Kiwop) compensa con logos enterprise que Jose no tiene.
4. **Una acción principal repetida y una alternativa de bajo compromiso**: «Book a 15-min intro call» (Designjoy), «Agenda un café» (Secuoyas), «Schedule a video call» (Infinite Red).
5. **Una cara.** Los independientes que convierten enseñan a la persona (foto de Rafael; en Designjoy, «run entirely by Brett»). En un freelance, la persona es el producto.
6. **Revertir el riesgo por escrito**: «Pause or cancel anytime», «75 % back after a week», «Sin compromiso y 100 % confidencial». josecoded ya tiene materia prima para esto (garantía de 30 días, tarea piloto), pero la deja enterrada en el interior.
7. **El rendimiento como argumento**, pero no a costa de la prueba: Kiwop combina 200 KB con logos y casos.

### 2.3 Debilidades comunes (la oportunidad)

- **Peso**: 6 de 11 superan 1,5 MB y tres pasan de 9 MB (Designjoy, Secuoyas, basement). LCP móvil de 3-38 s en cinco de ellos. Una web de 300 KB con LCP < 2,5 s es un argumento real y demostrable ante pymes y CTO.
- **Accesibilidad**: Designjoy 74, Secuoyas 85, Yeeply 86 y Rauno 87 en Lighthouse. josecoded tiene 100 en todas las páginas medidas. Con la EAA en vigor es un argumento de venta (ver §7).
- **Ninguno habla a las tres audiencias a la vez.** Las agencias venden proyecto; los portfolios, empleo. Ninguno resuelve bien «te contrato, te subcontrato o te encargo un proyecto». Ese es el hueco de Jose, siempre que cada vía tenga su prueba y su camino corto.
- **Las agencias españolas suenan genéricas** («De tu idea al proyecto…», «Hablemos»). Un desarrollador con nombre y apellidos, cifras de rendimiento y precio cerrado se diferencia de inmediato.

## 3. Auditoría de josecoded (local, 2026-11-14)

### 3.1 Mediciones

Lighthouse 13.6.0 sobre `localhost:3470`. Ojo: sin latencia de red.

| Página | Dispositivo | Rend. | Accesib. | Buenas prácticas | SEO | LCP | CLS | TBT | Peso |
|---|---|---|---|---|---|---|---|---|---|
| `/es` | móvil | 98 | 100 | 96 | 66* | 2,0 s | 0 | 10 ms | 298 KiB |
| `/es` | escritorio | 100 | 100 | 96 | 66* | 0,4 s | 0 | 0 ms | 289 KiB |
| `/es/servicios/a-medida` | móvil | 100 | 100 | 96 | 66* | 1,4 s | 0 | 10 ms | 346 KiB |
| `/es/proyectos` | móvil | 100 | 100 | 96 | 66* | 1,4 s | 0 | 10 ms | 271 KiB |
| `/es/contacto` | móvil | 100 | 100 | 96 | 66* | 1,4 s | 0 | 0 ms | 307 KiB |

\* El SEO baja a 66 solo porque el build local sirve `noindex, nofollow` (meta y `X-Robots-Tag`) y `robots.txt` con `Disallow: /`. Es lo esperable fuera de producción. **Hay que comprobarlo en el primer despliegue.** Las «Buenas prácticas» pierden 4 puntos por un `favicon.ico` que da 404; además, en el `<head>` no aparece ningún `<link rel="icon">`.

SEO técnico, comprobado sobre el HTML:

- **Bien**: `title`, `description` y `canonical` propios en las 8 páginas; un solo H1 por página; JSON-LD con `Person` y `WebSite` en todas, más `BreadcrumbList`, `FAQPage`, `ProfessionalService`, `ProfilePage` y `ContactPage` donde corresponde; Open Graph con imagen de 1200×630; `llms.txt` completo.
- **A revisar**:
  - `sitemap.xml` y `llms.txt` salen con la base `http://localhost:3000`. Hay que asegurarse de que en producción la URL base del sitio sea `https://josecoded.com`.
  - El título de `/proyectos` («Proyectos · josecoded») no contiene ninguna búsqueda.
  - El H2 «Apps y webs que he construido.» de la home repite el H1 de `/proyectos` (ya anotado en `ESTADO.md`).
- **Cantidad de texto**: home 573 palabras, a medida 2.080 (7 H2), cómo trabajo 1.347, ficha de NextRaket 231, contacto 242.

### 3.2 Página a página

| Página | Lo que funciona | Lo que resta | Capturas |
|---|---|---|---|
| **Home** | H1 claro con el especialista (React Native), lead con las tres vías, «Hablemos» y «Ver proyectos», línea de identidad con enlace al CV, hero animado de calidad, cinco fases, cierre con plazo de respuesta | El visual del hero lleva la etiqueta «EJEMPLO» y usa datos ficticios: lo primero que ve el visitante es un producto que no existe. Solo dos proyectos (falta el tercero). Teaser de precios con 5 «Precio en revisión». Ninguna cara, logo ni testimonio. En escritorio, grandes franjas vacías entre bloques (secciones de un viewport con 3 tarjetas): parece sin terminar | `josecoded/home-1440.jpg`, `home-1440-full.jpg`, `home-375.jpg`, `home-375-full.jpg` |
| **/servicios** | Las tres vías como preguntas, con «Qué recibes», CV en PDF y «Preguntar disponibilidad»; bloque de auditoría; FAQ | La primera pantalla es solo un H1 y deja media pantalla vacía. Cuatro bloques casi vacíos con mucho aire entre ellos. La caja naranja de Nexo es el elemento más llamativo de la página y le quita peso a la acción principal | `servicios-1440.jpg`, `servicios-1440-full.jpg` |
| **/servicios/a-medida** | Niveles, garantía de 30 días, mantenimiento S/M/L, costes de terceros explicados, recomendador, «qué necesito de ti»: el contenido más completo del sector español | 2.080 palabras y 7 bloques, con 15 «Precio en revisión»: el comparador no compara nada. El H1 («Precio de app móvil y web: desarrollo a medida con precio y fecha cerrados.») está escrito para el buscador y en móvil ocupa toda la primera pantalla | `a-medida-1440-full.jpg`, `a-medida-375.jpg` |
| **/servicios/freelance** | Encargos típicos con tamaño y entregable, tarea piloto, condiciones para compras: todo esto responde objeciones reales de un CTO | Tarifa «en revisión». La columna de contenido no se alinea con el H1 (sangría de unos 260 px por la subnavegación lateral). Mucho vacío vertical | `freelance-1440-full.jpg` |
| **/proyectos** | Cada tarjeta dice el papel exacto, las fechas y el estado | Sin una sola imagen. Las cuatro tarjetas son texto y etiquetas. 3Cat y 3CatInfo son el mejor activo (radiotelevisión pública, apps en tiendas), pero no se ven | `proyectos-1440-full.jpg` |
| **/proyectos/nextraket** | Estructura reto → qué hice → resultado, CTA contextual «¿Necesitas algo así?» | El resultado dice que no pone nombres de clientes ni cifras: es el punto donde debería estar la prueba y se lee como una negativa. En escritorio, el contenido ocupa la mitad izquierda y deja la derecha vacía. Ni una captura | `ficha-nextraket-1440-full.jpg` |
| **/sobre-mi** | Trayectoria clara, formación, stack agrupado, cuatro reglas de trabajo, CV en ES y EN, LinkedIn | Sin retrato. Sin GitHub (pendiente de Jose). Es la página que más leerá un recruiter y es muy textual. El bloque «Entrenador de tenis» es un buen detalle humano, pero no tiene ningún apoyo visual | `sobre-mi-1440-full.jpg` |
| **/como-trabajo** | Caso propio de la web (CSP, movimiento accesible), estándares comprobables: es un diferenciador real frente a recruiters y CTO | 1.347 palabras sin una figura de resultado. La primera pantalla repite la plantilla H1 + vacío | `como-trabajo-1440.jpg` |
| **/contacto** | Tres vías con su correo y botón de copiar, «qué pasa después» en tres pasos, formulario corto (vía, nombre, email, empresa opcional, mensaje), «Sin compromiso. No vendo ni cedo tus datos.» | No hay opción de llamada ni de agenda (2.9 ya admite teléfono). En escritorio, la columna izquierda de la tarjeta del formulario queda vacía y las tres tarjetas no llenan la fila (el PR 2 cambia este diseño). La verificación muestra «Cargando verificación» como un bloque gris | `contacto-1440-full.jpg`, `contacto-375-full.jpg` |

### 3.3 Camino al contacto por vía (desde la home)

| Vía | Camino actual | Clics | Qué le falta frente a los referentes |
|---|---|---|---|
| **Contratación (recruiter)** | Home → «Ver contratación» (`/servicios#contratacion`) → «Descargar CV» o «Preguntar disponibilidad» (`/contacto?via=hiring`) | 2-3 | Retrato, GitHub, disponibilidad y modalidad visibles (2.8 las deja al chat, que hoy está apagado). Con el chat apagado, el recruiter no tiene respuesta a «¿está disponible?» sin escribir |
| **Freelance (por hora o tarea)** | Home → «Ver tarifa y ejemplos» → «Proponer una tarea piloto» o «Pedir propuesta» → formulario | 3 | La tarifa. Una llamada corta como alternativa. Un testimonio de alguien que haya subcontratado a Jose |
| **A medida (pyme o startup)** | Home → nivel o «Ver desarrollo a medida» → «Pedir <nivel>» → formulario con resumen | 2-3 | Precios «desde», capturas de webs o apps entregadas, un testimonio de cliente de NextRaket, y la garantía y la propiedad del código a la vista antes del formulario |

«Hablemos» (cápsula y hero) abre el selector desde cualquier página. Es un buen atajo y no cuenta como fricción. En la cápsula sigue apareciendo «Contacto» aunque Q6 dice que «Contacto» sale de ella: conviene comprobar si es intencionado.

### 3.4 Cómo lo percibe cada visitante (primeros 10 segundos)

- **Recruiter técnico**: «Desarrollador full stack especializado en React Native» lo encaja a la primera, y el CV está a un clic. Echa de menos una cara y GitHub. Ve «Alten» y «3Cat», pero no las apps. Impresión: profesional y cuidado, pero anónimo.
- **Dueño de una pyme**: entiende «apps y webs para empresas y negocios». El hero le enseña un «EJEMPLO» de panel de pedidos y luego «Precio en revisión» cinco veces. Busca «¿a quién le ha hecho esto?» y no lo encuentra. Impresión: bonito, pero sin pruebas y sin precio todavía. Hoy pediría presupuesto a Yeeply, que le da un «desde» y reseñas.
- **CTO o PM que busca un refuerzo freelance**: valora los encargos con tamaño, la tarea piloto, el código en su repositorio y la web de 145 KB de JS. Es la vía mejor resuelta. Le falta la tarifa y alguien que lo avale.

### 3.5 Diseño (crítica con criterios de `impeccable critique` y `redesign-skill`)

- **Jerarquía**: el H1 domina como debe, pero cada página repite el mismo patrón (H1 negro de 3-4 líneas con el final en coral, raya coral sobre cada H2, lead gris). El coral pierde valor como acento porque aparece en cada título. Al final la raya hace de eyebrow, que es justo lo que Jose descartó.
- **Tipografía**: grotesca muy pesada y con el tracking muy cerrado. Funciona en el hero, pero en todos los H2 de todas las páginas cansa y suena a plantilla. Falta un registro secundario (por ejemplo, H2 de menor peso o un tamaño intermedio) que dé ritmo.
- **Espacio**: a 1440 px hay bloques de un viewport con 3 tarjetas y un 40-50 % de vacío. El scroll por bloques (decisión de Jose) exige que cada bloque llene su pantalla con contenido o imagen. Si no lo hace, parece un esqueleto.
- **Color**: el acero y el carbón dan seriedad. El naranja saturado de la caja de Nexo es el bloque de color más grande del sitio y compite con «Hablemos».
- **Imagen**: es un sitio sin imágenes. En un sector donde la prueba es visual (apps en tiendas, webs entregadas) es la carencia principal, por encima de cualquier ajuste fino.
- **Movimiento**: el hero animado es el mejor elemento y diferencia de verdad, a la altura de Callstack o Kiwop. Conviene mantenerlo como único momento expresivo.
- **Microcopy**: claro, de tú y honesto. «Lo que no puedo enseñar, no lo enseño» y «Aquí no pongo nombres de clientes ni cifras» se leen como excusas: hay que darles la vuelta (para `redactor`).

## 4. Brecha y recomendaciones priorizadas

Impacto (A/M/B) sobre la percepción de elegancia y profesionalidad y sobre la contratación; esfuerzo (A/M/B). El orden es por impacto/esfuerzo.

### 4.1 Datos que tiene que aportar Jose (sin ellos, el diseño no puede cerrar la brecha)

| # | Qué | Impacto / esfuerzo | Por qué |
|---|---|---|---|
| D1 | **Retrato profesional** (fondo neutro, luz natural; una versión vertical y otra horizontal) | A / B | Los independientes que convierten enseñan cara. Va en el hero o junto a la línea de identidad, y en Sobre mí |
| D2 | **Precios «desde» reales** para los 5 niveles, la hora y la tarea (ronda de tarifas 2.23). Contexto: rangos de 200-450 €/día citados por fuentes secundarias para perfiles con experiencia en España (sin dato oficial de Malt) | A / M | Elimina 20 «Precio en revisión» y cumple la promesa de «precio cerrado». Yeeply publica 2.000, 4.500 y 8.000 € |
| D3 | **2-3 testimonios con nombre y cargo**: clientes de NextRaket, un lead o compañero de Alten (recomendaciones de LinkedIn), alguien que te haya subcontratado | A / M | Hoy hay cero. Es lo que más pesa en los tres caminos |
| D4 | **Permiso del NDA para 3Cat y 3CatInfo** (ya pendiente) y **capturas de las apps publicadas** en la App Store y Google Play | A / B | El mejor «logo» que tiene Jose. Las capturas de la ficha pública de las tiendas son públicas, pero el uso lo tiene que confirmar el NDA |
| D5 | **Cifras de resultado** por caso: usuarios, valoración en tiendas, tiempos, peso o LCP antes y después, procesos automatizados en NextRaket | A / M | Convierte las fichas en casos («−37 % LCP» de Kiwop, «5×» de Callstack) |
| D6 | **2-3 webs o apps de NextRaket que se puedan enseñar** (con permiso del cliente, aunque sea sin nombre) y el **tercer proyecto destacado** de la home | M / M | La home enseña dos tarjetas y ninguna imagen |
| D7 | GitHub, disponibilidad y modalidad (remoto, híbrido, Madrid), y un enlace de Cal.com o similar para una llamada de 15 min | M / B | Recruiters y CTO; la alternativa de bajo compromiso de §2.2 |

### 4.2 Diseño (para `director-arte`; la UI nueva necesita aprobación de Jose)

| # | Qué | Impacto / esfuerzo |
|---|---|---|
| A1 | **Franja de prueba justo bajo el hero**: cara + «apps en App Store y Google Play para 3Cat» + 1-2 cifras + un testimonio corto. Patrón de Infinite Red y Callstack, adaptado al tamaño de Jose | A / M |
| A2 | **Tarjetas de proyecto con imagen** (captura en marco de dispositivo y fondo carbón) en la home, `/proyectos` y la ficha; la ficha a dos columnas con imagen a la derecha | A / M |
| A3 | **Densidad y ritmo**: revisar que cada bloque del scroll por bloques llene su pantalla o deje de medir un viewport en escritorio. Hoy home, servicios, freelance y cómo trabajo enseñan franjas vacías | A / M |
| A4 | **Romper la plantilla de títulos**: el coral solo en el H1 de la home y en las CTA; los H2 con menos peso o tamaño; quitar la raya coral sobre los H2 (hace de eyebrow) | M / B |
| A5 | **Primera pantalla de las páginas interiores**: H1 más corto + un elemento de prueba o resumen a la derecha (precio «desde», cifra, foto), sin media pantalla vacía | M / M |
| A6 | **Bajar el tono de la caja de Nexo** (superficie neutra con acento coral, no un bloque coral) para que «Hablemos» o «Pedir propuesta» sigan siendo lo más visible | M / B |
| A7 | **Visual del hero**: mantener el movimiento y valorar que la última fase («Publicar» o «Mantener») termine en una captura real, o retirar el «EJEMPLO» cuando haya material | M / M |
| A8 | `/contacto`: añadir la llamada o la agenda como cuarta vía visible y ocupar la columna vacía (el PR 2 ya rehace la composición 7/12 + 5/12) | M / B |

### 4.3 Contenido y textos (para `redactor`)

| # | Qué | Impacto / esfuerzo |
|---|---|---|
| R1 | Dar la vuelta a las negativas («Aquí no pongo nombres de clientes ni cifras», «Lo que no puedo enseñar, no lo enseño») y convertirlas en lo que sí se puede afirmar (papel, alcance, tiendas, tiempo en producción) | A / B |
| R2 | H1 de `/servicios/a-medida` más corto y humano; la búsqueda «precio de app» se queda en el `title` y en el primer H2 | M / B |
| R3 | Revertir el riesgo en una línea cerca de cada CTA: garantía de 30 días, código y cuentas a tu nombre, tarea piloto sin permanencia (ya está en el interior, falta subirlo) | M / B |
| R4 | Mientras no haya precios: sustituir el teaser de niveles de la home por la promesa («precio y fecha cerrados antes de empezar») sin chapas «en revisión», u ocultar el teaser (decide Jose) | A / B |
| R5 | `title` de `/proyectos` con la búsqueda («Proyectos de apps React Native y webs Next.js») | B / B |
| R6 | Textos ya pendientes en `ESTADO.md` (home escaparate, `offersPage.*`, `howPage.*`, FAQ) | M / M |

### 4.4 Técnico y SEO (para `implementador-web` y `seo-geo`, nivel S)

- Favicon y `<link rel="icon">`/`apple-touch-icon` (hoy, 404).
- URL base del sitio en producción para `sitemap.xml` y `llms.txt`, y quitar el `noindex` solo en producción. Comprobarlo en W46.
- Valorar `Review`/`AggregateRating` en el JSON-LD solo cuando haya testimonios reales y verificables.
- Nombre del asistente: Kiwop, una agencia española del mismo mercado, comercializa una plataforma llamada «Nexo». El riesgo es bajo, pero conviene saberlo antes de invertir en la marca del asistente.

### 4.5 Qué copiar, qué evitar y qué quitar

- **Copiar (como patrón)**: prueba justo bajo el hero (Infinite Red); casos con cifra y nombre (Callstack, Kiwop); «desde» públicos (Yeeply); una sola acción principal y una llamada corta como alternativa (Designjoy); la cara de la persona (Rafael Cabanillas); 200 KB con prueba social (Kiwop).
- **Evitar**: hero 3D o WebGL pesado (basement: 15 MB y TBT de 1 s); formularios largos o emergentes (Yeeply); portfolio sin CTA de contratación (Brittany Chiang, Rauno); cuatro botones distintos para lo mismo; titulares genéricos de agencia.
- **Quitar ya**: las chapas «Precio en revisión» visibles en la home; la frase negativa del resultado de NextRaket; la raya coral sobre cada H2; los huecos de un viewport sin contenido.

## 5. Registro recomendado

`registro: equilibrado`

Evidencia:

- **Objetivo principal: convertir** por tres vías, no recordar una marca. Los referentes que mejor convierten con un perfil parecido (Infinite Red, Kiwop, Callstack, Yeeply) están en equilibrado: un elemento de marca fuerte y el resto al servicio de la prueba y la acción.
- **Personas y contexto**: recruiters que escanean en escritorio entre muchas pestañas; dueños de pyme que llegan desde el móvil o por recomendación; CTO que valoran el criterio técnico. Ninguno premia la experimentación visual. Todos premian la claridad, la prueba y la velocidad.
- **Lo que hacen los mejores y el hueco**: los expresivos (basement, Rauno) se apoyan en clientes de primera fila, premios o fama propia, que Jose aún no tiene. Sin ese respaldo, lo expresivo se percibe como forma sin fondo, y además pesa (basement 15 MB, Designjoy 9,9 MB). Los elegantes puros (Emil, Brittany) no venden servicios. El hueco es una web equilibrada, rápida y accesible, con prueba real.
- **Presupuesto**: el de `CLAUDE.md` (LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JS de la home ≤ 150 KB gz, Lighthouse ≥ 95) ya encaja en equilibrado y hoy se cumple (146,5 KB gz en `/es` según `ESTADO.md`, al límite). Las imágenes que se añadan (A1, A2) deben ir en AVIF o WebP con dimensiones fijas, y no deben ser el LCP del hero en móvil.
- **Encaje con lo decidido**: el hero animado y el scroll por bloques se quedan como el momento expresivo acotado. El resto baja de intensidad (A3, A4, A6).

Pendiente de confirmación de Jose en el checkpoint.

## 6. EAA (Ley Europea de Accesibilidad)

**josecoded no entra.** Es una web profesional de presentación y captación sin venta ni reserva en línea al consumidor. Además, la EAA exime a las microempresas que prestan servicios. Si algún día se cobra en la web (pagos de clientes en el área privada), habría que revisarlo.

**Oportunidad comercial:** muchos clientes de la vía «a medida» sí entran (comercio electrónico, reservas, transporte, banca) desde junio de 2025. Lighthouse da 100 de accesibilidad en todas las páginas de josecoded, frente a 74-87 en Designjoy, Secuoyas, Yeeply y Rauno. Con el artículo del blog sobre EAA y la oferta de auditoría (2.29), es un argumento diferencial que hoy no aparece en la home.

## 7. Ficheros

- Informe: `docs/producto/2026-11-14-benchmark-home.md`
- Capturas de josecoded: `docs/producto/2026-11-14-benchmark/josecoded/` (9 páginas × escritorio y móvil × primera pantalla y página completa)
- Capturas de referentes: `docs/producto/2026-11-14-benchmark/referentes/` (12 webs × escritorio, móvil y página completa de escritorio)

Fuentes externas: [designjoy.co](https://www.designjoy.co/), [infinite.red](https://infinite.red/), [callstack.com](https://www.callstack.com/), [basement.studio](https://basement.studio/), [yeeply.com](https://yeeply.com/), [kiwop.com](https://www.kiwop.com/), [secuoyas.com](https://www.secuoyas.com/), [rafacmur.com](https://www.rafacmur.com/), [brittanychiang.com](https://brittanychiang.com/), [rauno.me](https://rauno.me/), [emilkowal.ski](https://emilkowal.ski/), [galaxies.dev](https://galaxies.dev/). Rangos de tarifa (secundarios, sin verificar): [jobrise.io](https://jobrise.io/es/blog/freelance-developer-espana-2026/), [pasqualepillitteri.it](https://pasqualepillitteri.it/es/news/456/tarifas-freelance-ict-italia).
