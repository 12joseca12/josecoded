import { Icon } from '@/components/ui/icon';

import styles from './link-row.module.css';

export interface ProfileLink {
  id: string;
  label: string;
  href: string;
  /** Own profile of the same person: `rel="me"` lets search engines join them to the entity. */
  own?: boolean;
}

/**
 * LinkedIn, GitHub and the CV in one row. Links to the visitor's own profiles carry `rel="me"` (SEO/GEO
 * analysis §2.0.8); a link with no URL yet is not rendered. These are plain anchors because the shared
 * link primitives take no `rel`.
 */
export function LinkRow({ label, links }: { label: string; links: readonly ProfileLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className={styles.row} aria-label={label}>
      {links.map((link) => (
        <li key={link.id}>
          <a href={link.href} className={styles.link} rel={link.own ? 'me noopener' : 'noopener'}>
            {link.label}
            <Icon name="arrow-right" />
          </a>
        </li>
      ))}
    </ul>
  );
}
