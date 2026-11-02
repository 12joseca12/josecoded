import { JsonLd } from '@/components/seo';
import { Pending, isPendingVisible } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';
import { faqJsonLd, graphOf } from '@/lib/seo/jsonld';

import styles from './faq.module.css';
import { realFaq } from './real';

import type { FaqEntry } from './real';

/**
 * Questions and answers as native `<details>` (one per question; no script). With `jsonLd`, it emits
 * the `FAQPage` of exactly the entries it shows, with the same text. Pending entries are left out in
 * production and shown as a marker in development; they never reach the structured data. Answers
 * may hold several paragraphs separated by a blank line.
 *
 * A11y: `summary` is the control (Enter/Space, a visible focus ring, 2.75 rem target); each answer
 * is plain text inside its `details`; the list is a `ul` so a screen reader counts the questions.
 */
export function Faq({ items, jsonLd = true }: { items: readonly FaqEntry[]; jsonLd?: boolean }) {
  const real = realFaq(items);
  const shown = isPendingVisible() ? items : real;
  if (shown.length === 0) return null;

  return (
    <>
      <ul className={styles.list}>
        {shown.map((item) => {
          const pending = isPendingDato(item.question) || isPendingDato(item.answer);
          return (
            <li key={item.id} className={styles.item}>
              <details className={styles.details} data-pending={pending ? '' : undefined}>
                <summary className={styles.summary}>
                  {isPendingDato(item.question) ? <Pending>{item.question}</Pending> : item.question}
                </summary>
                <div className={styles.answer}>
                  {isPendingDato(item.answer) ? (
                    <Pending>{item.answer}</Pending>
                  ) : (
                    item.answer.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      {jsonLd ? <FaqJsonLd items={real} /> : null}
    </>
  );
}

/** The `FAQPage` of a page whose questions are spread over several `Faq` blocks (one per way). */
export function FaqJsonLd({ items }: { items: readonly FaqEntry[] }) {
  const node = faqJsonLd(items.map(({ question, answer }) => ({ question, answer })));
  return node ? <JsonLd data={graphOf(node)} /> : null;
}
