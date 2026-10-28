/* home v7 (base v5) · común a las variantes: cabecera, enlace activo, paleta ⌘K y teclas del cierre. */
document.documentElement.classList.add('js');
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const icons = () => window.lucide?.createIcons();
icons();

/* cabecera: gana fondo tras 80 px; el enlace de la sección a la vista queda marcado */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 80);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
/* v7: los enlaces llevan a pantallas propias; la escena a la vista solo se señala con color (sin aria-current: la página actual sigue siendo la home) */
const links = [...document.querySelectorAll('.nav__links a[data-sec]')];
const secs = [...new Set(links.map((a) => document.getElementById(a.dataset.sec)).filter(Boolean))];
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-here', a.dataset.sec === e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
secs.forEach((s) => io.observe(s));

/* paleta ⌘K: sin animación (acción de teclado) */
/* v7: comandos de la spec v2.0 (README §6.5). `need` los retira si falta su contenido (variantes de Lab/Blog). */
export const CMDS = [
  { g: 'Ir a', label: 'Sobre mí', icon: 'user', href: '/sobre-mi', k: 'sobre mi jose quien persona' },
  { g: 'Ir a', label: 'Servicios', icon: 'route', href: '/servicios', k: 'servicios vias trabajar contratar freelance como trabajas precios' },
  { g: 'Ir a', label: 'Proyectos', icon: 'layout-grid', href: '/proyectos', k: 'proyectos apps webs portfolio casos' },
  { g: 'Ir a', label: 'Lab', icon: 'flask-conical', href: '/lab', need: 'lab', k: 'lab demos laboratorio experimentos herramientas' },
  { g: 'Ir a', label: 'Blog', icon: 'book-open', href: '/blog', need: 'blog', k: 'blog guias articulos' },
  { g: 'Ir a', label: 'Para agencias', icon: 'handshake', href: '/partners', k: 'agencia agencias partners partner consultora subcontratar marca blanca colaborar' },
  { g: 'Acciones', label: 'Packs', icon: 'package', href: '/servicios#packs', hint: 'desde 900 €', k: 'packs precio web tienda restaurante clinica app movil cuanto cuesta' },
  { g: 'Acciones', label: 'Trabajo por horas', icon: 'clock', href: '/servicios#por-hora', hint: '40 €/h', k: 'hora horas tarifa precio refuerzo equipo consultoria auditoria' },
  { g: 'Acciones', label: 'Pedir propuesta', icon: 'sparkles', href: '/propuesta', k: 'propuesta presupuesto generador ia feature encargo precio fijo proyecto cerrado' },
  { g: 'Acciones', label: 'Descargar CV', icon: 'download', href: '#pendiente', dato: 'CV es (PDF)', hint: 'PDF', k: 'cv curriculum resume contratar empleo trabajo reclutador puesto' },
  { g: 'Acciones', label: 'Reservar 20 min', icon: 'calendar', href: '#pendiente', dato: 'URL de Cal.com', k: 'llamada reunion cita calendario entrevista' },
  { g: 'Acciones', label: 'Escribir por WhatsApp', icon: 'message-circle', href: '#pendiente', dato: 'WhatsApp', k: 'whatsapp hablar mensaje' },
  { g: 'Acciones', label: 'Contacto', icon: 'mail', href: '/contacto', k: 'contacto email correo hablamos' },
  { g: 'Acciones', label: 'Abrir el chat', icon: 'message-square', href: '/chat', k: 'chat asistente ia preguntar' },
  { g: 'Acciones', label: 'Login', icon: 'log-in', href: '/auth', k: 'login entrar cuenta area clientes' },
];
const has = { lab: true, blog: true };

/* v7 · aviso discreto: en el prototipo las pantallas propias aún no existen, así que un enlace a /ruta avisa en vez de dar 404 */
const note = Object.assign(document.createElement('div'), { className: 'notice', role: 'status' });
note.setAttribute('aria-live', 'polite');
document.body.append(note);
let noteTimer = 0;
export function notice({ path, dato }) {
  note.textContent = dato ? `Destino pendiente: {{DATO: ${dato}}}` : `Lleva a ${decodeURI(path)}, pantalla propia`;
  note.classList.add('is-on'); clearTimeout(noteTimer);
  noteTimer = setTimeout(() => note.classList.remove('is-on'), 2600);
}
export const setContent = (c) => Object.assign(has, c);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pal = document.getElementById('palette'), pq = document.getElementById('pq'), pres = document.getElementById('pres');
let sel = 0, shown = [];
const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
function renderPal() {
  const q = norm(pq.value.trim());
  shown = CMDS.filter((c) => (!c.need || has[c.need]) && (!q || norm(c.label + ' ' + c.k).includes(q)));
  sel = Math.min(sel, Math.max(0, shown.length - 1));
  pres.innerHTML = '';
  if (!shown.length) { pres.innerHTML = `<li class="empty">Nada con «${esc(pq.value)}». Prueba con «precio», «cv» o «agencia».</li>`; return; }
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
  const c = shown[i]; if (!c) return; pal.close();
  if (c.dato || c.href.startsWith('/')) { notice(c.dato ? { dato: c.dato } : { path: c.href }); return; }   // v7: pantallas propias (aún no existen en el prototipo)
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
