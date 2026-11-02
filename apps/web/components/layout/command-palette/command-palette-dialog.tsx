'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useId, useReducer, useRef } from 'react';

import { useShell } from '@/components/layout/shell-provider';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { getPathname } from '@/i18n/navigation';
import { isInternalHref, toLinkTarget } from '@/lib/href';
import { filter, reduce } from '@/lib/motion/palette';

import styles from './command-palette.module.css';

import type { PaletteCommand } from '@/lib/motion/palette';
import type { Href, IconName } from '@josecoded/types';

/** Glyphs of the keys the footer shows (they are symbols, not text to translate). */
const KEYS = { up: '↑', down: '↓', enter: '↵' } as const;

export interface PaletteItem extends PaletteCommand {
  icon: IconName;
  href: Href;
  groupLabel: string;
}

export interface PaletteCopy {
  label: string;
  placeholder: string;
  hintMove: string;
  hintOpen: string;
  /** The empty message with a `{query}` placeholder. */
  empty: string;
  listLabel: string;
}

/**
 * The dialog of the palette, loaded on the first ⌘K or click on the search button (it is a separate
 * chunk: the filtering, the list and the keys are not in the first load). A real `<dialog>` opened
 * with `showModal()`: focus is trapped, the page behind is inert and Esc closes it natively. No
 * animation (a keyboard action). The state of what was typed lives in the body, which exists only
 * while the dialog is open, so each opening starts empty.
 */
export default function CommandPaletteDialog({ commands, copy }: { commands: readonly PaletteItem[]; copy: PaletteCopy }) {
  const { palette, closePalette } = useShell();
  const dialog = useRef<HTMLDialogElement>(null);
  // the native `close` event arrives in a later task: when we closed it ourselves it must not touch
  // the state again (a quick ⌘K in between would be undone)
  const closedByUs = useRef(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (palette && !element.open) element.showModal();
    if (!palette && element.open) {
      closedByUs.current = true;
      element.close();
    }
  }, [palette]);

  return (
    <dialog
      ref={dialog}
      className={styles.palette}
      aria-label={copy.label}
      // Esc: the shell state flips first and the effect closes the dialog, so the store never lags behind the element
      onCancel={(event) => {
        event.preventDefault();
        closePalette();
      }}
      onClose={() => {
        if (closedByUs.current) closedByUs.current = false;
        else closePalette();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closePalette();
      }}
    >
      {palette ? <PaletteBody commands={commands} copy={copy} /> : null}
    </dialog>
  );
}

/**
 * The final, localized URL of an internal command (`/servicios#packs` becomes `/services#packs` in
 * English), so that the plain Next router can take it and keep the hash.
 */
function localizedPath(href: Href, locale: string): string {
  const { pathname, query, hash } = toLinkTarget(href);
  const path = getPathname({ href: query ? { pathname, query } : pathname, locale } as Parameters<typeof getPathname>[0]);
  return hash ? `${path}#${hash}` : path;
}

function PaletteBody({ commands, copy }: { commands: readonly PaletteItem[]; copy: PaletteCopy }) {
  const { closePalette, closeCell } = useShell();
  const router = useRouter();
  const locale = useLocale();
  const id = useId();
  const [state, dispatch] = useReducer((current: { query: string; index: number }, action: Parameters<typeof reduce>[1]) => reduce(current, action, commands), {
    query: '',
    index: 0,
  });
  const shown = filter(commands, state.query);
  const selected = shown[state.index];

  useEffect(() => {
    if (selected) document.getElementById(`${id}-${selected.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [id, selected]);

  // a cell that is open closes first, then the page changes
  function open(command: PaletteItem | undefined) {
    if (!command) return;
    closePalette();
    closeCell();
    if (isInternalHref(command.href)) router.push(localizedPath(command.href, locale));
    else window.open(command.href, '_blank', 'noopener');
  }

  let group = '';
  return (
    <div className={styles.box}>
      <div className={styles.field}>
        <Icon name="search" />
        <input
          className={styles.input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={selected ? `${id}-${selected.id}` : undefined}
          aria-autocomplete="list"
          aria-label={copy.label}
          placeholder={copy.placeholder}
          autoComplete="off"
          value={state.query}
          onChange={(event) => dispatch({ type: 'query', query: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              dispatch({ type: 'key', key: event.key });
            } else if (event.key === 'Enter') {
              event.preventDefault();
              open(selected);
            }
          }}
        />
        <Kbd>esc</Kbd>
      </div>
      <ul className={styles.list} id={`${id}-list`} role="listbox" aria-label={copy.listLabel}>
        {shown.length === 0 ? (
          <li className={styles.empty} role="presentation">
            {copy.empty.replace('{query}', state.query)}
          </li>
        ) : (
          shown.map((command, i) => {
            const heading = command.group !== group ? ((group = command.group), command.groupLabel) : null;
            return (
              <li key={command.id} role="presentation">
                {heading ? <p className={`${styles.item} ${styles.group}`} role="presentation">{heading}</p> : null}
                <div
                  id={`${id}-${command.id}`}
                  className={styles.item}
                  role="option"
                  aria-selected={i === state.index}
                  onPointerMove={() => i !== state.index && dispatch({ type: 'hover', index: i })}
                  onClick={() => open(command)}
                >
                  <Icon name={command.icon} />
                  <span>{command.label}</span>
                  {command.hint ? <span className={styles.hint}>{command.hint}</span> : null}
                </div>
              </li>
            );
          })
        )}
      </ul>
      <div className={styles.foot}>
        <span>
          <Kbd>{KEYS.up}</Kbd>
          <Kbd>{KEYS.down}</Kbd> {copy.hintMove}
        </span>
        <span>
          <Kbd>{KEYS.enter}</Kbd> {copy.hintOpen}
        </span>
      </div>
    </div>
  );
}
