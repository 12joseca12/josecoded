import { z } from "zod";

const placeholder = /\{\{DATO[^}]*\}\}/;

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
});

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
