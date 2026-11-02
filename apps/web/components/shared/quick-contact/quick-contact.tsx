'use client';

import { CopyField } from '@/components/shared/copy-field';
import { TrackClick } from '@/components/shared/track-click';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

import styles from './quick-contact.module.css';

import type { Href } from '@josecoded/types';

export interface QuickContactLabels {
  /** Accessible name of the group. */
  group: string;
  whatsapp: string;
  book: string;
  linkedin: string;
  email: string;
  copy: string;
  copied: string;
  failed: string;
}

/**
 * The fast ways to reach Jose in one row: WhatsApp, a 20-minute call, email (with copy) and
 * LinkedIn. A way without data is not rendered (never a dead button). Each way sends
 * `quick_contact { channel, page }`. The same row serves `/partners`, `/contacto` and the chat.
 * `primary` picks which link is the page's one violet action; the others are ghost.
 *
 * A11y: a named group; every way is a real link or button with a visible name; the email is plain
 * text plus a copy button whose result is announced.
 */
export function QuickContact({
  page,
  labels,
  whatsapp,
  book,
  email,
  linkedin,
  primary,
}: {
  /** Where it is shown (`partners`, `contact`, `chat`): the event says it. */
  page: string;
  labels: QuickContactLabels;
  whatsapp?: Href;
  book?: Href;
  email?: string;
  linkedin?: Href;
  primary?: 'whatsapp' | 'book';
}) {
  return (
    <div className={styles.row} role="group" aria-label={labels.group} data-testid="quick-contact">
      {whatsapp ? (
        <TrackClick event="quick_contact" data={{ channel: 'whatsapp', page }}>
          <Button href={whatsapp} variant={primary === 'whatsapp' ? 'solid' : 'ghost'} icon="message-circle">
            {labels.whatsapp}
          </Button>
        </TrackClick>
      ) : null}
      {book ? (
        <TrackClick event="quick_contact" data={{ channel: 'book', page }}>
          <Button href={book} variant={primary === 'book' ? 'solid' : 'ghost'} icon="calendar">
            {labels.book}
          </Button>
        </TrackClick>
      ) : null}
      {linkedin ? (
        <TrackClick event="quick_contact" data={{ channel: 'linkedin', page }}>
          <ArrowLink href={linkedin} emphasis="strong">
            {labels.linkedin}
          </ArrowLink>
        </TrackClick>
      ) : null}
      {email ? (
        <CopyField
          label={labels.email}
          value={email}
          labels={{ copy: labels.copy, copied: labels.copied, failed: labels.failed }}
          onCopy={() => track('quick_contact', { channel: 'email', page })}
        />
      ) : null}
    </div>
  );
}
