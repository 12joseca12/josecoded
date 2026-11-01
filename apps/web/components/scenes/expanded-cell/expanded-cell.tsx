'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { useShell } from '@/components/layout/shell-provider';
import { Icon } from '@/components/ui/icon';
import { openCell } from '@/lib/motion/expand-cell';

import styles from './expanded-cell.module.css';

import type { CellHandle } from '@/lib/motion/expand-cell';

const noSubscription = () => () => undefined;

/**
 * Island of an expandable `BentoCell`: the ⤢ and ✕ controls, the veil, and the bridge between the
 * shell store (`openCell`, so the palette can close it) and `lib/motion/expand-cell.ts`, which does
 * the work (modal dialog, inert page, focus trap, View Transitions, Esc). The cell is found by id.
 *
 * A11y: both controls are real buttons with a translated name; the open one carries
 * `aria-haspopup="dialog"`. Esc, ✕ and the veil close it; focus returns to ⤢.
 */
export function CellExpander({
  cellId,
  openLabel,
  closeLabel,
  controlClass,
}: {
  cellId: string;
  openLabel: string;
  closeLabel: string;
  controlClass: string | undefined;
}) {
  const { openCell: openId, openCellById, closeCell } = useShell();
  const opener = useRef<HTMLButtonElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const handle = useRef<CellHandle | undefined>(undefined);
  // the veil must live in <main>, the stacking context of the open cell; absent on the server
  const host = useSyncExternalStore(
    noSubscription,
    () => document.getElementById('main'),
    () => null,
  );

  useEffect(() => {
    const cell = document.getElementById(cellId);
    if (!cell || !host) return;
    if (openId === cellId && !handle.current) {
      handle.current = openCell(cell, {
        opener: opener.current,
        scrim: scrim.current,
        onClose: () => {
          handle.current = undefined;
          closeCell();
        },
      });
    } else if (openId !== cellId && handle.current) {
      void handle.current.close();
    }
  }, [openId, cellId, host, closeCell]);

  useEffect(() => () => handle.current?.destroy(), []);

  return (
    <>
      <button
        ref={opener}
        type="button"
        className={controlClass}
        data-slot="open"
        aria-label={openLabel}
        aria-haspopup="dialog"
        onClick={() => openCellById(cellId)}
      >
        <Icon name="maximize" />
      </button>
      <button type="button" className={controlClass} data-slot="close" aria-label={closeLabel} onClick={closeCell}>
        <Icon name="x" />
      </button>
      {host ? createPortal(<div ref={scrim} className={styles.scrim} hidden aria-hidden="true" />, host) : null}
    </>
  );
}
