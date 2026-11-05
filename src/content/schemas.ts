import { z } from "zod";

const placeholder = /\{\{DATO[^}]*\}\}/;

const pendingPattern = /^\{\{DATO[^}]*\}\}$/;

export const isPending = (value: unknown): boolean =>
  typeof value === "string" && pendingPattern.test(value);

const pending = z.string().regex(pendingPattern);
const orPending = <T extends z.ZodType>(schema: T) => z.union([schema, pending]);

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");
const urlOrPlaceholder = z
  .string()
  .refine((value) => placeholder.test(value) || URL.canParse(value), "must be a URL");
const pathOrPlaceholder = z
  .string()
  .refine((value) => placeholder.test(value) || value.startsWith("/"), "must start with /");

export const projectStatuses = ["live", "wip", "archived"] as const;

export const projectSchema = z.strictObject({
  title: text,
  slug,
  summary: text,
  role: text,
  stack: z.array(text).min(1),
  year: z.number().int().min(2000).max(2100),
  links: z.array(z.strictObject({ label: text, href: urlOrPlaceholder })).default([]),
  cover: z.strictObject({ src: pathOrPlaceholder, alt: text }).optional(),
  featured: z.boolean().default(false),
  order: z.number().int().min(0),
  status: z.enum(projectStatuses),
});

export const blogSchema = z.strictObject({
  title: text,
  slug,
  description: text,
  date: z.iso.date(),
  tags: z.array(text).default([]),
  draft: z.boolean().default(false),
});

export const legalSchema = z.strictObject({
  title: text,
  updated: z.iso.date(),
  draft: z.boolean().default(false),
  summary: z.array(text).max(5).default([]),
});

export const stackGroups = ["mobile", "web", "backend", "ai", "quality", "tools"] as const;
export const stackLevels = ["working", "proficient", "advanced"] as const;
export const educationKinds = ["degree", "certification", "course"] as const;

const stackItemSchema = z.strictObject({
  name: text,
  years: orPending(z.number().int().min(0).max(40)).optional(),
  level: orPending(z.enum(stackLevels)).optional(),
});

export const cvSchema = z
  .strictObject({
    stack: z
      .array(
        z.strictObject({
          group: z.enum(stackGroups),
          items: z.array(stackItemSchema).min(1),
        }),
      )
      .min(1),
    experience: z.array(
      z.strictObject({
        period: orPending(text),
        role: orPending(text),
        organization: orPending(text),
        summary: orPending(text),
        highlights: z.array(text).default([]),
      }),
    ),
    education: z.array(
      z.strictObject({
        title: orPending(text),
        period: orPending(text).optional(),
        organization: orPending(text).optional(),
        kind: z.enum(educationKinds).optional(),
      }),
    ),
    file: z.strictObject({ es: pathOrPlaceholder, en: pathOrPlaceholder }),
  })
  .refine(
    (cv) => new Set(cv.stack.map((entry) => entry.group)).size === cv.stack.length,
    "stack groups must be unique",
  );

export const contentSchemas = {
  projects: projectSchema,
  blog: blogSchema,
  legal: legalSchema,
} as const;

export type ContentType = keyof typeof contentSchemas;
export const contentTypes = Object.keys(contentSchemas) as ContentType[];

export type ProjectMeta = z.infer<typeof projectSchema>;
export type BlogMeta = z.infer<typeof blogSchema>;
export type LegalMeta = z.infer<typeof legalSchema>;
export type Cv = z.infer<typeof cvSchema>;
export type StackGroup = (typeof stackGroups)[number];
export type StackLevel = (typeof stackLevels)[number];
