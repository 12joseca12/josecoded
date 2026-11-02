const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const nav = document.querySelector(".nav");
const menuButton = document.querySelector(".menu-button");

if (nav && menuButton) {
  const setOpen = (open) => {
    nav.toggleAttribute("data-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  };

  menuButton.addEventListener("click", () => setOpen(!nav.hasAttribute("data-open")));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.hasAttribute("data-open")) {
      setOpen(false);
      menuButton.focus();
    }
  });

  matchMedia("(min-width: 64rem)").addEventListener("change", () => setOpen(false));
}

const hero = document.querySelector(".hero");

if (hero) {
  const copy = hero.querySelector(".hero-copy");
  const visual = hero.querySelector(".hero-visual");
  const cta = hero.querySelector("[data-cta]");
  const ghost = hero.querySelector("[data-ghost]");
  const navCurrent = [...document.querySelectorAll(".nav-links li:first-child a, .menu-panel li:first-child a")];

  const status = document.createElement("p");
  status.className = "sr-only";
  status.setAttribute("role", "status");
  document.body.append(status);

  const skeleton = document.createElement("div");
  skeleton.className = "skeleton";
  skeleton.setAttribute("aria-hidden", "true");
  skeleton.innerHTML = '<span class="sk sk-phone"></span><span class="sk sk-card"></span><span class="sk sk-card sk-card-b"></span>';
  visual.append(skeleton);

  const notFound = document.createElement("section");
  notFound.className = "not-found";
  notFound.hidden = true;
  notFound.setAttribute("aria-labelledby", "nf-title");
  notFound.innerHTML = '<p class="nf-code" aria-hidden="true">404</p><h2 id="nf-title">Esta pantalla no existe</h2><p>El enlace está roto o la página se ha movido. Puedes volver al inicio o ver los proyectos.</p><div class="nf-actions"><a class="btn btn-primary" href="#">Volver al inicio</a><a class="nf-link" href="#">Ver proyectos</a></div>';
  hero.append(notFound);

  const field = document.createElement("form");
  field.className = "field";
  field.hidden = true;
  field.noValidate = true;
  field.innerHTML = '<label for="email">Tu email para la propuesta</label><div class="field-row"><input id="email" name="email" type="email" autocomplete="email" value="jose.gmail.com" aria-invalid="true" aria-describedby="email-error"><button class="btn btn-primary" type="submit">Enviar</button></div><p class="field-error" id="email-error"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.5v4.2M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Falta la @. Escribe un email como nombre@dominio.com.</p>';
  field.addEventListener("submit", (event) => {
    event.preventDefault();
    field.querySelector("input").focus();
  });
  copy.append(field);

  let busyTimer;

  cta.addEventListener("click", () => {
    if (cta.getAttribute("aria-busy") === "true" || cta.disabled) return;
    cta.setAttribute("aria-busy", "true");
    status.textContent = "Preparando la propuesta…";
    busyTimer = setTimeout(() => {
      cta.removeAttribute("aria-busy");
      status.textContent = "Listo. Te llevo al formulario.";
    }, 1500);
  });

  ghost.addEventListener("click", (event) => {
    if (ghost.getAttribute("aria-disabled") === "true") event.preventDefault();
  });

  const states = [
    ["normal", "Normal"],
    ["loading", "Cargando"],
    ["error", "Error"],
    ["empty", "404"],
    ["disabled", "Deshabilitado"],
    ["active", "Nav activa"],
  ];

  const panel = document.createElement("div");
  panel.className = "states";
  panel.innerHTML = `<button class="states-toggle" type="button" aria-expanded="false" aria-controls="states-list">Estados</button><fieldset class="states-list" id="states-list" hidden><legend>Vista previa de estados</legend>${states
    .map(([value, label], index) => `<label><input type="radio" name="state" value="${value}"${index === 0 ? " checked" : ""}><span>${label}</span></label>`)
    .join("")}</fieldset>`;
  document.body.append(panel);

  const toggle = panel.querySelector(".states-toggle");
  const list = panel.querySelector(".states-list");

  toggle.addEventListener("click", () => {
    const open = list.hidden;
    list.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) list.querySelector("input:checked").focus();
  });

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !list.hidden) {
      list.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });

  const apply = (state) => {
    document.body.dataset.state = state;
    clearTimeout(busyTimer);
    cta.removeAttribute("aria-busy");
    visual.setAttribute("aria-busy", String(state === "loading"));
    status.textContent = state === "loading" ? "Cargando proyectos…" : "";
    field.hidden = state !== "error";
    notFound.hidden = state !== "empty";
    copy.hidden = state === "empty";
    cta.disabled = state === "disabled";
    if (state === "disabled") ghost.setAttribute("aria-disabled", "true");
    else ghost.removeAttribute("aria-disabled");
    navCurrent.forEach((link) => {
      if (state === "active") link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  panel.addEventListener("change", (event) => apply(event.target.value));
  apply("normal");

  const initial = new URLSearchParams(location.search).get("estado");
  if (initial && states.some(([value]) => value === initial)) {
    panel.querySelector(`input[value="${initial}"]`).checked = true;
    apply(initial);
  }
}

const switcher = document.querySelector(".switcher");
const stage = document.querySelector(".stage");

if (switcher && stage) {
  const links = [...switcher.querySelectorAll("a")];
  const variants = links.map((link) => link.hash.slice(1));

  const load = (current) =>
    new Promise((resolve) => {
      if (stage.src.endsWith(`${current}.html`)) return resolve();
      stage.addEventListener("load", resolve, { once: true });
      setTimeout(resolve, 1200);
      stage.src = `${current}.html`;
    });

  const show = () => {
    const current = variants.includes(location.hash.slice(1)) ? location.hash.slice(1) : variants[0];
    const link = links[variants.indexOf(current)];
    links.forEach((item) => item.removeAttribute("aria-current"));
    link.setAttribute("aria-current", "true");
    stage.title = link.dataset.title;
    document.title = `josecoded · estilo ${current.toUpperCase()}`;
    if (document.startViewTransition && !reducedMotion.matches && stage.dataset.ready) {
      document.startViewTransition(() => load(current));
    } else {
      load(current);
    }
    stage.dataset.ready = "true";
  };

  switcher.addEventListener("keydown", (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = links.indexOf(document.activeElement);
    const next = links[(index + step + links.length) % links.length];
    next.focus();
    next.click();
  });

  window.addEventListener("hashchange", show);
  show();
}
