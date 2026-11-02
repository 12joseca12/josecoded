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

const switcher = document.querySelector(".switcher");
const stage = document.querySelector(".stage");

if (switcher && stage) {
  const links = [...switcher.querySelectorAll("a")];
  const variants = links.map((link) => link.hash.slice(1));

  const show = () => {
    const current = variants.includes(location.hash.slice(1)) ? location.hash.slice(1) : variants[0];
    const link = links[variants.indexOf(current)];
    links.forEach((item) => item.removeAttribute("aria-current"));
    link.setAttribute("aria-current", "true");
    stage.title = link.dataset.title;
    if (!stage.src.endsWith(`${current}.html`)) stage.src = `${current}.html`;
    document.title = `josecoded · estilo ${current.toUpperCase()}`;
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
