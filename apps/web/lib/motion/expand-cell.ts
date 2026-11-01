import { captureFocus, inertSiblings, trapFocus } from '@/lib/a11y';

export interface OpenCellOptions {
  /** The control that asked for it; focus goes back to it on close. */
  opener?: HTMLElement | null;
  /** The veil under the cell; `hidden` follows the open state. Not inert, not part of the dialog. */
  scrim?: HTMLElement | null;
  /** Called once when the cell is closed, whichever way (Esc, close button, veil, `close()`). */
  onClose?: () => void;
}

export interface CellHandle {
  /** Resolves when the cell is back in the grid. */
  close: () => Promise<void>;
  isOpen: () => boolean;
  /** Removes the listeners; if the cell is still open it is put back without a transition. */
  destroy: () => void;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<unknown> };
};

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs `update` inside a View Transition when the browser has them and motion is welcome; otherwise
 * it just runs. Returns the transition's `finished` promise, or `null` when nothing was animated.
 */
function transition(update: () => void): Promise<unknown> | null {
  const doc = document as ViewTransitionDocument;
  if (reducedMotion() || typeof doc.startViewTransition !== 'function') {
    update();
    return null;
  }
  return doc.startViewTransition(update).finished;
}

/**
 * Expands a bento cell into a modal dialog (View Transitions, `--dur-vt`): the cell becomes
 * `role="dialog"` + `aria-modal`, everything else turns `inert`, Tab cycles inside it, the page
 * stops scrolling, and Esc closes it and returns focus to the opener. A `dialog[open]` above it
 * (the command palette) takes Esc first. The visual state is `data-open` on the cell; the CSS of
 * `BentoCell` draws it. Without View Transitions the change is immediate.
 */
export function openCell(cell: HTMLElement, { opener = null, scrim = null, onClose }: OpenCellOptions = {}): CellHandle {
  const restoreFocus = captureFocus(opener ?? (document.activeElement as HTMLElement | null));
  let open = true;
  let releaseInert: (() => void) | undefined;
  let releaseTrap: (() => void) | undefined;

  cell.style.setProperty('view-transition-name', 'cell');
  cell.setAttribute('role', 'dialog');
  cell.setAttribute('aria-modal', 'true');

  function enter() {
    cell.dataset.open = 'true';
    if (scrim) scrim.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    releaseInert = inertSiblings(cell, scrim ? [scrim] : []);
    releaseTrap = trapFocus(cell);
  }
  function leave() {
    delete cell.dataset.open;
    if (scrim) scrim.hidden = true;
    document.documentElement.style.overflow = '';
    releaseInert?.();
    releaseTrap?.();
    releaseInert = releaseTrap = undefined;
  }
  function settle() {
    cell.style.removeProperty('view-transition-name');
    cell.removeAttribute('role');
    cell.removeAttribute('aria-modal');
    restoreFocus();
    onClose?.();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (document.querySelector('dialog[open]')) return;
    void close();
  }
  const onScrimClick = () => void close();

  function close(): Promise<void> {
    if (!open) return Promise.resolve();
    open = false;
    document.removeEventListener('keydown', onKeyDown);
    scrim?.removeEventListener('click', onScrimClick);
    const finished = transition(leave);
    if (!finished) {
      settle();
      return Promise.resolve();
    }
    return finished.then(settle, settle);
  }

  void transition(enter);
  cell.focus({ preventScroll: true });
  document.addEventListener('keydown', onKeyDown);
  scrim?.addEventListener('click', onScrimClick);

  return {
    close,
    isOpen: () => open,
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
      scrim?.removeEventListener('click', onScrimClick);
      if (open) {
        open = false;
        leave();
        cell.style.removeProperty('view-transition-name');
        cell.removeAttribute('role');
        cell.removeAttribute('aria-modal');
      }
    },
  };
}
