/* B · Bento de páginas. Firma: la celda crece hasta ocupar la pantalla (View Transitions: el navegador morfa la misma caja).
   Emil: ocasional (se abre a propósito) → 380 ms con curva de cajón iOS; se cierra por donde se abrió; con reduced-motion, cambio instantáneo. */
import { reduce } from './base.js';
const scrim = document.getElementById('scrim');
let open = null, opener = null;
const vt = (fn) => (!reduce && document.startViewTransition ? document.startViewTransition(fn) : fn());
function expand(cell) {
  if (open) return;
  opener = document.activeElement; cell.style.viewTransitionName = 'cell';
  vt(() => { cell.classList.add('is-open'); scrim.hidden = false; open = cell; document.body.style.overflow = 'hidden'; });
  cell.setAttribute('role', 'dialog'); cell.setAttribute('aria-modal', 'true'); cell.focus({ preventScroll: true });
}
function collapse() {
  if (!open) return; const cell = open;
  const t = vt(() => { cell.classList.remove('is-open'); scrim.hidden = true; open = null; document.body.style.overflow = ''; });
  const done = () => { cell.style.viewTransitionName = ''; cell.removeAttribute('role'); cell.removeAttribute('aria-modal'); opener?.focus?.({ preventScroll: true }); };
  t?.finished ? t.finished.then(done) : done();
}
document.querySelectorAll('.cell').forEach((cell) => {
  cell.addEventListener('click', (e) => { if (e.target.closest('a, .cell__close, label')) return; expand(cell); });
  cell.querySelector('.cell__open').addEventListener('click', (e) => { e.stopPropagation(); expand(cell); });
  cell.querySelector('.cell__close').addEventListener('click', (e) => { e.stopPropagation(); collapse(); });
});
scrim.addEventListener('click', collapse);
addEventListener('keydown', (e) => { if (e.key === 'Escape') collapse(); });
