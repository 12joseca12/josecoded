import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';

import styles from './arrow-link.module.css';

import type { PrimitiveActionProps } from '@/components/ui/action';
import type { ArrowLinkEmphasis, ArrowLinkSize, IconName } from '@josecoded/types';

export type ArrowLinkProps = PrimitiveActionProps & {
  /** `regular` (500) closes the hero; `strong` (550) is the exit of a bento cell. */
  emphasis?: ArrowLinkEmphasis;
  size?: ArrowLinkSize;
  /** Trailing icon; the arrow by default, `download` or `message-circle` for those actions. */
  icon?: IconName;
};

/**
 * Text link with a trailing icon that moves 3 px on hover (fine pointer only, never with reduced
 * motion). It is the secondary exit of hero and cells, so it never carries a solid background.
 * Same polymorphism as `Button`: `href` makes it a link, otherwise it is a `<button type="button">`.
 *
 * A11y: name from its text (the icon is `aria-hidden`); Enter on the link, Enter/Space on the
 * button; focus ring from `:focus-visible`; contrast `violet-soft` on `bg` 9.6:1 (DESIGN.md).
 */
export function ArrowLink({
  emphasis = 'regular',
  size = 'inherit',
  icon = 'arrow-right',
  children,
  ...rest
}: ArrowLinkProps) {
  return (
    <Action {...rest} className={styles.link} data-emphasis={emphasis} data-size={size}>
      {children}
      <Icon name={icon} />
    </Action>
  );
}
