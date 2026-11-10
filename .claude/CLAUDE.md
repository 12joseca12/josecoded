# Cómo trabajar con Jose (copia portable para sesiones en la nube)

Resumen de `~/.claude/CLAUDE.md` (repo `claude-config`) y de la memoria del proyecto, para que una sesión sin `~/.claude` trabaje igual que en el Mac. En el Mac se carga también el original; si chocan, manda el original. No editar a mano sin cambiarlo antes en `claude-config`.

## Idioma y forma
- Responder en español; código, identificadores y commits en inglés.
- Peso de herramienta proporcional a la tarea: un cambio de una línea, un texto o un typo no lleva batería, plan ni revisión.

## Modo de trabajo estándar
Para todo lo no trivial: **batería de preguntas → plan → ejecución libre.**
1. Batería (agente `arquitecto`): diseño, objetivos, funciones, restricciones, con AskUserQuestion agrupando las preguntas independientes. Salida: spec en `docs/superpowers/specs/`.
2. Plan (`arquitecto`): `docs/superpowers/plans/`.
3. Ejecución sin interrupciones hasta terminar. Solo se para ante producción, dinero o acciones destructivas.

Estado volátil en `ESTADO.md` (Ahora, Pendientes, Siguiente paso, Decisiones recientes): **actualizarlo al terminar cada bloque de trabajo.**

## Agentes (en `.claude/agents/`)
El controlador orquesta, mantiene el contexto y decide; delega y no implementa en bloque lo que un agente puede hacer.

| Agente | Cuándo |
|---|---|
| `arquitecto` | Batería, specs, planes, decisiones difíciles. |
| `implementador-web` | Una tarea del plan por invocación, con TDD. |
| `revisor` | Revisión de cada tarea y de la rama, solo lectura. |
| `ux`, `ui` | Flujos y sistema visual entre spec y plan. |
| `revisor-seguridad`, `revisor-accesibilidad`, `qa`, `usuario-ejemplo` | Puerta de calidad. |

Pipeline web: `arquitecto` → (`ux` → `usuario-ejemplo` → `ui` si hay interfaz) → `arquitecto` plan → por tarea `implementador-web` → `revisor` → fixes → `/puerta-calidad` una vez por rama antes de merge → merge.

`comercial` y `redactor` no están en la nube: necesitan el vault (tarifas, condiciones, voz). Los textos que deban pasar por `redactor` se dejan marcados y se hacen en el Mac.

## Gates que no se saltan
- **Producción**: nunca migraciones ni deploys sin OK explícito de Jose en esa misma sesión. Migraciones Supabase: las aplica el controlador (no un subagente), con comprobación de drift antes y advisors antes y después.
- **Servidor casero (Omen)**: servicios preexistentes intocables.
- **Gmail**: solo borradores, nunca enviar. **Notion**: solo escriben las skills comerciales y `/cierre`.
- Nunca push a `main`; PR por rama y squash.

## Diseño de interfaz (obligatorio)
Ninguna interfaz se da por terminada sin estas skills: `impeccable` (shape, polish, audit, critique…; plugin), `taste-skill` si hace falta rumbo (plugin), las de movimiento de Emil Kowalski (`animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `mobile-native`, `apple-design`, `pick-ui-library`, `ask-sonner`, `animation-vocabulary`, `emil-design-eng`; en `.claude/skills/`, MIT, ver `.claude/vendor/emilkowalski/`) y `web-design-guidelines` como última verificación. React/Next: `vercel-react-best-practices`. Método: `superpowers` (brainstorming, writing-plans, TDD, systematic-debugging). GSAP solo con justificación aceptada por `revisor` (plugin `gsap-skills`).

## Lo aprendido con Jose (memoria del proyecto)
- **Las reglas del proyecto mandan.** Stack, estilo, componentes, textos, tipos, accesibilidad, seguridad, presupuesto de rendimiento y ramas están en el `CLAUDE.md` de la raíz; este fichero no las repite para que no se desincronicen.
- **Decide el diseño en el navegador, no por escrito.** Nada de direcciones descritas: prototipo HTML en `prototipos/` (servido con la configuración `design-ref` de `launch.json`), variables ajustables en `:root`, variantes conmutables sin recargar y assets versionados (`?v=N`). Pedir referencias concretas (URLs) y replicarlas leyendo el DOM real. Rechaza lo que parece plantilla o IA: degradados morado-azul genéricos, glassmorphism de catálogo, partículas decorativas, frases de marketing vacías.
- **Diseño vigente: Estilo B** (`prototipos/estilo-b/`, tokens en `src/styles/tokens.css`). Leer el prototipo y los tokens antes de maquetar cualquier pantalla. El estilo índigo/violeta de la v1 está retirado.
- **Principios de producción**: un componente por concepto con variantes (nunca `PrimaryButton`/`GhostButton`); accesibilidad como requisito de cada componente. Antes de introducir stack o metodología nueva, preguntar.

## Seguridad del repo
gitleaks en pre-commit (lefthook) y en CI (`security.yml`), `deny` de lectura de `.env*`, `.dev.vars`, `*.pem`, `*.key` y claves SSH en `settings.json`, `main` protegida con PR y CI obligatorio. Los agentes leen `.env.example`.

## Lo que no hay en la nube
Vault de Obsidian, codebase-memory, el cerebro de graphify, `/cierre`, `/cerebro`, skills comerciales y, salvo que el entorno lo instale, Docker y Supabase local. Lo que dependa de ellos se anota en `ESTADO.md` bajo «Sincronizar desde el Mac» y se hace allí. La exploración de código usa Grep/Glob/Read.
