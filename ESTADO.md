# Estado — josecoded

## Ahora

Reinicio desde cero (decisión de Jose, 2026-11-02). Se guardan solo la animación de glifos, las decisiones de pantallas (documento y prototipos) y la configuración de agentes en `.claude/`. Todo lo anterior queda en la rama `archivo/v1-2026-11-02`.

## Siguiente paso

Definir con Jose la metodología nueva y tomar las decisiones de base (producto, estilo, arquitectura) antes de crear tareas. El tablón de bloques (https://claude.ai/artifact/VQd4B9VtsaxjY5hoKcNk9D) se vacía y se rellena cuando esas decisiones estén cerradas.

## Pendientes

- Supabase de producción (`echlwywbucgbhwpncviy`): sigue con el esquema aplicado en el gate 1.9 (base + `definer_wrappers`) y los precios cargados. Limpiarlo es una acción en producción y necesita el OK explícito de Jose.
- Rotar los tokens que Jose pegó en el chat (Supabase, Cloudflare) si no se ha hecho.

## Decisiones recientes

- **2026-11-02 — Ramas limpias.** Solo quedan `main`, `develop` y las de archivo (`archivo/v1-2026-11-02`, `archivo/chore-monorepo-base`, `archivo/chore-supabase`). Worktrees antiguos del Mac eliminados.
- **2026-11-02 — Reinicio.** Se vacía `main` con un commit (historial conservado), se archiva todo en `archivo/v1-2026-11-02` y se crea `develop` desde el `main` vacío.
