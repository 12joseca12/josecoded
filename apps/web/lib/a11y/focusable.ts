// Elements the keyboard can reach by Tab: shared by the focus trap and anything else that needs to
// know "what is tabbable inside this container".
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/** Tabbable descendants of `container` in DOM order, without hidden or inert ones. */
export function focusableWithin(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.closest('[hidden], [inert]') === null && el.getAttribute('tabindex') !== '-1',
  );
}
