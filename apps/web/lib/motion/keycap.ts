export type KeyId = 'mod' | 'k';

type Listener = () => void;

const down: Record<KeyId, boolean> = { mod: false, k: false };
const listeners = new Set<Listener>();
let attached = false;

function set(key: KeyId, value: boolean) {
  if (down[key] === value) return;
  down[key] = value;
  listeners.forEach((listener) => listener());
}

/** Which of the two keys the event concerns, if any: ⌘/Ctrl is `mod`, K is `k`. */
export function keyOf(event: KeyboardEvent): KeyId | null {
  if (event.key === 'Meta' || event.key === 'Control') return 'mod';
  if (event.key.toLowerCase() === 'k') return 'k';
  return null;
}

const onKeyDown = (event: KeyboardEvent) => {
  const key = keyOf(event);
  if (key) set(key, true);
};
const onKeyUp = (event: KeyboardEvent) => {
  const key = keyOf(event);
  if (key) set(key, false);
};
// the browser keeps no keyup for a key released in another window
const onBlur = () => {
  set('mod', false);
  set('k', false);
};

/**
 * Shared state of the two big keys of the closing scene: they sink while the real key is held.
 * One set of window listeners serves every key cap, attached with the first subscriber and removed
 * with the last. Meant for `useSyncExternalStore`.
 */
export function subscribeKeys(listener: Listener): () => void {
  listeners.add(listener);
  if (!attached) {
    attached = true;
    addEventListener('keydown', onKeyDown);
    addEventListener('keyup', onKeyUp);
    addEventListener('blur', onBlur);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && attached) {
      attached = false;
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      removeEventListener('blur', onBlur);
      onBlur();
    }
  };
}

export const isKeyDown = (key: KeyId): boolean => down[key];

/** ⌘ on Apple platforms, Ctrl elsewhere. */
export function modLabel(platform: string): string {
  return /Mac|iPhone|iPad|iPod/i.test(platform) ? '⌘' : 'Ctrl';
}

/** What the key cap says: the platform's modifier for `mod`, «K» for `k`. */
export function keyLabel(key: KeyId, platform: string): string {
  return key === 'k' ? 'K' : modLabel(platform);
}
