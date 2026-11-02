import { CopyField } from '@/components/shared/copy-field';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';

import styles from './hiring-card.module.css';

import type { Href } from '@josecoded/types';

export interface HiringCardLabels {
  title: string;
  cv: string;
  book: string;
  assistant: string;
  linkedin: string;
  email: string;
  copy: string;
  copied: string;
  failed: string;
}

/**
 * The card of the hiring way: CV (only if the PDF exists), a 20-minute call, the assistant in its
 * recruiter case, LinkedIn and the email with a copy button. A way without data is not rendered;
 * no salary, no availability is stated here (D47).
 *
 * A11y: a `section` named by its `h3`; the actions are real links in the order solid, then the
 * secondary ones; the email is plain text with a copy button that announces the result.
 */
export function HiringCard({
  labels,
  cv,
  book,
  assistant,
  linkedin,
  email,
}: {
  labels: HiringCardLabels;
  cv?: Href;
  book?: Href;
  assistant: Href;
  linkedin?: Href;
  email?: string;
}) {
  return (
    <Surface as="section" aria-labelledby="hiring-card-title">
      <div className={styles.card}>
        <h3 id="hiring-card-title" className={styles.title}>
          {labels.title}
        </h3>
        <div className={styles.actions}>
          {book ? (
            <Button href={book} icon="calendar">
              {labels.book}
            </Button>
          ) : null}
          {cv ? (
            <Button href={cv} variant="ghost" icon="download">
              {labels.cv}
            </Button>
          ) : null}
          <ArrowLink href={assistant} emphasis="strong">
            {labels.assistant}
          </ArrowLink>
          {linkedin ? (
            <ArrowLink href={linkedin} emphasis="strong">
              {labels.linkedin}
            </ArrowLink>
          ) : null}
        </div>
        {email ? (
          <CopyField
            label={labels.email}
            value={email}
            labels={{ copy: labels.copy, copied: labels.copied, failed: labels.failed }}
          />
        ) : null}
      </div>
    </Surface>
  );
}
