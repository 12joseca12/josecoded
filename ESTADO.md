# Estado — josecoded

## Ahora
Spec v1 cerrada el 2026-09-13 tras la batería de preguntas: `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md`. Repo aún sin código. Se rehace joseCoded desde cero como monorepo `apps/web` + `apps/api`, conservando gateway, worker de Omen, Supabase y dominio (ver CLAUDE.md).

## Pendientes
- [ ] Commitear CLAUDE.md, ESTADO.md, .gitignore y la spec.
- [ ] Jose: corregir los tres ejemplos provisionales de `Comercial/voz.md` (redactados por Claude) o sustituirlos por textos reales.
- [ ] Jose: alta de OAuth Google/GitHub en el dashboard de Supabase, antes de la rama de auth.
- [ ] Actualizar la nota del vault `Proyectos/josecoded.md` con las decisiones cerradas (propuesto, pendiente de OK).
- [ ] Inventario de contenido real (proyectos, textos, métricas) antes de `ux`.
- [ ] Tarea 0: validar Next.js + OpenNext en Cloudflare Workers sin middleware Node (fallback Vercel).

## Siguiente paso
`ux` (2–3 direcciones, oscuro tech elegante sin "estética IA") → `usuario-ejemplo` valida con la persona Marta → `ui` → plan del `arquitecto` en `docs/superpowers/plans/`.

## Decisiones recientes
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
