import { z } from 'zod';

import aviso_en from './aviso-legal.en.json';
import aviso_es from './aviso-legal.es.json';
import cookies_en from './cookies.en.json';
import cookies_es from './cookies.es.json';
import privacy_en from './privacidad.en.json';
import privacy_es from './privacidad.es.json';

// The three legal texts, in Spanish (the one that is legally binding) and English (courtesy translation), as data:
// sections of paragraphs and lists, rendered by `app/[locale]/(public)/legal/[doc]`. Text Jose still has to supply
// (owner name, NIF, address, email) is a `{{DATO}}` marker; a legal text with a marker is not published in production.

export const LEGAL_DOCS = ['aviso-legal', 'privacidad', 'cookies'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

const docSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(155),
  updated: z.iso.date(),
  sections: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        heading: z.string().min(1),
        paragraphs: z.array(z.string().min(1)).optional(),
        items: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1),
});

export type LegalContent = z.infer<typeof docSchema>;

const all = {
  'aviso-legal': { es: aviso_es, en: aviso_en },
  privacidad: { es: privacy_es, en: privacy_en },
  cookies: { es: cookies_es, en: cookies_en },
} as const;

export function legalContent(doc: LegalDoc, locale: 'es' | 'en'): LegalContent {
  return docSchema.parse(all[doc][locale]);
}

/** Every string of a text, to look for markers. */
export function legalStrings(content: LegalContent): string[] {
  return content.sections.flatMap((section) => [section.heading, ...(section.paragraphs ?? []), ...(section.items ?? [])]);
}
