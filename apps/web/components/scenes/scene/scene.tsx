import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import reveal from './reveal.module.css';
import styles from './scene.module.css';

import type { ReactNode } from 'react';

/**
 * One screen of the home (UX v4.0 §4.1): a two-tone `h2` and, to its right, an optional aside
 * (a link to another page), then the scene's content, usually a `Bento`. `fill` makes it a whole
 * screen tall, which only the home wants; elsewhere a scene is as tall as its content.
 *
 * A11y: a `section` named by its own `h2` (a landmark that screen readers list); the heading text is
 * the full two-tone sentence. The id is the anchor the header and the section indicator point to.
 */
export function Scene({
  id,
  lead,
  tail,
  aside,
  fill = false,
  children,
}: {
  id: string;
  lead: ReactNode;
  tail: ReactNode;
  aside?: ReactNode;
  fill?: boolean;
  children: ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      className={styles.scene}
      aria-labelledby={titleId}
      data-fill={fill ? 'true' : undefined}
      data-snap={fill ? '' : undefined}
    >
      <header className={`${styles.head} ${reveal.item}`}>
        <TwoToneHeading lead={lead} tail={tail} id={titleId} />
        {aside}
      </header>
      {children}
    </section>
  );
}

/** The aside of a scene head: a short question and the link that answers it. */
export function SceneAside({ children }: { children: ReactNode }) {
  return <p className={styles.aside}>{children}</p>;
}
