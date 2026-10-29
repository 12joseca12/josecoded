'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useShell } from '@/components/layout/shell-provider';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';

import styles from './search-trigger.module.css';

/**
 * Opens the command palette and owns the global shortcut: ⌘K / Ctrl+K toggles it from anywhere,
 * also while typing in a field. Until a palette is mounted (task 2.16 calls
 * `useShell().registerPalette()`), the trigger is inert: `aria-disabled`, no dialog semantics, and
 * the shortcut is left to the browser.
 *
 * A11y: a button named «Buscar» (the label stays even when only the icon is visible). With a
 * palette: `aria-haspopup="dialog"`, `aria-expanded` follows it and `aria-keyshortcuts` announces
 * the shortcut. Without: `aria-disabled` only. 2.75 rem hit area under 900 px; the shortcut is
 * never animated.
 */
export function SearchTrigger() {
  const t = useTranslations('nav');
  const { palette, paletteMounted, openPalette, togglePalette } = useShell();

  useEffect(() => {
    if (!paletteMounted) return;
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePalette();
      }
    }
    addEventListener('keydown', onKeyDown);
    return () => removeEventListener('keydown', onKeyDown);
  }, [paletteMounted, togglePalette]);

  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label={t('search')}
      aria-disabled={paletteMounted ? undefined : 'true'}
      aria-haspopup={paletteMounted ? 'dialog' : undefined}
      aria-expanded={paletteMounted ? palette : undefined}
      aria-keyshortcuts={paletteMounted ? 'Meta+K Control+K' : undefined}
      onClick={paletteMounted ? openPalette : undefined}
    >
      <Icon name="search" />
      <span className={styles.label} aria-hidden="true">
        {t('search')}
      </span>
      <span className={styles.keys} aria-hidden="true">
        <Kbd>⌘K</Kbd>
      </span>
    </button>
  );
}
