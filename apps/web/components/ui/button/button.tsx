import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';

import styles from './button.module.css';

import type { PrimitiveActionProps } from '@/components/ui/action';
import type { ButtonSize, ButtonVariant, IconName } from '@josecoded/types';

type ButtonBase = {
  /** `solid` is the one violet action of a view; `ghost` is its sibling (never the only action). */
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type WithLabel = ButtonBase & {
  iconOnly?: false;
  icon?: IconName;
  /** An icon after the label (a «Siguiente ›»). */
  iconAfter?: IconName;
};

/** An icon-only button has no text, so its translated `aria-label` is mandatory. */
type IconOnly = ButtonBase & { iconOnly: true; icon: IconName; 'aria-label': string };

export type ButtonProps = (WithLabel | IconOnly) & PrimitiveActionProps;

/**
 * Pill button. With `href` it is a link (`<a>`), without it a `<button type="button">`; the
 * disabled state exists only on the button form. The label sits in `[data-slot='label']` so that a
 * layout can hide it at narrow widths and leave the icon.
 *
 * A11y: native role from the element; name from its content (or `aria-label` when `iconOnly`);
 * keyboard Enter/Space on the button, Enter on the link; focus ring from `:focus-visible`;
 * `disabled` removes it from the tab order; pressing scales to 0.97 unless reduced motion.
 */
export function Button({
  variant = 'solid',
  size = 'md',
  iconOnly = false,
  icon,
  children,
  ...rest
}: ButtonProps) {
  const { iconAfter, ...action } = rest as typeof rest & { iconAfter?: IconName };
  return (
    <Action
      {...action}
      className={styles.btn}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly ? 'true' : undefined}
    >
      {icon ? <Icon name={icon} /> : null}
      {iconOnly ? null : <span data-slot="label">{children}</span>}
      {iconAfter && !iconOnly ? <Icon name={iconAfter} /> : null}
    </Action>
  );
}
