/* home v6 · bento por escenas. Las transiciones entre escenas y el recorrido de Proyectos los hace CSS;
   aquí solo va la celda que se amplía (View Transitions) y el foco del carrusel. */
import { reduce } from './base.js';

/* ---------- celda que se amplía: la misma caja crece hasta la pantalla y vuelve por donde vino ---------- */
const scrim = Object.assign(document.createElement('div'), { className: 'scrim', hidden: true });
document.body.append(scrim);
let open = null, opener = null;
const vt = (fn) => (!reduce && document.startViewTransition ? document.startViewTransition(fn) : (fn(), null));
function expand(cell) {
  if (open) return;
  opener = document.activeElement; cell.style.viewTransitionName = 'cell';
  vt(() => { cell.classList.add('is-open'); scrim.hidden = false; open = cell; document.documentElement.style.overflow = 'hidden'; });
  cell.setAttribute('role', 'dialog'); cell.setAttribute('aria-modal', 'true'); cell.focus({ preventScroll: true });
}
function collapse() {
  if (!open) return; const cell = open;
  const t = vt(() => { cell.classList.remove('is-open'); scrim.hidden = true; open = null; document.documentElement.style.overflow = ''; });
  const done = () => { cell.style.viewTransitionName = ''; cell.removeAttribute('role'); cell.removeAttribute('aria-modal'); opener?.focus?.({ preventScroll: true }); };
  t?.finished ? t.finished.then(done) : done();
}
document.querySelectorAll('.cell--big').forEach((cell) => {
  cell.addEventListener('click', (e) => { if (e.target.closest('a, label, .cell__close')) return; expand(cell); });
  cell.querySelector('.cell__open').addEventListener('click', (e) => { e.stopPropagation(); expand(cell); });
  cell.querySelector('.cell__close').addEventListener('click', (e) => { e.stopPropagation(); collapse(); });
});
scrim.addEventListener('click', collapse);
addEventListener('keydown', (e) => { if (e.key === 'Escape') collapse(); });

/* ---------- Proyectos: la tarjeta que cruza el centro queda en foco (las transformaciones cuentan para IntersectionObserver) ---------- */
const cards = [...document.querySelectorAll('.tcard')];
const marks = [...document.querySelectorAll('.rail__links span')];
const setActive = (i) => { cards.forEach((c, k) => c.classList.toggle('is-active', k === i)); marks.forEach((m, k) => m.classList.toggle('is-on', k === i)); };
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(cards.indexOf(e.target)); }), { rootMargin: '0px -45% 0px -45%' });
cards.forEach((c) => io.observe(c));
setActive(0);
