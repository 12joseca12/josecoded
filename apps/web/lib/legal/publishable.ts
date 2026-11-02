import { legalContent, legalStrings } from '@/content/legal';
import { isPendingDato } from '@/lib/content/dato';
import { env } from '@/lib/env';

import type { LegalDoc } from '@/content/legal';

/**
 * Whether a legal text may be shown as it stands: outside production anything renders (a preview
 * shows the markers), in production only a text with no `{{DATO}}` left.
 */
export function isLegalPublishable(doc: LegalDoc, locale: 'es' | 'en'): boolean {
  if (env.client.NEXT_PUBLIC_SITE_ENV !== 'production') return true;
  return !legalStrings(legalContent(doc, locale)).some(isPendingDato);
}

/** Both languages publishable (what the sitemap and the footer check, since links exist in both). */
export function isLegalPublishableEverywhere(doc: LegalDoc): boolean {
  return (['es', 'en'] as const).every((locale) => isLegalPublishable(doc, locale));
}

/**
 * The production build is the gate that makes Jose supply the owner's data (like `pageMetadata`
 * does for titles): it fails while a legal text holds a `{{DATO}}`.
 */
export function assertLegalPublishable(doc: LegalDoc, locale: 'es' | 'en'): void {
  if (!isLegalPublishable(doc, locale)) {
    throw new Error(`legal: /legal/${doc} (${locale}) still has a {{DATO}}; production cannot be built until it is supplied`);
  }
}
