---
paths: ["**/*.tsx", "**/*.css"]
---
<!-- Generado por /harness (claude-config). No editar: se sobrescribe en /harness update. -->
# Movimiento en la web

Si el `CLAUDE.md` del proyecto o sus documentos de decisiones dicen otra cosa, manda el proyecto. Para excluir esta regla: `omitir` en `.claude/harness.json`.

Las librerías citadas aplican si ya están en `package.json`; añadir una nueva necesita aprobación del proyecto.

- Anima solo `transform` y `opacity`. Nunca `width`, `height`, `top`, `left` ni `margin`; nada de `transition: all`: lista las propiedades.
- Duraciones y curvas salen de la escala de tokens del proyecto (`var(--duration-*)`, `var(--ease-*)`); sin milisegundos ni `cubic-bezier()` sueltos. Si falta el token, propónlo; no lo inventes.
- Interrumpible: para estados que el usuario puede revertir (hover, abrir/cerrar, pulsado) usa transiciones CSS, que parten del valor actual; los keyframes, solo para entradas de una vez.
- La salida es más rápida que la entrada.
- `prefers-reduced-motion: reduce`: quita desplazamientos y escalas. Que quede o no un fundido de `opacity` lo decide el `CLAUDE.md` del proyecto.
- `will-change` solo mientras dura la animación.
- Origen de la transformación en el elemento que la dispara (popovers, menús).
- Movimiento que no comunica nada (decoración que repite) se quita.
- Para decidir cómo, usa las skills `animate` y `review-animations`.
