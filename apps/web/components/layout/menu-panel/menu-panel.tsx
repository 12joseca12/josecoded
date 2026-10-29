import { Action } from '@/components/ui/action';

import styles from './menu-panel.module.css';

import type { PrimitiveActionProps } from '@/components/ui/action';
import type { ReactNode, Ref } from 'react';

/**
 * The floating sheet under a header button (mobile menu, account menu): overlay material, 17rem,
 * it enters from its button in 180 ms and does not animate with reduced motion. It starts hidden;
 * `createDisclosure` (`lib/motion/disclosure.ts`) shows and hides it, so the attribute is never
 * driven by React state. The semantics (a `nav`, a group) go inside, on the element that owns them.
 */
export function MenuPanel({
  id,
  ref,
  children,
}: {
  id: string;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div id={id} ref={ref} className={styles.panel} hidden>
      {children}
    </div>
  );
}

export type MenuItemProps = PrimitiveActionProps & {
  /** The one emphasised exit of the panel (Contacto in the mobile menu). */
  highlighted?: boolean;
  /** Draws a hairline above: starts a new group. */
  separated?: boolean;
};

/**
 * A 2.75 rem row. Same polymorphism as `Button`: `href` makes it a link, otherwise a button.
 *
 * A11y: native role; name from its text; `aria-current` is passed by the caller; hit area
 * 2.75 rem; the focus ring comes from `:focus-visible`.
 */
export function MenuItem({ highlighted = false, separated = false, ...rest }: MenuItemProps) {
  return (
    <Action
      {...rest}
      className={styles.item}
      data-highlighted={highlighted ? 'true' : undefined}
      data-separated={separated ? 'true' : undefined}
    />
  );
}
