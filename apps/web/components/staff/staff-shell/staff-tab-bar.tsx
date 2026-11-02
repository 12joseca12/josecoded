'use client';

import { useEffect, useId, useRef } from 'react';

import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';
import { usePathname } from '@/i18n/navigation';
import { isCurrentStaffPath } from '@/lib/staff/nav';

import { StaffLinks } from './staff-nav';
import styles from './staff-tab-bar.module.css';

import type { StaffNavView } from './staff-nav';

/**
 * Bottom bar of the phone and the tablet (< 64rem): the destinations of the bar and a «Más» button that opens
 * a sheet with the rest. Tabs are at least 2.75rem tall; the sheet is a native modal `<dialog>` (focus trapped,
 * Esc closes, focus returns to the button) that also closes when a link in it navigates.
 *
 * A11y: `nav` landmark named by `label`; the button announces that it opens a dialog; the sheet is named by
 * its heading and has its own `nav`.
 */
export function StaffTabBar({
  label,
  items,
  moreButton,
  moreSections,
  close,
  sheetItems,
}: {
  label: string;
  items: readonly StaffNavView[];
  moreButton: string;
  moreSections: string;
  close: string;
  sheetItems: readonly StaffNavView[];
}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // a navigation from inside the sheet leaves the layout mounted: close it by hand
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <nav aria-label={label} className={styles.bar}>
        <ul role="list" className={styles.tabs}>
          {items.map((item) => (
            <li key={item.id}>
              <Action
                href={item.href}
                className={styles.tab}
                aria-current={isCurrentStaffPath(pathname, item.href) ? 'page' : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Action>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={styles.tab}
              aria-haspopup="dialog"
              onClick={() => dialog.current?.showModal()}
            >
              <Icon name="ellipsis" />
              <span>{moreButton}</span>
            </button>
          </li>
        </ul>
      </nav>
      <dialog
        ref={dialog}
        className={styles.sheet}
        aria-labelledby={titleId}
        onClick={(event) => {
          // a click on the dialog itself is a click on its backdrop (the content fills the box)
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <span className={styles.grabber} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {moreButton}
          </h2>
          <button type="button" className={styles.closeButton} aria-label={close} onClick={() => dialog.current?.close()}>
            <Icon name="x" />
          </button>
        </div>
        <nav aria-label={moreSections} className={styles.sheetNav}>
          <StaffLinks items={sheetItems} size="sheet" />
        </nav>
      </dialog>
    </>
  );
}
