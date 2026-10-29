import { focusableWithin } from './focusable';

/**
 * Keeps Tab and Shift+Tab cycling inside `container` (modal cell, dialog-like panels). It does not
 * move focus on entry: the opener decides where focus lands. Returns the function that releases the
 * trap. Pair it with `inertSiblings` so a screen reader cannot leave the container either.
 */
export function trapFocus(container: HTMLElement): () => void {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const items = focusableWithin(container);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      // nothing to tab to: keep focus on the container itself
      event.preventDefault();
      container.focus();
      return;
    }
    const active = document.activeElement;
    if (!container.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && (active === first || active === container)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}
