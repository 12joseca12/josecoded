'use client';

import { useSyncExternalStore } from 'react';

import { isKeyDown, keyLabel, subscribeKeys } from '@/lib/motion/keycap';

import styles from './key-cap.module.css';

import type { KeyId } from '@/lib/motion/keycap';

const noSubscription = () => () => undefined;

/**
 * A big key cap that shows the real shortcut of the palette (⌘ or Ctrl, and K) and sinks 2 px
 * while that key is held. It is a real `<kbd>`: the closing hint reads «o pulsa ⌘ K y busca lo que
 * quieras». The modifier follows the platform (⌘ on Apple, Ctrl elsewhere) once hydrated. It
 * does not open anything itself: the palette owns the shortcut.
 *
 * A11y: native `kbd` semantics; the pressed state is visual only; with reduced motion it does not
 * move; the hint that holds it is hidden without a fine pointer, where there is no keyboard.
 */
export function KeyCap({ keyId }: { keyId: KeyId }) {
  const pressed = useSyncExternalStore(subscribeKeys, () => isKeyDown(keyId), () => false);
  const platform = useSyncExternalStore(noSubscription, () => navigator.platform, () => 'MacIntel');
  return (
    <kbd className={styles.key} data-down={pressed ? 'true' : undefined}>
      {keyLabel(keyId, platform)}
    </kbd>
  );
}
