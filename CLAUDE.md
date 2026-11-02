perfil: web
vault: Proyectos/josecoded.md
canvas_padre: "Plataforma web personal"

# josecoded

Web personal de Jose: muestra su trabajo y capta clientes por tres vías (contratación, freelance, packs). Qué y por qué: `docs/brief.md`. Decisiones cerradas: `docs/arquitectura/decisiones.md`. Pantallas: `docs/arquitectura/pantallas.md`. Datos: `docs/arquitectura/datos.md`. Estado volátil: `ESTADO.md`. Este fichero es el cómo. La v1 vive en la rama `archivo/v1-2026-11-02` y solo se consulta.

## Dos repos
- `josecoded` (este): la web Next, `supabase/` (migraciones y tests RLS, única fuente del esquema) y `contracts/` (fixtures zod de lo que cruza como JSON). Despliega en Cloudflare.
- `josecoded-omen`: backend Node en el servidor casero Omen (IA, RAG, Radar, trabajos). Solo sale hacia Supabase, nunca recibe. Copia `database.ts` y `contracts/` de aquí con `pnpm contracts:pull`. Sustituye a `josecoded-worker`.

## Stack
- Next 16 App Router en Cloudflare Workers vía OpenNext; un solo paquete (`src/`), sin workspace. TypeScript estricto, pnpm.
- Supabase (Postgres 17, auth OTP + Google, TOTP para personal, storage, realtime, pgvector). Producción `echlwywbucgbhwpncviy`; desarrollo `josecoded-dev` (pendiente de crear); local con Docker en el Mac.
- Omen: modelo local + RAG propio + Groq (reparto pendiente, decisión 4.5).
- Email Resend, Telegram para Jose, Turnstile en formularios públicos.

## Comandos
Placeholders hasta que exista el scaffold (primer bloque de `infra/`): `pnpm install` · `pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm e2e` · `pnpm build` · `pnpm db:reset` (local) · `pnpm db:types` (regenera `database.ts`). Se confirman en `README.md` cuando existan. **pnpm siempre, nunca npm/npx.**

## Reglas del proyecto
1. **Estilo B** (acero `#929DA7`, carbón `#17191C`, coral `#FF4B32`; `prototipos/estilo-b/`). `tokens.css` a mano es la fuente; los componentes consumen solo `var(--token)` desde CSS Modules. Sin Tailwind ni shadcn.
2. **Sin comentarios en el código**, vigilado por lint. El porqué va al nombre, al commit o a `decisiones.md`.
3. **Un componente por concepto con variantes** (`variant`/`size`/`tone` como `data-*`), textos solo en `messages/es.json`, tipos en `src/types/` (zod en las fronteras, tipos inferidos), `database.ts` generado y nunca editado.
4. **UX del brief en todo:** transición de pantalla (View Transitions), botones con hover/foco/pulsado/desactivado, esqueleto en todo lo que carga, estado de carga en todo botón que lanza una acción, pantalla propia para 404 y cada error. Motion en CSS nativo; `prefers-reduced-motion` sin animaciones.
5. **Accesibilidad WCAG 2.2 AA** por componente: teclado, foco visible, contraste, axe bloqueante en E2E, lector de pantalla por pantalla.
6. **Seguridad base** (decisión 9.1): RLS en toda tabla, `anon` sin permisos salvo lo público explícito, clave de servicio solo en servidor y Omen, CSP con nonce, Turnstile y límite de peticiones en lo público, URL firmadas, zod en toda frontera, advisors de Supabase a cero.
7. **Responsive:** mobile-first, dos breakpoints en `rem`, container queries, unidades relativas; `px` solo en hairlines, sombras y offsets de motion.
8. **Presupuesto:** LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JS de la home ≤ 150 KB gz, Lighthouse ≥ 95.
9. **Ramas `<area>/<tema>`** (áreas: `public` `auth` `admin` `crm` `area` `freelance` `chat` `radar` `lab` `ai` `data` `infra` `docs` `fix`; tema kebab-case, 1–3 palabras). Commits Conventional con el área como scope. `main` protegida, PR por bloque, squash, nunca push a `main`.
10. Skills obligatorias en interfaz: `impeccable`, las de movimiento de Emil Kowalski, `vercel-react-best-practices`, `web-design-guidelines`. Dependencias solo las del plan; una extra la decide `revisor`.

## Método: tablón y bloques
- Tablón en GitHub Issues + Projects: una issue por bloque, enlazada a su PR y a su preview; `ESTADO.md` resume.
- Un bloque = una pantalla con sus componentes o una función de principio a fin; ≤ ~400 líneas, ≤ 1 h de agente. Tareas claras y concisas; si no cabe, se parte antes.
- Pipeline por bloque: `implementador-web` → `revisor` → fixes; `/puerta-calidad` una vez por pantalla antes del merge.
- Orden: público → auth y admin base → CRM → área → freelance → Radar → lab (`pantallas.md`).

## Qué aprueba Jose
Decisiones de arquitectura · cada pantalla en el navegador (prototipo HTML en `prototipos/`) antes de implementarla · cada PR en la preview · cada migración y despliegue en producción (`supabase db push` con advisors antes y después, nunca `db reset`; despliegue de Omen). Sin su OK en la misma sesión, no se toca producción.
