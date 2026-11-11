---
name: puerta-calidad
description: "Puerta de calidad de una rama antes de merge en perfiles web y movil: lanza en paralelo a qa, revisor-seguridad, revisor-accesibilidad, usuario-ejemplo y ui (revisión de diseño con impeccable), consolida sus hallazgos, los pasa al implementador y repite hasta que los cinco dan PASA. En perfil infra lanza solo revisor-seguridad. Úsala al terminar la implementación de una rama, antes de merge o de /ship."
---

# /puerta-calidad

Requisitos: estar en la rama de la feature, con la app arrancable en local y la spec en `docs/superpowers/specs/`. Lee `perfil:` del `CLAUDE.md`.

## Pasos

1. **Preparar.** Identifica la spec de la rama (la más reciente que la nombre) y su sección "Persona objetivo". Arranca el dev server (`preview_start`) o build de simulador y confirma que carga. Calcula el rango `main...HEAD`.
   Si existe `.claude/hooks/harness/prepush.sh`, ejecútalo con `--base <rama base>` antes de lanzar agentes (en repos sin remoto es la única vez que corre esa verificación, además del `Stop`): si sale 1 (typecheck o tests en rojo), se corrige primero y no se lanza ningún agente sobre una rama que no compila. Avisos (herramienta ausente, rango vacío) no bloquean.
2. **Lanzar en paralelo** (una sola respuesta con varias llamadas a Agent, `run_in_background: true`), según perfil:
   - `web`/`movil`: `qa`, `revisor-seguridad`, `revisor-accesibilidad`, `usuario-ejemplo` y `ui` en modo revisión (que ejecuta `/impeccable audit` y `/impeccable critique`, y `review-animations` si la rama toca movimiento).
   - `infra`: solo `revisor-seguridad`.
   - `hw` y `comercial`: esta skill no aplica; dilo y termina sin lanzar agentes.
   A cada uno pásale: ruta del proyecto, rango de diff, ruta de la spec, URL o app del simulador, y "termina con una última línea PASA o NO PASA".
3. **Consolidar.** Cuando terminen todos los agentes lanzados en el paso 2, construye una tabla `agente | veredicto | nº hallazgos bloqueantes/altos` y una lista única de fixes deduplicada (dos agentes pueden señalar lo mismo), ordenada por severidad, cada fix con el agente que lo detectó y pasos de reproducción.
4. **Corregir.** Si algún veredicto es NO PASA: agrupa los fixes en tareas pequeñas y lánzalas a `implementador-<perfil>` una a una, con `revisor` detrás de cada una. Después vuelve al paso 2 **solo con los agentes que dieron NO PASA**. El lanzamiento inicial del paso 2 es la vuelta 1; como máximo se hacen tres vueltas en total. Si tras la tercera algún agente sigue en NO PASA, para e informa a Jose de lo que sigue fallando.
5. **Informe** a Jose: tabla final, fixes aplicados, lo que quedó fuera y por qué. Termina con "Puerta de calidad: PASA" o "NO PASA".

## Reglas
- No hagas merge ni `/ship`: eso lo decide Jose tras el informe.
- Hallazgos de severidad media o baja se listan pero no bloquean; van a `ESTADO.md` → Pendientes.
