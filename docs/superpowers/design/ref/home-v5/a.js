/* A · Índice de comandos. Una sola animación de firma: la selección se desliza (280 ms, ease-in-out) al panel en foco. */
import { reduce } from './base.js';
const rows = [...document.querySelectorAll('.idx__row')];
const panels = rows.map((r) => document.querySelector(r.getAttribute('href')));
const hl = document.querySelector('.idx__hl');
function activate(i) {
  rows.forEach((r, k) => r.setAttribute('aria-current', k === i));
  panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
  hl.style.setProperty('--y', `${rows[i].offsetTop}px`);
  if (innerWidth < 900) rows[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
}
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) activate(panels.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
panels.forEach((p) => io.observe(p));
activate(0);
// 1-5 saltan al panel: acción de teclado, sin animación de scroll
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
  const n = +e.key; if (n >= 1 && n <= 5) { panels[n - 1].scrollIntoView({ block: 'center', behavior: 'instant' }); }
});
