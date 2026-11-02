const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const wide = matchMedia("(min-width: 64rem)");
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform ?? navigator.platform ?? "");
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

const goTo = (id, { focus = true } = {}) => {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
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
const pathLabels = [...document.querySelectorAll("[data-path]")];
const indicator = document.querySelector(".nav-a__indicator");

const moveIndicator = () => {
  if (!indicator) return;
  const link = document.querySelector(".nav-a__links a[aria-current]");
  if (!link || root.dataset.nav !== "a" || !wide.matches) {
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
  for (const label of pathLabels) label.textContent = id === "inicio" ? "~" : `~/${id}`;
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

document.querySelector(".nav-a__bar")?.addEventListener("transitionend", (event) => {
  if (event.propertyName === "max-width") moveIndicator();
});

const placeTicks = () => {
  const max = root.scrollHeight - innerHeight;
  if (max <= 0) return;
  for (const box of document.querySelectorAll("[data-ticks]")) {
    box.replaceChildren(
      ...sections.slice(1).map((section) => {
        const tick = document.createElement("span");
        const top = section.getBoundingClientRect().top + scrollY;
        tick.style.setProperty("--x", `${Math.min(100, (top / max) * 100).toFixed(2)}%`);
        return tick;
      }),
    );
  }
};

let resizeFrame = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    placeTicks();
    moveIndicator();
  });
});
document.fonts?.ready.then(() => {
  placeTicks();
  moveIndicator();
});
addEventListener("load", placeTicks);

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

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText("hola@josecoded.com");
    announce("Email copiado: hola@josecoded.com");
  } catch {
    announce("No se pudo copiar. El email es hola@josecoded.com");
  }
};

const palette = document.getElementById("palette");
const paletteInput = palette.querySelector("input");
const paletteList = palette.querySelector("[role=listbox]");
const paletteEmpty = palette.querySelector("[data-empty]");
const paletteQuery = palette.querySelector("[data-query]");

const commands = [
  ...sections.map((section, index) => ({
    group: "Secciones",
    label: section.dataset.section,
    icon: String(index).padStart(2, "0"),
    hint: `#${section.id}`,
    run: () => goTo(section.id),
  })),
  { group: "Acciones", label: "Pedir propuesta", icon: "→", hint: "contacto", run: startContact },
  { group: "Acciones", label: "Copiar email", icon: "@", hint: "hola@josecoded.com", run: copyEmail },
  { group: "Acciones", label: "Volver arriba", icon: "↑", hint: "inicio", run: () => goTo("inicio") },
];

const normalize = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const groups = [...new Set(commands.map((command) => command.group))].map((name, index) => {
  const group = document.createElement("div");
  group.setAttribute("role", "group");
  group.setAttribute("aria-labelledby", `palette-group-${index}`);
  const label = document.createElement("div");
  label.className = "palette__group-label";
  label.id = `palette-group-${index}`;
  label.setAttribute("role", "presentation");
  label.textContent = name;
  group.append(label);
  paletteList.append(group);
  return { name, group };
});

const options = commands.map((command, index) => {
  const option = document.createElement("div");
  option.className = "palette__opt";
  option.id = `palette-opt-${index}`;
  option.setAttribute("role", "option");
  option.setAttribute("aria-selected", "false");
  option.innerHTML = `<span class="palette__ico" aria-hidden="true"></span><span class="palette__label"></span><span class="palette__hint" aria-hidden="true"></span>`;
  option.querySelector(".palette__ico").textContent = command.icon;
  option.querySelector(".palette__label").textContent = command.label;
  option.querySelector(".palette__hint").textContent = command.hint;
  groups.find((group) => group.name === command.group).group.append(option);
  return { command, option, text: normalize(`${command.label} ${command.hint}`) };
});

let visible = options;
let active = 0;

const setActive = (index) => {
  if (!visible.length) {
    paletteInput.removeAttribute("aria-activedescendant");
    return;
  }
  active = (index + visible.length) % visible.length;
  for (const item of options) item.option.setAttribute("aria-selected", "false");
  const item = visible[active];
  item.option.setAttribute("aria-selected", "true");
  paletteInput.setAttribute("aria-activedescendant", item.option.id);
  item.option.scrollIntoView({ block: "nearest" });
};

const filter = () => {
  const query = normalize(paletteInput.value.trim());
  visible = options.filter((item) => !query || item.text.includes(query));
  for (const item of options) item.option.hidden = !visible.includes(item);
  for (const { group } of groups) group.hidden = !group.querySelector("[role=option]:not([hidden])");
  paletteEmpty.hidden = visible.length > 0;
  paletteQuery.textContent = paletteInput.value.trim();
  setActive(0);
};

const runActive = (item = visible[active]) => {
  if (!item) return;
  palette.close();
  item.command.run();
};

paletteInput.addEventListener("input", filter);
paletteInput.addEventListener("keydown", (event) => {
  const moves = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: visible.length - 1 };
  if (event.key in moves) {
    event.preventDefault();
    setActive(moves[event.key]);
  } else if (event.key === "Enter") {
    event.preventDefault();
    runActive();
  }
});
for (const item of options) {
  item.option.addEventListener("pointermove", () => {
    const index = visible.indexOf(item);
    if (index !== active) setActive(index);
  });
  item.option.addEventListener("click", () => runActive(item));
}
palette.addEventListener("opened", () => {
  paletteInput.value = "";
  filter();
  const index = visible.findIndex((item) => item.command.hint === `#${current}`);
  setActive(Math.max(0, index));
  paletteInput.focus();
});

for (const kbd of document.querySelectorAll("[data-kbd]")) kbd.textContent = isMac ? "⌘K" : "Ctrl K";

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && root.dataset.nav === "b") {
    event.preventDefault();
    if (palette.open) palette.close();
    else openDialog(palette);
  }
});

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

const variants = ["a", "b", "c"];
const headers = [...document.querySelectorAll("[data-nav-variant]")];
const switches = [...document.querySelectorAll("[data-set-nav]")];

const applyVariant = (variant) => {
  root.dataset.nav = variant;
  for (const header of headers) header.hidden = header.dataset.navVariant !== variant;
  for (const button of switches) button.setAttribute("aria-pressed", String(button.dataset.setNav === variant));
  const url = new URL(location.href);
  url.searchParams.set("nav", variant);
  history.replaceState(null, "", url);
  try {
    localStorage.setItem("estilo-b-nav", variant);
  } catch {}
  placeTicks();
  moveIndicator();
};

const setVariant = (variant) => {
  if (variant === root.dataset.nav) return;
  closeDialogs();
  if (document.startViewTransition && !reduced.matches) document.startViewTransition(() => applyVariant(variant));
  else applyVariant(variant);
  const name = switches.find((button) => button.dataset.setNav === variant)?.querySelector(".lab__name")?.textContent;
  announce(`Navegación ${name}`);
};

for (const button of switches) button.addEventListener("click", () => setVariant(button.dataset.setNav));

const stored = (() => {
  try {
    return localStorage.getItem("estilo-b-nav");
  } catch {
    return null;
  }
})();
const requested = new URLSearchParams(location.search).get("nav") ?? stored;
applyVariant(variants.includes(requested) ? requested : "a");

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
  placeTicks();
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
