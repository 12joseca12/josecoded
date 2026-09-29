/* C · Carrusel fijado. El recorrido lo mueve CSS (animation-timeline); aquí solo se marca la tarjeta en foco y se traducen los enlaces a posición de scroll. */
import { reduce } from './base.js';
const tour = document.getElementById('tour');
const cards = [...document.querySelectorAll('.tcard')];
const railLinks = [...document.querySelectorAll('.rail__links a')];
const navLinks = [...document.querySelectorAll('.nav__links a')];
const pinned = () => CSS.supports('animation-timeline: view()') && innerWidth >= 900 && !reduce;
function setActive(i) {
  cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
  railLinks.forEach((a, k) => a.setAttribute('aria-current', k === i));
  navLinks.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === `#${cards[i].id}`));
}
// la tarjeta en foco es la que cruza el centro horizontal de la pantalla (las transformaciones cuentan para IntersectionObserver)
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(cards.indexOf(e.target)); }), { rootMargin: '0px -45% 0px -45%' });
cards.forEach((c) => io.observe(c));
setActive(0);
// en modo fijado, un enlace a una tarjeta es una posición de scroll dentro del recorrido
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a || !pinned()) return;
  const i = cards.findIndex((c) => `#${c.id}` === a.getAttribute('href')); if (i < 0) return;
  e.preventDefault();
  const top = tour.getBoundingClientRect().top + scrollY, run = tour.offsetHeight - innerHeight;
  scrollTo({ top: top + (run * i) / (cards.length - 1), behavior: 'smooth' });
});
