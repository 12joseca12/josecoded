# Brief — josecoded

Descripción de Jose del 2026-11-02, tras el reinicio. Es la entrada de la batería del arquitecto; las decisiones se toman a partir de aquí.

## Quién y para qué

Jose es programador full stack enfocado en React Native. La página tiene dos objetivos:

1. Mostrarle: habilidades, proyectos y stack.
2. Captar clientes por tres vías: contratación por cuenta ajena, freelance (precio por hora o por tarea) y packs de webs y apps móviles.

## Zonas

- **Pública**: presentación, proyectos, stack, servicios y packs, captación.
- **Contenido orgánico**: sección para posicionar la página (SEO y GEO).
- **Laboratorio**: ver las aplicaciones móviles en la web. Se estudia al final.
- **Closers** (privada): CRM para gestionar clientes. Un closer puede tener closers a su cargo; la comisión se reparte entre closer y subcloser en campos separados.
- **Freelance** (privada, se deja preparada): si Jose delega en otro freelance, que tenga ahí la información del proyecto.
- **Área de clientes** (privada): compartir archivos e información del proyecto, tener sus documentos y descargarlos, crear historias de usuario y ver el desarrollo del proyecto en tiempo real.
- **Admin**: controlar aspectos de la app y gestionar admin, closers, freelance y clientes. Incluye **Radar**: detección mediante IA.

## Comunicación

- Chat con Jose para cada closer, cliente y freelance, y también en la página principal.
- Una IA alojada en Omen responde por Jose.

## Infraestructura

- Supabase como base de datos y autenticación.
- Omen (servidor casero) aloja la IA, Radar y las funciones privadas, con su propia API y backend Node, trabajando junto a Supabase. Omen se limpia si hace falta.

## Por decidir

Datos exactos de cada parte, componentes de cada pantalla, organización, secciones y redirecciones.

## Requisitos transversales

- Ciberseguridad: a prueba de ataques, sin fallos técnicos ni vulnerabilidades.
- Accesible.
- Responsiva en web y móvil.
- Repositorio muy limpio y elegante, sin comentarios en el código, presentable como muestra de trabajo.
- Componentes limpios y elegantes con aspecto tecnológico; para clientes, sobre todo limpio y estructurado.
- UX cuidada en todo:
  - animaciones de cambio de pantalla;
  - botones que reaccionan (hover, foco, pulsado y desactivado);
  - esqueleto en todo lo que cargue desde cero;
  - estado de carga en cualquier botón que lance una acción;
  - pantallas propias para 404 y para cada tipo de error.

## Estilo

Tres referencias de paleta y estilo en `prototipos/estilo/referencias/`:

| | Paleta | Referencia |
|---|---|---|
| A | Midnight Black `#030407` · Electric Cobalt Blue `#1558C9` · Acid Lime `#D4FF24` | «Feel Every Moment» |
| B | Cool Steel Grey `#929DA7` · Midnight Charcoal `#17191C` · Vibrant Coral Orange `#FF4B32` | «Create Beyond Limits» |
| C | Obsidian Black `#080808` · Chrome Silver `#CDCBCA` · Laser Crimson Red `#D41514` | «The Next Human Interface» |

Para cada una se crea un hero de home de prueba parecido a la referencia, sin robots: enfocado en aplicaciones web, móviles e IA, con esos colores.

## Decisión de estilo (2026-11-02)

Gana la **opción B** (Cool Steel Grey `#929DA7` · Midnight Charcoal `#17191C` · Vibrant Coral Orange `#FF4B32`; prototipo `prototipos/estilo/b.html`). Requisitos que Jose añade sobre ella:

- Scroll de las páginas públicas cuidado de forma especial.
- Visual del hero animado: transición fluida, sin saltos y dinámica, como si la app se estuviera transformando.
- Barra de navegación limpia y elegante pero tecnológica, que facilite moverse por la web.
- Barra de scroll lateral personalizada.

## Ajustes de estilo B (2026-11-02, tras la v2)

- Sin títulos pequeños (eyebrows) encima de los textos, en ninguna sección.
- Navegación: **cápsula** (opción A).
- Scroll por bloques en escritorio: cada gesto lleva suavemente al bloque siguiente; en móvil, scroll nativo.
- El progreso del scroll es el borde coral de la cápsula: 0 % sin borde, 100 % borde completo.
- Los componentes de cada sección se depuran más adelante, al definir cada pantalla.
