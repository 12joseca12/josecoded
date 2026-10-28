# emilkowalski/skills

Copia vendorizada de https://github.com/emilkowalski/skills (MIT, Emil Kowalski).

- Commit de origen: `d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128`
- Fecha de la copia: 2026-09-24
- 13 skills: animate, animate-expo, animation-vocabulary, apple-design, ask-sonner,
  emil-design-eng, find-animation-opportunities, improve-animations, mobile-native,
  pick-ui-library, prototype, review-animations, write-swift.

Se vendoriza (y no se instala como plugin) porque el repo de origen no trae
`.claude-plugin/marketplace.json`. Las demás skills externas (impeccable,
taste-skill, hyperframes) sí son plugins y viven fuera del repo; su marketplace y
su activación quedan declarados en `settings.json`.

## Actualizar

    ./scripts/actualizar-skills-externas.sh

No editar estos ficheros a mano: cualquier cambio local se pierde al actualizar.
