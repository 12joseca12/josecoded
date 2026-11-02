/* josecoded · ref/crm · JS mínimo del prototipo.
   Producto: abrir hojas (dialog nativo), pestañas ARIA, copiar, interruptores y los pasos de K4.
   Prototipo: rol por ?role=admin|closer y variantes (README §4) guardadas en localStorage. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const params = new URLSearchParams(location.search);

  /* ---------- rol y variantes ---------- */
  const role = params.get('role') === 'closer' ? 'closer' : 'admin';
  root.dataset.role = role;
  if (params.has('shot')) root.classList.add('shot');

  const PREFS = { density: 'comfortable', overdue: 'danger', title: 'v7', mbar: '4', k3: 'split' };
  const read = (k) => { try { return localStorage.getItem('crm.' + k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem('crm.' + k, v); } catch { /* sin almacenamiento */ } };
  for (const k of Object.keys(PREFS)) {
    root.dataset[k] = params.get(k) || read(k) || PREFS[k];
  }

  /* los enlaces internos conservan el rol */
  for (const a of document.querySelectorAll('a[href$=".html"], a[href*=".html?"], a[href*=".html#"]')) {
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) continue;
    if (role === 'closer') url.searchParams.set('role', 'closer');
    a.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
  }

  /* panel del prototipo */
  for (const input of document.querySelectorAll('.proto input[type="radio"]')) {
    const k = input.name;
    if (k === 'role') input.checked = input.value === role;
    else input.checked = root.dataset[k] === input.value;
    input.addEventListener('change', () => {
      if (k === 'role') {
        const url = new URL(location.href);
        if (input.value === 'closer') url.searchParams.set('role', 'closer');
        else url.searchParams.delete('role');
        location.href = url.toString();
        return;
      }
      root.dataset[k] = input.value;
      write(k, input.value);
    });
  }

  /* ---------- aviso breve (role=status) ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  const say = (text) => {
    if (!toast) return;
    toast.querySelector('span').textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };

  /* ---------- hojas y diálogos ---------- */
  const openDialog = (id, opener) => {
    const d = document.getElementById(id);
    if (!d || typeof d.showModal !== 'function') return;
    d.showModal();
    d._opener = opener || null;
  };
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); openDialog(opener.dataset.open, opener); return; }
    const missing = e.target.closest('[data-missing]');
    if (missing) { e.preventDefault(); say('Pantalla fuera de este prototipo'); return; }
    const sayer = e.target.closest('[data-say]');
    if (sayer) {
      say(sayer.dataset.say);
      const d = sayer.closest('dialog');
      if (d && sayer.hasAttribute('data-close')) d.close();
    }
  });
  for (const d of document.querySelectorAll('dialog')) {
    /* clic en el velo cierra (el velo es el propio dialog fuera de su caja) */
    d.addEventListener('click', (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) d.close();
    });
    d.addEventListener('close', () => { if (d._opener) d._opener.focus(); });
  }
  if (params.get('open')) requestAnimationFrame(() => openDialog(params.get('open')));

  /* ---------- pestañas (patrón ARIA con flechas, Inicio y Fin) ---------- */
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls'))?.classList.toggle('is-active', on);
      }
      if (focus) tab.focus();
      if (list.dataset.param) {
        const url = new URL(location.href);
        url.searchParams.set(list.dataset.param, tab.dataset.value);
        history.replaceState(null, '', url);
      }
    };
    const wanted = list.dataset.param && params.get(list.dataset.param);
    select(tabs.find((t) => t.dataset.value === wanted) || tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0], false);
    list.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) select(t, false); });
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length], true);
    });
  }

  /* ---------- copiar ---------- */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch { /* sin permiso: el aviso basta en el prototipo */ }
    say(b.dataset.copied || 'Copiado');
  });

  /* ---------- interruptores (role=switch) y contador de cambios ---------- */
  const dirty = document.querySelector('[data-dirty]');
  let changes = 0;
  document.addEventListener('click', (e) => {
    const s = e.target.closest('button[role="switch"]');
    if (!s || s.disabled) return;
    s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true'));
    if (dirty) {
      changes += 1;
      dirty.hidden = false;
      dirty.querySelector('b').textContent = changes === 1 ? '1 cambio sin guardar' : changes + ' cambios sin guardar';
    }
  });

  /* ---------- selector segmentado con aria-pressed ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.seg button[aria-pressed]');
    if (!b) return;
    for (const o of b.parentElement.querySelectorAll('button[aria-pressed]')) o.setAttribute('aria-pressed', String(o === b));
  });
  for (const t of document.querySelectorAll('.chip-toggle[aria-pressed]')) {
    t.addEventListener('click', () => t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')));
  }

  /* ---------- K4: pasos ---------- */
  const stepsRoot = document.querySelector('[data-steps]');
  if (stepsRoot) {
    const marks = [...stepsRoot.querySelectorAll('.steps li')];
    const panels = [...stepsRoot.querySelectorAll('.step-panel')];
    const go = (n, focus) => {
      marks.forEach((m, i) => {
        if (i + 1 === n) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current');
        m.toggleAttribute('data-done', i + 1 < n);
      });
      panels.forEach((p, i) => p.classList.toggle('is-active', i + 1 === n));
      if (focus) panels[n - 1].querySelector('h2')?.focus();
    };
    go(Number(params.get('step')) || 2, false);
    stepsRoot.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step-go]');
      if (b) go(Number(b.dataset.stepGo), true);
    });
  }

  /* ---------- K7: vincular Telegram ---------- */
  for (const card of document.querySelectorAll('.tg')) {
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tg-go]');
      if (b) card.dataset.state = b.dataset.tgGo;
    });
  }

  /* ---------- K3: compositor de presupuestos ---------- */
  const quote = document.querySelector('[data-quote]');
  if (quote) {
    const euro = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    const recalc = () => {
      let sub = 0;
      for (const line of quote.querySelectorAll('.quote-line')) {
        const q = Number(line.querySelector('output').value);
        const total = q * Number(line.dataset.price);
        line.querySelector('.amount').textContent = euro(total);
        sub += total;
      }
      const discount = role === 'admin' ? Number(quote.querySelector('[name="discount"]')?.value || 0) : 0;
      quote.querySelector('[data-sub]').textContent = euro(sub);
      quote.querySelector('[data-disc]').textContent = discount ? '− ' + euro(discount) : euro(0);
      quote.querySelector('[data-total]').textContent = euro(Math.max(0, sub - discount));
    };
    quote.addEventListener('click', (e) => {
      const b = e.target.closest('[data-qty]');
      if (!b) return;
      const out = b.closest('.stepper').querySelector('output');
      out.value = Math.max(1, Number(out.value) + Number(b.dataset.qty));
      recalc();
    });
    quote.addEventListener('input', recalc);
    recalc();
  }

  /* ---------- atajo «/» para buscar ---------- */
  const search = document.querySelector('[data-hotkey="/"]');
  if (search) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return;
      const t = e.target;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      search.focus();
    });
  }
})();
