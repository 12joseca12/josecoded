/* hero-lab · sin dependencias. Orden: base CSS ya pintada → código → título → luz (diferida). */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('motion=reduce');

/* ---------- código real del proyecto (fuente y destino: se sobreescribe una con otra) ---------- */
const SRC = {
  hono: `const app = new Hono<{ Bindings: Env }>();

app.use('*', requestId);
app.use('*', securityHeaders);
app.route('/api/v1', v1Routes);

export default app;`,
  rsc: `export default async function Home() {
  const facts = await getBuildFacts();
  return (
    <main>
      <HeroIntro facts={facts} />
      <Projects order="proofs" />
    </main>
  );
}`,
  sql: `create table public.affiliates (
  id      uuid primary key,
  user_id uuid references auth.users(id),
  code    text not null unique,
  level   text default 'standard'
);
alter table public.affiliates
  enable row level security;`,
};
const ALT = { hono: SRC.rsc, rsc: SRC.sql, sql: SRC.hono };

const KW = /\b(import|from|const|export|default|async|function|return|await|create|table|policy|alter|enable|using|select|for|all|on|not|null|references|primary|key|check|in|type|of)\b/g;

function highlight(line) {
  return line
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/('[^']*'|"[^"]*")/g, '<span class="s">$1</span>')
    .replace(KW, '<span class="k">$1</span>')
    .replace(/(\/\/.*$|--.*$)/, '<span class="c">$1</span>');
}

/* Cada capa: líneas como <span>, varios "cabezales" que sobreescriben 1–2 caracteres por tick, asíncronos y por zonas. */
class CodeLayer {
  constructor(pre, src, alt) {
    this.pre = pre;
    this.lines = src.split('\n');
    const altLines = alt.split('\n');
    this.dest = this.lines.map((_, i) => altLines[i % altLines.length]);   // destino por línea (ping-pong)
    this.spans = this.lines.map((l) => { const s = document.createElement('span'); s.innerHTML = highlight(l) + '\n'; pre.appendChild(s); return s; });
    this.heads = Array.from({ length: 2 }, () => this.newHead());
  }
  newHead() {
    return { line: Math.floor(Math.random() * this.lines.length), col: 0, wait: 10 + Math.random() * 40 };
  }
  tick() {
    for (const h of this.heads) {
      if (h.wait > 0) { h.wait -= 1; continue; }
      const tgt = this.dest[h.line], cur = this.lines[h.line], span = this.spans[h.line];
      const end = Math.max(cur.length, tgt.length);
      if (h.col >= end) {                                   // línea terminada: queda el destino y se invierte el sentido
        this.lines[h.line] = tgt; this.dest[h.line] = cur.trimEnd();
        span.innerHTML = highlight(tgt) + '\n';
        Object.assign(h, this.newHead()); continue;
      }
      const n = Math.random() < .3 ? 2 : 1;
      const glyph = Math.random() < .25;
      const piece = glyph ? rnd(n) : tgt.slice(h.col, h.col + n).padEnd(n, ' ');
      const next = (cur.slice(0, h.col) + piece + cur.slice(h.col + n)).slice(0, end);
      this.lines[h.line] = next;
      span.innerHTML = highlight(next.slice(0, h.col)) + '<span class="hot">' + esc(next.slice(h.col, h.col + n)) + '</span><span class="cur"></span>' + highlight(next.slice(h.col + n)) + '\n';
      if (!glyph) h.col += n;
    }
  }
}
const GLYPHS = '{}[]()<>=/;:._-+*#$%&@!?~0123456789abcdefxyz';
const rnd = (n) => Array.from({ length: n }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const layers = [...document.querySelectorAll('.code pre')].map((pre) => new CodeLayer(pre, SRC[pre.dataset.src], ALT[pre.dataset.src]));

/* ---------- título: compila rápido (≤ 900 ms), converge de izquierda a derecha ---------- */
const title = document.getElementById('title');
const NAME = title.textContent;
function compileTitle() {
  if (reduce) return;
  title.classList.add('is-compiling');
  title.innerHTML = [...NAME].map((ch) => ch === ' ' ? ' ' : `<span class="g">${rnd(1)}</span>`).join('');
  const gs = [...title.querySelectorAll('.g')];
  const t0 = performance.now(), total = 820, per = total / gs.length;
  const chars = [...NAME].filter((c) => c !== ' ');
  let raf;
  const step = (now) => {
    const t = now - t0;
    gs.forEach((g, i) => {
      if (g.classList.contains('set')) return;
      if (t > 120 + i * per) { g.textContent = chars[i]; g.classList.add('set'); }
      else if (Math.random() < .5) g.textContent = rnd(1);
    });
    if (t < total + 160) raf = requestAnimationFrame(step);
    else { title.classList.remove('is-compiling'); title.textContent = NAME; }
  };
  raf = requestAnimationFrame(step);
  return () => { cancelAnimationFrame(raf); title.classList.remove('is-compiling'); title.textContent = NAME; };
}

/* ---------- bucle de código ---------- */
const P = { speed: 1, opacity: .62, intensity: .7, beam: .22, fog: .8, lspeed: .5, on: true };
let acc = 0, last = 0, frames = 0, fpsT = 0;
const fpsEl = document.getElementById('fps');
function loop(now) {
  const dt = Math.min(50, now - last); last = now;
  acc += dt * P.speed;
  while (acc > 90) { acc -= 90; layers.forEach((l) => l.tick()); }     // un tick cada ~90 ms a velocidad 1
  frames++; if (now - fpsT > 1000) { fpsEl.textContent = frames; frames = 0; fpsT = now; }
  if (!document.hidden && inView) requestAnimationFrame(loop);
}
let inView = true;
new IntersectionObserver(([e]) => { const was = inView; inView = e.isIntersecting; if (inView && !was) { last = performance.now(); requestAnimationFrame(loop); } }).observe(document.getElementById('hero'));
document.addEventListener('visibilitychange', () => { if (!document.hidden && inView) { last = performance.now(); requestAnimationFrame(loop); } });
if (!reduce) { last = performance.now(); requestAnimationFrame(loop); }

/* ---------- luz WebGL: después del primer frame y en idle, con crossfade; si falla, nada ---------- */
let light = null;
const glEl = document.getElementById('gl');
async function loadLight() {
  if (reduce || light) return;
  try {
    const { createLight } = await import('./light.js');
    light = createLight(document.getElementById('light'), () => P);
    glEl.textContent = light ? `gl: ${light.info}` : 'gl: no disponible';
  } catch (e) { glEl.textContent = 'gl: error'; console.warn(e); }
}
requestAnimationFrame(() => ('requestIdleCallback' in window ? requestIdleCallback(loadLight, { timeout: 1500 }) : setTimeout(loadLight, 300)));

/* ---------- paralaje de capas (solo transform, vía variables CSS) ---------- */
if (!reduce && matchMedia('(pointer: fine)').matches) {
  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  const ease = () => { cx += (tx - cx) * .05; cy += (ty - cy) * .05; document.documentElement.style.setProperty('--px', cx.toFixed(4)); document.documentElement.style.setProperty('--py', cy.toFixed(4)); requestAnimationFrame(ease); };
  requestAnimationFrame(ease);
}

/* ---------- controles ---------- */
const panel = document.getElementById('panel');
addEventListener('keydown', (e) => { if (e.key === 'c' && !e.metaKey && !e.ctrlKey) panel.hidden = !panel.hidden; });
const bind = (id, key, apply) => { const el = document.getElementById(id); const out = el.parentElement.querySelector('output'); el.addEventListener('input', () => { P[key] = +el.value; if (out) out.value = el.value; apply?.(); }); };
bind('c-speed', 'speed');
bind('c-opacity', 'opacity', () => document.documentElement.style.setProperty('--code-opacity', P.opacity));
bind('l-intensity', 'intensity'); bind('l-beam', 'beam'); bind('l-fog', 'fog'); bind('l-speed', 'lspeed');
document.getElementById('hue').addEventListener('change', (e) => { document.body.dataset.hue = e.target.value; light?.recolor(); });
document.getElementById('l-on').addEventListener('change', (e) => { P.on = e.target.checked; document.getElementById('light').classList.toggle('is-on', P.on && !!light); });
let cancel = compileTitle();
document.getElementById('replay').addEventListener('click', () => { cancel?.(); cancel = compileTitle(); });
document.getElementById('skip').addEventListener('click', (e) => { e.preventDefault(); cancel?.(); document.getElementById('after').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
