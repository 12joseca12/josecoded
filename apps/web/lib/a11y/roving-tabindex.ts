export type RovingOrientation = 'horizontal' | 'vertical' | 'both';

export interface RovingOptions {
  orientation: RovingOrientation;
  /** Wrap from the last item to the first and back. */
  loop: boolean;
  /** Items of the list, in order. Re-read on every key press, so the list may change. */
  items: () => HTMLElement[];
  /** Called when the arrow keys, Home or End move to another item (after it received focus). */
  onMove?: (item: HTMLElement, index: number) => void;
}

export interface Roving {
  /** Makes `item` the single tab stop without moving focus. */
  setActive: (item: HTMLElement) => void;
  destroy: () => void;
}

const KEYS: Record<RovingOrientation, { prev: string[]; next: string[] }> = {
  horizontal: { prev: ['ArrowLeft'], next: ['ArrowRight'] },
  vertical: { prev: ['ArrowUp'], next: ['ArrowDown'] },
  both: { prev: ['ArrowLeft', 'ArrowUp'], next: ['ArrowRight', 'ArrowDown'] },
};

const isDisabled = (el: HTMLElement) =>
  el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * Roving tabindex for a composite widget (tablist, segmented control, menu, palette list): exactly
 * one item has `tabindex="0"`, the others `-1`; arrows move (Home/End jump), Tab leaves the widget.
 * Disabled items are skipped.
 */
export function createRovingTabindex(list: HTMLElement, options: RovingOptions): Roving {
  const { orientation, loop, items, onMove } = options;
  const keys = KEYS[orientation];

  function enabled() {
    return items().filter((item) => !isDisabled(item));
  }

  function setActive(active: HTMLElement) {
    for (const item of items()) item.tabIndex = item === active ? 0 : -1;
  }

  function init() {
    const all = enabled();
    const start =
      all.find((item) => item.getAttribute('aria-selected') === 'true' || item.getAttribute('aria-checked') === 'true') ??
      all[0];
    if (start) setActive(start);
  }

  function move(to: HTMLElement | undefined) {
    if (!to) return;
    setActive(to);
    to.focus();
    onMove?.(to, items().indexOf(to));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const all = enabled();
    const current = all.indexOf(event.target as HTMLElement);
    if (current === -1) return;
    let next: HTMLElement | undefined;
    if (keys.next.includes(event.key)) {
      next = all[current + 1] ?? (loop ? all[0] : undefined);
    } else if (keys.prev.includes(event.key)) {
      next = all[current - 1] ?? (loop ? all[all.length - 1] : undefined);
    } else if (event.key === 'Home') {
      next = all[0];
    } else if (event.key === 'End') {
      next = all[all.length - 1];
    } else {
      return;
    }
    event.preventDefault();
    move(next);
  }

  // focus that arrives by click or by a screen reader also becomes the tab stop
  function onFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (enabled().includes(target)) setActive(target);
  }

  init();
  list.addEventListener('keydown', onKeyDown);
  list.addEventListener('focusin', onFocusIn);
  return {
    setActive,
    destroy() {
      list.removeEventListener('keydown', onKeyDown);
      list.removeEventListener('focusin', onFocusIn);
    },
  };
}
