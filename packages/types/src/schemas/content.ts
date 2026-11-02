import { z } from 'zod';

// Editable site content (task 1.8e, DATOS v1.4 §14.2, §14.5, D53). The admin edits drafts in Supabase; `content_publish()`
// validates them again in SQL (namespace list, {{DATO}} markers, object shape) and the gateway commits the files.

export const CONTENT_KINDS = ['message_override', 'faq', 'project', 'blog_post', 'settings'] as const;
export const PUBLICATION_STATUSES = ['queued', 'committed', 'deployed', 'failed'] as const;

/** Namespaces of `messages/<locale>/*.json` the admin may override: mirror of `content_publish()`. Never `auth`, `area`, `dev`. */
export const EDITABLE_NAMESPACES = ['home', 'services', 'partners', 'about', 'projects', 'contact', 'blog', 'lab', 'seo', 'common'] as const;
export const ADMIN_ONLY_NAMESPACES = ['auth', 'area', 'dev'] as const;

export const contentKindSchema = z.enum(CONTENT_KINDS);
const localeSchema = z.enum(['es', 'en']);

/** A text without a `{{DATO}}` placeholder: publishing refuses them. */
const publishableText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((v) => !v.includes('{{DATO'), { message: 'placeholder {{DATO}} cannot be published' });

export const FAQ_VIAS = ['hourly', 'fixed', 'packs', 'hiring', 'partners'] as const;

const messageOverride = z.object({
  kind: z.literal('message_override'),
  /** Dotted path of an existing key; the first segment must be an editable namespace. */
  key: z.string().regex(/^[a-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/).refine((k) => (EDITABLE_NAMESPACES as readonly string[]).includes(k.split('.')[0]!), {
    message: 'namespace not editable',
  }),
  locale: localeSchema,
  draft: z.object({ value: publishableText(5000) }),
});

const faq = z.object({
  kind: z.literal('faq'),
  key: z.string().trim().min(1).max(80),
  locale: localeSchema,
  draft: z.object({
    via: z.enum(FAQ_VIAS),
    question: publishableText(300),
    answer: publishableText(3000),
    sort: z.number().int().min(0),
    published: z.boolean(),
  }),
});

const projectTexts = z.object({
  oneLiner: publishableText(300),
  challenge: publishableText(3000),
  work: publishableText(3000),
  result: publishableText(3000),
});

const project = z.object({
  kind: z.literal('project'),
  /** Slug of `content/projects/*.json`: the entry overrides texts and visibility, it never creates projects. */
  key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  locale: z.null().optional(),
  draft: z.object({ es: projectTexts, en: projectTexts, published: z.boolean(), sort: z.number().int().min(0) }),
});

const blogPost = z.object({
  kind: z.literal('blog_post'),
  key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  locale: localeSchema,
  draft: z.object({
    title: publishableText(160),
    description: publishableText(300),
    kind: z.enum(['guide', 'note']),
    tags: z.array(z.string().trim().min(1).max(40)).max(12),
    labSlug: z.string().optional(),
    /** Markdown, not MDX: raw HTML and MDX nodes are rejected by the Server Action. */
    body_md: z.string().min(1).max(100_000).refine((v) => !v.includes('{{DATO'), { message: 'placeholder {{DATO}} cannot be published' }),
    published: z.boolean(),
    publishedAt: z.iso.datetime().optional(),
  }),
});

/** `settings`: sections on/off, the global switch of the prices and the scenes of the home. `hiddenPacks` is gone (D54). */
export const siteSettingsSchema = z.object({
  sections: z.object({ lab: z.boolean(), blog: z.boolean(), partners: z.boolean(), projects: z.boolean(), chat: z.boolean() }),
  prices: z.object({ showPrices: z.boolean() }),
  home: z.object({ scenes: z.array(z.string().min(1)) }),
});

const settings = z.object({
  kind: z.literal('settings'),
  key: z.literal('settings'),
  locale: z.null().optional(),
  draft: siteSettingsSchema,
});

/** What `content_save_draft(kind, key, locale, draft)` receives, validated by kind. */
export const contentEntrySchema = z.discriminatedUnion('kind', [messageOverride, faq, project, blogPost, settings]);
