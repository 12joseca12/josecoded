/* josecoded · UI v3 · comportamiento de la referencia (sin dependencias, script clásico para abrir desde file://).
   Contiene los stand-ins de: HeaderScrollState, MobileMenuSheet, PageTransition, IntroFall (lado DOM), CompileReveal v3, Dialog/Sheet/Toast. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GLYPHS = '{}[]()<>=;:/*+-_$#@!?&|0123456789abcdefghijklmnopqrstuvwxyz';
  var rg = function () { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; };

  /* ---------- vistas (stand-in de rutas) + PageTransition 120 / 160 ms ---------- */
  var views = Array.prototype.slice.call(document.querySelectorAll('.view'));
  var current = 'home';
  function viewFromHash() { var h = (location.hash || '#home').slice(1); return document.getElementById('view-' + h) ? h : 'home'; }
  function showView(name, instant) {
    if (name === current && !instant) return;
    var from = document.getElementById('view-' + current), to = document.getElementById('view-' + name);
    var go = function () {
      from.classList.remove('is-active', 'is-leaving'); to.classList.add('is-active', 'is-entering'); setTimeout(function () { to.classList.remove('is-entering'); }, 200); current = name; window.scrollTo(0, 0);
      document.querySelectorAll('.refswitch button').forEach(function (b) { b.setAttribute('aria-current', b.dataset.go === name ? 'true' : 'false'); });
      window.dispatchEvent(new CustomEvent('view:change', { detail: name }));
      document.body.classList.toggle('is-admin', name.indexOf('radar') === 0);
    };
    if (instant || reduce) { go(); return; }
    from.classList.add('is-leaving'); setTimeout(go, 120);
  }
  document.querySelectorAll('.refswitch button').forEach(function (b) { b.addEventListener('click', function () { location.hash = b.dataset.go; }); });
  addEventListener('hashchange', function () { showView(viewFromHash()); });
  showView(viewFromHash(), true);

  /* ---------- SiteHeader: fondo translúcido tras 80 px ---------- */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('is-scrolled', scrollY > 80); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- MobileMenuSheet ---------- */
  var menu = document.getElementById('menu'), menuOpen = document.getElementById('menu-open'), menuClose = document.getElementById('menu-close');
  function openMenu() { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('is-open'); }); menuOpen.setAttribute('aria-expanded', 'true'); menuClose.focus(); document.body.style.overflow = 'hidden'; }
  function closeMenu() { menu.classList.remove('is-open'); menuOpen.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; setTimeout(function () { menu.hidden = true; }, 160); menuOpen.focus(); }
  menuOpen.addEventListener('click', openMenu); menuClose.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- utilidades de texto: partir en caracteres conservando layout y accesibilidad ---------- */
  function leafTargets(el) {
    if (el.matches('ul, .ctas, .nav__right')) return Array.prototype.slice.call(el.querySelectorAll('a, button'));
    return [el];
  }
  function splitChars(target) {
    var text = target.textContent.replace(/\s+/g, ' ').trim();
    var wrap = document.createElement('span'); wrap.setAttribute('aria-hidden', 'true');
    while (target.firstChild) wrap.appendChild(target.firstChild);
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    target.appendChild(sr); target.appendChild(wrap);
    var out = [];
    var walk = function (n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) {
          var flex = /flex|grid/.test(getComputedStyle(c.parentElement).display);
          var frag = flex ? document.createElement('span') : document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (word) {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            Array.prototype.forEach.call(word, function (ch) { var sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ch; sp.dataset.ch = ch; w.appendChild(sp); out.push(sp); });
            frag.appendChild(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && !c.classList.contains('sr-only')) walk(c);
      });
    };
    walk(wrap); return out;
  }

  /* ---------- IntroFall (lado DOM): caída, aterrizaje con destello, salto con cualquier interacción ---------- */
  var html = document.documentElement;
  if (html.dataset.intro === 'pending' && current === 'home' && !reduce) {
    var targets = []; document.querySelectorAll('[data-fall]').forEach(function (el) { targets = targets.concat(leafTargets(el)); });
    var shells = Array.prototype.slice.call(document.querySelectorAll('#view-home .badge, #view-home .btn'));
    var drops = [];
    var vh = innerHeight;
    targets.forEach(function (t) {
      var shell = t.closest('.badge, .btn');
      splitChars(t).forEach(function (el) {
        var start = -(0.35 + Math.random() * 0.75) * vh, landT = 0.4 + Math.random() * 0.8;
        drops.push({ el: el, shell: shell, y: start, speed: -start / landT, landed: false, flash: 0 });
      });
    });
    shells.forEach(function (sh) { sh.classList.add('is-forming'); });
    drops.forEach(function (d) { d.el.style.transform = 'translateY(' + d.y + 'px)'; d.el.classList.add('is-falling'); d.el.textContent = rg(); d.el.style.willChange = 'transform'; });
    delete html.dataset.intro;
    var started = false, done = false, lastT = 0, t0 = 0;
    function finishAll() {
      if (done) return; done = true;
      drops.forEach(function (d) { d.el.style.transform = ''; d.el.style.willChange = ''; d.el.classList.remove('is-falling', 'is-wet'); d.el.textContent = d.el.dataset.ch; });
      shells.forEach(function (sh) { sh.classList.remove('is-forming'); });
      if (window.__scene) window.__scene.skipIntro();
    }
    function tick(now) {
      if (done) return;
      var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; var pending = 0;
      drops.forEach(function (d) {
        if (d.landed) { if (d.flash > 0) { d.flash -= dt; if (d.flash <= 0) { d.el.classList.remove('is-wet'); d.el.textContent = d.el.dataset.ch; d.el.style.willChange = ''; } } return; }
        pending++; d.y += d.speed * dt;
        if (d.y >= 0) { d.y = 0; d.landed = true; d.flash = 0.14 + Math.random() * 0.16; d.el.classList.remove('is-falling'); d.el.classList.add('is-wet'); d.el.style.transform = ''; d.el.textContent = rg();
          if (d.shell && !drops.some(function (o) { return o.shell === d.shell && !o.landed; })) d.shell.classList.remove('is-forming'); }
        else { d.el.style.transform = 'translateY(' + d.y + 'px)'; if (Math.random() < 0.3) d.el.textContent = rg(); }
      });
      if (!pending && drops.every(function (d) { return d.flash <= 0; })) { done = true; return; }
      requestAnimationFrame(tick);
    }
    function start() {
      if (started) return; started = true; t0 = performance.now(); lastT = t0;
      if (window.__scene && window.__scene.mode === 'scene') window.__scene.playIntro(t0);
      requestAnimationFrame(tick);
    }
    /* sincronía: espera a la escena como máximo 1.200 ms (diseño técnico §1.6.4) */
    var wait = setTimeout(start, 1200);
    if (window.__scene && window.__scene.ready) { clearTimeout(wait); start(); }
    else addEventListener('scene:ready', function () { clearTimeout(wait); start(); }, { once: true });
    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) { addEventListener(ev, function () { if (!started) { clearTimeout(wait); start(); } finishAll(); }, { once: true, passive: true }); });
  } else { delete html.dataset.intro; }

  /* ---------- CompileReveal v3: los h2 resuelven sus glifos de izquierda a derecha en ≤ 300 ms, una vez ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!reduce && 'IntersectionObserver' in window) {
    reveals.forEach(function (h) { h.__chars = splitChars(h); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var chars = e.target.__chars, n = chars.length, start = performance.now();
        chars.forEach(function (c) { c.classList.add('is-glyph'); c.textContent = rg(); });
        var step = function (now) {
          var t = now - start, pending = false;
          chars.forEach(function (c, i) {
            if (c.dataset.done) return;
            if (t >= i * 300 / n) { c.dataset.done = '1'; c.classList.remove('is-glyph'); c.classList.add('is-wet'); c.textContent = c.dataset.ch; setTimeout(function () { c.classList.remove('is-wet'); }, 140); }
            else { pending = true; if (Math.random() < 0.35) c.textContent = rg(); }
          });
          if (pending) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    reveals.forEach(function (h) { io.observe(h); });
  }

  /* ---------- Dialog / Sheet / Toast ---------- */
  var lastFocus = null;
  function openOverlay(el) { lastFocus = document.activeElement; el.hidden = false; requestAnimationFrame(function () { el.classList.add('is-open'); }); var f = el.querySelector('button, a, input, select, textarea'); if (f) f.focus(); }
  function closeOverlay(el) { el.classList.remove('is-open'); setTimeout(function () { el.hidden = true; }, 220); if (lastFocus) lastFocus.focus(); }
  var confirm = document.getElementById('confirm'), snooze = document.getElementById('snooze');
  document.querySelectorAll('[data-confirm]').forEach(function (b) { b.addEventListener('click', function () { openOverlay(confirm); }); });
  document.querySelectorAll('[data-snooze]').forEach(function (b) { b.addEventListener('click', function () { openOverlay(snooze); }); });
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { var o = b.closest('.overlay, .sheet'); closeOverlay(o); if (b.dataset.toast) toast(b.dataset.toast); }); });
  [confirm, snooze].forEach(function (o) { o.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(o); }); });
  confirm.addEventListener('click', function (e) { if (e.target === confirm) closeOverlay(confirm); });
  document.getElementById('confirm-send').addEventListener('click', function () {
    var b = this; b.classList.add('is-loading'); b.setAttribute('aria-busy', 'true');
    setTimeout(function () { b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); closeOverlay(confirm); toast('Enviada 09:13 · recibo 4F7Q', true); }, 1200);
  });
  var toastEl = document.getElementById('toast'), toastText = document.getElementById('toast-text'), toastUndo = document.getElementById('toast-undo'), toastTimer;
  function toast(text, noUndo) { toastText.textContent = text; toastUndo.hidden = !!noUndo; toastEl.hidden = false; clearTimeout(toastTimer); if (noUndo) toastTimer = setTimeout(function () { toastEl.hidden = true; }, 6000); }
  toastUndo.addEventListener('click', function () { toastEl.hidden = true; });

  /* ---------- pequeños estados interactivos: switch, chips, tabs ---------- */
  document.querySelectorAll('[role="switch"]').forEach(function (s) { s.addEventListener('click', function () { var on = s.getAttribute('aria-checked') !== 'true'; s.setAttribute('aria-checked', on); var l = s.querySelector('#pause-label'); if (l) l.textContent = on ? 'Radar activo' : 'En pausa hasta el 26 sep'; }); });
  document.querySelectorAll('.counters .chip').forEach(function (c) { c.addEventListener('click', function () { c.parentElement.querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); }); c.setAttribute('aria-pressed', 'true'); }); });
  document.querySelectorAll('.kit .chip[aria-pressed], .sheet .chip[aria-pressed]').forEach(function (c) { c.addEventListener('click', function () { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); }); });
  document.querySelectorAll('[role="tablist"]').forEach(function (tl) { tl.querySelectorAll('[role="tab"]').forEach(function (t) { t.addEventListener('click', function () { tl.querySelectorAll('[role="tab"]').forEach(function (o) { o.setAttribute('aria-selected', 'false'); }); t.setAttribute('aria-selected', 'true'); }); }); });
})();
