import { Action } from '@/components/ui/action';

import { NavLinksState } from './nav-links-state';
import styles from './nav-links.module.css';

import type { Href } from '@josecoded/types';

export interface NavLinkItem {
  href: Href;
  label: string;
  /** Id of the home scene this link stands for. */
  scene: string;
}

export const NAV_LINKS_ID = 'primary-nav';

/**
 * Main navigation of the header. Server Component: the links are plain anchors in the HTML. The one
 * client island, `NavLinksState`, marks the current one after hydration: in an inner page the link
 * of the page (or of the section it sits in) carries `aria-current`; on the home, which is one
 * page, the scene in view is marked only with colour (`data-here`, README §16.1) and
 * `aria-current` stays off.
 *
 * A11y: `nav` landmark named by `label`; links are plain anchors read by their text; contrast
 * text-2 on bg 7.9:1, current text 16.9:1.
 */
export function NavLinks({ items, label }: { items: readonly NavLinkItem[]; label: string }) {
  return (
    <nav id={NAV_LINKS_ID} aria-label={label} className={styles.links}>
      {items.map((item) => (
        <Action key={item.href} href={item.href} className={styles.link} data-href={item.href} data-scene={item.scene}>
          {item.label}
        </Action>
      ))}
      <NavLinksState navId={NAV_LINKS_ID} />
    </nav>
  );
}
