import { collectTexts } from '@/lib/content/texts';

import type { PublishedText, TextEntry, TextPair } from '@/lib/content/texts';
import type { EditableNamespace } from '@josecoded/types';

type Tree = { [key: string]: unknown };

/**
 * The real list of editable texts (from the catalogs) with four of the services page dressed as the states D2 Textos
 * has: a draft nobody published, an override that is live, a live one with a newer draft over it, and the rest as they
 * are. The overrides are made up; the keys and base texts are the site's.
 */
export function previewTexts(es: Tree, en: Tree): {
  entries: TextEntry[];
  published: Record<string, PublishedText>;
  drafts: Record<string, TextPair>;
  namespace: EditableNamespace;
  elsewhere: number;
} {
  const live = {
    'services.head.accent': { es: 'Por horas, por encargo, con packs o dentro de tu equipo.', en: 'Hourly, fixed-price, packs or inside your team.', version: 3 },
    'services.head.proposal': { es: 'Pide una propuesta orientativa', en: '', version: 3 },
  } satisfies Record<string, PublishedText>;
  return {
    entries: collectTexts(es, en),
    published: live,
    drafts: {
      'services.head.lead': { es: 'Desarrollador freelance. Cuatro formas de trabajar contigo.', en: 'Freelance developer. Four ways to work with you.' },
      'services.head.proposal': { es: 'Pide una propuesta, sin compromiso', en: '' },
    },
    namespace: 'services',
    elsewhere: 2,
  };
}
