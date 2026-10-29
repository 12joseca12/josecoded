import { captureFocus } from '@/lib/a11y';

export interface DisclosureOptions {
  /** Any wheel gesture outside the panel closes it (the page is about to scroll under it). */
  closeOnWheel?: boolean;
  /** Closes when the viewport grows wider than this many rem (the menu button disappears). */
  closeAboveRem?: number;
  /** Called after every real change of state; the shell store follows it. */
  onChange?: (open: boolean) => void;
}

export interface Disclosure {
  open: () => void;
  /** `restoreFocus: false` when the focus already went somewhere on purpose (a link, another field). */
  close: (options?: { restoreFocus?: boolean }) => void;
  toggle: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

/**
 * Native disclosure (button + panel) with every way out (working-agreements §16): Esc (focus goes
 * back to the button), choosing a link, focus or a tap outside, the wheel, and the viewport growing
 * past the menu breakpoint. Non-modal on purpose: nothing is made inert and focus is not trapped,
 * so Tab walks on to the page and that very move closes it. Its document listeners exist only
 * while it is open.
 */
export function createDisclosure(
  button: HTMLElement,
  panel: HTMLElement,
  options: DisclosureOptions = {},
): Disclosure {
  const { closeOnWheel = false, closeAboveRem, onChange } = options;
  let isOpen = !panel.hidden;
  let releaseFocus: (() => void) | undefined;
  let stopListening: (() => void) | undefined;

  const isOutside = (target: EventTarget | null) =>
    !(target instanceof Node) || (!panel.contains(target) && !button.contains(target));

  function listen() {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isOutside(event.target)) close({ restoreFocus: false });
    };
    const onPointerDown = (event: Event) => {
      if (isOutside(event.target)) close({ restoreFocus: false });
    };
    const onPanelClick = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('a[href]')) {
        close({ restoreFocus: false });
      }
    };
    const onWheel = (event: Event) => {
      if (event.target instanceof Node && panel.contains(event.target)) return;
      close({ restoreFocus: false });
    };
    const wide =
      closeAboveRem !== undefined && typeof matchMedia === 'function'
        ? matchMedia(`(width > ${closeAboveRem}rem)`)
        : null;
    const onWide = (event: MediaQueryListEvent) => {
      if (event.matches) close({ restoreFocus: false });
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('pointerdown', onPointerDown);
    panel.addEventListener('click', onPanelClick);
    if (closeOnWheel) window.addEventListener('wheel', onWheel, { passive: true });
    wide?.addEventListener('change', onWide);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('pointerdown', onPointerDown);
      panel.removeEventListener('click', onPanelClick);
      window.removeEventListener('wheel', onWheel);
      wide?.removeEventListener('change', onWide);
    };
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    releaseFocus = captureFocus(button);
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    stopListening = listen();
    onChange?.(true);
  }

  function close({ restoreFocus = true }: { restoreFocus?: boolean } = {}) {
    if (!isOpen) return;
    isOpen = false;
    stopListening?.();
    stopListening = undefined;
    button.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    if (restoreFocus) releaseFocus?.();
    releaseFocus = undefined;
    onChange?.(false);
  }

  return {
    open,
    close,
    toggle: () => (isOpen ? close() : open()),
    isOpen: () => isOpen,
    destroy: () => {
      stopListening?.();
      stopListening = undefined;
    },
  };
}
