import type { SectionAvailability } from '@/lib/content/sections';

/** Key of `nav.*` in the messages: the label of the one header link that stands for Lab and/or Blog. */
export type NavLabelKey = 'labBlog' | 'lab' | 'blog';

/**
 * What the header and the menu call the Lab/Blog destination (pantallas v2.0 P22, home-v7 §4.4): «Lab/Blog» when both
 * exist, the one that exists otherwise, and `null` (no link at all) when neither does. It returns the message key,
 * never the words, so the texts stay in `messages/{es,en}`.
 */
export function navLabel({ lab, blog }: SectionAvailability): NavLabelKey | null {
  if (lab && blog) return 'labBlog';
  if (lab) return 'lab';
  if (blog) return 'blog';
  return null;
}
