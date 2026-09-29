/* home v4 · interfaz. Una pieza viva por sección (la ventana, la arquitectura); todo lo demás, preciso y quieto. */
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const icons = () => window.lucide?.createIcons();
icons();

/* solo prototipo: ?shot=<y> posiciona el scroll para capturas de revisión */
const shot = new URLSearchParams(location.search).get('shot');
if (shot) { document.documentElement.style.scrollBehavior = 'auto'; addEventListener('load', () => scrollTo(0, +shot)); }

/* ---------- cabecera: gana fondo tras 80 px ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 80);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- la ventana ---------- */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TABS = {
  negocios: {
    query: 'Pide tu web', crumb: 'Negocios', glow: 'rgb(124 108 255 / 0.36)',
    caption: ['Webs para tu negocio.', 'Descríbela y te digo qué pack encaja y desde cuánto, al momento.'],
    actions: [['Pedir mi propuesta', '↵'], ['WhatsApp', '⌘W']],
    render: (v) => chatDemo(v, 'Tengo una clínica dental y quiero que los pacientes pidan cita online.', () => `
      <div class="result pop"><small>Ejemplo · te encaja</small><b>Web con reservas · desde 1.400 €</b><p>Sin IVA. Precio cerrado y el dominio a tu nombre.</p></div>`),
  },
  empresas: {
    query: 'Trabajo con empresas', crumb: 'Empresas', glow: 'rgb(91 75 255 / 0.38)',
    caption: ['Para equipos técnicos.', 'Proyecto cerrado o dentro de tu equipo, con el mismo cuidado.'],
    actions: [['Reservar 20 min', '↵'], ['Descargar CV', '⌘D']],
    render: (v) => listView(v, [
      ['Servicios', [['app-window', 'Web con Next.js', 'Producto y marketing'], ['smartphone', 'Apps con React Native', 'iOS y Android'], ['sparkles', 'IA integrada', 'Asistentes y automatizaciones']]],
      ['Cómo', [['clock', 'Por horas', '40 €/h'], ['package-check', 'Feature cerrada', 'desde 150 €']]],
    ]),
  },
  proyectos: {
    query: 'Proyectos', crumb: 'En uso', glow: 'rgb(157 140 255 / 0.32)',
    caption: ['Proyectos que están en uso.', 'Con enlace a la store, a la web o al código.'],
    actions: [['Abrir ficha', '↵'], ['Ver todos', '⌘P']],
    render: (v) => projectsView(v),
  },
  asistente: {
    query: 'Pregunta lo que quieras', crumb: 'Asistente', glow: 'rgb(110 90 255 / 0.34)',
    caption: ['Un asistente que sabe de mi trabajo.', 'Y si hace falta, contesto yo desde el panel.'],
    actions: [['Abrir chat', '↵'], ['Hablar con Jose', '⌘J']],
    render: (v) => chatDemo(v, '¿Haces apps con React Native?', () => `
      <div class="msg msg--jc">Sí: apps con React Native y Expo, publicadas en las stores. ¿Te enseño los proyectos?</div>`),
  },
};
const PROJ = [['smartphone', 'HazmeFila', 'App'], ['briefcase', 'Oportunix', 'Web'], ['store', 'Webs de comercios', 'Web'], ['smartphone', '3catinfo', 'App']];

const view = document.getElementById('winView');
const stagewin = document.querySelector('.stagewin');
const glow = document.getElementById('glow');
const btns = [...document.querySelectorAll('.dock__btn')];
const keysOrder = btns.map((b) => b.dataset.tab);
let current = null, runId = 0;

function listView(v, groups) {
  let i = 0;
  v.innerHTML = `<div class="view stagger">${groups.map(([g, rows]) => `<div class="grp">${esc(g)}</div>` + rows.map(([ic, t, m]) =>
    `<div class="row${i === 0 ? ' is-sel' : ''}" style="--i:${i++}"><span class="ic"><i data-lucide="${ic}"></i></span><span>${esc(t)}</span><span class="meta">${esc(m)}</span></div>`).join('')).join('')}</div>`;
  arm(v);
}
function projectsView(v) {
  v.innerHTML = `<div class="view split"><div class="stagger">${PROJ.map(([ic, n, t], i) =>
    `<div class="row${i === 0 ? ' is-sel' : ''}" style="--i:${i}" data-p="${i}"><span class="ic"><i data-lucide="${ic}"></i></span><span>${esc(n)}</span><span class="meta">${t}</span></div>`).join('')}</div>
    <div class="detail"><div class="shot"><span class="todo">captura real</span></div><h3 id="pdName">${PROJ[0][1]}</h3><p><span class="todo">{{DATO: qué hace, en una frase}}</span></p></div></div>`;
  v.querySelectorAll('[data-p]').forEach((r) => {
    const pick = () => { v.querySelectorAll('[data-p]').forEach((x) => x.classList.toggle('is-sel', x === r)); v.querySelector('#pdName').textContent = PROJ[+r.dataset.p][1]; };
    r.addEventListener('mouseenter', pick); r.addEventListener('click', pick);
  });
  arm(v);
}
function arm(v) { icons(); const s = v.querySelectorAll('.stagger'); requestAnimationFrame(() => requestAnimationFrame(() => s.forEach((x) => x.classList.add('go')))); }

/* demo de conversación: el mensaje se escribe, «pensando», y aparece la respuesta. Explicativo (marketing): puede durar más que la UI. */
function chatDemo(v, text, answer) {
  const id = ++runId;
  v.innerHTML = `<div class="view chat"><div class="msg msg--me"><span class="typed"></span><span class="caret"></span></div></div>`;
  const chat = v.querySelector('.chat'), typed = v.querySelector('.typed');
  if (reduce) { typed.textContent = text; v.querySelector('.caret').remove(); chat.insertAdjacentHTML('beforeend', answer()); chat.querySelectorAll('.pop').forEach((p) => p.classList.add('go')); return; }
  let i = 0;
  const step = () => {
    if (id !== runId) return;
    typed.textContent = text.slice(0, ++i);
    if (i < text.length) return setTimeout(step, 18 + Math.random() * 22);
    v.querySelector('.caret').remove();
    chat.insertAdjacentHTML('beforeend', '<div class="msg msg--jc thinking"><span class="dots"><i></i><i></i><i></i></span></div>');
    setTimeout(() => {
      if (id !== runId) return;
      chat.querySelector('.thinking').remove();
      chat.insertAdjacentHTML('beforeend', answer());
      requestAnimationFrame(() => requestAnimationFrame(() => chat.querySelectorAll('.pop').forEach((p) => p.classList.add('go'))));
    }, 650);
  };
  setTimeout(step, 250);
}

function select(tab, { focus = false } = {}) {
  if (tab === current || !TABS[tab]) return;
  const T = TABS[tab]; current = tab; runId++;
  btns.forEach((b) => { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  document.getElementById('winQuery').textContent = T.query;
  document.getElementById('winCrumb').textContent = T.crumb;
  document.getElementById('winActions').innerHTML = T.actions.map(([a, k]) => `<span>${esc(a)} <kbd>${k}</kbd></span>`).join('');
  const cap = document.getElementById('winCaption'); cap.innerHTML = `${esc(T.caption[0])} <span>${esc(T.caption[1])}</span>`;
  glow.style.setProperty('--glow', T.glow);
  // cambio de vista: la vieja se va rápido (140 ms), la nueva entra con ease-out; el alto se ajusta sin saltos
  const from = view.offsetHeight, old = view.firstElementChild;
  const swap = () => {
    T.render(view);
    const nv = view.firstElementChild;
    if (!reduce && nv) { nv.classList.add('is-entering'); requestAnimationFrame(() => { nv.classList.remove('is-entering'); nv.classList.add('is-in'); }); }
    const to = view.offsetHeight;
    if (!reduce && Math.abs(to - from) > 2) view.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 240, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
  };
  if (old && !reduce) { old.classList.add('is-leaving'); setTimeout(swap, 140); } else swap();
}
btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.tab)));
document.querySelector('.dock').addEventListener('keydown', (e) => {
  const i = keysOrder.indexOf(current);
  if (e.key === 'ArrowRight') { e.preventDefault(); select(keysOrder[(i + 1) % 4], { focus: true }); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); select(keysOrder[(i + 3) % 4], { focus: true }); }
});
// atajos 1-4 cuando la ventana está a la vista (sin animar la acción: es de teclado)
let winVisible = false;
new IntersectionObserver(([e]) => { winVisible = e.isIntersecting; if (winVisible && !current) select('negocios'); }, { threshold: 0.35 }).observe(stagewin);
addEventListener('keydown', (e) => {
  if (!winVisible || e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(document.activeElement.tagName)) return;
  const n = +e.key; if (n >= 1 && n <= 4) select(keysOrder[n - 1]);
});
// los enlaces de la cabecera y del hero abren su pestaña
document.querySelectorAll('a[data-tab]').forEach((a) => a.addEventListener('click', () => { current = null; setTimeout(() => select(a.dataset.tab), 0); }));
if (shot) select('negocios');

/* ---------- arquitectura: cables calculados desde la posición real de cada nodo ---------- */
const svg = document.querySelector('.arch__wires');
const arch = document.getElementById('arch');
function wire() {
  if (!arch || getComputedStyle(svg).display === 'none') return;
  const A = arch.getBoundingClientRect(); svg.setAttribute('viewBox', `0 0 ${A.width} ${A.height}`);
  const box = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return { l: r.left - A.left, r: r.right - A.left, y: r.top - A.top + r.height / 2 }; };
  const link = (pid, a, b) => { const s = box(a), e = box(b), mx = (s.r + e.l) / 2; document.getElementById(pid).setAttribute('d', `M${s.r} ${s.y} C ${mx} ${s.y} ${mx} ${e.y} ${e.l} ${e.y}`); };
  link('w1', 'n-nav', 'n-cf'); link('w2', 'n-cf', 'n-gw'); link('w3', 'n-cf', 'n-um'); link('w4', 'n-gw', 'n-sb'); link('w5', 'n-gw', 'n-sv');
}
wire(); addEventListener('resize', wire, { passive: true }); document.fonts?.ready.then(wire);
if (svg && !reduce) {
  const NS = 'http://www.w3.org/2000/svg';
  const routes = [['w1', 0], ['w2', 1.1], ['w4', 2.0], ['w1', 1.6], ['w3', 2.7], ['w5', 3.5]];
  routes.forEach(([id, begin]) => {
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '3.5'); c.setAttribute('class', 'pk'); c.setAttribute('opacity', '0');
    const show = document.createElementNS(NS, 'set'); show.setAttribute('attributeName', 'opacity'); show.setAttribute('to', '1'); show.setAttribute('begin', `${begin}s`); c.append(show);
    const m = document.createElementNS(NS, 'animateMotion'); m.setAttribute('dur', '1.4s'); m.setAttribute('begin', `${begin}s`); m.setAttribute('repeatCount', 'indefinite');
    m.setAttribute('keyPoints', '0;1'); m.setAttribute('keyTimes', '0;1'); m.setAttribute('calcMode', 'spline'); m.setAttribute('keySplines', '0.77 0 0.175 1');
    const mp = document.createElementNS(NS, 'mpath'); mp.setAttribute('href', `#${id}`); m.append(mp); c.append(m); svg.append(c);
  });
  svg.pauseAnimations();
  new IntersectionObserver(([e]) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()), { threshold: 0.2 }).observe(svg);
}

/* ---------- paleta ⌘K: sin animación (acción de teclado) ---------- */
const CMDS = [
  { g: 'Ir a', label: 'Webs para tu negocio', icon: 'store', tab: 'negocios', k: 'negocio web precio packs tienda restaurante clinica' },
  { g: 'Ir a', label: 'Trabajo con empresas', icon: 'building-2', tab: 'empresas', k: 'empresas cto contratar freelance cv' },
  { g: 'Ir a', label: 'Proyectos', icon: 'layout-grid', tab: 'proyectos', k: 'proyectos apps webs portfolio' },
  { g: 'Ir a', label: 'Cómo está hecha esta web', icon: 'layers', href: '#build', k: 'stack arquitectura cloudflare next' },
  { g: 'Ir a', label: 'Blog', icon: 'book-open', href: '#', k: 'articulos blog' },
  { g: 'Acciones', label: 'Ver packs y precios', icon: 'tag', tab: 'negocios', hint: 'desde 900 €', k: 'precio precios cuanto cuesta packs' },
  { g: 'Acciones', label: 'Pedir una propuesta con IA', icon: 'sparkles', tab: 'negocios', k: 'propuesta presupuesto generador ia' },
  { g: 'Acciones', label: 'Preguntar al asistente', icon: 'bot', tab: 'asistente', k: 'chat asistente ia' },
  { g: 'Acciones', label: 'Escribir por WhatsApp', icon: 'message-circle', href: '#hablamos', k: 'whatsapp contacto hablar' },
  { g: 'Acciones', label: 'Reservar 20 min', icon: 'calendar', href: '#hablamos', k: 'llamada reunion cita calendario' },
];
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
function go(i) {
  const c = shown[i]; if (!c) return; pal.close();
  if (c.tab) { stagewin.scrollIntoView({ block: 'center' }); current = null; select(c.tab); } else if (c.href !== '#') location.hash = c.href;
}
function openPal() { if (pal.open) return; pq.value = ''; sel = 0; renderPal(); pal.showModal(); pq.focus(); }
document.getElementById('cmdk-open').addEventListener('click', openPal);
// las teclas del cierre se hunden cuando pulsas el atajo de verdad (feedback físico, 90 ms)
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
