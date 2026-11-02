# josecoded

Reinicio del proyecto el 2026-11-02. El repositorio está vacío a propósito: se empieza de cero con una metodología nueva.

## Qué se ha guardado

- `archivo/glyph-scene/`: la animación de glifos del hero (escena three.js en TypeScript, scripts que generan el vídeo y el póster, tests), los medios ya generados en `media/` y los componentes React que la montaban en la web (`hero-web/`). Es material de referencia: no compila por sí solo, porque dependía de paquetes del monorepo anterior.
- `archivo/decisiones-pantallas/`: el documento de pantallas y contenidos (`2026-09-29-pantallas-y-contenidos.md`) y los prototipos HTML de la home (`prototipo-home-v7/`) y del CRM (`prototipo-crm/`). Los prototipos se abren con `python3 -m http.server 8000 --directory archivo/decisiones-pantallas` y se navega a `/prototipo-home-v7/` o `/prototipo-crm/`.
- `.claude/` y `CLAUDE.md`: agentes, skills y reglas de trabajo.

## Dónde está todo lo anterior

La rama `archivo/v1-2026-11-02` en GitHub contiene el proyecto completo tal como estaba antes del reinicio (web, CRM, admin, gateway, migraciones de Supabase, documentos y planes).
