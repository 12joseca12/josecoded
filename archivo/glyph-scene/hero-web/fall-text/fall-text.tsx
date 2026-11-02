import { Pending, isPendingVisible } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Whitespace that separates words: any space except the non-breaking ones, which glue words. */
const WORD_GAP = /((?:(?![\u00A0\u202F\u2007])\s)+)/;
const IS_GAP = /^(?:(?![\u00A0\u202F\u2007])\s)+$/;

/**
 * Text served already split for the intro fall (DT §1.6.4): an `sr-only` copy that assistive
 * technology reads from 0 ms, and an `aria-hidden` copy where each word is an indivisible `.w` and
 * each character a `.ch` with its final letter in `data-ch`. Without JavaScript, or after the
 * first visit, the letters are already in place; `IntroFall` only mutates their `style`, class and
 * text (`nodeValue`), so hydration never sees a structural change. Server Component on purpose.
 *
 * A pending `{{DATO}}` marker is not split (nothing falls): it goes through `Pending`, which shows
 * it in development and previews; in production nothing is rendered at all, not even an empty `Tag`
 * (an empty heading is an accessibility error).
 *
 * Duplicated text: the `sr-only` copy is `user-select: none` (globals.css) and the letters are
 * `aria-hidden`, so a screen reader reads the text once and copy/paste gets it once. The prototype's
 * `aria-label` on the container is not used because it is prohibited on `p` and `span`.
 *
 * Splitting: the text is NFC-normalised and cut by grapheme (`Intl.Segmenter`), so a combining
 * accent or a ZWJ emoji is one falling character; non-breaking spaces stay inside their word.
 */
export function FallText({
  as: Tag = 'span',
  text,
}: {
  as?: 'h1' | 'p' | 'span';
  text: string;
}) {
  if (isPendingDato(text)) {
    if (!isPendingVisible()) return null;
    return (
      <Tag>
        <Pending>{text}</Pending>
      </Tag>
    );
  }

  const clean = text.normalize('NFC');

  return (
    <Tag>
      <span className="sr-only">{clean}</span>
      <span aria-hidden="true">
        {clean.split(WORD_GAP).map((part, i) =>
          IS_GAP.test(part) ? (
            ' '
          ) : part === '' ? null : (
            <span key={i} className="w">
              {Array.from(segmenter.segment(part), ({ segment }, j) => (
                <span key={j} className="ch" data-ch={segment}>
                  {segment}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
