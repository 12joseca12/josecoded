/* josecoded · home v3 · prototipo
   Módulos: util · accent · código de fondo · hero · router+morph · scroll · menú
   Solo transform / opacity / filter en animaciones. El código de fondo se actualiza por líneas, en lotes. */
(() => {
  'use strict';

  /* ---------------- util ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /motion=reduce/.test(location.search);
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const today = () => new Date().toISOString().slice(0, 10);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const EASE = 'power3.out';
  const EASE_IO = 'power3.inOut';

  const shell = $('#shell');
  const panel = $('#panel');
  const viewRoot = $('#view');
  const hero = $('#hero');

  if (hasGSAP) gsap.registerPlugin(Flip, ScrollTrigger);

  /* ---------------- acento (verde / morado) ---------------- */
  const setAccent = (a) => {
    document.documentElement.dataset.accent = a;
    store.set('accent', a);
    $$('.accent-opt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.accent === a)));
  };
  setAccent(store.get('accent') || 'green');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.accent-opt');
    if (b) setAccent(b.dataset.accent);
  });

  /* ---------------- código de fondo: sobreescritura lenta por zonas ---------------- */
  const SNIPPETS = [
`import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types/env.types';
import { healthRoutes } from './modules/health.routes';
import { v1Routes } from './modules/v1.routes';
import { requestId, securityHeaders } from './middlewares/security.middleware';

const app = new Hono<{ Bindings: Env }>();

app.use('*', requestId);
app.use('*', securityHeaders);

app.use('*', async (c, next) => {
  const env = parseEnv(c.env);
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  return cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next);
});

app.route('/', healthRoutes);
app.route('/api/v1', v1Routes);

app.notFound((c) => c.json(fail('not_found', 'Route not found'), 404));

app.onError((error, c) => {
  if (error instanceof Error && error.message.startsWith('Invalid environment:')) {
    return c.json(fail('internal_error', 'API misconfigured'), 500);
  }
  return c.json(fail('internal_error', 'Internal API error'), 500);
});

export default app;`,
`import { Suspense } from 'react';
import { getBuildInfo } from '@/lib/build-info';
import { getProjects } from '@/lib/content/projects';
import { SectionIndex } from '@/components/section-index';
import { ProjectCard } from '@/components/project-card';

export const revalidate = 3600;

export default async function HomePage() {
  const [build, projects] = await Promise.all([getBuildInfo(), getProjects({ limit: 3 })]);

  return (
    <>
      <Presentation build={build} />
      <SectionIndex />
      <section aria-labelledby="proyectos">
        <h2 id="proyectos">Proyectos</h2>
        <Suspense fallback={<ProjectSkeleton count={3} />}>
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} proofs={p.proofs} />
          ))}
        </Suspense>
      </section>
      <ThisSite facts={build.facts} lcp={build.lcp} />
    </>
  );
}`,
`-- Foro: tablas, índices, búsqueda (FTS simple) y RLS.
-- El worker josecoded-api usa service_role para escrituras.

create table if not exists public.forum_entries (
  id uuid primary key default gen_random_uuid(),
  thematic_id uuid not null references public.forum_thematics (id) on delete cascade,
  slug text not null,
  title_display text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (thematic_id, slug)
);

alter table public.forum_entries enable row level security;
alter table public.forum_comments enable row level security;

drop policy if exists forum_entries_select_all on public.forum_entries;
create policy forum_entries_select_all on public.forum_entries
  for select to anon, authenticated using (true);

drop policy if exists forum_comments_insert_own on public.forum_comments;
create policy forum_comments_insert_own on public.forum_comments
  for insert to authenticated with check (auth.uid() = author_id);

create index if not exists forum_entries_thematic_idx
  on public.forum_entries (thematic_id, created_at desc);`,
  ];

  const GLYPHS = '{}[]()<>=;:/*+-_#$%&|~^01234567890abcdefxyz';
  const rnd = (n) => Math.floor(Math.random() * n);
  const glyph = () => GLYPHS[rnd(GLYPHS.length)];

  class CodeLayer {
    constructor(el, startIdx, cols, rows, tick) {
      this.el = el; this.cols = cols; this.rows = rows; this.tick = tick;
      this.idx = startIdx;
      this.cur = this.grid(SNIPPETS[startIdx]);
      this.target = this.grid(SNIPPETS[(startIdx + 1) % SNIPPETS.length]);
      this.zones = [];
      this.lines = [];
      this.el.textContent = '';
      for (let r = 0; r < rows; r++) {
        const s = document.createElement('span');
        s.textContent = this.cur[r];
        this.el.append(s, '\n');
        this.lines.push(s);
      }
      this.timer = null;
    }
    grid(src) {
      const out = src.split('\n');
      while (out.length < this.rows) out.push('');
      return out.slice(0, this.rows).map((l) => (l + ' '.repeat(this.cols)).slice(0, this.cols));
    }
    spawn() {
      // Una zona = un "cabezal" que reescribe un tramo de una línea, despacio.
      const r = rnd(this.rows);
      const len = 6 + rnd(16);
      const start = rnd(Math.max(1, this.cols - len));
      this.zones.push({ r, c: start, end: start + len, wait: rnd(3) });
    }
    step() {
      const dirty = new Set();
      if (this.zones.length < 5 && Math.random() < 0.55) this.spawn();
      this.zones = this.zones.filter((z) => {
        if (z.wait-- > 0) return true;
        z.wait = rnd(2);
        const line = this.cur[z.r].split('');
        // Escribe el carácter final en el cabezal y deja 1–2 glifos "en vuelo" delante.
        line[z.c] = this.target[z.r][z.c];
        if (z.c + 1 < this.cols) line[z.c + 1] = glyph();
        if (z.c + 2 < this.cols && Math.random() < 0.5) line[z.c + 2] = glyph();
        this.cur[z.r] = line.join('');
        dirty.add(z.r);
        z.c += 1;
        if (z.c >= z.end) {
          // Limpia los glifos en vuelo al terminar la zona.
          const l2 = this.cur[z.r].split('');
          for (let i = z.c; i < Math.min(z.c + 2, this.cols); i++) l2[i] = this.target[z.r][i];
          this.cur[z.r] = l2.join('');
          return false;
        }
        return true;
      });
      // Lote: solo las líneas tocadas. La línea con cabezal lleva un span resaltado.
      dirty.forEach((r) => {
        const z = this.zones.find((q) => q.r === r);
        const s = this.lines[r];
        if (z) {
          const t = this.cur[r];
          s.textContent = '';
          s.append(t.slice(0, z.c));
          const hot = document.createElement('i'); hot.className = 'hot'; hot.textContent = t.slice(z.c, z.c + 2);
          s.append(hot, t.slice(z.c + 2));
        } else s.textContent = this.cur[r];
      });
      // Cuando casi todo coincide con el objetivo, cambia de snippet.
      if (this.zones.length === 0 && Math.random() < 0.02) {
        let same = 0;
        for (let r = 0; r < this.rows; r++) if (this.cur[r] === this.target[r]) same++;
        if (same / this.rows > 0.6) {
          this.idx = (this.idx + 1) % SNIPPETS.length;
          this.target = this.grid(SNIPPETS[(this.idx + 1) % SNIPPETS.length]);
        }
      }
    }
    start() { if (!this.timer) this.timer = setInterval(() => this.step(), this.tick); }
    stop() { clearInterval(this.timer); this.timer = null; }
  }

  const codeLayers = [];
  const buildCode = () => {
    if (codeLayers.length) return;
    const cols = isMobile() ? 60 : 96;
    const rows = isMobile() ? 34 : 38;
    $$('.code-layer').forEach((el, i) => codeLayers.push(new CodeLayer(el, i % SNIPPETS.length, cols, rows, 110 + i * 40)));
  };
  const startCode = () => { buildCode(); if (!REDUCED) codeLayers.forEach((l) => l.start()); };
  const stopCode = () => codeLayers.forEach((l) => l.stop());

  /* ---------------- hero: boot → compiling → typing → hold → minimizing → ready ---------------- */
  const titleEl = $('#hero-title-inner');
  const brandName = $('#brand-name');
  const TITLE = titleEl.textContent;
  let heroTL = null;
  let heroRunning = false;
  let beamTween = null;

  const setState = (s) => { shell.dataset.state = s; };

  const prepareTitle = () => {
    titleEl.textContent = '';
    TITLE.split('').forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'ch is-mono';
      s.textContent = ch === ' ' ? ' ' : glyph();
      s.dataset.ch = ch;
      titleEl.append(s);
    });
  };
  const resolveTitle = () => {
    $$('.ch', titleEl).forEach((s) => { s.textContent = s.dataset.ch; s.classList.remove('is-mono'); s.classList.add('is-set'); });
  };

  const finishHero = (skipped, mount = true) => {
    if (!heroRunning) return;
    heroRunning = false;
    heroTL && heroTL.kill();
    stopCode();
    beamTween && beamTween.kill();
    resolveTitle();
    store.set('hero_seen', today());
    setState('ready');
    brandName.style.opacity = '';
    titleEl.style.opacity = '';
    if (skipped && hasGSAP && !REDUCED) {
      gsap.fromTo(hero, { opacity: 1 }, { opacity: 0, duration: 0.18, onComplete: () => { hero.style.opacity = ''; } });
    }
    if (mount && !currentEl) mountRoute(parseHash(), { initial: true });
  };

  const runHero = () => {
    if (REDUCED || !hasGSAP) { store.set('hero_seen', today()); setState('ready'); return false; }
    heroRunning = true;
    const m = isMobile();
    const T = m ? { compile: 0.8, typing: 0.5, hold: 0.4, min: 0.6 } : { compile: 1.2, typing: 0.8, hold: 0.6, min: 0.7 };
    setState('boot');
    hero.style.opacity = '';
    prepareTitle();
    startCode();
    const chars = $$('.ch', titleEl);
    const role = $('#hero-role');
    const facts = $$('#hero-facts li');
    const links = $('#hero-links');
    const seed = $('#hero-seed');
    const status = $('#hero-status');
    role.classList.add('sweep'); role.style.setProperty('--sweep', '0%');
    gsap.set([role, facts, links], { clearProps: 'opacity' });
    gsap.set(brandName, { opacity: 0 });

    // Haz de luz que atraviesa el código (lento, nunca estático).
    beamTween = gsap.fromTo('.hero-beam', { xPercent: -120, rotation: 16 }, { xPercent: 160, rotation: 22, duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true });

    heroTL = gsap.timeline({ onComplete: () => finishHero(false) });
    // compiling: scramble determinista de izquierda a derecha, resuelve en ≤ 900 ms.
    heroTL.set(shell, { attr: { 'data-state': 'compiling' } }, 0.05);
    heroTL.to(seed, { opacity: 0, duration: 0.25 }, 0.1);
    const per = Math.min(0.9, T.compile * 0.75) / Math.max(1, chars.length);
    chars.forEach((s, i) => {
      const at = 0.12 + i * per;
      let tick = 0;
      heroTL.call(() => { if (s.dataset.ch !== ' ') s.textContent = glyph(); }, null, Math.max(0, at - 0.09));
      heroTL.call(() => { if (s.dataset.ch !== ' ') s.textContent = glyph(); }, null, Math.max(0, at - 0.045));
      heroTL.call(() => { s.textContent = s.dataset.ch; s.classList.remove('is-mono'); s.classList.add('is-set'); tick++; }, null, at);
    });
    heroTL.fromTo(status, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.1);
    heroTL.call(() => { status.textContent = 'ok · ' + Math.round(T.compile * 1000) + ' ms'; }, null, T.compile);
    // typing: barrido de luz en la línea de rol; hechos escalonados 80 ms; enlaces.
    heroTL.set(shell, { attr: { 'data-state': 'typing' } }, T.compile);
    heroTL.to(role, { opacity: 1, duration: 0.05 }, T.compile);
    heroTL.to(role, { '--sweep': '100%', duration: T.typing * 0.7, ease: 'power2.out' }, T.compile);
    heroTL.fromTo(facts, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: EASE }, T.compile + T.typing * 0.3);
    heroTL.fromTo(links, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: EASE }, T.compile + T.typing * 0.55);
    // hold
    heroTL.set(shell, { attr: { 'data-state': 'hold' } }, T.compile + T.typing);
    // minimizing: el título viaja a la barra de título (FLIP); el resto se atenúa; el shell recupera brillo.
    const tMin = T.compile + T.typing + T.hold;
    heroTL.set(shell, { attr: { 'data-state': 'minimizing' } }, tMin);
    heroTL.call(() => {
      // El contenido de la home entra desde abajo mientras el título viaja (UX §3.6, minimizing).
      mountRoute(parseHash(), { initial: true, duringHero: true });
      role.classList.remove('sweep');
      gsap.to([role, facts, links, status], { opacity: 0, y: -6, duration: 0.18, ease: 'power2.in' });
      gsap.to('.hero-depth', { opacity: 0, duration: T.min, ease: 'power2.in' });
      gsap.set(brandName, { opacity: 1, visibility: 'hidden' });
      Flip.fit(titleEl, brandName, { duration: T.min, ease: EASE_IO, scale: true, onComplete: () => {
        gsap.set(brandName, { clearProps: 'visibility' });
        gsap.set(titleEl, { opacity: 0 });
      } });
    }, null, tMin);
    heroTL.to({}, { duration: T.min + 0.05 }, tMin);
    return true;
  };

  const skipHero = (e) => { if (heroRunning) { if (e && e.type === 'keydown' && e.key === 'Tab') { /* Tab también salta */ } finishHero(true); } };
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, skipHero, { passive: true }));
  $('#hero-skip').addEventListener('click', (e) => { e.preventDefault(); skipHero(); $('#view').focus(); });

  /* ---------------- datos de proyectos ---------------- */
  const SCREENS = {
    web: '<span class="project-screen project-screen--web"><span class="ps-bar"></span><span class="ps-hero"></span><span class="ps-grid"><i></i><i></i><i></i></span></span>',
    app: '<span class="project-screen project-screen--app"><span class="ps-bar"></span><span class="ps-card"></span><span class="ps-card"></span><span class="ps-cta"></span></span>',
    news: '<span class="project-screen project-screen--news"><span class="ps-bar"></span><span class="ps-img"></span><span class="ps-line"></span><span class="ps-line ps-line--short"></span></span>',
    ide: '<span class="project-screen project-screen--ide"><span class="ps-bar"></span><span class="ps-side"></span><span class="ps-code"><i></i><i></i><i></i><i></i></span></span>',
  };
  const PROJECTS = {
    oportunix: { name: 'Oportunix', screen: 'web', meta: 'web · next.js 16 + firebase · <span data-placeholder>publicada</span>', fact: 'Web de mystery boxes y subastas. Primer commit, febrero de 2026. <span data-placeholder>oportunix.com en producción</span>.', ctas: [['Ver la web', 'primary'], ['Ver el código', 'secondary']], did: ['Diseño y desarrollo de la web completa.', 'Subastas en tiempo real y pagos.', 'Publicación y medición de rendimiento.'], stack: 'Next.js 16, Firebase (Auth, Firestore), Tailwind, Vercel.', faq1: 'Sí. <span data-placeholder>Publicada en oportunix.com desde marzo de 2026.</span>' },
    hazmefila: { name: 'HazmeFila', screen: 'app', meta: 'app · expo sdk 56 + supabase · <span data-placeholder>en pruebas</span>', fact: 'App para contratar a alguien que haga cola por ti. Primer commit, junio de 2026.', ctas: [['Ver el código', 'primary']], did: ['App completa en React Native con Expo.', 'Backend en Supabase con RLS por usuario.', 'Pagos y geolocalización.'], stack: 'React Native, Expo SDK 56, Supabase (Postgres, Auth, Realtime), TypeScript.', faq1: '<span data-placeholder>En pruebas cerradas (TestFlight e Internal testing).</span>' },
    '3catinfo': { name: '3catinfo', screen: 'news', meta: 'app · ios + android · publicada', fact: 'App de noticias de 3Cat con actualizaciones en tiempo real, modo sin conexión y sincronización entre dispositivos.', ctas: [['Ver en App Store', 'primary'], ['Ver en Google Play', 'secondary']], did: ['Desarrollo de la app.', 'Rendimiento en dispositivos de gama media.'], stack: null, faq1: 'Sí, publicada en App Store y Google Play. Proyecto bajo acuerdo de confidencialidad: muestro nombre y alcance.' },
    josecoded: { name: 'josecoded.com', screen: 'ide', meta: 'web · next.js + workers + supabase · publicada', fact: 'Esta web. Los datos del build salen del repositorio al construir.', ctas: [['Ver el código', 'primary']], did: ['Next.js en Cloudflare Workers (OpenNext).', 'Gateway Hono propio y backend Fastify en servidor propio.', 'Supabase con RLS; Umami para analítica.'], stack: 'Next.js, Hono, Fastify, Supabase, n8n, Cloudflare.', faq1: 'Sí, la estás viendo.' },
  };
  const GENERIC = {
    empresas: ['Trabajo con empresas', 'Por proyecto o por horas, 40 €/h. Web, móvil e IA integrada.', 'Desarrollador full-stack freelance. Web con Next.js, móvil con React Native, IA integrada con Workers AI, Ollama y n8n. Por proyecto o por horas: 40 €/h; feature con alcance cerrado, 150 €.'],
    blog: ['Blog', 'Cómo están hechos mis proyectos y esta web.', 'Artículos sobre cómo está hecha esta web y mis proyectos.'],
    'sobre-mi': ['Jose', 'Desarrollador full-stack freelance · Granada, España', 'Digo qué hago, cuánto cuesta y cuándo está.'],
    contacto: ['Contacto', 'WhatsApp, formulario o 20 min por videollamada.', 'Te respondo el mismo día laborable.'],
    chat: ['Chat con el asistente', 'Pregunta por mi trabajo, precios o esta web.', 'El asistente responde con lo que hay en la web; si hace falta, sigo yo.'],
    propuesta: ['Propuesta orientativa', 'Cuatro preguntas y te doy pack, precio y plazo.', 'Tipo de negocio, qué debe hacer la web, si vende o reserva online, y plazo.'],
  };

  /* ---------------- router + morph ---------------- */
  const LABELS = { home: 'Inicio', empresas: 'Empresas', negocios: 'Negocios', proyectos: 'Proyectos', blog: 'Blog', 'sobre-mi': 'Sobre mí', contacto: 'Contacto', chat: 'Chat', propuesta: 'Propuesta' };
  const parseHashString = (hash) => {
    const h = hash.replace(/^#\/?/, '');
    const [path, anchor] = h.split('#');
    const parts = path.split('/').filter(Boolean);
    if (!parts.length) return { route: 'home' };
    if (parts[0] === 'proyectos' && parts[1]) return { route: 'proyecto', slug: parts[1], anchor };
    return { route: parts[0], anchor };
  };
  const parseHash = () => parseHashString(location.hash);
  const hashFor = (r) => r.route === 'home' ? '#/' : r.route === 'proyecto' ? `#/proyectos/${r.slug}` : `#/${r.route}${r.anchor ? '#' + r.anchor : ''}`;
  const keyFor = (r) => r.route === 'proyecto' ? `proyecto-${r.slug}` : r.route;

  let current = null;
  let currentEl = null;
  let tabs = [];
  try { tabs = JSON.parse(sessionStorage.getItem('tabs') || '[]'); } catch {}

  const fill = (root, field, html) => { const el = root.querySelector(`[data-field="${field}"]`); if (el) el.innerHTML = html; return el; };

  const buildView = (r) => {
    let frag;
    if (r.route === 'home') frag = $('#tpl-home').content.cloneNode(true);
    else if (r.route === 'negocios') frag = $('#tpl-negocios').content.cloneNode(true);
    else if (r.route === 'proyectos') frag = $('#tpl-proyectos').content.cloneNode(true);
    else if (r.route === 'proyecto' && PROJECTS[r.slug]) {
      const p = PROJECTS[r.slug];
      frag = $('#tpl-proyecto').content.cloneNode(true);
      fill(frag, 'meta', p.meta); fill(frag, 'name', p.name); fill(frag, 'fact', p.fact);
      fill(frag, 'ctas', p.ctas.map(([t, k]) => `<a class="btn btn--${k}" href="#" data-noop><span class="btn-label">${t}</span></a>`).join(''));
      fill(frag, 'did', p.did.map((d, i) => `<li><span class="fact-mark mono" aria-hidden="true">0${i + 1}</span>${d}</li>`).join(''));
      if (p.stack) fill(frag, 'stack', p.stack); else frag.querySelector('[data-field="stack-block"]').remove();
      fill(frag, 'faq1', p.faq1);
      frag.querySelector('.project-frame--big').innerHTML = SCREENS[p.screen];
    } else {
      const g = GENERIC[r.route] || [LABELS[r.route] || r.route, '', ''];
      frag = $('#tpl-generic').content.cloneNode(true);
      fill(frag, 'title', g[0]); fill(frag, 'fact', g[1]); fill(frag, 'lead', g[2]);
    }
    const el = frag.firstElementChild;
    // Ids de FLIP: nombre y hecho de cada entrada del índice / proyecto ↔ cabecera de la vista destino.
    $$('.index-item[data-route]', el).forEach((a) => {
      a.querySelector('.index-name').dataset.flipId = a.dataset.route + '-name';
      a.querySelector('.index-fact').dataset.flipId = a.dataset.route + '-fact';
    });
    $$('.project[data-slug]', el).forEach((a) => {
      a.querySelector('.project-name').dataset.flipId = 'proyecto-' + a.dataset.slug + '-name';
      a.querySelector('.project-frame').dataset.flipId = 'proyecto-' + a.dataset.slug + '-frame';
    });
    const k = keyFor(r);
    const t = el.querySelector('.view-title'); if (t) t.dataset.flipId = k + '-name';
    const f = el.querySelector('.view-fact'); if (f) f.dataset.flipId = k + '-fact';
    const bf = el.querySelector('.project-frame--big'); if (bf) bf.dataset.flipId = k + '-frame';
    $$('.block-title', el).forEach((h) => { h.dataset.compile = 'section: ' + h.textContent.trim(); });
    return el;
  };

  const syncTree = (r) => {
    $$('.tree-node').forEach((n) => {
      const match = n.dataset.route === r.route && (!n.dataset.slug || n.dataset.slug === r.slug) && (!n.dataset.anchor || n.dataset.anchor === r.anchor);
      if (match) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
    });
    $$('.has-children').forEach((li) => {
      const head = li.querySelector(':scope > .tree-node');
      const open = head.dataset.route === r.route || (head.dataset.route === 'proyectos' && r.route === 'proyecto');
      li.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
    });
  };

  const renderTabs = () => {
    const box = $('#tabs');
    box.innerHTML = '';
    tabs.forEach((t) => {
      const b = document.createElement('div');
      b.className = 'tab' + (current && keyFor(current) === t.key ? ' is-active' : '');
      b.innerHTML = `<a class="tab-link" href="${t.hash}"${current && keyFor(current) === t.key ? ' aria-current="page"' : ''}><span class="tab-label"><span>${t.label}</span><span class="clone" aria-hidden="true">${t.label}</span></span></a><button type="button" class="tab-close" aria-label="Cerrar ${t.label}">×</button>`;
      b.querySelector('.tab-close').addEventListener('click', (e) => { e.preventDefault(); closeTab(t.key); });
      box.append(b);
    });
    try { sessionStorage.setItem('tabs', JSON.stringify(tabs)); } catch {}
  };
  const openTab = (r) => {
    const key = keyFor(r);
    const label = r.route === 'proyecto' ? (PROJECTS[r.slug] || {}).name || r.slug : LABELS[r.route] || r.route;
    if (!tabs.find((t) => t.key === key)) { tabs.push({ key, label, hash: hashFor({ ...r, anchor: undefined }) }); if (tabs.length > 6) tabs.shift(); }
    renderTabs();
  };
  const closeTab = (key) => {
    const i = tabs.findIndex((t) => t.key === key);
    if (i < 0) return;
    tabs.splice(i, 1);
    if (current && keyFor(current) === key) {
      const next = tabs[tabs.length - 1];
      if (next) location.hash = next.hash; else location.hash = '#/';
      if (!next) tabs = [];
    }
    renderTabs();
  };

  /* Reveals por capas + CompileReveal + capas de arquitectura */
  const armMotion = (el) => {
    if (!hasGSAP) return;
    const blocks = $$('.reveal', el);
    blocks.forEach((b, i) => {
      const kids = Array.from(b.children);
      if (REDUCED) return;
      const title = b.querySelector('.block-title');
      ScrollTrigger.create({
        trigger: b, scroller: panel, start: 'top 92%', once: true,
        onEnter: () => {
          if (title) { title.classList.add('is-compiling'); setTimeout(() => title.classList.remove('is-compiling'), 260); }
          gsap.fromTo(kids, { y: 18, opacity: 0, filter: 'blur(6px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.64, stagger: 0.07, ease: EASE, clearProps: 'filter,transform' });
        },
      });
    });
    const arch = $('#arch-stack', el);
    if (arch) {
      if (REDUCED) { arch.style.setProperty('--gap', '52px'); arch.style.setProperty('--spine', '1'); return; }
      gsap.set(arch, { '--gap': '14px', '--spine': 0 });
      gsap.timeline({ scrollTrigger: { trigger: arch.closest('.block'), scroller: panel, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } })
        .to(arch, { '--gap': '52px', ease: 'none' }, 0)
        .to(arch, { '--spine': 1, ease: 'none' }, 0.2);
    }
    // Paralaje de profundidad mínimo entre los marcos de proyecto y su texto.
    $$('.project-frame', el).forEach((f) => {
      if (REDUCED || isMobile()) return;
      gsap.fromTo(f, { y: 10 }, { y: -10, ease: 'none', scrollTrigger: { trigger: f, scroller: panel, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
  };

  const mountRoute = (r, opts = {}) => {
    const { sourceEl, initial, duringHero } = opts;
    const prevEl = currentEl;
    const same = current && keyFor(current) === keyFor(r);
    current = r;
    syncTree(r); openTab(r);
    if (same && !initial) { if (r.anchor) scrollToAnchor(r.anchor); return; }

    // 1. Estado FLIP de origen: nombres/hechos de la vista actual + etiqueta del árbol pulsada.
    let state = null;
    if (hasGSAP && !REDUCED && !initial) {
      const targets = [];
      const srcLbl = sourceEl && !prevEl?.contains(sourceEl) ? (sourceEl.querySelector('.tree-label, .tab-label') || sourceEl) : null;
      if (srcLbl) srcLbl.dataset.flipId = keyFor(r) + '-name';
      if (prevEl) targets.push(...$$('[data-flip-id]', prevEl).filter((n) => !srcLbl || n.dataset.flipId !== srcLbl.dataset.flipId));
      if (srcLbl) targets.push(srcLbl);
      if (targets.length) state = Flip.getState(targets, { props: 'opacity' });
    }
    // 2. La vista saliente se desenfoca y se va (fuera del flujo, sin saltos).
    if (prevEl) {
      const st = getComputedStyle(viewRoot);
      const top = panel.scrollTop;
      prevEl.style.cssText = `position:absolute;left:${st.paddingLeft};right:${st.paddingRight};top:calc(${st.paddingTop} + ${top}px);pointer-events:none;`;
      prevEl.querySelectorAll('[data-flip-id]').forEach((n) => { n.style.opacity = '0'; });
      if (hasGSAP && !REDUCED) gsap.to(prevEl, { opacity: 0, filter: 'blur(8px)', y: -10, duration: 0.24, ease: 'power2.in', onComplete: () => prevEl.remove() });
      else prevEl.remove();
      if (hasGSAP) ScrollTrigger.getAll().forEach((t) => { if (prevEl.contains(t.trigger)) t.kill(); });
    }
    // 3. Vista entrante.
    const el = buildView(r);
    currentEl = el;
    viewRoot.style.position = 'relative';
    viewRoot.append(el);
    if (lenis) lenis.scrollTo(0, { immediate: true }); else panel.scrollTop = 0;
    document.title = (LABELS[r.route] || r.route) + ' — josecoded';
    if (!initial) history.replaceState(null, '', hashFor(r));
    // 4. Morph: la cabecera nace del elemento pulsado; el resto entra con escala+desenfoque (activetheory A7).
    if (hasGSAP && !REDUCED) {
      const head = el.querySelector('.view-head');
      const rest = Array.from(el.children).filter((c) => c !== head);
      if (state) {
        Flip.from(state, { targets: $$('[data-flip-id]', el), duration: 0.52, ease: EASE_IO, scale: true, absolute: false });
      }
      if (head) gsap.fromTo(head, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.1 });
      if (!initial) gsap.fromTo(rest, { opacity: 0, scale: 0.97, filter: 'blur(8px)', y: 16 }, { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.42, delay: 0.18, stagger: 0.05, ease: EASE, clearProps: 'filter,transform' });
      else if (duringHero) gsap.fromTo(el.children, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: EASE, delay: 0.3 });
      else gsap.fromTo(el.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: EASE });
    }
    // 5. Motion de scroll y foco.
    requestAnimationFrame(() => { armMotion(el); hasGSAP && ScrollTrigger.refresh(); if (r.anchor) setTimeout(() => scrollToAnchor(r.anchor), 400); });
    if (!initial) { const h = el.querySelector('h1, .view-head') || el; h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    if (r.route === 'home') { const rp = $('#replay-hero', el); if (rp) { if (REDUCED || !hasGSAP) rp.remove(); else rp.addEventListener('click', (e) => { e.preventDefault(); replay(); }); } }
  };

  const scrollToAnchor = (id) => {
    const t = currentEl && currentEl.querySelector('#' + CSS.escape(id));
    if (!t) return;
    if (lenis) lenis.scrollTo(t, { offset: -16 }); else t.scrollIntoView();
  };

  const replay = () => {
    if (REDUCED || !hasGSAP) return;
    if (currentEl) { currentEl.remove(); currentEl = null; current = null; ScrollTrigger.getAll().forEach((t) => t.kill()); }
    gsap.set(hero, { opacity: 1 });
    gsap.set(titleEl, { clearProps: 'all' });
    gsap.set('.hero-depth', { clearProps: 'opacity' });
    gsap.set(['#hero-role', '#hero-facts li', '#hero-links', '#hero-status'], { clearProps: 'all' });
    $('#hero-seed').style.opacity = '';
    heroPlayedThisLoad = true;
    runHero();
  };

  // Navegación por clic (árbol, índice, proyectos, pestañas, menú, botones)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"], button#brand');
    if (!a) return;
    if (a.matches('[data-noop]')) { e.preventDefault(); return; }
    if (a.id === 'brand') { e.preventDefault(); if (current && current.route === 'home') replay(); else navigate({ route: 'home' }, a); return; }
    if (a.id === 'hero-skip' || a.id === 'skip' || a.id === 'replay-hero') return;
    const href = a.getAttribute('href');
    if (!href.startsWith('#/')) return;
    e.preventDefault();
    const r = a.dataset.route ? { route: a.dataset.route, slug: a.dataset.slug, anchor: a.dataset.anchor } : parseHashString(href);
    closeMenu();
    if (heroRunning) { finishHero(true, false); navigate(r, a, true); return; }
    navigate(r, a);
  });
  const navigate = (r, sourceEl, fresh) => {
    history.pushState(null, '', hashFor(r));
    mountRoute(r, fresh ? { initial: true } : { sourceEl });
  };
  window.addEventListener('popstate', () => { if (!heroRunning) mountRoute(parseHash(), {}); });

  // Teclado en el árbol: flechas entre nodos visibles
  $('#tree')?.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const nodes = $$('.tree-node', $('#tree')).filter((n) => n.offsetParent !== null && n.getBoundingClientRect().height > 0);
    const i = nodes.indexOf(document.activeElement);
    let j = i;
    if (e.key === 'ArrowDown') j = Math.min(nodes.length - 1, i + 1);
    if (e.key === 'ArrowUp') j = Math.max(0, i - 1);
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = nodes.length - 1;
    if (j !== i) { e.preventDefault(); nodes[j].focus(); }
  });

  /* ---------------- scroll suave con barra propia ---------------- */
  let lenis = null;
  const thumb = $('#scrollbar-thumb');
  const bar = $('#scrollbar');
  let hideTimer = null;
  const updateBar = () => {
    const h = panel.clientHeight, sh = panel.scrollHeight, y = panel.scrollTop;
    if (sh <= h + 1) { bar.style.opacity = '0'; return; }
    bar.style.opacity = '';
    const track = bar.clientHeight;
    const th = Math.max(28, (h / sh) * track);
    thumb.style.height = th + 'px';
    thumb.style.transform = `translateY(${(y / (sh - h)) * (track - th)}px)`;
    bar.classList.add('is-visible');
    clearTimeout(hideTimer); hideTimer = setTimeout(() => bar.classList.remove('is-visible'), 900);
  };
  if (typeof Lenis !== 'undefined' && !REDUCED && hasGSAP) {
    lenis = new Lenis({ wrapper: panel, content: viewRoot, lerp: 0.11, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', () => { ScrollTrigger.update(); updateBar(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    panel.addEventListener('scroll', updateBar, { passive: true });
  }
  if (hasGSAP) ScrollTrigger.defaults({ scroller: panel });
  window.addEventListener('resize', () => { updateBar(); hasGSAP && ScrollTrigger.refresh(); });

  /* ---------------- hoja de menú (móvil) ---------------- */
  const sheet = $('#menu-sheet');
  const menuBtn = $('#menu-open');
  let lastFocus = null;
  const openMenu = () => {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    if (hasGSAP && !REDUCED) {
      gsap.fromTo('.sheet-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo('.sheet-panel', { y: 24, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.32, stagger: 0.06, ease: EASE, clearProps: 'transform' });
    }
    sheet.querySelector('.sheet-list a').focus();
  };
  const closeMenu = () => {
    if (sheet.hidden) return;
    const done = () => { sheet.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); lastFocus && lastFocus.focus && lastFocus.focus(); };
    if (hasGSAP && !REDUCED) gsap.to(['.sheet-panel', '.sheet-backdrop'], { opacity: 0, y: 12, duration: 0.18, ease: 'power2.in', onComplete: () => { gsap.set(['.sheet-panel', '.sheet-backdrop'], { clearProps: 'all' }); done(); } });
    else done();
  };
  menuBtn.addEventListener('click', () => (sheet.hidden ? openMenu() : closeMenu()));
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeMenu(); });
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a, button', sheet).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  // Deslizar hacia abajo para cerrar
  let ty = null;
  sheet.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener('touchend', (e) => { if (ty !== null && e.changedTouches[0].clientY - ty > 60) closeMenu(); ty = null; }, { passive: true });

  /* ---------------- arranque ---------------- */
  let heroPlayedThisLoad = false;
  const initial = parseHash();
  const firstToday = store.get('hero_seen') !== today();
  if (initial.route === 'home' && firstToday && !REDUCED && hasGSAP) {
    heroPlayedThisLoad = true;
    runHero();
  } else {
    setState('ready');
    store.set('hero_seen', today());
    mountRoute(initial, { initial: true });
  }
  // Si la fuente tarda, evita el salto del título: espera a que carguen antes de medir.
  document.fonts && document.fonts.ready.then(() => hasGSAP && ScrollTrigger.refresh());
})();
