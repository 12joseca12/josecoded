import { hasDato } from '@/lib/content/dato';

/**
 * A fact about Jose (name, city, photo, CV…) from `messages` `facts.*`, read with `t.raw`. While it
 * is still a `{{DATO}}` marker, `ready` is false and `value` is the marker itself: the scene shows
 * it as a pending note in development and leaves the piece out in production.
 */
export function readFact(raw: unknown): { value: string; ready: boolean } {
  const value = String(raw);
  return { value, ready: hasDato(value) };
}
