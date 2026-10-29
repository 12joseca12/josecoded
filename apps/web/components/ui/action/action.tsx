import { Link } from '@/i18n/navigation';
import { isInternalHref, toLinkTarget } from '@/lib/href';

import type { LinkOrButtonProps } from '@josecoded/types';
import type { AriaAttributes, ComponentProps, MouseEvent, ReactNode } from 'react';

type LinkHref = ComponentProps<typeof Link>['href'];

/** What every action-like primitive forwards to its root: no `style` on purpose. */
type ActionCommon = AriaAttributes & {
  id?: string;
  title?: string;
  children?: ReactNode;
};

/** The props a primitive built on `Action` accepts: no `className`, the primitive owns its styles. */
export type PrimitiveActionProps = ActionCommon & LinkOrButtonProps<MouseEvent<HTMLButtonElement>>;

export type ActionProps = PrimitiveActionProps & { className?: string };

/**
 * The root element behind `Button`, `ArrowLink` and the triggers (working-agreements §15.3).
 * With `href` it is a link: the localized next-intl `Link` for a route of this site, a plain `<a>`
 * for `#hash`, `https:`, `mailto:` and `tel:`. Without it, a `<button type="button">`. The union in
 * `ActionProps` keeps `onClick`, `type` and `disabled` off a link.
 */
export function Action({ href, type = 'button', onClick, disabled, ...rest }: ActionProps) {
  if (href === undefined) {
    return <button type={type} onClick={onClick} disabled={disabled} {...rest} />;
  }
  if (isInternalHref(href)) {
    return <Link href={toLinkTarget(href) as LinkHref} {...rest} />;
  }
  return <a href={href} {...rest} />;
}
