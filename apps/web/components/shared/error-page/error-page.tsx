import styles from './error-page.module.css';

import type { ReactNode } from 'react';

/**
 * The page for an error (404, 500): the code above the title, a sentence that says what happened and what
 * to do, the main action and a few useful links (never «Contacto» of the header: pantallas v2.0 P19). No
 * hooks and no providers, so the 404 route, the error boundary and the root 404 can all use it.
 *
 * A11y: the `h1` is the title alone (the code is a separate paragraph above it); actions and links are
 * real links or buttons in reading order.
 */
export function ErrorPage({
  code,
  title,
  text,
  actions,
  linksLabel,
  links,
}: {
  code: string;
  title: string;
  text: string;
  actions: ReactNode;
  linksLabel?: string;
  links?: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <p className={styles.code}>{code}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{text}</p>
      <div className={styles.actions}>{actions}</div>
      {links ? (
        <p className={styles.links}>
          {linksLabel} {links}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A plain anchor for the error pages: a 404 is rendered as a client shell and a soft navigation started
 * before the router is ready goes nowhere, so these links do a full page load.
 */
export function ErrorLink({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a href={href} className={styles.link} data-primary={primary ? 'true' : undefined}>
      {children}
    </a>
  );
}
