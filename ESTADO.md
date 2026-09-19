# Estado — josecoded

## Ahora
Fase de diseño previa al plan (2026-09-17). Spec v1.3. Documentos en `docs/superpowers/design/`: UX v2.1 (shell IDE-lite, 38 pantallas + 16 errores, flujos, microcopy con hechos), diseño técnico v1.1 (verificado contra Supabase real; 47 migraciones remotas, 9 aditivas nuevas sin colisión), UI: tres direcciones descartadas por Jose (estilo y estructura), pareja de color 1 (verde + secundario) en refinado y demo de motion en `ref/colores-v2.html`. Supabase `josecoded` restaurado y activo. Hero aprobado en `ref/hero-lab-3/` (ver Decisiones); pendiente trasladar el resto de la home al mismo lenguaje.

## Pendientes
- [ ] Jose: elegir fondo (F1/F2/F3) y secundario (S1/S2/S3) de `ref/colores-v2.html` y dar feedback de la demo de motion; pasar el resultado de Stitch.
- [ ] `ui`: prototipo único de la home IDE-lite sobre UX v2.1 con la pareja elegida; iterar hasta aprobación de Jose; rehacer `2026-09-17-josecoded-ui.md` (motivos generativos y motion superados).
- [ ] Jose: los 14 `{{DATO}}` de UX §18 (nombre, ciudad, años, estado de apps, certificaciones, contacto, GitHub, stores).
- [ ] Jose: URL `workers.dev` actual del gateway; cuenta/dominio en Resend; plantilla OTP y "leaked password protection" en Supabase (diseño técnico P7–P10).
- [ ] Consolidar el documento previo a implementación (pantallas, componentes, errores, flujos, stack, integraciones, tests, preview aprobada) y pasar a plan del `arquitecto`.
- [ ] **Batería de preguntas: flujos internos de búsqueda de trabajo y freelancing** (pedido por Jose el 2026-09-17). Hacerla tras aprobar la dirección visual y antes del plan: qué es (seguimiento de candidaturas, pipeline freelance, ambos), dónde vive (admin / área interna), fuentes (Indeed MCP, LinkedIn, Notion Clientes), relación con leads y afiliados, qué se automatiza. Añadir a spec, UX y diseño técnico.
- [ ] Jose: corregir los tres ejemplos provisionales de `Comercial/voz.md` (redactados por Claude) o sustituirlos por textos reales.
- [ ] Jose: alta de OAuth Google/GitHub en el dashboard de Supabase, antes de la rama de auth.
- [ ] Inventario de contenido real (proyectos, textos, métricas) antes de `ux`.
- [ ] Tarea 0: validar Next.js + OpenNext en Cloudflare Workers sin middleware Node (fallback Vercel).

## Siguiente paso
Jose elige color y valida la demo de motion (+ Stitch) → `ui` prototipo home IDE-lite → aprobación → batería de flujos internos (empleo/freelancing) → consolidar documento de diseño → plan del `arquitecto` en `docs/superpowers/plans/`.

## Decisiones recientes
- 2026-09-19: **hero decidido** (split tipo Resend): izquierda badge + título + subtítulo + CTA; derecha escena Three.js de partículas-glifo (caracteres reales, morado con toques verdes) que morfa móvil → web → IA (chip con cerebro de nodos dentro, siempre de frente) con respiración y ondas de código. Intro de primera visita por sesión: cada letra (nav, badge, título, subtítulo, CTAs) y cada partícula caen desde arriba y aterrizan entre 0,4 y 1,2 s. Fondo: grano fino + rayo de luz suave (retícula y deriva disponibles, apagadas). Prototipo: `docs/superpowers/design/ref/hero-lab-3/`. Descartados: formatos IDE-lite/terminal/scroll/objeto (`ref/heros/`), túnel de código (`hero-lab-2`), luz volumétrica + código DOM (`hero-lab`).
- 2026-09-17: batería UX/UI/integraciones/tests (spec §12): home = la aplicación en sí (IDE-lite, sin dividir audiencias), hero de presentación con entrada código→título→minimizar una vez al día, motion sobrio con sentido técnico (CompileReveal, FocusLight, transición), visual generativo descartado tras ver las direcciones, textos con hechos sin frases vacías, colores verde + complementario, es/en, GitHub + stores + Cal.com, tests unit+integración+E2E.
- 2026-09-17: decisiones técnicas P1–P6: Workers Free; Supabase restaurado por el controlador con OK; `notify` primaria y n8n opcional; `api.josecoded.com`; deploy diario solo si cambian datos generados; `call_booked` y AI Gateway. Admin real = `staff_members.role='admin'`; leads solo vía gateway.
- 2026-09-14: tarifas v2 (`Comercial/tarifas.md`, con fecha de vigencia): packs web P1 900 / P2 1.400 / P3 2.500 / P4 4.200 €; extras mantenimiento 49 / 149 €/mes, SEO 250 / 600 €, GEO 300 €, ciberseguridad 250 €; regalos por pack no oficiales; ampliación = diferencia de lista sin descuento.
- 2026-09-14: programa de afiliados en la web v1 dentro del área interna de clientes/afiliados (D15): `?ref=CODIGO` → lead atribuido; cliente 2 meses de mantenimiento, no cliente 10 %, premium (a mano) 20 %, sobre el primer pedido sin IVA; pago manual marcado en admin. Spec v1.1.
- 2026-09-13: proyecto creado con `/nuevo-proyecto`.
- 2026-09-13: spec v1. Dos audiencias con igual peso (empresas que contratan / negocios locales); Jose se presenta como freelance, sin marca de agencia. Persona principal: dueña de negocio local.
- 2026-09-13: sin MVP; producto final v1 completo, cuanto antes. SEO + GEO como requisito de primer nivel.
- 2026-09-13: foro eliminado; se conservan chat IA, blog (MDX en repo, comentarios solo con cuenta) y portal cliente. Panel admin propio (leads, moderación, portal, chat). Leads → Supabase + Telegram vía n8n.
- 2026-09-13: showcase técnico: generador de propuesta con IA (precio por reglas desde tarifas, nunca por LLM), GSAP. Descartados 3D, datos en vivo, sección I+D.
- 2026-09-13: preguntas abiertas cerradas: chat con cuenta; comentarios en cola de aprobación; blog desde cero (slugs viejos → 410); SEO para toda España sin ciudad; 3catinfo con nombre pero sin métricas ni stack; Umami como tarea infra del plan; Llama 3.3 70B.
- 2026-09-13: insumos comerciales creados en el vault (`Comercial/tarifas.md`, `condiciones.md`, `voz.md`): 40 €/h, 150 €/feature, web básica 900 €, reservas/catálogo 1.400 €, app 4.000/6.000 €, mantenimiento 49 €/mes sin hosting; pago 40/30/30; 2 rondas, 30 días de garantía; legales incluidos.
- 2026-09-13: stack Next.js App Router + Tailwind v4 + shadcn + GSAP; Cloudflare Workers vía OpenNext; monorepo pnpm con `josecoded-api` movido a `apps/api`. Solo modo oscuro. Analítica Umami en Omen + Cloudflare Web Analytics.
