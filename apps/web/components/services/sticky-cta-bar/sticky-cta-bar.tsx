'use client';

import { useEffect, useRef, useState } from 'react';

import { TrackClick } from '@/components/shared/track-click';
import { Button } from '@/components/ui/button';
import { useStickyOffset } from '@/lib/layout/sticky-offset';

import styles from './sticky-cta-bar.module.css';

import type { Href } from '@josecoded/types';

/**
 * The only fixed bar of the site (pantallas v2.0): on a phone, while the packs are on screen, a
 * WhatsApp button and a proposal button stay within thumb reach. Above the tablet breakpoint it is
 * not drawn. It watches the section with an `IntersectionObserver`; the bar is `inert` while hidden
 * so Tab never lands on an invisible button.
 *
 * A11y: a named group of two real links; hidden means `inert` and `visibility: hidden`; it respects
 * the safe area at the bottom of the screen; no motion with reduced motion.
 */
export function StickyCtaBar({
  watch,
  label,
  whatsapp,
  proposal,
  labels,
}: {
  /** Id of the section that shows the bar. */
  watch: string;
  label: string;
  whatsapp?: Href;
  proposal: Href;
  labels: { whatsapp: string; proposal: string };
}) {
  const [visible, setVisible] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  // while shown, the bar covers the bottom edge: focus and anchors stay above it (scroll-padding-block-end)
  useStickyOffset(bar, 'bottom', visible);

  useEffect(() => {
    const section = document.getElementById(watch);
    if (!section || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false));
    observer.observe(section);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <div ref={bar} role="group" aria-label={label} className={styles.bar} data-visible={visible ? 'true' : undefined} inert={!visible}>
      {whatsapp ? (
        <TrackClick event="whatsapp_click" data={{ origin: 'services-sticky', pack: 'any' }}>
          <Button href={whatsapp} variant="ghost" icon="message-circle">
            {labels.whatsapp}
          </Button>
        </TrackClick>
      ) : null}
      <Button href={proposal} icon="sparkles">
        {labels.proposal}
      </Button>
    </div>
  );
}
