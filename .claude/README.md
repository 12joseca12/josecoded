# .claude del repo

Copia de lo que usa este proyecto de `claude-config`, para que las sesiones en la nube (sin la configuración global del Mac) trabajen igual que en el Mac. La fuente de verdad sigue siendo `claude-config`: lo copiado aquí lo gestiona `/harness` (se sobrescribe en cada actualización); no editar estas copias a mano.

- `CLAUDE.md`: instrucciones globales de Jose en versión portable. Lo propio del proyecto va entre los marcadores `harness:proyecto:inicio` y `harness:proyecto:fin` y se conserva.
- Agentes: `arquitecto`, `tech-lead`, `implementador-web`, `revisor`, `revisor-seguridad`, `revisor-accesibilidad`, `qa`, `usuario-ejemplo`, `ui`, `ux`.
- Skills: `puerta-calidad`, `vercel-react-best-practices`, `web-design-guidelines`, `animate`, `emil-design-eng`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `mobile-native`, `apple-design`, `pick-ui-library`, `ask-sonner`, `animation-vocabulary`. Licencia y procedencia en `vendor/emilkowalski/`.
- Plugins activos (`settings.json`): `cloudflare@claude-plugins-official`, `gsap-skills@gsap-skills`, `impeccable@impeccable`, `superpowers@claude-plugins-official`, `taste-skill@taste-skill`.
- `hooks/harness/`: hooks del harness (formato, verificación al parar, guardia de Bash, aviso de sesión). `hooks/harness/estado-sesion.sh` imprime Pendientes y Siguiente paso de `ESTADO.md` al arrancar una sesión en la nube (en el Mac no hace nada: ya lo hace el hook global).
- `settings.json`, `harness.json`, `rules/harness-*.md`: permisos, versión y reglas por stack, también gestionados por `/harness`.

En la nube no hay: vault de Obsidian, codebase-memory, cerebro de graphify, `/cierre`, `/cerebro`, agentes `comercial` y `redactor`, y Docker o Supabase local salvo que el entorno los instale.
