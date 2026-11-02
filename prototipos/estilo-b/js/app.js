const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const wide = matchMedia("(min-width: 64rem)");
const status = document.querySelector("[data-status]");
const sections = [...document.querySelectorAll("[data-section]")];
const scrollBehavior = () => (reduced.matches ? "auto" : "smooth");

const announce = (text) => {
  status.textContent = "";
  requestAnimationFrame(() => {
    status.textContent = text;
  });
};

const closeDialogs = () => {
  for (const dialog of document.querySelectorAll("dialog[open]")) dialog.close();
};

const blockQuery = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 64rem) and (min-height: 37.5rem)");

const blocks = (() => {
  const quiet = 220;
  const merge = 0.12;
  const tall = 1.08;
  const ignoreKeys = 'input, textarea, select, button, summary, label, [contenteditable=""], [contenteditable="true"], [role="listbox"], [role="radiogroup"], [role="slider"], .states';
  let stops = [];
  let frame = 0;
  let moving = false;
  let lockedUntil = 0;
  let settling = false;
  let lastTime = 0;
  let lastAbs = 0;
  let measureFrame = 0;

  const enabled = () => blockQuery.matches && !reduced.matches;
  const active = () => enabled() && !document.querySelector("dialog[open]");
  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);
  const topOf = (element) => element.getBoundingClientRect().top + scrollY;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const measure = () => {
    const vh = innerHeight;
    const max = maxScroll();
    const shown = sections.filter((section) => section.getClientRects().length);
    const next = [];
    shown.forEach((section, index) => {
      const top = topOf(section);
      const end = index < shown.length - 1 ? topOf(shown[index + 1]) : root.scrollHeight;
      if (end - top > vh * tall) {
        next.push({ y: Math.min(top, max), inside: true });
        next.push({ y: Math.min(end - vh, max), inside: false });
      } else {
        next.push({ y: Math.min(top, max), inside: false });
      }
    });
    next.push({ y: max, inside: false });
    next.sort((a, b) => a.y - b.y);
    stops = [];
    for (const stop of next) {
      const last = stops.at(-1);
      if (last && stop.y - last.y < vh * merge) {
        if (last.y > 0) stops[stops.length - 1] = { y: stop.y, inside: stop.inside };
      } else stops.push({ ...stop, y: Math.round(stop.y) });
    }
  };

  const schedule = () => {
    cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measure);
  };

  const stop = () => {
    if (!moving) return;
    cancelAnimationFrame(frame);
    moving = false;
  };

  const glide = (to) => {
    cancelAnimationFrame(frame);
    const from = scrollY;
    const target = Math.round(Math.max(0, Math.min(to, maxScroll())));
    const distance = Math.abs(target - from);
    if (!enabled() || distance < 2) {
      scrollTo({ top: target, behavior: "instant" });
      moving = false;
      return;
    }
    const vh = innerHeight;
    const duration = distance < vh * 0.35 ? 300 : Math.min(1100, 640 + 160 * (distance / vh));
    const start = performance.now();
    moving = true;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      scrollTo({ top: from + (target - from) * ease(t), behavior: "instant" });
      if (t < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      moving = false;
      settling = true;
      lockedUntil = performance.now() + quiet;
    };
    frame = requestAnimationFrame(tick);
  };

  const plan = (dir, delta) => {
    const y = scrollY;
    if (dir > 0) {
      const index = stops.findLastIndex((item) => item.y <= y + 1);
      const here = stops[index];
      const next = stops[index + 1];
      if (!next) return null;
      if (here?.inside) return y + delta >= next.y - 1 ? next.y : null;
      return next.y;
    }
    const index = stops.findLastIndex((item) => item.y < y - 1);
    const above = stops[index];
    if (!above) return null;
    if (above.inside) return y + delta <= above.y + 1 ? above.y : null;
    return above.y;
  };

  const scrollsInside = (element, delta) => {
    for (let node = element; node && node !== document.body && node !== root; node = node.parentElement) {
      if (!/(auto|scroll)/.test(getComputedStyle(node).overflowY)) continue;
      if (node.scrollHeight <= node.clientHeight + 1) continue;
      if (delta > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 0) return true;
    }
    return false;
  };

  const onWheel = (event) => {
    if (!active() || event.ctrlKey || event.defaultPrevented) return;
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    if (!delta || Math.abs(event.deltaX) > Math.abs(delta)) return;
    if (scrollsInside(event.target, delta)) return;
    const now = performance.now();
    const abs = Math.abs(delta);
    const inertia = settling && now - lastTime < 500 && abs <= lastAbs * 1.05;
    lastTime = now;
    lastAbs = abs;
    if (moving || now < lockedUntil || inertia) {
      event.preventDefault();
      if (!moving) lockedUntil = now + quiet;
      return;
    }
    settling = false;
    const target = plan(Math.sign(delta), delta);
    if (target === null) return;
    event.preventDefault();
    glide(target);
  };

  const onKey = (event) => {
    if (!active() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest(ignoreKeys)) return;
    const steps = { PageDown: 1, PageUp: -1, ArrowDown: 1, ArrowUp: -1, " ": event.shiftKey ? -1 : 1 };
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      glide(event.key === "Home" ? 0 : maxScroll());
      return;
    }
    if (!(event.key in steps)) return;
    if (moving) {
      event.preventDefault();
      return;
    }
    const dir = steps[event.key];
    const delta = dir * (event.key.startsWith("Arrow") ? 40 : innerHeight * 0.875);
    const target = plan(dir, delta);
    if (target === null) return;
    event.preventDefault();
    glide(target);
  };

  const yFor = (element) => {
    if (element.matches("[data-section]")) {
      const top = Math.min(topOf(element), maxScroll());
      const near = stops.reduce((best, item) => (Math.abs(item.y - top) < Math.abs(best.y - top) ? item : best), stops[0] ?? { y: top });
      return Math.abs(near.y - top) < innerHeight * merge ? near.y : top;
    }
    return topOf(element) - parseFloat(getComputedStyle(root).fontSize) * 5.75;
  };

  addEventListener("wheel", onWheel, { passive: false });
  addEventListener("keydown", onKey);
  addEventListener("pointerdown", stop, { passive: true });
  addEventListener("resize", schedule);
  new ResizeObserver(schedule).observe(document.body);
  blockQuery.addEventListener("change", schedule);
  measure();

  return { enabled, glide, yFor, measure };
})();

const goTo = (id, { focus = true } = {}) => {
  const target = document.getElementById(id);
  if (!target) return;
  if (blocks.enabled()) blocks.glide(blocks.yFor(target));
  else target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
  if (focus) target.focus({ preventScroll: true });
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented) return;
  const id = decodeURIComponent(link.hash.slice(1));
  if (!id || !document.getElementById(id)) return;
  event.preventDefault();
  if (link.hasAttribute("data-reset-state")) applyState("normal");
  closeDialogs();
  goTo(id);
});

let current = "";
const indicator = document.querySelector(".nav-a__indicator");

const moveIndicator = () => {
  if (!indicator) return;
  const link = document.querySelector(".nav-a__links a[aria-current]");
  if (!link || !wide.matches) {
    indicator.style.opacity = "0";
    indicator.dataset.hidden = "";
    return;
  }
  if (indicator.hasAttribute("data-hidden")) {
    indicator.setAttribute("data-instant", "");
    indicator.removeAttribute("data-hidden");
  }
  indicator.style.width = `${link.offsetWidth}px`;
  indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  indicator.style.opacity = "1";
  if (indicator.hasAttribute("data-instant")) {
    indicator.getBoundingClientRect();
    requestAnimationFrame(() => indicator.removeAttribute("data-instant"));
  }
};

const setCurrent = (id) => {
  if (id === current) return;
  current = id;
  for (const link of document.querySelectorAll("[data-spy] a")) {
    if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
  moveIndicator();
};

const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id);
  },
  { rootMargin: "-42% 0px -56% 0px" },
);
sections.forEach((section) => spy.observe(section));

const progressFallback = !CSS.supports("animation-timeline: scroll()");
let ticking = false;
let scrolled = null;
let condensed = null;

const onScroll = () => {
  ticking = false;
  const y = scrollY;
  const max = root.scrollHeight - innerHeight;
  const nextScrolled = y > 8;
  const nextCondensed = y > innerHeight * 0.3;
  if (nextScrolled !== scrolled) {
    scrolled = nextScrolled;
    root.toggleAttribute("data-scrolled", scrolled);
  }
  if (nextCondensed !== condensed) {
    condensed = nextCondensed;
    root.toggleAttribute("data-condensed", condensed);
  }
  if (progressFallback) root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
  if (max - y < 4 && sections.length) setCurrent(sections.at(-1).id);
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
onScroll();

const capsule = document.querySelector(".nav-a__bar");
const ring = capsule.querySelector(".capsule-ring__fill");

const drawRing = () => {
  const { width, height } = capsule.getBoundingClientRect();
  if (!width || !height) return;
  const inset = 1;
  const r = height / 2 - inset;
  const left = inset;
  const right = width - inset;
  const top = inset;
  const bottom = height - inset;
  const f = (n) => n.toFixed(2);
  ring.setAttribute(
    "d",
    `M${f(width / 2)} ${f(top)}H${f(right - r)}A${f(r)} ${f(r)} 0 0 1 ${f(right)} ${f(top + r)}A${f(r)} ${f(r)} 0 0 1 ${f(right - r)} ${f(bottom)}H${f(left + r)}A${f(r)} ${f(r)} 0 0 1 ${f(left)} ${f(top + r)}A${f(r)} ${f(r)} 0 0 1 ${f(left + r)} ${f(top)}Z`,
  );
};

new ResizeObserver(drawRing).observe(capsule);
drawRing();

capsule.addEventListener("transitionend", (event) => {
  if (event.propertyName === "max-width") moveIndicator();
});

let resizeFrame = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(moveIndicator);
});
document.fonts?.ready.then(() => {
  moveIndicator();
  drawRing();
  blocks.measure();
});
addEventListener("load", blocks.measure);

const dialogs = [...document.querySelectorAll("dialog")];

const openDialog = (dialog) => {
  if (!dialog || dialog.open) return;
  closeDialogs();
  dialog.showModal();
  for (const control of document.querySelectorAll(`[aria-controls="${dialog.id}"]`)) control.setAttribute("aria-expanded", "true");
  dialog.dispatchEvent(new Event("opened"));
};

for (const dialog of dialogs) {
  dialog.addEventListener("close", () => {
    for (const control of document.querySelectorAll(`[aria-controls="${dialog.id}"]`)) control.setAttribute("aria-expanded", "false");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  for (const button of dialog.querySelectorAll("[data-close]")) button.addEventListener("click", () => dialog.close());
}

for (const opener of document.querySelectorAll("[data-opens]")) {
  opener.addEventListener("click", () => openDialog(document.getElementById(opener.dataset.opens)));
}

wide.addEventListener("change", () => {
  for (const dialog of document.querySelectorAll(".sheet[open]")) dialog.close();
  moveIndicator();
});

const contactForm = document.querySelector("[data-contact]");

const startContact = () => {
  goTo("contacto", { focus: false });
  const field = contactForm && !contactForm.hidden ? contactForm.querySelector("input") : document.querySelector("[data-contact-done]");
  field?.focus({ preventScroll: true });
};

document.addEventListener("click", (event) => {
  const cta = event.target.closest("[data-cta]");
  if (!cta || cta.disabled || cta.getAttribute("aria-busy") === "true") return;
  cta.setAttribute("aria-busy", "true");
  announce("Abriendo el formulario de contacto…");
  setTimeout(() => {
    cta.removeAttribute("aria-busy");
    closeDialogs();
    startContact();
  }, 750);
});

const emailField = contactForm.querySelector('input[type="email"]');
const emailError = contactForm.querySelector(".cfield__error");
const contactSubmit = contactForm.querySelector('[type="submit"]');
const contactDone = document.querySelector("[data-contact-done]");

const setEmailError = (invalid) => {
  emailField.setAttribute("aria-invalid", String(invalid));
  emailError.hidden = !invalid;
};

emailField.addEventListener("input", () => {
  if (emailField.getAttribute("aria-invalid") === "true" && emailField.validity.valid && emailField.value.trim()) setEmailError(false);
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (contactSubmit.disabled || contactSubmit.getAttribute("aria-busy") === "true") return;
  const valid = emailField.value.trim() !== "" && emailField.validity.valid;
  setEmailError(!valid);
  if (!valid) {
    emailField.focus();
    announce("Revisa el email.");
    return;
  }
  contactSubmit.setAttribute("aria-busy", "true");
  announce("Enviando…");
  setTimeout(() => {
    contactSubmit.removeAttribute("aria-busy");
    contactForm.hidden = true;
    contactDone.hidden = false;
    contactDone.focus();
    announce("Mensaje enviado.");
  }, 1400);
});

document.querySelector("[data-contact-reset]").addEventListener("click", () => {
  contactForm.reset();
  setEmailError(false);
  contactDone.hidden = true;
  contactForm.hidden = false;
  contactForm.querySelector("input").focus();
});

document.querySelector("[data-hero-field]").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.querySelector("input").focus();
});

const projectIndex = [...document.querySelectorAll("[data-pindex]")];
const projectSpy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const item of projectIndex) item.toggleAttribute("aria-current", item.dataset.pindex === entry.target.id);
    }
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
document.querySelectorAll(".pcard").forEach((card) => projectSpy.observe(card));

const visual = document.querySelector(".hero-visual");
const smil = [...visual.querySelectorAll("svg")].filter((svg) => svg.querySelector("animate"));
let onscreen = true;

const syncPlayback = () => {
  const paused = document.hidden || !onscreen || reduced.matches;
  visual.toggleAttribute("data-paused", paused);
  for (const svg of smil) {
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
    if (reduced.matches) svg.setCurrentTime(0);
  }
};

new IntersectionObserver(([entry]) => {
  onscreen = entry.isIntersecting;
  syncPlayback();
}).observe(visual);
document.addEventListener("visibilitychange", syncPlayback);
reduced.addEventListener("change", syncPlayback);
syncPlayback();

if (!CSS.supports("animation-timeline: view()") && !reduced.matches) {
  root.classList.add("io-reveal");
  const revealer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-in", "");
        revealer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  document.querySelectorAll(".reveal").forEach((element) => revealer.observe(element));
}

const statesPanel = document.querySelector(".states");
const statesToggle = statesPanel.querySelector(".states__toggle");
const statesList = statesPanel.querySelector(".states__list");
const heroCopy = document.querySelector(".hero-copy");
const heroField = document.querySelector("[data-hero-field]");
const notFound = document.querySelector("[data-not-found]");
const ghost = document.querySelector("[data-ghost]");
const loadingRegions = [visual, document.querySelector("[data-loading-region]")];

const setStatesOpen = (open) => {
  statesList.hidden = !open;
  statesToggle.setAttribute("aria-expanded", String(open));
  if (open) statesList.querySelector("input:checked").focus();
};

statesToggle.addEventListener("click", () => setStatesOpen(statesList.hidden));
statesPanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !statesList.hidden) {
    setStatesOpen(false);
    statesToggle.focus();
  }
});

function applyState(state) {
  document.body.dataset.state = state;
  const radio = statesList.querySelector(`input[value="${state}"]`);
  if (radio) radio.checked = true;
  for (const region of loadingRegions) region?.setAttribute("aria-busy", String(state === "loading"));
  heroField.hidden = state !== "error";
  notFound.hidden = state !== "empty";
  heroCopy.hidden = state === "empty";
  for (const cta of document.querySelectorAll("[data-cta]")) cta.disabled = state === "disabled";
  contactSubmit.disabled = state === "disabled";
  if (state === "disabled") ghost.setAttribute("aria-disabled", "true");
  else ghost.removeAttribute("aria-disabled");
  if (state === "error") {
    emailField.value = "jose.gmail.com";
    setEmailError(true);
  } else if (emailField.value === "jose.gmail.com") {
    emailField.value = "";
    setEmailError(false);
  }
  if (state === "loading") announce("Cargando proyectos…");
  blocks.measure();
}

statesPanel.addEventListener("change", (event) => {
  const next = event.target.value;
  if (document.startViewTransition && !reduced.matches) document.startViewTransition(() => applyState(next));
  else applyState(next);
});

ghost.addEventListener("click", (event) => {
  if (ghost.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

const initialState = new URLSearchParams(location.search).get("estado");
if (initialState && statesList.querySelector(`input[value="${initialState}"]`)) applyState(initialState);
