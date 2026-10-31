import { Pending } from '@/components/ui/pending';
import { isPendingDato } from '@/lib/content/dato';

/**
 * Text served already split for the intro fall (DT §1.6.4): an `sr-only` copy that assistive
 * technology reads from 0 ms, and an `aria-hidden` copy where each word is an indivisible `.w` and
 * each character a `.ch` with its final letter in `data-ch`. Without JavaScript, or after the
 * first visit, the letters are already in place; `IntroFall` only mutates their `style`, class and
 * `textContent`, so hydration never sees a structural change. Server Component on purpose.
 *
 * A pending `{{DATO}}` marker is not split (nothing falls): it goes through `Pending`, which shows
 * it in development and previews and renders nothing in production.
 */
export function FallText({
  as: Tag = 'span',
  text,
}: {
  as?: 'h1' | 'p' | 'span';
  text: string;
}) {
  if (isPendingDato(text)) {
    return (
      <Tag>
        <Pending>{text}</Pending>
      </Tag>
    );
  }

  return (
    <Tag>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((part, i) =>
          part.trim() === '' ? (
            part && ' '
          ) : (
            <span key={i} className="w">
              {Array.from(part, (ch, j) => (
                <span key={j} className="ch" data-ch={ch}>
                  {ch}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
