import { z } from 'zod';

// Shape of .impeccable/design.json as far as tokens are concerned. Descriptive parts
// (narrative, components, colorMeta, typographyMeta, motion, breakpoints) are not read.

const text = z.string().min(1);
const group = z.record(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), text);

const entry = z.object({
  name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  value: text,
  purpose: z.string().optional(),
});
const entries = z.array(entry);

const typographyRole = z.object({
  family: z.enum(['sans', 'mono']),
  fontSize: text,
  fontWeight: z.number(),
  lineHeight: z.number().optional(),
  letterSpacing: text.optional(),
  fontFeature: text.optional(),
});

export const designSchema = z.object({
  colors: group,
  fontFamilies: z.object({ sans: text, mono: text }),
  typography: z.record(z.string(), typographyRole),
  rounded: group,
  spacing: group,
  sizes: group,
  extensions: z.object({
    alphas: entries,
    shadows: entries,
    blurs: entries,
    durations: entries,
    easings: entries,
    scroll: entries,
    layers: entries,
    viewport: entries,
    containers: entries,
    gradients: entries,
    lights: entries,
  }),
});

export type Design = z.infer<typeof designSchema>;
