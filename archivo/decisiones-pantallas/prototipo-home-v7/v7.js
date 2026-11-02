/* home v7 · bento por escenas (base v6; cambios v7 marcados «v7»).
   CSS hace las transiciones entre escenas y el recorrido de Proyectos; aquí van el paginado por gesto,
   la celda que se amplía y los gestos vivos de cada celda. */
import { reduce, icons, setContent, notice } from './base.js';

/* v7 · conmutador de desarrollo (fuera del diseño): ?lab=0 y/o ?blog=0 muestran las variantes de Lab/Blog (README §4.4) */
const qs = new URLSearchParams(location.search);
const content = { lab: qs.get('lab') !== '0', blog: qs.get('blog') !== '0' };
setContent(content);
{
  const labBlog = document.getElementById('lab-blog');
  const only = content.lab && !content.blog ? 'lab' : !content.lab && content.blog ? 'blog' : null;
  document.querySelectorAll('[data-need]').forEach((el) => { if (!content[el.dataset.need]) el.hidden = true; });
  document.querySelectorAll('[data-only]').forEach((el) => { el.hidden = el.dataset.only !== only; });
  if (!content.lab && !content.blog) labBlog.remove();
}

/* v7 · la home es una muestra: los enlaces a rutas internas llevan a pantallas propias que el prototipo aún no tiene → aviso en vez de 404 */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="/"], a[data-dato]'); if (!a) return;
  e.preventDefault();
  const u = new URL(a.href);
  notice(a.dataset.dato ? { dato: a.dataset.dato } : { path: u.pathname + u.search + u.hash });
}, true);

/* v7 · celda ampliada (⤢): con cada celda enlazando a su pantalla, se propone quitarla (README §15). ?ampliar=1 la recupera para comparar */
const expandable = qs.get('ampliar') === '1';
document.documentElement.classList.toggle('no-expand', !expandable);

const fine = matchMedia('(hover: hover) and (pointer: fine)');
const root = document.documentElement;

/* =================== paginado: un gesto = una escena ===================
   Emil: navegación deliberada y ocasional → ~0,8 s ease-in-out (0.77, 0, 0.175, 1). Interrumpible: un gesto en sentido contrario la corta.
   Adaptativo: solo salta si la escena cabe entera; si no cabe (pantalla baja, fuente grande), primero se recorre con el scroll normal. */
const menuBtn = document.getElementById('menu-btn'), menu = document.getElementById('menu');
const menuOpen = () => !menu.hidden;
const overlayOpen = () => open || menuOpen() || document.querySelector('dialog[open]');   // celda ampliada, menú móvil o paleta
const tour = document.getElementById('proyectos');
const cards = [...document.querySelectorAll('.tcard')];
const pinnedTour = () => getComputedStyle(tour.querySelector('.tour__sticky')).position === 'sticky';
function stops() {
  const out = [];
  for (const el of document.querySelectorAll('main > section')) {
    const top = el.getBoundingClientRect().top + scrollY;
    if (el === tour && pinnedTour()) { const run = tour.offsetHeight - innerHeight; cards.forEach((_, i) => out.push(top + (run * i) / (cards.length - 1))); continue; }
    out.push(top);
    const extra = el.offsetHeight - innerHeight;
    if (extra > 8) for (let y = innerHeight * 0.85; y < extra; y += innerHeight * 0.85) out.push(top + y), out.push(top + extra);   // escenas altas: paradas intermedias
  }
  return [...new Set(out.map((y) => Math.round(Math.min(y, root.scrollHeight - innerHeight))))].sort((a, b) => a - b);
}
const ease = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);   // curva fuerte ease-in-out
let anim = null;
function glide(to) {
  cancelAnimationFrame(anim?.raf);
  const from = scrollY, d = to - from; if (Math.abs(d) < 2) return;
  const dur = Math.min(950, 600 + Math.abs(d) * 0.15), t0 = performance.now();
  anim = { to, end: t0 + dur };
  const step = (now) => { const t = Math.min(1, (now - t0) / dur); scrollTo(0, from + d * ease(t)); if (t < 1) anim.raf = requestAnimationFrame(step); else anim = null; };
  anim.raf = requestAnimationFrame(step);
}
function page(dir) {
  const s = stops(), y = anim ? anim.to : scrollY;
  const next = dir > 0 ? s.find((v) => v > y + 4) : [...s].reverse().find((v) => v < y - 4);
  if (next != null) glide(next);
}
const pagingOn = () => fine.matches && !reduce;
const syncMode = () => root.classList.toggle('paging', pagingOn());
syncMode(); fine.addEventListener?.('change', syncMode);
let lockUntil = 0, acc = 0, lastWheel = 0;
addEventListener('wheel', (e) => {
  if (menuOpen()) closeMenu(false);   // la rueda cierra el menú y el gesto sigue
  if (!pagingOn() || e.ctrlKey || open || document.querySelector('dialog[open]')) return;
  e.preventDefault();
  const now = performance.now();
  if (now - lastWheel > 220) acc = 0;            // nuevo gesto
  lastWheel = now; acc += e.deltaY;
  if (now < lockUntil) return;                    // ignora la inercia del trackpad del gesto anterior
  if (Math.abs(acc) > 24) { page(Math.sign(acc)); acc = 0; lockUntil = now + 700; }
}, { passive: false });
addEventListener('keydown', (e) => {
  if (!pagingOn() || overlayOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target instanceof Element ? e.target : document.body;
  if (t.closest('input, textarea, select, [contenteditable], [role=tab]') || (e.key === ' ' && t.closest('a, button, [tabindex]:not([tabindex="-1"])'))) return;   // Espacio y flechas son de los controles, no del paginado
  const map = { ArrowDown: 1, PageDown: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 };
  if (e.key in map) { e.preventDefault(); page(map[e.key]); }
  if (e.key === 'Home') { e.preventDefault(); glide(0); }
  if (e.key === 'End') { e.preventDefault(); glide(root.scrollHeight - innerHeight); }
});
// los enlaces internos también se deslizan (y en Proyectos apuntan al principio del recorrido)
document.addEventListener('click', (e) => {
  if (open) return;
  const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return;
  const t = document.querySelector(a.getAttribute('href')); if (!t) return;
  e.preventDefault(); const y = t.getBoundingClientRect().top + scrollY;
  reduce ? scrollTo(0, y) : glide(y);
});

/* =================== menú móvil (disclosure) =================== */
function closeMenu(refocus = true) { if (!menuOpen()) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); if (refocus) menuBtn.focus({ preventScroll: true }); }
menuBtn.addEventListener('click', () => { const o = menuOpen(); menu.hidden = o; menuBtn.setAttribute('aria-expanded', String(!o)); });
menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('pointerdown', (e) => { if (menuOpen() && !e.target.closest('#menu, #menu-btn')) closeMenu(false); });
document.addEventListener('focusin', (e) => { if (menuOpen() && !e.target.closest('#menu, #menu-btn')) closeMenu(false); });
matchMedia('(min-width: 1081px)').addEventListener?.('change', (e) => { if (e.matches) closeMenu(false); });

/* =================== celda que se amplía (View Transitions) =================== */
const scrim = Object.assign(document.createElement('div'), { className: 'scrim', hidden: true });
document.getElementById('main').append(scrim); // same stacking context as the open cell (main has z-index: 2)
let open = null, opener = null, syncPager = () => {};
// celda modal de verdad: todo lo que no es la celda (ni el scrim ni la paleta) queda inerte; la cabecera además se atenúa (base.css)
let shielded = [];
const shield = (cell) => { for (let n = cell; n && n !== document.body; n = n.parentElement) for (const s of n.parentElement.children) if (s !== n && s !== scrim && s.tagName !== 'SCRIPT' && s.tagName !== 'DIALOG' && !s.inert) { s.inert = true; shielded.push(s); } };
const unshield = () => { shielded.forEach((s) => { s.inert = false; }); shielded = []; };
const vt = (fn) => (!reduce && document.startViewTransition ? document.startViewTransition(fn) : (fn(), null));
function expand(cell) {
  if (open) return;
  closeMenu(false); opener = document.activeElement; cell.style.viewTransitionName = 'cell';
  vt(() => { cell.classList.add('is-open'); scrim.hidden = false; open = cell; shield(cell); document.querySelector('.pager')?.classList.remove('is-on'); root.style.overflow = 'hidden'; });
  cell.setAttribute('role', 'dialog'); cell.setAttribute('aria-modal', 'true'); cell.focus({ preventScroll: true });
}
function collapse() {
  if (!open) return; const cell = open;
  const t = vt(() => { cell.classList.remove('is-open'); scrim.hidden = true; open = null; unshield(); syncPager(); root.style.overflow = ''; });
  const done = () => { cell.style.viewTransitionName = ''; cell.removeAttribute('role'); cell.removeAttribute('aria-modal'); opener?.focus?.({ preventScroll: true }); };
  return t?.finished ? t.finished.then(done, done) : Promise.resolve(done());
}
(expandable ? document.querySelectorAll('.cell--big') : []).forEach((cell) => {
  cell.addEventListener('click', (e) => { if (e.target.closest('a, label, input, button, [role=tab], .pack')) { if (e.target.closest('.cell__open')) expand(cell); return; } expand(cell); });
  cell.querySelector('.cell__close').addEventListener('click', (e) => { e.stopPropagation(); collapse(); });
  cell.addEventListener('keydown', (e) => {   // Tab no sale de la celda
    if (e.key !== 'Tab' || open !== cell) return;
    const f = [...cell.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')].filter((el) => el.getClientRects().length), a = document.activeElement;
    if (!f.length) return;
    if (e.shiftKey && (a === f[0] || a === cell)) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
});
scrim.addEventListener('click', collapse);
addEventListener('overlay:close', (e) => { if (open) e.detail.wait = collapse(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (menuOpen()) closeMenu(); else if (!document.querySelector('dialog[open]')) collapse(); } });

/* =================== vida en el bento =================== */
// luz bajo el cursor (se escribe en la propia celda, no en un ancestro)
if (fine.matches && !reduce) document.querySelectorAll('.cell').forEach((c) => c.addEventListener('pointermove', (e) => {
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

// v7 · vías: grupo de radios. El resaltado se desliza SOLO a la vía elegida (el hover es un tinte aparte, en CSS: no aparenta selección).
document.querySelectorAll('.vias').forEach((box) => {
  const hl = box.querySelector('.vias__hl'), radios = [...box.querySelectorAll('input[name="via"]')];
  const go = box.closest('.cell').querySelector('#vias-go');
  const place = () => { const r = radios.find((x) => x.checked) || radios[0], row = r.closest('.via'); hl.style.setProperty('--y', `${row.offsetTop}px`); hl.style.height = `${row.offsetHeight}px`; go?.setAttribute('href', r.dataset.href); };
  // v7 · en móvil el panel va bajo la lista: si al elegir queda fuera de la vista, se acerca lo justo (sin esto el cambio pasa sin verse)
  const panels = box.querySelector('.vias__panels');
  const reveal = (row) => {   // sube lo justo para ver el panel entero, sin esconder la fila elegida bajo la cabecera (alto real de #nav)
    const p = panels.getBoundingClientRect(), head = document.getElementById('nav').getBoundingClientRect().bottom, gap = parseFloat(getComputedStyle(row).paddingTop) || 0;
    const need = p.bottom - innerHeight + gap, room = row.getBoundingClientRect().top - head - gap;
    const dy = Math.min(need, room); if (dy <= 0) return;
    root.style.scrollSnapType = 'none';   // el snap de proximidad devolvería la vista al inicio de la escena; se suspende hasta el siguiente gesto del usuario
    scrollBy({ top: dy, behavior: reduce ? 'instant' : 'smooth' });
    const restore = () => { root.style.scrollSnapType = ''; };
    addEventListener('touchstart', restore, { once: true, passive: true }); addEventListener('wheel', restore, { once: true, passive: true });
  };
  radios.forEach((r) => r.addEventListener('change', () => { place(); if (!fine.matches) reveal(r.closest('.via')); }));
  requestAnimationFrame(() => { place(); requestAnimationFrame(() => box.classList.add('is-ready')); });   // sin deslizamiento en la primera colocación
  addEventListener('resize', place);
  new ResizeObserver(place).observe(box);
});

// packs: la barra se desliza al pack que señalas
document.querySelectorAll('.packs--live').forEach((box) => {
  const bar = box.querySelector('.packs__bar'), packs = [...box.querySelectorAll('.pack')];
  const pick = (p) => { packs.forEach((x) => x.classList.toggle('is-hi', x === p)); bar.style.setProperty('--x', `${p.offsetLeft}px`); bar.style.setProperty('--w', `${p.offsetWidth}px`); bar.style.top = `${p.offsetTop + p.offsetHeight + 6}px`; bar.style.bottom = 'auto'; };
  packs.forEach((p) => { p.addEventListener('pointerenter', () => pick(p)); p.addEventListener('focus', () => pick(p)); });
  const home = packs.find((p) => p.classList.contains('is-hi')) || packs[1];
  const init = () => pick(home); requestAnimationFrame(init); addEventListener('resize', init); new ResizeObserver(init).observe(box);
  box.addEventListener('pointerleave', init);   // v7: al salir, la barra vuelve al destacado inicial (P2)
  box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget)) init(); });
});

// v7 · tarifas: radios + :has() en CSS (funciona sin JS); aquí no hace falta nada.

// trato directo: la conversación se escribe cuando la escena está a la vista, y se repite sin prisa
document.querySelectorAll('.mini-chat').forEach((chat) => {
  const bubs = [...chat.querySelectorAll('.bub')]; let alive = false, timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const typeInto = (el, text, done) => { let i = 0; const tick = () => { if (!alive) return; el.textContent = text.slice(0, ++i); if (i < text.length) timers.push(setTimeout(tick, 22)); else done?.(); }; tick(); };
  const run = () => {
    bubs.forEach((b) => { b.classList.remove('is-on'); b.textContent = ''; });
    bubs[0].classList.add('is-on');
    typeInto(bubs[0], bubs[0].dataset.t, () => timers.push(setTimeout(() => { bubs[1].classList.add('is-on'); typeInto(bubs[1], bubs[1].dataset.t, () => timers.push(setTimeout(run, 5000))); }, 700)));
  };
  if (reduce) { bubs.forEach((b) => { b.textContent = b.dataset.t; b.classList.add('is-on'); }); return; }
  new IntersectionObserver(([e]) => { const was = alive; alive = e.isIntersecting; if (alive && !was) run(); if (!alive) clear(); }, { threshold: 0.4 }).observe(chat);
});

// proyectos: la tarjeta que cruza el centro queda en foco
const marks = [...document.querySelectorAll('.rail__links span')];
const setActive = (i) => { cards.forEach((c, k) => c.classList.toggle('is-active', k === i)); marks.forEach((m, k) => m.classList.toggle('is-on', k === i)); };
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(cards.indexOf(e.target)); }), { rootMargin: '0px -45% 0px -45%' });
cards.forEach((c) => io.observe(c));
setActive(0);
icons();

/* =================== indicador de sección (líneas a la derecha) ===================
   Emil: cambio de estado frecuente → 200 ms ease-out, solo transform/color. Aparece al salir del hero (250 ms) y se va al volver. */
{
  const secs = [...document.querySelectorAll('main > section:not(.hero)')];
  const lb = content.lab && content.blog ? 'Lab/Blog' : content.lab ? 'Lab' : 'Blog';
  const names = { 'sobre-mi': 'Sobre mí', servicios: 'Servicios', proyectos: 'Proyectos', 'lab-blog': lb, hablamos: 'Contacto' };
  const pager = document.createElement('nav');
  pager.className = 'pager'; pager.setAttribute('aria-label', 'Secciones');
  pager.innerHTML = secs.map((s) => `<button type="button" aria-label="${names[s.id] || s.id}" data-id="${s.id}"><i aria-hidden="true"></i></button>`).join('');
  document.body.append(pager);
  const btns = [...pager.querySelectorAll('button')];
  btns.forEach((b) => b.addEventListener('click', () => { if (open) return; const t = document.getElementById(b.dataset.id); const y = t.getBoundingClientRect().top + scrollY; reduce ? scrollTo(0, y) : glide(y); }));
  const hero = document.querySelector('.hero');
  const update = () => {
    const mid = innerHeight / 2;
    const inHero = hero.getBoundingClientRect().bottom > mid;
    const tr = tour.getBoundingClientRect(), inTour = pinnedTour() && tr.top <= mid && tr.bottom > mid;   // con el carrusel fijado la tarjeta ocupa la pantalla y pasa bajo las líneas
    pager.classList.toggle('is-on', !inHero && !inTour && !open);
    const cur = secs.findIndex((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    btns.forEach((b, i) => b.setAttribute('aria-current', i === cur));
  };
  // se oculta si el margen derecho no deja sitio (menos de 2,25 rem)
  const fit = () => { const cs = getComputedStyle(pager); const rg = parseFloat(cs.right) * 2; pager.classList.toggle('is-cramped', rg < 36); };
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', () => { fit(); update(); }, { passive: true });
  // respaldo: IntersectionObserver también se entera del scroll programático (paginado, enlaces)
  const ioP = new IntersectionObserver(update, { rootMargin: '-50% 0px -50% 0px' }); [hero, ...secs].forEach((s) => ioP.observe(s));
  syncPager = update; fit(); update();
}
