/* home v4 · interfaz: cabecera, paleta ⌘K, ventana de proyectos, h2 que se resuelven y entradas únicas. */
document.documentElement.classList.add('js');
window.lucide?.createIcons();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* solo prototipo: ?shot=<y> posiciona el scroll para capturas de revisión */
const shot = new URLSearchParams(location.search).get('shot');
if (shot) { document.documentElement.style.scrollBehavior = 'auto'; addEventListener('load', () => scrollTo(0, +shot)); }

/* ---------- cabecera: gana fondo tras 80 px ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 80);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- proyectos (datos de ejemplo: los reales llegan de la spec, §18) ---------- */
const PROJECTS = [
  { name: 'HazmeFila', stack: 'React Native · Supabase' },
  { name: 'Oportunix', stack: 'Next.js · Supabase' },
  { name: 'Webs de comercios', stack: 'Next.js · Cloudflare' },
  { name: '3catinfo', stack: 'React Native' },
];
const list = document.getElementById('plist');
const items = [...list.querySelectorAll('li')];
const detail = document.getElementById('pdetail');
function select(i, focus) {
  items.forEach((li, k) => { const on = k === i; li.setAttribute('aria-selected', on); li.tabIndex = on ? 0 : -1; });
  if (focus) items[i].focus();
  const p = PROJECTS[i];
  detail.querySelector('.pd__name').textContent = p.name;
  detail.querySelector('.pd__meta div:last-child dd').textContent = p.stack;
}
items.forEach((li, i) => {
  li.addEventListener('click', () => select(i, true));
  li.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover) and (pointer: fine)').matches) select(i, false); });
});
list.addEventListener('keydown', (e) => {
  const cur = items.findIndex((li) => li.getAttribute('aria-selected') === 'true');
  if (e.key === 'ArrowDown') { e.preventDefault(); select(Math.min(items.length - 1, cur + 1), true); }
  if (e.key === 'ArrowUp') { e.preventDefault(); select(Math.max(0, cur - 1), true); }
  if (e.key === 'Home') { e.preventDefault(); select(0, true); }
  if (e.key === 'End') { e.preventDefault(); select(items.length - 1, true); }
});

/* ---------- paleta ⌘K: sin animación (acción de teclado, cientos de veces) ---------- */
const CMDS = [
  { g: 'Ir a', label: 'Proyectos', icon: 'layout-grid', href: '#proyectos', k: 'proyectos apps webs portfolio' },
  { g: 'Ir a', label: 'Trabajo con empresas', icon: 'building-2', href: '#vias', k: 'empresas cto contratar freelance cv' },
  { g: 'Ir a', label: 'Webs para tu negocio', icon: 'store', href: '#vias', k: 'negocio web precio packs tienda restaurante clinica' },
  { g: 'Ir a', label: 'Cómo está hecha esta web', icon: 'layers', href: '#build', k: 'stack arquitectura cloudflare next' },
  { g: 'Ir a', label: 'Blog', icon: 'book-open', href: '#', k: 'articulos blog' },
  { g: 'Ir a', label: 'Sobre mí', icon: 'user', href: '#', k: 'sobre mi jose' },
  { g: 'Acciones', label: 'Ver packs y precios', icon: 'tag', href: '#vias', hint: 'desde 900 €', k: 'precio precios cuanto cuesta packs' },
  { g: 'Acciones', label: 'Pedir una propuesta con IA', icon: 'sparkles', href: '#', k: 'propuesta presupuesto generador ia' },
  { g: 'Acciones', label: 'Escribir por WhatsApp', icon: 'message-circle', href: '#hablamos', k: 'whatsapp contacto hablar' },
  { g: 'Acciones', label: 'Reservar 20 min', icon: 'calendar', href: '#hablamos', k: 'llamada reunion cita calendario' },
  { g: 'Acciones', label: 'Preguntar al asistente', icon: 'bot', href: '#', k: 'chat asistente ia' },
];
const pal = document.getElementById('palette');
const pq = document.getElementById('pq');
const pres = document.getElementById('pres');
let sel = 0, shown = [];
const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
function renderPal() {
  const q = norm(pq.value.trim());
  shown = CMDS.filter((c) => !q || norm(c.label + ' ' + c.k).includes(q));
  sel = Math.min(sel, Math.max(0, shown.length - 1));
  pres.innerHTML = '';
  if (!shown.length) { pres.innerHTML = `<li class="empty">Nada con «${pq.value.replace(/[<>&]/g, '')}». Prueba con «precio» o «whatsapp».</li>`; return; }
  let g = '';
  shown.forEach((c, i) => {
    if (c.g !== g) { g = c.g; const h = document.createElement('li'); h.className = 'grp'; h.textContent = g; h.setAttribute('role', 'presentation'); pres.append(h); }
    const li = document.createElement('li');
    li.setAttribute('role', 'option'); li.id = 'pc' + i; li.setAttribute('aria-selected', i === sel);
    li.innerHTML = `<i data-lucide="${c.icon}" aria-hidden="true"></i><span></span>${c.hint ? `<span class="hint">${c.hint}</span>` : ''}`;
    li.querySelector('span').textContent = c.label;
    li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
    li.addEventListener('click', () => go(i));
    pres.append(li);
  });
  window.lucide?.createIcons();
  mark();
}
function mark() {
  pres.querySelectorAll('[role=option]').forEach((li) => li.setAttribute('aria-selected', li.id === 'pc' + sel));
  pq.setAttribute('aria-activedescendant', 'pc' + sel);
  document.getElementById('pc' + sel)?.scrollIntoView({ block: 'nearest' });
}
function go(i) { const c = shown[i]; if (!c) return; pal.close(); if (c.href !== '#') location.hash = c.href; }
function openPal() { if (pal.open) return; pq.value = ''; sel = 0; renderPal(); pal.showModal(); pq.focus(); }
document.getElementById('cmdk-open').addEventListener('click', openPal);
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPal(); }
});
pq.addEventListener('input', () => { sel = 0; renderPal(); });
pq.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); mark(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
  if (e.key === 'Enter') { e.preventDefault(); go(sel); }
});
pal.addEventListener('click', (e) => { if (e.target === pal) pal.close(); });

/* ---------- h2: se resuelven glifo a glifo, una sola vez (el texto real es accesible siempre) ---------- */
const GL = '{}[]()<>=;:/*+-_$#@!?&|0123456789abcdefghijklmnopqrstuvwxyz';
function resolveText(el) {
  const final = el.textContent;
  el.setAttribute('aria-label', final);
  const chars = [...final];
  const start = performance.now(), dur = 520 + chars.length * 14;
  const frame = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const settled = Math.floor(chars.length * (1 - Math.pow(1 - t, 3)));
    let html = '';
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (i < settled || c === ' ') html += c.replace(/[<>&]/g, '');
      else html += `<span class="g">${GL[(Math.random() * GL.length) | 0]}</span>`;
    }
    el.innerHTML = html;
    if (t < 1) requestAnimationFrame(frame); else { el.textContent = final; el.removeAttribute('aria-label'); }
  };
  requestAnimationFrame(frame);
}
if (!reduce && !shot) {
  const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { ro.unobserve(e.target); resolveText(e.target); } }), { rootMargin: '0px 0px -20% 0px' });
  document.querySelectorAll('h2.resolve').forEach((h) => ro.observe(h));
}

/* ---------- tarjetas con luz y canto: el borde se enciende donde está el cursor ---------- */
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
if (fine) document.querySelectorAll('.lit').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  el.addEventListener('pointerenter', () => el.style.setProperty('--lit', '1'));
  el.addEventListener('pointerleave', () => el.style.setProperty('--lit', '0'));
});

/* ---------- el enlace de cada puerta se resuelve en glifos al entrar (corto: se ve decenas de veces) ---------- */
function scramble(el, dur = 260) {
  if (el.dataset.busy) return; el.dataset.busy = '1';
  const final = el.dataset.text || (el.dataset.text = el.textContent);
  el.setAttribute('aria-label', final);
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur), n = Math.floor(final.length * t);
    el.innerHTML = [...final].map((c, i) => (i < n || c === ' ') ? c : `<span class="g">${GL[(Math.random() * GL.length) | 0]}</span>`).join('');
    if (t < 1) requestAnimationFrame(step); else { el.textContent = final; delete el.dataset.busy; }
  };
  requestAnimationFrame(step);
}
if (fine && !reduce) document.querySelectorAll('.door').forEach((d) => d.addEventListener('pointerenter', () => scramble(d.querySelector('.glyphs'))));

/* ---------- botones magnéticos: siguen al cursor con muelle y responden a la pulsación ---------- */
if (fine && !reduce) document.querySelectorAll('.mag').forEach((btn) => {
  const s = { x: 0, y: 0, vx: 0, vy: 0, sc: 1, vs: 0, tx: 0, ty: 0, ts: 1 };
  let raf = 0;
  const K = 260, D = 22;   // muelle crítico-suave: sin rebote apreciable
  const tick = (() => { let last = 0; return (now) => {
    const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016); last = now;
    for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['sc', 'vs', 'ts']]) { const a = -K * (s[p] - s[t]) - D * s[v]; s[v] += a * dt; s[p] += s[v] * dt; }
    btn.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) scale(${s.sc.toFixed(4)})`;
    const still = [['x', 'tx'], ['y', 'ty'], ['sc', 'ts']].every(([p, t]) => Math.abs(s[p] - s[t]) < 0.01) && Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vs) < 0.01;
    if (still) { raf = 0; last = 0; } else raf = requestAnimationFrame(tick);
  }; })();
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const zone = 1.6;   // radio de atracción en múltiplos del tamaño del botón
  addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy, near = Math.abs(dx) < r.width * zone / 2 + 24 && Math.abs(dy) < r.height * zone / 2 + 24;
    const nx = near ? dx * 0.22 : 0, ny = near ? dy * 0.3 : 0;
    if (nx !== s.tx || ny !== s.ty) { s.tx = nx; s.ty = ny; kick(); }
  }, { passive: true });
  btn.addEventListener('pointerdown', () => { s.ts = 0.96; kick(); });
  const release = () => { s.ts = 1; kick(); };
  btn.addEventListener('pointerup', release); btn.addEventListener('pointerleave', () => { release(); s.tx = 0; s.ty = 0; kick(); });
});

/* ---------- la web se compila: al llegar a cada componente, la nube lanza glifos que dibujan su borde
   y después el componente se imprime de arriba abajo con una línea de barrido. Una vez por visita. ---------- */
const compileTargets = [...document.querySelectorAll('.door, .win, .scheme')];
if (!reduce && !shot) {
  compileTargets.forEach((el) => el.classList.add('compile'));
  const print = (el) => {
    const h = el.getBoundingClientRect().height;
    const line = document.createElement('span'); line.className = 'scanline'; line.setAttribute('aria-hidden', 'true');
    el.append(line);
    el.classList.add('is-printing');
    line.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${h}px)`, opacity: 1 }], { duration: 620, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' })
      .finished.then(() => line.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }).finished)
      .then(() => { line.remove(); el.classList.add('is-done'); });
    const title = el.querySelector('h3 a, .win__query'); if (title) { title.classList.add('compile-glyphs'); scramble(title, 420); }
  };
  // se observa el contenedor: un elemento recortado por clip-path no cuenta como visible para IntersectionObserver
  const groups = new Map();
  compileTargets.forEach((el) => { const g = el.parentElement; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(el); });
  const io2 = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io2.unobserve(e.target);
    groups.get(e.target).forEach((el, i) => setTimeout(() => {
      if (window.compileBurst && innerWidth >= 900) { const t = window.compileBurst(el); setTimeout(() => print(el), Math.max(0, t * 1000 * 0.8)); }
      else print(el);   // móvil o sin WebGL: solo la impresión
    }, i * 140));
  }), { threshold: 0.25 });
  groups.forEach((_, g) => io2.observe(g));
}

/* ---------- botones: la etiqueta se descompone en glifos y se recompone al entrar (breve) ---------- */
if (fine && !reduce) document.querySelectorAll('.btn--solid, .link, .door__alt').forEach((b) => {
  const tn = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (!tn) return;
  const lbl = document.createElement('span'); lbl.className = 'compile-glyphs'; lbl.textContent = tn.textContent; tn.replaceWith(lbl);
  b.addEventListener('pointerenter', () => scramble(lbl, 220));
});
