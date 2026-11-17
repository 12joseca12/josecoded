(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollDriven = CSS.supports('animation-timeline: view()');
  let speed = 1;

  const env = document.querySelector('[data-env]');
  const paintEnv = () => {
    const parts = [];
    if (!scrollDriven) parts.push('<b>Este navegador no tiene animaciones ligadas al scroll</b>: ves la alternativa estática (ábrelo en Chrome o Safari 26 para verlas).');
    if (reduce.matches) parts.push('<b>Tienes activado «reducir movimiento»</b>: ves la alternativa estática de todas.');
    env.innerHTML = parts.join(' ');
  };
  paintEnv();
  reduce.addEventListener('change', paintEnv);

  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  const setPlaying = (vp, on) => {
    const btn = vp.closest('.stage').querySelector('.play');
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.lbl').textContent = on ? 'Parar' : 'Reproducir';
  };

  const stop = (vp) => {
    if (vp._raf) cancelAnimationFrame(vp._raf);
    vp._raf = 0;
    setPlaying(vp, false);
  };

  const glide = (vp) => {
    stop(vp);
    const max = vp.scrollHeight - vp.clientHeight;
    let from = vp.scrollTop;
    const start = () => {
      const dur = 3400 / speed;
      const t0 = performance.now();
      setPlaying(vp, true);
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        vp.scrollTop = from + (max - from) * easeInOutSine(p);
        if (p < 1) vp._raf = requestAnimationFrame(step);
        else stop(vp);
      };
      vp._raf = requestAnimationFrame(step);
    };
    if (from >= max - 2) {
      reset(vp);
      from = 0;
      setTimeout(start, 280);
    } else start();
  };

  const observers = new Map();
  const arm = (vp) => {
    const stg = vp.querySelector('.stg');
    if (!stg) return;
    if (observers.has(vp)) observers.get(vp).disconnect();
    stg.classList.remove('in');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { root: vp, threshold: 0.3 });
    io.observe(stg);
    observers.set(vp, io);
  };

  const reset = (vp) => {
    stop(vp);
    vp.scrollTop = 0;
    arm(vp);
  };

  const vtJump = (vp, target) => {
    const goingUp = target.offsetTop < vp.scrollTop;
    const apply = () => { vp.scrollTop = target.offsetTop; };
    if (!document.startViewTransition || reduce.matches || root.classList.contains('static')) { apply(); return; }
    root.dataset.vt = goingUp ? 'up' : 'down';
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => { delete root.dataset.vt; });
  };

  document.querySelectorAll('.vp').forEach((vp) => {
    arm(vp);
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((ev) => vp.addEventListener(ev, () => { if (vp._raf) stop(vp); }, { passive: true }));
    const stage = vp.closest('.stage');
    const isVt = vp.classList.contains('t14');
    stage.querySelector('.play').addEventListener('click', () => {
      if (isVt) {
        const band = vp.querySelector('[data-anchor="band"]');
        vtJump(vp, vp.scrollTop < band.offsetTop - 4 ? band : vp.querySelector('[data-anchor="top"]'));
        return;
      }
      if (vp._raf) stop(vp); else glide(vp);
    });
    stage.querySelector('.reset').addEventListener('click', () => reset(vp));
    vp.querySelectorAll('[data-vt]').forEach((b) => b.addEventListener('click', () => vtJump(vp, vp.querySelector(`[data-anchor="${b.dataset.vt}"]`))));
  });

  document.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => {
    speed = Number(b.dataset.speed);
    document.querySelectorAll('[data-speed]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));

  const tog = document.querySelector('[data-static]');
  tog.addEventListener('click', () => {
    const on = !root.classList.contains('static');
    root.classList.toggle('static', on);
    tog.setAttribute('aria-pressed', String(on));
  });
})();
