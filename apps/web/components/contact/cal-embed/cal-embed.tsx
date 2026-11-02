'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

import styles from './cal-embed.module.css';

/**
 * The 20-minute call. Nothing of Cal.com is loaded until the visitor asks for it: the button mounts
 * the booking page in an iframe (`frame-src` of the CSP allows cal.com); until then the HTML holds a
 * button and a plain link to the same page. `booking_open` is sent when it opens.
 *
 * A11y: a real button; the iframe has a title; the link to cal.com is always there as the way out
 * (also without JavaScript); when the booking opens, focus moves to its container (the button that
 * had it is gone), which is a named region.
 */
export function CalEmbed({
  calLink,
  origin,
  labels,
}: {
  /** `josecoded/20min` (`NEXT_PUBLIC_CAL_LINK`). */
  calLink: string;
  origin: string;
  labels: { open: string; title: string; external: string };
}) {
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) frame.current?.focus();
  }, [open]);
  const href = `https://cal.com/${calLink}`;

  return (
    <div className={styles.box}>
      {open ? (
        <div ref={frame} className={styles.region} role="region" aria-label={labels.title} tabIndex={-1}>
          <iframe
            className={styles.frame}
            src={`${href}?embed=true&theme=dark&layout=month_view`}
            title={labels.title}
            loading="lazy"
          />
        </div>
      ) : (
        <Button
          icon="calendar"
          onClick={() => {
            track('booking_open', { origin });
            setOpen(true);
          }}
        >
          {labels.open}
        </Button>
      )}
      <ArrowLink href={href as never} emphasis="strong">
        {labels.external}
      </ArrowLink>
    </div>
  );
}
