const root = document.documentElement;
const body = document.body;
const PHASES = 5;
const STATIC_PHASE = 3;

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const tplPhone = document.getElementById("tpl-phone");
document.querySelectorAll('[data-mount="phone"]').forEach((mount) => {
  mount.append(tplPhone.content.cloneNode(true));
  const dev = mount.querySelector(".dev");
  if (mount.dataset.fixed !== undefined) dev.dataset.p = mount.dataset.fixed;
  else dev.setAttribute("data-live", "");
});

const stage = document.querySelector(".stage");
const phasesEl = document.querySelector(".phases");
const live = [...document.querySelectorAll("[data-live]")];
const buttons = [...document.querySelectorAll(".phase")];
const pauseBtn = document.querySelector(".pause");
const layers = [...document.querySelectorAll(".layer")];
const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
const reduceToggle = document.querySelector("[data-reduce]");

let phase = 0;
let userPaused = false;
let offscreen = false;

const isReduced = () => root.dataset.motion === "reduced";
const variant = () => body.dataset.variant;

const sweep = () => {
  if (isReduced()) return;
  stage.querySelectorAll(".scan").forEach((scan) => {
    if (!scan.offsetParent) return;
    scan.animate(
      [
        { opacity: 0, transform: "translateY(-100%)" },
        { opacity: 1, offset: 0.12 },
        { opacity: 1, offset: 0.82 },
        { opacity: 0, transform: `translateY(${scan.parentElement.clientHeight / scan.clientHeight * 100}%)` },
      ],
      { duration: parseFloat(getComputedStyle(root).getPropertyValue("--scan-dur")) || 900, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
    );
  });
};

const layoutStack = (prev, next, animate) => {
  layers.forEach((layer, i) => {
    const oldPos = (i - prev + PHASES) % PHASES;
    const newPos = (i - next + PHASES) % PHASES;
    layer.style.setProperty("--pos", newPos);
    layer.style.zIndex = String(10 - newPos);
    layer.toggleAttribute("data-front", newPos === 0);
    if (animate && newPos > oldPos) {
      layer.style.setProperty("--peel-delay", `${oldPos * 90}ms`);
      layer.removeAttribute("data-peel");
      void layer.offsetWidth;
      layer.setAttribute("data-peel", "");
    }
  });
};

layers.forEach((layer) =>
  layer.addEventListener("animationend", (event) => {
    if (event.animationName === "peel") layer.removeAttribute("data-peel");
  }),
);

const setPhase = (next) => {
  const prev = phase;
  phase = next;
  stage.dataset.phase = String(next);
  live.forEach((el) => (el.dataset.p = String(next)));
  buttons.forEach((button, i) => {
    if (i === next) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
    button.toggleAttribute("data-done", i < next);
  });
  if (prev !== next) {
    layoutStack(prev, next, !isReduced() && variant() === "c");
    sweep();
  }
};

const syncPaused = () => {
  const paused = userPaused || offscreen || document.hidden;
  stage.toggleAttribute("data-paused", paused);
  phasesEl.toggleAttribute("data-paused", paused);
};

phasesEl.addEventListener("animationend", (event) => {
  if (event.animationName !== "ring-run" || isReduced()) return;
  setPhase((phase + 1) % PHASES);
});

buttons.forEach((button, i) =>
  button.addEventListener("click", () => {
    if (i !== phase) setPhase(i);
  }),
);

pauseBtn.addEventListener("click", () => {
  userPaused = !userPaused;
  pauseBtn.setAttribute("aria-pressed", String(userPaused));
  syncPaused();
});

new IntersectionObserver(
  ([entry]) => {
    offscreen = !entry.isIntersecting;
    syncPaused();
  },
  { threshold: 0.15 },
).observe(stage);
document.addEventListener("visibilitychange", syncPaused);

const applyMotion = () => {
  const reduced = reduceQuery.matches || reduceToggle.checked;
  root.dataset.motion = reduced ? "reduced" : "full";
  if (reduced) setPhase(STATIC_PHASE);
};
reduceQuery.addEventListener("change", applyMotion);
reduceToggle.addEventListener("change", applyMotion);

const radios = [...document.querySelectorAll('input[name="variant"]')];
const applyVariant = (value) => {
  const run = () => {
    body.dataset.variant = value;
    layoutStack(phase, phase, false);
    sweep();
  };
  if (document.startViewTransition && !isReduced()) document.startViewTransition(run);
  else run();
};
const requested = new URLSearchParams(location.search).get("variant") || store.get("hero-variant");
if (requested && ["a", "b", "c"].includes(requested)) {
  body.dataset.variant = requested;
  radios.forEach((radio) => (radio.checked = radio.value === requested));
}
radios.forEach((radio) =>
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    store.set("hero-variant", radio.value);
    applyVariant(radio.value);
  }),
);
if (new URLSearchParams(location.search).get("motion") === "reduced") reduceToggle.checked = true;

const toast = document.querySelector(".toast");
let toastTimer = 0;
document.querySelectorAll("[data-soon]").forEach((button) =>
  button.addEventListener("click", () => {
    toast.textContent = "Fuera de este prototipo: se diseña en su bloque.";
    toast.setAttribute("data-show", "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.removeAttribute("data-show"), 2200);
  }),
);
addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    document.querySelector(".search").click();
  }
});

const capsule = document.querySelector(".capsule");
const ring = capsule.querySelector(".capsule__fill");
const drawRing = () => {
  const { width, height } = capsule.getBoundingClientRect();
  if (!width || !height) return;
  const inset = 1;
  const r = height / 2 - inset;
  const f = (n) => n.toFixed(2);
  const right = width - inset;
  const bottom = height - inset;
  ring.setAttribute(
    "d",
    `M${f(width / 2)} ${f(inset)}H${f(right - r)}A${f(r)} ${f(r)} 0 0 1 ${f(right)} ${f(inset + r)}A${f(r)} ${f(r)} 0 0 1 ${f(right - r)} ${f(bottom)}H${f(inset + r)}A${f(r)} ${f(r)} 0 0 1 ${f(inset)} ${f(inset + r)}A${f(r)} ${f(r)} 0 0 1 ${f(inset + r)} ${f(inset)}Z`,
  );
};
new ResizeObserver(drawRing).observe(capsule);
document.fonts?.ready.then(drawRing);

let ticking = false;
const onScroll = () => {
  ticking = false;
  const max = root.scrollHeight - innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  ring.style.setProperty("--progress", progress.toFixed(4));
  body.toggleAttribute("data-scrolled", scrollY > 8);
};
addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  },
  { passive: true },
);

layoutStack(0, 0, false);
setPhase(0);
applyMotion();
onScroll();
