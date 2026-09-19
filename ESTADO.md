# Estado — josecoded

## Ahora
Diseño completo (2026-09-19): spec v1.5.2, UX v3.2, diseño técnico v1.2.1, UI v3 (`ref/ui-v3/`) y plan de v1 con 97 tareas en 10 fases (`docs/superpowers/plans/2026-09-19-josecoded-v1.md`). Hero aprobado en `ref/hero-lab-3/`. Falta `/plan-eng-review` y arrancar la fase 0.

## Pendientes
- [ ] Jose: proyecto OAuth de Google (Gmail lectura + borradores, Calendar) en su cuenta; ≥ 12 correos reales anonimizados para fixtures del parser; comprobar que el MCP de Indeed responde en `claude -p`; nombre a mostrar en el hero.
- [ ] Jose: elegir fondo (F1/F2/F3) y secundario (S1/S2/S3) de `ref/colores-v2.html` y dar feedback de la demo de motion; pasar el resultado de Stitch.
- [ ] `ui`: prototipo único de la home IDE-lite sobre UX v2.1 con la pareja elegida; iterar hasta aprobación de Jose; rehacer `2026-09-17-josecoded-ui.md` (motivos generativos y motion superados).
- [ ] Jose: los 14 `{{DATO}}` de UX §18 (nombre, ciudad, años, estado de apps, certificaciones, contacto, GitHub, stores).
- [ ] Jose: URL `workers.dev` actual del gateway; cuenta/dominio en Resend; plantilla OTP y "leaked password protection" en Supabase (diseño técnico P7–P10).
- [ ] Consolidar el documento previo a implementación (pantallas, componentes, errores, flujos, stack, integraciones, tests, preview aprobada) y pasar a plan del `arquitecto`.
- [ ] Jose (Radar): perfil de búsqueda (roles, keywords, modalidad, zona, salario/tarifa mínimos, idiomas, exclusiones, disponibilidad) y CV maestro es/en actualizado; crear cuentas en InfoJobs/Tecnoempleo/Upwork/Workana/Malt cuando toque; activar alertas de empleo de LinkedIn por correo al Gmail.
- [ ] Jose: corregir los tres ejemplos provisionales de `Comercial/voz.md` (redactados por Claude) o sustituirlos por textos reales.
- [ ] Jose: alta de OAuth Google/GitHub en el dashboard de Supabase, antes de la rama de auth.
- [ ] Inventario de contenido real (proyectos, textos, métricas) antes de `ux`.
- [ ] Tarea 0: validar Next.js + OpenNext en Cloudflare Workers sin middleware Node (fallback Vercel).

## Siguiente paso
`/plan-eng-review` del plan → fase 0 (6 validaciones en paralelo con `implementador-web`) → fase 1 → ramas `feat/radar-core` en paralelo con fases 2–6. Gates de producción solo con OK de Jose.

## Decisiones recientes
- 2026-09-19: diseño técnico v1.2.1 (hero `glyph-scene` sin R3F, medios generados desde la escena, `IntroFall`; Radar completo). P11–P15: LCP título o poster ≤ 1,2 s; sin Lenis; Telegram del Radar desde el gateway; token de Google cifrado en KV; n8n por webhook con Cloudflare Access service token + HMAC (nunca expuesto). Hero: subtítulo por audiencia sin tecnologías (alternativa B), CTAs como el prototipo.
- 2026-09-19: **módulo Radar en v1** (caza de empleo y encargos freelance): agente que descubre, puntúa y prepara candidaturas; envío solo tras confirmación de Jose (admin o Telegram); conectores enchufables (Indeed por MCP desde el Mac, LinkedIn por alertas de correo y scraping con límites tras rodaje, InfoJobs/Tecnoempleo, Workana/Malt/Upwork); Gmail por API (Proton diferido); Google Calendar secundario "Radar"; Telegram para avisos y confirmación; Supabase fuente de verdad, Notion espejo opcional. Spec v1.5 §13, UX v3.1 §7.12–7.18. Estimación +35–45 % sobre v1.
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
