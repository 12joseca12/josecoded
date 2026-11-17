(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scrub = CSS.supports("animation-timeline: view()");
  var env = [];
  if (!scrub) env.push("Este navegador no soporta animaciones ligadas al scroll: verás cada ejemplo estático, que es su alternativa.");
  if (reduce) env.push("Tienes activado «reducir movimiento»: verás cada ejemplo estático, que es su alternativa.");
  var envEl = document.querySelector("[data-env]");
  if (envEl) envEl.textContent = env.join(" ");

  var timed = '[data-v2="rise"], [data-v2="head"], [data-v2="lead"], [data-v2="fade"], [data-v2="piece"], [data-v2="num"]';
  function observer(margin) {
    if (!("IntersectionObserver" in window)) return null;
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("is-in"); o.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px " + margin + " 0px" });
    return o;
  }
  var io = observer("-12%"), ioPiece = observer("-30%");
  document.querySelectorAll(timed).forEach(function (el) {
    var o = el.getAttribute("data-v2") === "piece" ? ioPiece : io;
    if (!o || el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in"); else o.observe(el);
  });

  function flush(el) { return el.offsetWidth; }

  function restartTimed(stage) {
    var els = stage.querySelectorAll(timed);
    stage.classList.add("snap");
    els.forEach(function (el) { el.classList.remove("is-in"); });
    flush(stage);
    stage.classList.remove("snap");
    flush(stage);
    requestAnimationFrame(function () { els.forEach(function (el) { el.classList.add("is-in"); }); });
  }

  function restartScrub(stage) {
    clearTimeout(stage._t);
    stage.classList.add("reset");
    flush(stage);
    stage.classList.remove("reset");
    stage.classList.add("replay");
    stage._t = setTimeout(function () {
      function back() {
        removeEventListener("scroll", back);
        stage.classList.add("reset");
        flush(stage);
        stage.classList.remove("replay", "reset");
      }
      addEventListener("scroll", back, { passive: true });
    }, 2800);
  }

  function hoverDemo(stage) {
    var items = stage.querySelectorAll("[data-h]");
    clearTimeout(stage._t);
    items.forEach(function (el) { el.classList.remove("is-h"); });
    var k = 0;
    (function next() {
      if (k > 0) items[k - 1].classList.remove("is-h");
      if (k >= items.length) return;
      items[k].classList.add("is-h");
      k++;
      stage._t = setTimeout(next, 650);
    })();
  }

  function sweep(ej) {
    var stage = ej.querySelector(".g-cont");
    var r = stage.getBoundingClientRect();
    var from = scrollY + r.top - innerHeight;
    var to = scrollY + r.bottom;
    var dur = 4200, t0 = null;
    if (reduce) { stage.scrollIntoView(); return; }
    scrollTo(0, from);
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      scrollTo(0, from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function replay(ej) {
    var stage = ej.querySelector(".ej-stage");
    var kind = ej.dataset.ej;
    if (kind === "h") return sweep(ej);
    if (kind === "g") return hoverDemo(stage);
    if (reduce || !scrub) return;
    restartScrub(stage);
    if (ej.dataset.v === "ref") restartTimed(stage);
  }

  document.querySelectorAll(".ej").forEach(function (ej) {
    var segs = ej.querySelectorAll("[data-set]");
    segs.forEach(function (b) {
      b.addEventListener("click", function () {
        ej.dataset.v = b.dataset.set;
        segs.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (ej.dataset.ej !== "h") replay(ej);
      });
    });
    var rep = ej.querySelector("[data-replay]");
    if (rep) rep.addEventListener("click", function () { replay(ej); });
    var lv = ej.querySelector("[data-levels]");
    if (lv) lv.addEventListener("click", function () {
      var on = !ej.classList.contains("lv");
      ej.classList.toggle("lv", on);
      lv.setAttribute("aria-pressed", String(on));
    });
  });

  var meters = Array.prototype.map.call(document.querySelectorAll("[data-meter]"), function (m) {
    return { out: m, el: m.closest(".ej").querySelector(m.dataset.meter) };
  });
  function px(v) { var n = parseFloat(String(v).split(" ")[1] || 0); return isNaN(n) ? 0 : n; }
  var ticking = false;
  function read() {
    ticking = false;
    meters.forEach(function (m) {
      if (!m.el) return;
      var r = m.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var cs = getComputedStyle(m.el);
      if (m.el.classList.contains("g-shot")) {
        var nums = (cs.clipPath.match(/inset\(([^r)]*)/) || ["", "0"])[1].trim();
        m.out.textContent = "En directo · recorte del marco: " + (cs.clipPath === "none" ? "ninguno" : nums.replace(/\./g, ","));
      } else {
        var s = cs.scale === "none" ? 1 : parseFloat(cs.scale);
        m.out.textContent = "En directo · desplazamiento " + px(cs.translate).toFixed(1).replace(".", ",") + " px · opacidad " + parseFloat(cs.opacity).toFixed(2).replace(".", ",") + " · escala " + s.toFixed(3).replace(".", ",");
      }
    });
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  read();
})();
