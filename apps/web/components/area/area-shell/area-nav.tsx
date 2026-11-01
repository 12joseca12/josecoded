'use client';

import { Action } from '@/components/ui/action';
import { usePathname } from '@/i18n/navigation';

import styles from './area-shell.module.css';

import type { Href } from '@josecoded/types';

export interface AreaNavItem {
  href: Href;
  label: string;
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === '/area-clientes') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navigation of the area. Client island only to mark the current link (`aria-current="page"`) from
 * the localized path; the links themselves are plain anchors.
 *
 * A11y: `nav` landmark named by `label`; each link is read by its text; the current one is
 * announced; targets are at least 2.75rem tall; on a phone the list wraps instead of scrolling.
 */
export function AreaNav({ label, items }: { label: string; items: readonly AreaNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <Action
              href={item.href}
              className={styles.link}
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
            >
              {item.label}
            </Action>
          </li>
        ))}
      </ul>
    </nav>
  );
}
