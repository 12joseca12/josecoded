/**
 * Marks everything outside `el` as `inert` (from `el` up to `<body>`, every sibling at each level)
 * and returns `restore`, which removes only what this call added: an element that was already
 * inert stays inert. `keep` lists elements that must stay interactive (a toast region, the palette).
 */
export function inertSiblings(el: HTMLElement, keep: readonly Element[] = []): () => void {
  const changed: Element[] = [];
  let node: HTMLElement = el;
  while (node.parentElement && node !== document.body) {
    const parent: HTMLElement = node.parentElement;
    for (const sibling of parent.children) {
      if (sibling === node || sibling.hasAttribute('inert')) continue;
      if (keep.some((k) => k === sibling || sibling.contains(k))) continue;
      // <script>/<style> are not interactive and the attribute would only add noise
      if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
      sibling.setAttribute('inert', '');
      changed.push(sibling);
    }
    node = parent;
  }
  return () => {
    for (const sibling of changed) sibling.removeAttribute('inert');
  };
}
