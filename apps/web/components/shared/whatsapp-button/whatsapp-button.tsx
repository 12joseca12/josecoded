'use client';

import { TrackClick } from '@/components/shared/track-click';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';

import type { Href } from '@josecoded/types';

/**
 * «Escribir por WhatsApp»: a link to `wa.me/<number>?text=<prefilled>` and the `whatsapp_click`
 * event with the page it was clicked on and the pack, if any. The prefilled text arrives already
 * translated (and ends with `(ref XXX)` when the visitor came with an accepted referral code). With
 * no number the page does not render it; the number is a required public variable, so that only
 * happens in tests.
 */
export function WhatsAppButton({
  href,
  label,
  origin,
  pack,
  variant = 'button',
}: {
  href: Href;
  label: string;
  origin: string;
  pack?: string;
  variant?: 'button' | 'link';
}) {
  return (
    <TrackClick event="whatsapp_click" data={pack ? { origin, pack } : { origin }}>
      {variant === 'button' ? (
        <Button href={href} icon="message-circle">
          {label}
        </Button>
      ) : (
        <ArrowLink href={href} emphasis="strong" icon="message-circle">
          {label}
        </ArrowLink>
      )}
    </TrackClick>
  );
}
