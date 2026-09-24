/* josecoded · demo comparativa de estilo · comportamiento común a las tres variantes.
   Script clásico (sin módulos) para que la demo funcione con doble clic por `file://`.

   Motion implementado aquí (decisiones cerradas el 2026-09-22):
   - Bloques que suben --rise y aparecen, con hijos escalonados a --stagger, UNA SOLA VEZ. Sin pinning.
   - Paralaje solo del fondo, ~10 % del scroll (se escribe --par en rem, no en px).
   - Cifras que cuentan desde cero una vez.
   - Hover de tarjeta: canto iluminado + flecha que avanza + luz que sigue al cursor (sin elevación).
   - Transición entre páginas: barrido de glifos ("recompila").
   - Hero ligado al scroll: el objeto se deshace en glifos hacia arriba y se apaga en ~50 % del viewport,
     reversible al volver a subir; título, subtítulo y CTA suben y se atenúan a la vez.
   - prefers-reduced-motion: todo estático con fundidos de opacidad; nada de lo anterior se ejecuta.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  /* `?rm=1` fuerza el modo de movimiento reducido para poder comprobarlo sin tocar el sistema */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches ||
               new URLSearchParams(location.search).get('rm') === '1';
  if (reduce) root.classList.add('rm');
  var GLYPHS = '{}[]()<>=;:/*+-_$#@!?&|0123456789abcdefghijklmnopqrstuvwxyz';
  var rg = function () { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ============================================================ variantes */
  var VARIANTS = ['v1', 'v2', 'v3'];
  var params = new URLSearchParams(location.search);
  var current = VARIANTS.indexOf(params.get('v')) > -1 ? params.get('v') : 'v1';
  var full = params.get('full') === '1';

  root.dataset.v = current;
  if (full) document.body.setAttribute('data-full', '');

  var buttons = [].slice.call(document.querySelectorAll('.switch__b'));
  var fullLink = document.querySelector('.switch__full');

  function setVariant(v, focusBtn) {
    if (VARIANTS.indexOf(v) < 0 || v === current) return;
    current = v;
    root.dataset.v = v;                                   /* sin recargar: la posición de scroll se mantiene */
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.variant === v)); });
    if (fullLink) fullLink.href = '?v=' + v + '&full=1';
    params.set('v', v);
    history.replaceState(null, '', '?' + params.toString() + location.hash);
    /* V3 empuja algo más de verde también dentro de la escena */
    if (window.GlyphScene && window.GlyphScene.setGreen) window.GlyphScene.setGreen(v === 'v3' ? 0.26 : v === 'v2' ? 0.08 : 0.14);
    if (focusBtn) focusBtn.focus();
  }
  buttons.forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.dataset.variant === current));
    b.addEventListener('click', function () { setVariant(b.dataset.variant); });
  });
  if (fullLink) fullLink.href = '?v=' + current + '&full=1';
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var idx = ['1', '2', '3'].indexOf(e.key);
    if (idx > -1) setVariant(VARIANTS[idx]);
  });

  /* ============================================================ índices de escalonado */
  [].forEach.call(document.querySelectorAll('[data-reveal]'), function (block) {
    [].forEach.call(block.children, function (child, i) { child.style.setProperty('--i', i); });
  });

  /* ============================================================ cifras que cuentan desde cero (una vez) */
  var nf = function (dec) { return new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), fmt = nf(dec);
    if (reduce) { el.textContent = fmt.format(target); return; }
    var dur = 900, t0 = performance.now(), sweep = root.dataset.v === 'v3';
    (function step(now) {
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      var txt = fmt.format(target * e);
      /* V3: las cifras también llegan con barrido de glifos */
      if (sweep && k < 0.7) txt = txt.split('').map(function (c) { return /\d/.test(c) && Math.random() < 0.45 ? rg() : c; }).join('');
      el.textContent = txt;
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt.format(target);
    })(t0);
  }

  /* ============================================================ barrido de glifos en titulares (V3) */
  function compileReveal(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    if (reduce || root.dataset.v !== 'v3') return;
    var text = el.textContent, chars = text.split('');
    el.textContent = '';
    var spans = chars.map(function (c) {
      var s = document.createElement('span');
      if (c === ' ') { s.textContent = ' '; } else { s.textContent = rg(); s.className = 'ch--glyph'; s.dataset.c = c; }
      el.appendChild(s); return s;
    });
    var t0 = performance.now(), total = 300;
    (function step(now) {
      var k = clamp((now - t0) / total, 0, 1);
      spans.forEach(function (s, i) {
        if (!s.dataset.c) return;
        if (i / spans.length <= k) { s.textContent = s.dataset.c; s.className = ''; }
        else if (Math.random() < 0.4) s.textContent = rg();
      });
      if (k < 1) requestAnimationFrame(step);
      else spans.forEach(function (s) { if (s.dataset.c) { s.textContent = s.dataset.c; s.className = ''; } });
    })(t0);
  }

  /* ============================================================ revelado al entrar (una sola vez) */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('is-in');
      [].forEach.call(el.querySelectorAll('[data-count]'), countUp);
      var h = el.querySelector('.block__h'); if (h) compileReveal(h);
      io.unobserve(el);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  [].forEach.call(document.querySelectorAll('[data-reveal]'), function (el) { io.observe(el); });

  /* ============================================================ luz que sigue al cursor (sin elevación) */
  if (!reduce) {
    [].forEach.call(document.querySelectorAll('.card'), function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      }, { passive: true });
    });
  }

  /* ============================================================ scroll: hero, paralaje, cabecera */
  var hero = document.querySelector('.hero');
  var header = document.querySelector('.hdr');
  var ticking = false, lastProg = -1;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = scrollY;
      /* paralaje del fondo: ~10 % del scroll, expresado en rem */
      root.style.setProperty('--par', (-(y * 0.1) / 16) + 'rem');
      header.classList.toggle('is-stuck', y > 80);
      if (reduce) return;
      /* el hero se deshace a lo largo del 50 % del viewport, ligado al scroll y reversible */
      var prog = clamp(y / (innerHeight * 0.5), 0, 1);
      if (Math.abs(prog - lastProg) < 0.002) return;
      lastProg = prog;
      hero.style.setProperty('--hs', prog.toFixed(3));
      if (window.GlyphScene && window.GlyphScene.ready) window.GlyphScene.setScroll(prog);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* indicador del ciclo (tres segmentos sin palabras) */
  var cycle = [].slice.call(document.querySelectorAll('.hero__cycle i'));
  window.__onCycle = function (i) { cycle.forEach(function (el, k) { el.classList.toggle('is-on', k === i); }); };

  /* ============================================================ transición entre páginas
     1) la página actual se funde a negro  2) una cortina de glifos (como los del hero) barre desplazándose
     3) la nueva pantalla ya está detrás y se va viendo conforme la cortina pasa de largo. */
  var sweepEl = document.querySelector('.sweep');
  var main = document.getElementById('main');
  var fadeEl = document.querySelector('.fade');
  if (!fadeEl) { fadeEl = document.createElement('div'); fadeEl.className = 'fade'; document.body.appendChild(fadeEl); }

  function buildCurtain() {
    var colW = 1.1, cols = Math.ceil(100 / colW);           // columnas en % del ancho
    var html = '';
    for (var c = 0; c < cols; c++) {
      var n = 14 + Math.floor(Math.random() * 10), t = '';
      for (var i = 0; i < n; i++) t += rg() + '\n';
      var delay = (Math.random() * 120).toFixed(0), dur = (900 + Math.random() * 500).toFixed(0);
      html += '<span class="sweep__col" style="left:' + (c * colW).toFixed(2) + '%;width:' + colW.toFixed(2) +
              '%;animation-delay:' + delay + 'ms;animation-duration:' + dur + 'ms">' + t + '</span>';
    }
    sweepEl.innerHTML = html;
  }

  function glyphSweep(after) {
    if (reduce || !sweepEl) {                                 // movimiento reducido: solo fundido
      fadeEl.classList.add('is-on');
      setTimeout(function () { if (after) after(); fadeEl.classList.remove('is-on'); }, 220);
      return;
    }
    buildCurtain();
    // 1 · fundido a negro de lo que hay ahora
    fadeEl.classList.add('is-on');
    setTimeout(function () {
      // 2 · la cortina de glifos entra por arriba y cae atravesando la pantalla
      sweepEl.classList.add('is-on');
      // la nueva pantalla ya está montada detrás: el negro se retira mientras la cortina la descubre
      setTimeout(function () { if (after) after(); fadeEl.classList.remove('is-on'); }, 260);
      setTimeout(function () { sweepEl.classList.remove('is-on'); sweepEl.innerHTML = ''; }, 1500);
    }, 260);
  }
  [].forEach.call(document.querySelectorAll('[data-sweep]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); glyphSweep(function () { scrollTo({ top: 0, behavior: 'instant' }); }); });
  });

  /* ============================================================ escena: arranque */
  window.__sceneOpts = {
    canvas: document.getElementById('scene'),
    stage: document.querySelector('.hero__media'),
    onCycle: function (i) { window.__onCycle(i); }
  };
  if (reduce) {
    /* poster estático: la escena no se inicializa y la caja del hero muestra el respaldo */
    document.querySelector('.hero__media').setAttribute('data-poster', '');
  }
  /* la caja del hero puede moverse cuando terminan de cargar las fuentes: la escena se recoloca */
  function reflowScene() { if (window.GlyphScene && window.GlyphScene.resize) window.GlyphScene.resize(); }
  addEventListener('load', reflowScene);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reflowScene);
  addEventListener('orientationchange', function () { setTimeout(reflowScene, 200); });

  window.__reduceMotion = reduce;
})();
