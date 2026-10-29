'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './site-header.module.css';

import type { ReactNode } from 'react';

/**
 * The `<header>` element of the site plus the island that tells it when the page has scrolled past
 * 80 px: an invisible sentinel of that height at the top of the document, watched with an
 * `IntersectionObserver` (no scroll listener). The header's content arrives as `children`, already
 * rendered on the server. It is transparent over the hero and gains the indigo band, the blur and
 * a hairline once the sentinel is out of view.
 */
export function HeaderScrollState({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
      <header className={styles.header} data-scrolled={scrolled ? 'true' : undefined}>
        {children}
      </header>
    </>
  );
}
