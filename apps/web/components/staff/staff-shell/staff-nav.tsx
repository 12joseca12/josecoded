'use client';

import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';
import { usePathname } from '@/i18n/navigation';
import { isCurrentStaffPath } from '@/lib/staff/nav';

import styles from './staff-nav.module.css';

import type { StaffNavItem } from '@/lib/staff/nav';
import type { StaffLinksSize } from '@josecoded/types';

/** A destination with its label already translated (the client islands receive no messages). */
export interface StaffNavView extends StaffNavItem {
  label: string;
  /** Overdue contacts, shown on the row of Contactos: the number and its sentence for assistive technology. */
  badge?: { count: number; label: string };
}

/**
 * A list of destinations. Client island only to mark the current one (`aria-current="page"`) from the
 * localized path; the links are plain anchors. Rows are at least 2.5rem tall (2.75rem with a coarse pointer).
 */
export function StaffLinks({
  items,
  size = 'rail',
  currentPath,
}: {
  items: readonly StaffNavView[];
  size?: StaffLinksSize;
  /** The logical path to mark as current instead of the URL's (the dev previews live under `/dev/crm`). */
  currentPath?: string;
}) {
  const live = usePathname();
  const pathname = currentPath ?? live;
  return (
    <ul role="list" className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <Action
            href={item.href}
            className={styles.item}
            data-size={size}
            aria-current={isCurrentStaffPath(pathname, item.href) ? 'page' : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge ? (
              <span className={styles.count} aria-label={item.badge.label}>
                {item.badge.count}
              </span>
            ) : null}
          </Action>
        </li>
      ))}
    </ul>
  );
}

/**
 * The navigation of the rail (≥ 64rem): the destinations and, under their own heading, the group «Más».
 *
 * A11y: `nav` landmark named by `label`; the group is a labelled list; the current link is announced.
 */
export function StaffRail({
  label,
  moreLabel,
  primary,
  more,
  currentPath,
}: {
  label: string;
  moreLabel: string;
  primary: readonly StaffNavView[];
  more: readonly StaffNavView[];
  currentPath?: string;
}) {
  return (
    <nav aria-label={label} className={styles.rail}>
      <StaffLinks items={primary} currentPath={currentPath} />
      <p className={styles.heading} id="staff-rail-more">
        {moreLabel}
      </p>
      <div role="group" aria-labelledby="staff-rail-more">
        <StaffLinks items={more} currentPath={currentPath} />
      </div>
    </nav>
  );
}
