'use client';

import { Link, usePathname } from '@/i18n/navigation';

import styles from './site-header.module.css';

/**
 * The brand. On the home, which is one page, it goes back to the top of it (`#top`, README §16.1 of
 * the prototype); on any other page it goes to the home. Client island only for the pathname.
 */
export function BrandLink({ label, name }: { label: string; name: string }) {
  const onHome = usePathname() === '/';
  return onHome ? (
    <a href="#top" className={styles.brand} aria-label={label}>
      {name}
    </a>
  ) : (
    <Link href="/" className={styles.brand} aria-label={label}>
      {name}
    </Link>
  );
}
