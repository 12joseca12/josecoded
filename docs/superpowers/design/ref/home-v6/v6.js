/* home v6 · bento por escenas.
   CSS hace las transiciones entre escenas y el recorrido de Proyectos; aquí van el paginado por gesto,
   la celda que se amplía y los gestos vivos de cada celda. */
import { reduce, icons } from './base.js';

const fine = matchMedia('(hover: hover) and (pointer: fine)');
const root = document.documentElement;

/* =================== paginado: un gesto = una escena ===================
   Emil: navegación deliberada y ocasional → ~0,8 s ease-in-out (0.77, 0, 0.175, 1). Interrumpible: un gesto en sentido contrario la corta.
   Adaptativo: solo salta si la escena cabe entera; si no cabe (pantalla baja, fuente grande), primero se recorre con el scroll normal. */
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
  if (!pagingOn() || e.ctrlKey || document.querySelector('.cell.is-open, dialog[open]')) return;
  e.preventDefault();
  const now = performance.now();
  if (now - lastWheel > 220) acc = 0;            // nuevo gesto
  lastWheel = now; acc += e.deltaY;
  if (now < lockUntil) return;                    // ignora la inercia del trackpad del gesto anterior
  if (Math.abs(acc) > 24) { page(Math.sign(acc)); acc = 0; lockUntil = now + 700; }
}, { passive: false });
addEventListener('keydown', (e) => {
  if (!pagingOn() || /input|textarea|select/i.test(document.activeElement.tagName) || document.querySelector('.cell.is-open, dialog[open]') || e.metaKey || e.ctrlKey) return;
  const map = { ArrowDown: 1, PageDown: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 };
  if (e.key in map) { e.preventDefault(); page(map[e.key]); }
  if (e.key === 'Home') { e.preventDefault(); glide(0); }
  if (e.key === 'End') { e.preventDefault(); glide(root.scrollHeight - innerHeight); }
});
// los enlaces internos también se deslizan (y en Proyectos apuntan al principio del recorrido)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return;
  const t = document.querySelector(a.getAttribute('href')); if (!t) return;
  e.preventDefault(); const y = t.getBoundingClientRect().top + scrollY;
  reduce ? scrollTo(0, y) : glide(y);
});

/* =================== celda que se amplía (View Transitions) =================== */
const scrim = Object.assign(document.createElement('div'), { className: 'scrim', hidden: true });
document.body.append(scrim);
let open = null, opener = null;
const vt = (fn) => (!reduce && document.startViewTransition ? document.startViewTransition(fn) : (fn(), null));
function expand(cell) {
  if (open) return;
  opener = document.activeElement; cell.style.viewTransitionName = 'cell';
  vt(() => { cell.classList.add('is-open'); scrim.hidden = false; open = cell; root.style.overflow = 'hidden'; });
  cell.setAttribute('role', 'dialog'); cell.setAttribute('aria-modal', 'true'); cell.focus({ preventScroll: true });
}
function collapse() {
  if (!open) return; const cell = open;
  const t = vt(() => { cell.classList.remove('is-open'); scrim.hidden = true; open = null; root.style.overflow = ''; });
  const done = () => { cell.style.viewTransitionName = ''; cell.removeAttribute('role'); cell.removeAttribute('aria-modal'); opener?.focus?.({ preventScroll: true }); };
  t?.finished ? t.finished.then(done) : done();
}
document.querySelectorAll('.cell--big').forEach((cell) => {
  cell.addEventListener('click', (e) => { if (e.target.closest('a, label, button, [role=tab], .pack')) { if (e.target.closest('.cell__open')) expand(cell); return; } expand(cell); });
  cell.querySelector('.cell__close').addEventListener('click', (e) => { e.stopPropagation(); collapse(); });
});
scrim.addEventListener('click', collapse);
addEventListener('keydown', (e) => { if (e.key === 'Escape') collapse(); });

/* =================== vida en el bento =================== */
// luz bajo el cursor (se escribe en la propia celda, no en un ancestro)
if (fine.matches && !reduce) document.querySelectorAll('.cell').forEach((c) => c.addEventListener('pointermove', (e) => {
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

// servicios: la selección sigue al puntero y al foco (240 ms, ease-in-out)
document.querySelectorAll('.plist--live').forEach((list) => {
  const hl = list.querySelector('.plist__hl'), rows = [...list.querySelectorAll('li')];
  const pick = (li) => { rows.forEach((r) => r.classList.toggle('is-sel', r === li)); hl.style.setProperty('--y', `${li.offsetTop}px`); hl.style.height = `${li.offsetHeight}px`; };
  rows.forEach((li) => { li.tabIndex = 0; li.addEventListener('pointerenter', () => pick(li)); li.addEventListener('focus', () => pick(li)); });
  requestAnimationFrame(() => pick(rows[0])); addEventListener('resize', () => pick(list.querySelector('.is-sel') || rows[0]));
});

// packs: la barra se desliza al pack que señalas
document.querySelectorAll('.packs--live').forEach((box) => {
  const bar = box.querySelector('.packs__bar'), packs = [...box.querySelectorAll('.pack')];
  const pick = (p) => { packs.forEach((x) => x.classList.toggle('is-hi', x === p)); bar.style.setProperty('--x', `${p.offsetLeft}px`); bar.style.setProperty('--w', `${p.offsetWidth}px`); bar.style.top = `${p.offsetTop + p.offsetHeight + 6}px`; bar.style.bottom = 'auto'; };
  packs.forEach((p) => { p.addEventListener('pointerenter', () => pick(p)); p.addEventListener('focus', () => pick(p)); });
  const init = () => pick(box.querySelector('.pack.is-hi') || packs[1]); requestAnimationFrame(init); addEventListener('resize', init);
});

// tarifas: selector segmentado (el pulgar se desliza; la cifra entra con un leve desenfoque)
document.querySelectorAll('.seg').forEach((seg) => {
  const cell = seg.closest('.cell'), tabs = [...seg.querySelectorAll('button')];
  const set = (v) => { seg.style.setProperty('--s', v); tabs.forEach((b) => b.setAttribute('aria-selected', b.dataset.v === String(v))); cell.querySelectorAll('[data-v]:not(button)').forEach((n) => { n.hidden = n.dataset.v !== String(v); }); };
  tabs.forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); set(+b.dataset.v); }));
  seg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const v = e.key === 'ArrowRight' ? 1 : 0; set(v); tabs[v].focus(); } });
});

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

// qué incluye: los checks se dibujan una vez al llegar
const checks = document.querySelectorAll('.checks--draw');
const ioC = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-on'); ioC.unobserve(e.target); } }), { threshold: 0.5 });
checks.forEach((c) => ioC.observe(c));

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
  const names = { 'sobre-mi': 'Sobre mí', empresas: 'Empresas', negocios: 'Negocios', proyectos: 'Proyectos', blog: 'Blog', hablamos: 'Contacto' };
  const pager = document.createElement('nav');
  pager.className = 'pager'; pager.setAttribute('aria-label', 'Secciones');
  pager.innerHTML = secs.map((s) => `<button type="button" aria-label="${names[s.id] || s.id}" data-id="${s.id}"><i aria-hidden="true"></i></button>`).join('');
  document.body.append(pager);
  const btns = [...pager.querySelectorAll('button')];
  btns.forEach((b) => b.addEventListener('click', () => { const t = document.getElementById(b.dataset.id); const y = t.getBoundingClientRect().top + scrollY; reduce ? scrollTo(0, y) : glide(y); }));
  const hero = document.querySelector('.hero');
  const update = () => {
    const mid = innerHeight / 2;
    const inHero = hero.getBoundingClientRect().bottom > mid;
    pager.classList.toggle('is-on', !inHero);
    const cur = secs.findIndex((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    btns.forEach((b, i) => b.setAttribute('aria-current', i === cur));
  };
  // se oculta si el margen derecho no deja sitio (menos de 2,25 rem)
  const fit = () => { const cs = getComputedStyle(pager); const rg = parseFloat(cs.right) * 2; pager.classList.toggle('is-cramped', rg < 36); };
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', () => { fit(); update(); }, { passive: true });
  // respaldo: IntersectionObserver también se entera del scroll programático (paginado, enlaces)
  const ioP = new IntersectionObserver(update, { rootMargin: '-50% 0px -50% 0px' }); [hero, ...secs].forEach((s) => ioP.observe(s));
  fit(); update();
}
