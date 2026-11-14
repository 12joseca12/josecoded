# Panel del chat en cristal: tokens y decisiones

Maqueta: `index.html` (misma carpeta). Estilo B: acero, carbón y coral. Solo modo claro, como la web.

## Recomendada: A · Escarcha

Tokens nuevos para `src/styles/tokens.css`. Los demás ya existen.

```css
--chat-glass: rgb(244 245 247 / 0.8);
--chat-glass-solid: rgb(244 245 247 / 0.95);   /* sin backdrop-filter */
--chat-glass-opaque: var(--panel);              /* prefers-reduced-transparency */
--chat-blur: 20px;                              /* escritorio */
--chat-blur-sheet: 16px;                        /* hoja móvil */
--chat-saturate: 150%;
--chat-edge: rgb(255 255 255 / 0.75);           /* borde 1px */
--chat-edge-in: rgb(255 255 255 / 0.9);         /* inset 0 1px 0, brillo superior */
--chat-rim: rgb(23 25 28 / 0.07);               /* inset 0 0 0 1px, borde sobre fondo claro */
--chat-sheen: rgb(255 255 255 / 0.45);          /* ::before, 0 → transparente en 7rem */
--chat-hair: rgb(23 25 28 / 0.1);
--chat-plate: rgb(255 255 255 / 0.9);           /* aviso de Nexo */
--chat-pill: rgb(255 255 255 / 0.72);           /* mensajes system */
--chat-bubble-jose: rgb(255 255 255 / 0.94);
--chat-bubble-nexo: #eceef1;
--chat-bubble-nexo-line: rgb(23 25 28 / 0.14);
--chat-bubble-own: var(--charcoal);
--chat-input: rgb(255 255 255 / 0.94);
--chat-input-line: rgb(23 25 28 / 0.22);
--chat-track: rgb(23 25 28 / 0.12);
--chat-progress: var(--coral-deep);
--chat-error-plate: rgb(255 255 255 / 0.94);
--chat-error-line: rgb(180 42 20 / 0.45);
--chat-shadow: 0 1px 2px rgb(23 25 28 / 0.06), 0 30px 60px -28px rgb(23 25 28 / 0.42);
```

Contraste, en el peor caso (cristal mezclado con carbón #17191C, blanco, coral o acero, sin contar con el desenfoque):
- tinta: 10,6:1
- tinta suave: 4,9:1
- coral profundo: 3,9:1, solo para lo que no es texto

Sin `backdrop-filter`, la tinta suave da 6,6:1. Con transparencia reducida, el panel vuelve a ser opaco.

Reglas de la capa de respaldo:
- Las burbujas son opacas o casi.
- El error siempre va en una placa blanca (6,0:1).
- Sobre el cristal sin placa, ningún texto baja de la tinta suave.

## Variantes (un eje cada una)
- **B · Cristal claro**, eje de transparencia:
  - glass `rgb(246 247 249 / 0.58)`, blur 28px, saturate 170%;
  - cabecera, compositor, horas y autores van en placas `rgb(248 249 250 / 0.86)` con 0,5rem de margen interior;
  - sobre el cristal sin placa, solo tinta en negrita (6,2:1).
- **C · Humo**, eje de tono:
  - glass `rgb(23 25 28 / 0.82)`, blur 20px;
  - texto `--on-dark` (9,1:1) y `--on-dark-soft` (5,2:1);
  - la burbuja propia pasa a papel, Jose a `--charcoal-raised`, error y progreso a `--coral-soft`;
  - con transparencia reducida, `--charcoal-2`.

## Fallbacks
- `@supports not (backdrop-filter…)`: el cristal sube al 95 %.
- `@media (prefers-reduced-transparency: reduce)`: sin blur, sin brillo y con fondo opaco.
- `@media (forced-colors: active)`: Canvas y CanvasText.
- `@media (prefers-reduced-motion: reduce)`: sin entrada ni desplazamientos. La cuenta atrás sigue en texto, sin transición en la barra, y los puntos de «escribiendo» quedan estáticos.

## Movimiento (valores finales, para `motion`)
- Apertura del panel flotante:
  - opacidad 0 → 1, `translateY(0.75rem) scale(0.97)` → nada;
  - 260 ms, `--ease-out`, origen abajo a la derecha, que es donde está el botón.
- Cierre: 180 ms, `--ease-out`.
- Hoja móvil:
  - entra con `translateY(100%)` → 0 en 420 ms con `--ease-drawer`;
  - se cierra arrastrando, por velocidad (> 0,11 px/ms) o por distancia.
- Mensaje nuevo:
  - opacidad + `translateY(0.5rem)`, 260 ms, `--ease-out`;
  - escalonado de 40 ms solo al abrir, nunca al escribir.
- Pulsado: `scale(0.97)` en botones e interruptor y `0.94` en botones de icono, 120 ms.
- Interruptor de Nexo: pulgar con transición de 180 ms y `--ease-out`, interrumpible.
- Cuenta atrás: la barra encoge en lineal, un paso por segundo.
- Lectores de pantalla: la cuenta atrás no se anuncia por segundos, solo los cambios de fase (entra Nexo, Nexo parado).
- **No se anima nunca el blur**, ni el radio ni la opacidad del cristal.
- **Con el chat abierto, el hero se pausa**: `html:has(.chat[open]) .hero * { animation-play-state: paused }`. Cada fotograma del hero detrás del cristal obliga a recalcular el blur.

## Decisiones de diseño
- **Barra de Nexo fija bajo la cabecera, en todos los estados.** Es el control visible de 5.15:
  - interruptor en espera y en cuenta atrás;
  - botón «Parar a Nexo» mientras responde;
  - interruptor apagado, con texto «Solo te responderá Jose», cuando está parado.
- **Nexo nunca se distingue solo por color**: lleva su nombre, la etiqueta «IA» y una burbuja gris acero con borde.
- **Aviso inicial** como placa en el hilo, antes del primer mensaje (mensaje `system` de 5.15).
- **Cabecera con Jose**: avatar J, presencia y «suele responder en…». El avatar animado de Nexo sale de la cabecera y queda para cuando Nexo responde.
- **/contacto**: el chat va incrustado en la columna derecha, 5/12 y sticky, junto al formulario (7/12). En móvil va debajo del formulario. Sin botones de cerrar ni ampliar.

## Por decidir (Jose)
1. Elegir variante: A (recomendada), B o C.
2. Textos de la web: hoy dicen «Chat con Nexo» (`contactChooser.chat`, `contactPage.chat.title`), y desde 5.13 y 5.15 el chat es con Jose. En la maqueta pone «Chat con Jose». El texto final lo hace `redactor`.
3. /contacto en móvil: ¿chat debajo del formulario (como en la maqueta) o encima?
