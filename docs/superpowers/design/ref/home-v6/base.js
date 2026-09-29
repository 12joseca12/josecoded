/* home v5 · común a las variantes: cabecera, enlace activo, paleta ⌘K y teclas del cierre. */
document.documentElement.classList.add('js');
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const icons = () => window.lucide?.createIcons();
icons();

/* cabecera: gana fondo tras 80 px; el enlace de la sección a la vista queda marcado */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 80);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const links = [...document.querySelectorAll('.nav__links a')];
const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === `#${e.target.id}`));
}), { rootMargin: '-45% 0px -50% 0px' });
secs.forEach((s) => io.observe(s));

/* paleta ⌘K: sin animación (acción de teclado) */
const CMDS = [
  { g: 'Ir a', label: 'Sobre mí', icon: 'user', href: '#sobre-mi', k: 'sobre mi jose quien' },
  { g: 'Ir a', label: 'Trabajo con empresas', icon: 'building-2', href: '#empresas', k: 'empresas cto contratar freelance cv' },
  { g: 'Ir a', label: 'Webs para tu negocio', icon: 'store', href: '#negocios', hint: 'desde 900 €', k: 'negocio web precio packs tienda restaurante clinica' },
  { g: 'Ir a', label: 'Proyectos', icon: 'layout-grid', href: '#proyectos', k: 'proyectos apps webs portfolio' },
  { g: 'Ir a', label: 'Blog', icon: 'book-open', href: '#blog', k: 'articulos blog' },
  { g: 'Acciones', label: 'Pedir una propuesta con IA', icon: 'sparkles', href: '#negocios', k: 'propuesta presupuesto generador ia' },
  { g: 'Acciones', label: 'Abrir el chat', icon: 'message-square', href: '#', k: 'chat asistente ia' },
  { g: 'Acciones', label: 'Login', icon: 'log-in', href: '#', k: 'login entrar cuenta area clientes' },
  { g: 'Acciones', label: 'Escribir por WhatsApp', icon: 'message-circle', href: '#hablamos', k: 'whatsapp contacto hablar' },
  { g: 'Acciones', label: 'Reservar 20 min', icon: 'calendar', href: '#hablamos', k: 'llamada reunion cita calendario' },
];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pal = document.getElementById('palette'), pq = document.getElementById('pq'), pres = document.getElementById('pres');
let sel = 0, shown = [];
const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
function renderPal() {
  const q = norm(pq.value.trim());
  shown = CMDS.filter((c) => !q || norm(c.label + ' ' + c.k).includes(q));
  sel = Math.min(sel, Math.max(0, shown.length - 1));
  pres.innerHTML = '';
  if (!shown.length) { pres.innerHTML = `<li class="empty">Nada con «${esc(pq.value)}». Prueba con «precio» o «whatsapp».</li>`; return; }
  let g = '';
  shown.forEach((c, i) => {
    if (c.g !== g) { g = c.g; const h = document.createElement('li'); h.className = 'grp'; h.textContent = g; h.setAttribute('role', 'presentation'); pres.append(h); }
    const li = document.createElement('li'); li.setAttribute('role', 'option'); li.id = 'pc' + i; li.setAttribute('aria-selected', i === sel);
    li.innerHTML = `<i data-lucide="${c.icon}" aria-hidden="true"></i><span></span>${c.hint ? `<span class="hint">${c.hint}</span>` : ''}`;
    li.querySelector('span').textContent = c.label;
    li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } }); li.addEventListener('click', () => go(i));
    pres.append(li);
  });
  icons(); mark();
}
function mark() { pres.querySelectorAll('[role=option]').forEach((li) => li.setAttribute('aria-selected', li.id === 'pc' + sel)); pq.setAttribute('aria-activedescendant', 'pc' + sel); document.getElementById('pc' + sel)?.scrollIntoView({ block: 'nearest' }); }
function go(i) {   // si hay una celda ampliada, se cierra primero (v6.js escucha overlay:close) y después se salta
  const c = shown[i]; if (!c) return; pal.close(); if (c.href === '#') return;
  const ev = new CustomEvent('overlay:close', { detail: { wait: null } }); dispatchEvent(ev);
  (ev.detail.wait || Promise.resolve()).then(() => { location.hash = c.href; });
}
function openPal() { if (pal.open) return; pq.value = ''; sel = 0; renderPal(); pal.showModal(); pq.focus(); }
document.getElementById('cmdk-open').addEventListener('click', openPal);
const kc = document.getElementById('keyCmd'), kk = document.getElementById('keyK');
addEventListener('keydown', (e) => {
  if (e.key === 'Meta' || e.key === 'Control') kc?.classList.add('is-down');
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { kk?.classList.add('is-down'); e.preventDefault(); pal.open ? pal.close() : openPal(); }
});
addEventListener('keyup', (e) => { if (e.key === 'Meta' || e.key === 'Control') kc?.classList.remove('is-down'); if (e.key.toLowerCase() === 'k') kk?.classList.remove('is-down'); });
pq.addEventListener('input', () => { sel = 0; renderPal(); });
pq.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); mark(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
  if (e.key === 'Enter') { e.preventDefault(); go(sel); }
});
pal.addEventListener('click', (e) => { if (e.target === pal) pal.close(); });

/* el campo del generador sugiere ejemplos escribiéndose (explicativo, en bucle suave; se para fuera de vista) */
document.querySelectorAll('.ask__ph[data-examples]').forEach((el) => {
  const ex = el.dataset.examples.split('|'); let k = 0, alive = false, timer = 0;
  if (reduce) { el.textContent = ex[0]; return; }
  const type = (s, i = 0) => { if (!alive) return; el.textContent = s.slice(0, i); if (i < s.length) timer = setTimeout(() => type(s, i + 1), 38); else timer = setTimeout(() => erase(s, s.length), 1800); };
  const erase = (s, i) => { if (!alive) return; el.textContent = s.slice(0, i); if (i > 0) timer = setTimeout(() => erase(s, i - 1), 16); else { k = (k + 1) % ex.length; timer = setTimeout(() => type(ex[k]), 300); } };
  new IntersectionObserver(([e]) => { const was = alive; alive = e.isIntersecting; if (alive && !was) type(ex[k]); if (!alive) clearTimeout(timer); }).observe(el);
});
