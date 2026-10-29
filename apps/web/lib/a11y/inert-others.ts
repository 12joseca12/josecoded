// Never silenced: assistive-technology announcers must keep working under any open layer.
const ALWAYS_LIVE = '[aria-live], #a11y-announcer, next-route-announcer';
// Global announcers may sit inside a wrapper: that wrapper stays out of `inert` too.
const GLOBAL_ANNOUNCERS = '#a11y-announcer, next-route-announcer';

// Layers can open and close in any order, so `inert` is reference counted per element: it is only
// removed when no open layer needs the element inert any more.
const holds = new WeakMap<Element, number>();

/**
 * Marks everything outside `el` as `inert` (from `el` up to `<body>`, every sibling at each level)
 * and returns `restore`, which releases only what this call took: an element that was already
 * inert before any layer stays inert. `keep` lists elements that must stay interactive (a toast
 * region, the palette).
 */
export function inertSiblings(el: HTMLElement, keep: readonly Element[] = []): () => void {
  const taken: Element[] = [];
  let node: HTMLElement = el;
  while (node.parentElement && node !== document.body) {
    const parent: HTMLElement = node.parentElement;
    for (const sibling of parent.children) {
      if (sibling === node) continue;
      const count = holds.get(sibling) ?? 0;
      // already inert and not ours: leave it alone
      if (count === 0 && sibling.hasAttribute('inert')) continue;
      if (keep.some((k) => k === sibling || sibling.contains(k))) continue;
      // <script>/<style> are not interactive and the attribute would only add noise
      if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
      if (sibling.matches(ALWAYS_LIVE) || sibling.querySelector(GLOBAL_ANNOUNCERS)) continue;
      holds.set(sibling, count + 1);
      sibling.setAttribute('inert', '');
      taken.push(sibling);
    }
    node = parent;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const sibling of taken) {
      const count = (holds.get(sibling) ?? 1) - 1;
      if (count <= 0) {
        holds.delete(sibling);
        sibling.removeAttribute('inert');
      } else holds.set(sibling, count);
    }
  };
}
