import { autoTunnels } from './tunnel.js';

const tunnels = autoTunnels();

/* ---------- 1 · editor: el árbol cambia el "fichero" del panel ---------- */
const DOCS = {
  jose: document.getElementById('ideDoc').innerHTML,
  empresas: `<p class="kicker"><span class="dot"></span> trabajo con empresas</p><h1>Por proyecto o por horas</h1>
    <p class="role">40 €/h · 150 € por feature cerrada · React Native, Next.js, TypeScript, Supabase, Cloudflare, n8n.</p>
    <ul class="facts"><li><b>Cómo trabajo</b> alcance cerrado, entregas semanales, código en tu repositorio.</li><li><b>Contratación</b> freelance o incorporación; CV descargable.</li></ul>
    <div class="ctas"><a class="btn btn--primary" href="#">Reservar 20 min</a><a class="btn btn--ghost" href="#">Descargar CV</a></div>`,
  negocios: `<p class="kicker"><span class="dot"></span> webs para tu negocio</p><h1>Cuatro packs, precio cerrado</h1>
    <ul class="facts"><li><b>P1</b> Web básica · desde 900 € · 1 semana</li><li><b>P2</b> Pedidos o reservas · desde 1.400 € · 2 semanas</li><li><b>P3</b> Gestión · desde 2.500 € · 2 semanas</li><li><b>P4</b> Gestión + automatizaciones · desde 4.200 € · 3 semanas</li></ul>
    <div class="ctas"><a class="btn btn--primary" href="#">Pedir propuesta</a><a class="btn btn--ghost" href="#">WhatsApp</a></div>`,
  proyectos: `<p class="kicker"><span class="dot"></span> proyectos</p><h1>Publicado, con enlaces</h1>
    <ul class="facts"><li><b>3catinfo</b> app de noticias · iOS y Android · desarrollo y rendimiento.</li><li><b>HazmeFila</b> Expo + Supabase.</li><li><b>Oportunix</b> Next.js 16.</li><li><b>Esta web</b> Cloudflare Workers + gateway Hono + Fastify + Supabase.</li></ul>
    <div class="ctas"><a class="btn btn--primary" href="#">Ver todos</a></div>`,
};
const tree = document.querySelector('.ide__tree'), doc = document.getElementById('ideDoc'), tabs = document.querySelector('.ide__tabs');
tree.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-file]'); if (!b) return;
  tree.querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
  tabs.innerHTML = `<span class="is-active">${b.textContent}</span>`;
  doc.classList.remove('is-switching'); void doc.offsetWidth;
  doc.innerHTML = DOCS[b.dataset.file]; doc.classList.add('is-switching');
});

/* ---------- 2 · split: hover/foco en la lista cambia el panel vivo ---------- */
const right = document.getElementById('splitRight');
const setPanel = (name) => {
  right.dataset.active = name;
  right.querySelectorAll('.panelv').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
  document.querySelectorAll('#hoverlist button').forEach((b) => b.classList.toggle('is-active', b.dataset.panel === name));
};
setPanel('tunnel');
document.querySelectorAll('#hoverlist button').forEach((b) => {
  b.addEventListener('pointerenter', () => setPanel(b.dataset.panel));
  b.addEventListener('focus', () => setPanel(b.dataset.panel));
  b.addEventListener('click', () => setPanel(b.dataset.panel));
});

/* ---------- 3 · terminal: elegir escribe la pregunta y "compila" la respuesta ---------- */
const ANSWERS = {
  negocio: { q: 'Una web para mi negocio', lines: [
    '<b>ok</b> cuatro packs con precio cerrado, sin hosting ni sorpresas:',
    '<em>P1</em> Web básica · desde 900 € · lista en 1 semana',
    '<em>P2</em> Pedidos o reservas · desde 1.400 € · 2 semanas',
    '<em>P3</em> Gestión interna · desde 2.500 € · 2 semanas',
    '<em>P4</em> Gestión + automatizaciones · desde 4.200 € · 3 semanas',
    '<b>siguiente</b> cuéntame tu negocio en 3 preguntas y te doy una propuesta orientativa.',
  ], ctas: '<a class="btn btn--primary" href="#">Pedir propuesta (2 min)</a><a class="btn btn--ghost" href="#">Hablar por WhatsApp</a>' },
  contratar: { q: 'Contratar a Jose', lines: [
    '<b>perfil</b> desarrollador full-stack · React Native, Next.js, TypeScript, Supabase · Granada',
    '<b>apps</b> 3catinfo (iOS/Android) · HazmeFila · Oportunix',
    '<b>esta web</b> Next.js en Cloudflare Workers · gateway Hono · Fastify en servidor propio · Supabase',
    '<b>formación</b> ITIL 4 · DevOps &amp; Cloud (AWS) · Professional Scrum Master',
    '<b>tarifas</b> 40 €/h · 150 € por feature cerrada · por proyecto',
  ], ctas: '<a class="btn btn--primary" href="#">Reservar 20 min</a><a class="btn btn--ghost" href="#">Descargar CV</a>' },
  proyectos: { q: 'Ver sus proyectos', lines: [
    '<em>3catinfo</em> app de noticias con vídeo · publicada en stores · desarrollo y rendimiento',
    '<em>HazmeFila</em> gestión de colas · Expo + Supabase',
    '<em>Oportunix</em> Next.js 16 · en producción',
    '<em>josecoded</em> esta web, con su código en GitHub',
  ], ctas: '<a class="btn btn--primary" href="#">Ver todos</a><a class="btn btn--ghost" href="#">Cómo está hecha esta web</a>' },
};
const tIn = document.getElementById('termInput'), tOut = document.getElementById('termOut');
document.getElementById('termChips').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-ans]'); if (!b) return;
  const a = ANSWERS[b.dataset.ans];
  tOut.innerHTML = '';
  // escribe la pregunta
  tIn.textContent = '';
  for (const ch of a.q) { tIn.textContent += ch; await new Promise((r) => setTimeout(r, 22)); }
  await new Promise((r) => setTimeout(r, 180));
  a.lines.forEach((l, i) => { const d = document.createElement('div'); d.className = 'line'; d.style.animationDelay = `${i * 90}ms`; d.innerHTML = l; tOut.appendChild(d); });
  const c = document.createElement('div'); c.className = 'ctas line'; c.style.animationDelay = `${a.lines.length * 90 + 80}ms`; c.innerHTML = a.ctas; tOut.appendChild(c);
});

/* ---------- 5 · scroll narrativo: progreso 0..1 sobre la sección → 3 estados ---------- */
const f5 = document.getElementById('f5'), stage = f5.querySelector('.stage');
const t1 = f5.querySelector('.stage__text--1'), t2 = f5.querySelector('.stage__text--2');
const stageGl = document.getElementById('stageGl');
let stageTunnel = null;
function onScroll() {
  const r = f5.getBoundingClientRect(); const total = r.height - innerHeight;
  const p = Math.min(1, Math.max(0, -r.top / total));
  t1.style.opacity = p < 0.25 ? Math.min(1, p / 0.08) * (1 - Math.max(0, (p - 0.18) / 0.07)) : 0;
  t2.style.opacity = p >= 0.25 && p < 0.55 ? Math.min(1, (p - 0.25) / 0.06) * (1 - Math.max(0, (p - 0.48) / 0.07)) : 0;
  stage.classList.toggle('s2', p >= 0.25 && p < 0.62);
  stage.classList.toggle('s3', p >= 0.62);
  // el túnel se atenúa y se frena conforme el código "se ordena"
  if (!stageTunnel) stageTunnel = tunnels?.get(stageGl);
  stageTunnel?.set('dim', p < 0.25 ? 1 : p < 0.62 ? 0.5 : 0.3);
  stageTunnel?.set('flow', p < 0.25 ? 0.5 : 0.15);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- 6 · objeto: pines, hover en módulos, pulso por las pistas ---------- */
const chip = document.getElementById('chip'), pins = chip.querySelector('.pins'), label = document.getElementById('objLabel');
let pinHtml = '';
for (let i = 0; i < 14; i++) { const x = 100 + i * 32; pinHtml += `<rect x="${x}" y="44" width="12" height="18" rx="2"/><rect x="${x}" y="358" width="12" height="18" rx="2"/>`; }
for (let i = 0; i < 8; i++) { const y = 84 + i * 34; pinHtml += `<rect x="64" y="${y}" width="18" height="12" rx="2"/><rect x="558" y="${y}" width="18" height="12" rx="2"/>`; }
pins.innerHTML = pinHtml;
const TRACE_OF = { web: ['web-api'], api: ['web-api', 'api-worker', 'api-db'], db: ['api-db'], worker: ['api-worker', 'worker-n8n'], n8n: ['worker-n8n'] };
chip.querySelectorAll('.mod').forEach((m) => {
  const on = () => { label.textContent = m.dataset.label; label.style.color = 'var(--text)'; chip.querySelectorAll('.traces path').forEach((p) => p.classList.toggle('is-hot', TRACE_OF[m.dataset.m].includes(p.dataset.t))); m.classList.add('is-hot'); };
  const off = () => { label.textContent = 'Pasa el ratón por un módulo'; label.style.color = ''; chip.querySelectorAll('.traces path').forEach((p) => p.classList.remove('is-hot')); m.classList.remove('is-hot'); };
  m.addEventListener('pointerenter', on); m.addEventListener('pointerleave', off); m.addEventListener('focus', on); m.addEventListener('blur', off); m.setAttribute('tabindex', '0');
});
// pulso que recorre las pistas en bucle (una petición viajando por el sistema)
const pulse = chip.querySelector('.pulse'), paths = [...chip.querySelectorAll('.traces path')];
let pi = 0, pt = 0;
function movePulse(now) {
  const path = paths[pi], len = path.getTotalLength();
  pt += 1.6; if (pt > len) { pt = 0; pi = (pi + 1) % paths.length; }
  const pos = paths[pi].getPointAtLength(pt); pulse.setAttribute('cx', pos.x); pulse.setAttribute('cy', pos.y);
  requestAnimationFrame(movePulse);
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(movePulse);
