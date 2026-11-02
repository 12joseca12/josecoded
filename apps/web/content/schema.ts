import { z } from 'zod';

import { FAQ_VIAS } from '@josecoded/types';

// Structure of the versioned content that is not a project (task 3.1). Texts of the interface live in `messages`; this
// is what the pages iterate (which ways, which steps, which questions), validated when it is loaded.

const anchor = z.string().regex(/^[a-z][a-z0-9-]*$/);
const localized = z.object({ es: anchor, en: anchor });

export const WAY_CODES = ['hourly', 'fixed', 'packs', 'hiring'] as const;
export const PRIMARY_ACTIONS = ['book', 'proposal'] as const;
export const SECONDARY_ACTIONS = ['assistant', 'whatsapp', 'cv', 'linkedin', 'email'] as const;

/** `/servicios`: the four ways, their anchors per language and their actions (PANT P20). */
export const servicesContentSchema = z.object({
  ways: z
    .array(
      z.object({
        code: z.enum(WAY_CODES),
        anchor: localized,
        icon: z.enum(['clock', 'package-check', 'store', 'briefcase']),
        primaryAction: z.enum(PRIMARY_ACTIONS),
        secondaryActions: z.array(z.enum(SECONDARY_ACTIONS)),
      }),
    )
    .length(WAY_CODES.length),
  process: z.array(anchor).min(3),
});

/** `/partners`: the blocks of the page (PANT P21); their texts are `partners.*` in messages. */
export const partnersContentSchema = z.object({
  cells: z.array(anchor).length(3),
  steps: z.array(anchor).min(3),
  fit: z.object({ yes: z.array(anchor).min(1), no: z.array(anchor).min(1) }),
});

export const faqFileSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    via: z.enum(FAQ_VIAS),
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(3000),
  }),
);

export type ServicesContent = z.infer<typeof servicesContentSchema>;
export type PartnersContent = z.infer<typeof partnersContentSchema>;
export type FaqFile = z.infer<typeof faqFileSchema>;
