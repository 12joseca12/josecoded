'use client';

import { useEffect, useState } from 'react';

import { Action } from '@/components/ui/action';
import { usePathname } from '@/i18n/navigation';
import { currentFor } from '@/lib/layout/nav';
import { observeActiveSection } from '@/lib/motion/active-section';

import styles from './nav-links.module.css';

import type { Href } from '@josecoded/types';

export interface NavLinkItem {
  href: Href;
  label: string;
  /** Id of the home scene this link stands for. */
  scene: string;
}

/**
 * Main navigation of the header. In an inner page the link of the page (or of the section it sits
 * in) carries `aria-current`. On the home, which is one page, the scene in view is marked only with
 * colour (`data-here`, README §16.1) and `aria-current` stays off.
 *
 * A11y: `nav` landmark named by `label`; links are plain anchors read by their text; contrast
 * text-2 on bg 7.9:1, current text 16.9:1.
 */
export function NavLinks({ items, label }: { items: readonly NavLinkItem[]; label: string }) {
  const pathname = usePathname();
  const onHome = pathname === '/';
  const [here, setHere] = useState<string | null>(null);

  useEffect(() => {
    if (!onHome) return;
    return observeActiveSection(
      items.map((item) => item.scene),
      setHere,
    );
  }, [onHome, items]);

  return (
    <nav aria-label={label} className={styles.links}>
      {items.map((item) => (
        <Action
          key={item.href}
          href={item.href}
          className={styles.link}
          aria-current={onHome ? undefined : currentFor(pathname, item.href)}
          data-here={onHome && here === item.scene ? 'true' : undefined}
        >
          {item.label}
        </Action>
      ))}
    </nav>
  );
}
