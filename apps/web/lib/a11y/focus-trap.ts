import { focusableWithin } from './focusable';

type Handler = (event: KeyboardEvent) => void;

// Active traps, last one on top. A single document listener forwards to the top-most; releasing it
// (in any order) hands the keys back to the previous one.
const stack: Handler[] = [];
function dispatch(event: KeyboardEvent) {
  stack[stack.length - 1]?.(event);
}

/**
 * Keeps Tab and Shift+Tab cycling inside `container` (modal cell, dialog-like panels). It does not
 * move focus on entry: the opener decides where focus lands. Returns the function that releases the
 * trap. Pair it with `inertSiblings` so a screen reader cannot leave the container either.
 */
export function trapFocus(container: HTMLElement): () => void {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    // nested layers (cell + palette): only the top-most trap handles the key
    if (stack[stack.length - 1] !== onKeyDown) return;
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

  stack.push(onKeyDown);
  if (stack.length === 1) document.addEventListener('keydown', dispatch);
  return () => {
    const index = stack.indexOf(onKeyDown);
    if (index === -1) return;
    stack.splice(index, 1);
    if (stack.length === 0) document.removeEventListener('keydown', dispatch);
  };
}
