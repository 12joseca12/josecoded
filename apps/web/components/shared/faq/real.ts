import { hasDato } from '@/lib/content/dato';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

/**
 * The entries that may be shown in production and described in `FAQPage`: question and answer both
 * real. A pending answer is not a question the site can answer yet, so it is left out (SEO/GEO
 * analysis §3, «FAQPage solo con respuestas reales»).
 */
export function realFaq<T extends FaqEntry>(items: readonly T[]): T[] {
  return items.filter((item) => hasDato(item.question) && hasDato(item.answer));
}
