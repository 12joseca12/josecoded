import type { LegalMeta } from "@/content/schemas";
import type { MessageKey } from "@/i18n/keys.generated";

export interface LegalPage {
  title: MessageKey;
  description: MessageKey;
  indexable: boolean;
}

export const legalPages = {
  "aviso-legal": {
    title: "legal.pages.notice.metaTitle",
    description: "legal.pages.notice.metaDescription",
    indexable: true,
  },
  privacidad: {
    title: "legal.pages.privacy.metaTitle",
    description: "legal.pages.privacy.metaDescription",
    indexable: true,
  },
  cookies: {
    title: "legal.pages.cookies.metaTitle",
    description: "legal.pages.cookies.metaDescription",
    indexable: false,
  },
} as const satisfies Record<string, LegalPage>;

export type LegalSlug = keyof typeof legalPages;

export const legalSlugs = Object.keys(legalPages) as LegalSlug[];

export function isLegalSlug(value: string): value is LegalSlug {
  return value in legalPages;
}

export function isLegalIndexed(slug: LegalSlug, meta: Pick<LegalMeta, "draft">): boolean {
  return legalPages[slug].indexable && !meta.draft;
}

export function legalPath(slug: LegalSlug): string {
  return `/legal/${slug}`;
}

export function indexedLegalPaths(
  entries: readonly { slug: string; meta: Pick<LegalMeta, "draft"> }[],
): string[] {
  return entries.flatMap((entry) =>
    isLegalSlug(entry.slug) && isLegalIndexed(entry.slug, entry.meta)
      ? [legalPath(entry.slug)]
      : [],
  );
}
