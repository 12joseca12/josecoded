'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useShell } from '@/components/layout/shell-provider';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';

import styles from './search-trigger.module.css';

/**
 * Opens the command palette (mounted by task 2.16, which reads `useShell().palette`) and owns the
 * global shortcut: ⌘K / Ctrl+K toggles it from anywhere, also while typing in a field.
 *
 * A11y: a button named «Buscar» (the label stays even when only the icon is visible),
 * `aria-haspopup="dialog"`, `aria-expanded` follows the palette, `aria-keyshortcuts` announces
 * the shortcut; 2.75 rem hit area under 900 px; the shortcut itself is never animated.
 */
export function SearchTrigger() {
  const t = useTranslations('nav');
  const { palette, openPalette, togglePalette } = useShell();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePalette();
      }
    }
    addEventListener('keydown', onKeyDown);
    return () => removeEventListener('keydown', onKeyDown);
  }, [togglePalette]);

  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label={t('search')}
      aria-haspopup="dialog"
      aria-expanded={palette}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={openPalette}
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
