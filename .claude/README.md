# .claude del repo

Copia de lo que usa josecoded de `claude-config`, para que las sesiones en la nube (sin `~/.claude`) trabajen igual que en el Mac. La fuente de verdad sigue siendo `~/Documents/GitHub/claude-config`: si se cambia allí, se vuelve a copiar aquí (no editar estas copias a mano).

- `CLAUDE.md`: instrucciones globales de Jose en versión portable más la memoria del proyecto (diseño en el navegador, reglas visuales, principios de producción).
- Agentes: arquitecto, implementador-web, revisor, revisor-seguridad, revisor-accesibilidad, qa, usuario-ejemplo, ui, ux.
- Skills: puerta-calidad, vercel-react-best-practices, web-design-guidelines y las de Emil Kowalski para web (animate, emil-design-eng, review-animations, improve-animations, find-animation-opportunities, mobile-native, apple-design, pick-ui-library, ask-sonner, animation-vocabulary). Licencia MIT y procedencia en `vendor/emilkowalski/`.
- Plugins (`settings.json`): superpowers, cloudflare, impeccable, taste-skill, gsap-skills.
- Hook `hooks/estado-sesion.sh`: al arrancar una sesión en la nube imprime Pendientes y Siguiente paso de `ESTADO.md` (en el Mac no hace nada: ya lo hace el hook global).

En la nube no hay: vault de Obsidian, codebase-memory, cerebro de graphify, `/cierre`, `/cerebro`, agentes `comercial` y `redactor`, y Docker o Supabase local salvo que el entorno los instale.
