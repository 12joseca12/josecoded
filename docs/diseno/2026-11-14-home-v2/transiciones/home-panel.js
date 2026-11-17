/* JS de la maqueta: panel de elección, escalonado (12), partido de títulos (06) y salto con View Transition (14).
   En producción solo pasarían el escalonado (~0,2 KB) y el salto (~0,24 KB); el panel no existe. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 47.99rem)');
  const scrollDriven = CSS.supports('animation-timeline: view()');

  const SEAMS = [
    { key: 'hp', label: 'Hero → franja', short: 'hero→franja', target: '.proof', rec: '12',
      opts: [['12', '12 Escalonado al entrar'], ['none', 'Ninguna']] },
    { key: 'fb', label: 'Franja → banda', short: 'franja→banda', target: '#trabajo', rec: '01',
      opts: [['01', '01 Cortina'], ['03', '03 Fundido a carbón'], ['02', '02 Punto que se abre'], ['07', '07 Apilado (solo escritorio)'], ['none', 'Ninguna']] },
    { key: 'bi', label: 'Dentro de la banda', short: 'interior banda', target: '#trabajo .work', rec: '08',
      opts: [['08', '08 Capas'], ['12', '12 Escalonado de los casos'], ['none', 'Ninguna']] },
    { key: 'bo', label: 'Banda → oferta', short: 'banda→oferta', target: '#oferta', rec: '04',
      opts: [['04', '04 Subida con escala'], ['09', '09 Borde curvo'], ['13', '13 Retroceso'], ['none', 'Ninguna']] },
    { key: 'ot', label: 'Tarjetas de la oferta', short: 'tarjetas oferta', target: '.offer', rec: '12',
      opts: [['12', '12 Escalonado al entrar'], ['none', 'Ninguna']] },
    { key: 'ov', label: 'Oferta → vías', short: 'oferta→vías', target: '.paths', rec: '05',
      opts: [['05', '05 Fundido cruzado'], ['04', '04 Subida con escala'], ['none', 'Ninguna']] },
    { key: 'vc', label: 'Vías → cierre', short: 'vías→cierre', target: '#contacto', rec: '11',
      opts: [['11', '11 Costura coral'], ['10', '10 Enfoque'], ['none', 'Ninguna']] },
    { key: 'h2', label: 'Títulos H2', short: 'títulos H2', target: '#h-trabajo', rec: '06',
      opts: [['06', '06 Títulos por líneas'], ['none', 'Ninguna (quietos)']] },
    { key: 'an', label: 'Anclas', short: 'anclas', target: null, rec: '14',
      opts: [['14', '14 Salto con View Transition'], ['smooth', 'Scroll suave nativo'], ['jump', 'Salto instantáneo']] },
  ];

  /* ---------- 12 Escalonado al entrar ---------- */
  const STG = [
    { key: 'hp', group: '.proof-grid', items: '.proof-grid > *' },
    { key: 'bi', group: '.work', items: '.work > .case, .work > .work-foot' },
    { key: 'ot', group: '.offer', items: '.tier, .hoy-price, .tiers-foot, .mvp', first: '.mvp' },
  ];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  const setStagger = () => {
    STG.forEach((s) => {
      const g = document.querySelector(s.group);
      const items = document.querySelectorAll(s.items);
      const on = root.dataset[s.key] === '12';
      io.unobserve(g);
      g.classList.remove('is-in');
      if (!on) {
        g.removeAttribute('data-stg');
        items.forEach((it) => { it.classList.remove('stg-i'); it.style.removeProperty('--i'); });
        return;
      }
      let n = 0;
      items.forEach((it) => {
        it.classList.add('stg-i');
        it.style.setProperty('--i', s.first && it.matches(s.first) ? 1 : n++);
      });
      g.setAttribute('data-stg', '');
      io.observe(g);
    });
  };

  /* ---------- 06 Títulos por líneas: parte cada H2 en sus líneas reales ---------- */
  const heads = Array.from(document.querySelectorAll('.sec h2, .closing h2'));
  heads.forEach((h) => { h.dataset.txt = h.textContent.trim(); });
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const splitHeads = () => {
    heads.forEach((h) => {
      const text = h.dataset.txt;
      if (root.dataset.h2 !== '06') { if (h.querySelector('.ln')) h.textContent = text; return; }
      const words = text.split(/\s+/);
      h.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
      const lines = [];
      let top = null;
      h.querySelectorAll('.w').forEach((w, i) => {
        if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
        lines[lines.length - 1].push(words[i]);
      });
      h.innerHTML = lines.map((l) => `<span class="ln"><span>${esc(l.join(' '))}</span></span>`).join(' ');
    });
  };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(splitHeads, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(splitHeads);

  /* ---------- 14 Salto con View Transition ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const t = id && document.getElementById(id);
    if (!t || root.dataset.an !== '14' || reduce.matches || !document.startViewTransition) return;
    e.preventDefault();
    root.dataset.vt = t.getBoundingClientRect().top < 0 ? 'up' : 'down';
    const vt = document.startViewTransition(() => {
      t.scrollIntoView({ behavior: 'instant', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
    vt.finished.finally(() => { delete root.dataset.vt; });
  });

  /* ---------- Panel ---------- */
  const tp = document.getElementById('tp');
  const tog = tp.querySelector('.tp-tog');
  const rowsEl = tp.querySelector('[data-rows]');
  const sumEl = tp.querySelector('[data-sum]');
  const stateEl = tp.querySelector('[data-state]');
  const env = tp.querySelector('[data-env]');

  const labelOf = (s, v) => {
    const o = s.opts.find((x) => x[0] === v);
    return v === 'none' ? 'ninguna' : o[1].replace(/\s*\(.*\)$/, '');
  };
  const summary = () => SEAMS.map((s) => `${s.short}: ${labelOf(s, root.dataset[s.key])}`).join('; ');

  const paint = () => {
    let changed = 0;
    SEAMS.forEach((s) => {
      const row = rowsEl.querySelector(`[data-row="${s.key}"]`);
      const v = root.dataset[s.key];
      row.querySelector('select').value = v;
      const diff = v !== s.rec;
      row.toggleAttribute('data-changed', diff);
      if (diff) changed++;
    });
    sumEl.textContent = summary();
    stateEl.textContent = changed ? `${changed} cambiada${changed > 1 ? 's' : ''}` : 'recomendada';
  };

  const set = (key, v) => {
    root.dataset[key] = v;
    if (key === 'h2') splitHeads();
    if (key === 'hp' || key === 'bi' || key === 'ot') setStagger();
    paint();
  };

  SEAMS.forEach((s) => {
    const row = document.createElement('div');
    row.className = 'tp-row';
    row.dataset.row = s.key;
    const id = 'tp-' + s.key;
    row.innerHTML = `<label for="${id}"><i aria-hidden="true"></i>${s.label}</label>` +
      `<select id="${id}">${s.opts.map(([v, l]) => `<option value="${v}">${l}${v === s.rec ? ' ★' : ''}</option>`).join('')}</select>` +
      (s.target ? `<button class="tp-go" type="button" aria-label="Ir a ${s.label}">Ver</button>` : `<button class="tp-go" type="button" aria-label="Ir arriba para probar las anclas">Arriba</button>`);
    row.querySelector('select').addEventListener('change', (e) => set(s.key, e.target.value));
    row.querySelector('.tp-go').addEventListener('click', () => {
      if (!s.target) { scrollTo({ top: 0, behavior: 'instant' }); return; }
      const el = document.querySelector(s.target);
      const y = el.getBoundingClientRect().top + scrollY - innerHeight * 0.92;
      scrollTo({ top: Math.max(0, y), behavior: 'instant' });
      if (narrow.matches) setOpen(false);
    });
    rowsEl.appendChild(row);
  });

  tp.querySelector('[data-reset]').addEventListener('click', () => {
    SEAMS.forEach((s) => { root.dataset[s.key] = s.rec; });
    splitHeads(); setStagger(); paint();
  });

  const copyBtn = tp.querySelector('[data-copy-sel]');
  let ct = 0;
  copyBtn.addEventListener('click', () => {
    const text = summary();
    const done = (ok) => {
      copyBtn.textContent = ok ? 'Copiada' : 'Selecciónala y copia';
      copyBtn.classList.toggle('done', ok);
      if (!ok) { const r = document.createRange(); r.selectNodeContents(sumEl); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      clearTimeout(ct); ct = setTimeout(() => { copyBtn.textContent = 'Copiar elección'; copyBtn.classList.remove('done'); }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
    else done(false);
  });

  const setOpen = (open) => {
    tp.toggleAttribute('data-closed', !open);
    tog.setAttribute('aria-expanded', String(open));
  };
  tog.addEventListener('click', () => setOpen(tp.hasAttribute('data-closed')));
  setOpen(!narrow.matches);

  const paintEnv = () => {
    const p = [];
    if (reduce.matches) p.push('Tienes «reducir movimiento» activado: ves la versión estática, que es la que verían esas personas.');
    else if (!scrollDriven) p.push('Este navegador no tiene animaciones ligadas al scroll: solo se ven 12 y 14. Ábrelo en Chrome.');
    env.textContent = p.join(' ');
  };
  reduce.addEventListener('change', paintEnv);
  paintEnv();

  splitHeads();
  setStagger();
  paint();
})();
