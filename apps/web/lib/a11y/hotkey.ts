// A single-key shortcut that focuses a field (WCAG 2.1.4: it only fires when nothing is being typed, and the
// control is also reachable without it). Used by the «/» of the contact search.

/** What the handler needs from a keyboard event; a real `KeyboardEvent` satisfies it. */
export interface HotkeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  /** A composition (IME) in progress: the key belongs to the input method. */
  isComposing: boolean;
  target: EventTarget | null;
}

/** Whether the target takes typed text (so a printable key must reach it) or is a control that owns its keys. */
function isTyping(target: EventTarget | null): boolean {
  if (!target || !('tagName' in target)) return false;
  const el = target as HTMLElement;
  if (el.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/** `true` when this key press should run the shortcut for `key`. */
export function isHotkey(event: HotkeyEvent, key: string): boolean {
  if (event.key !== key || event.defaultPrevented || event.isComposing) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return !isTyping(event.target);
}

/**
 * Focuses `field` when `key` is pressed away from other fields. Returns the cleanup. `select()` makes the next
 * thing typed replace the previous search, the way a search box usually behaves.
 */
export function bindFocusHotkey(field: HTMLInputElement, key: string): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!isHotkey(event, key)) return;
    event.preventDefault();
    field.focus();
    field.select();
  };
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}
