import type { Locale } from '@josecoded/types';
import type { ComponentType } from 'react';

/**
 * The compiled guide `content/blog/<locale>/<slug>.mdx`. `@next/mdx` compiles every file of that closed folder at build
 * (Turbopack bundles the matching modules), so the worker only renders the component: no MDX compiler at runtime. The
 * caller passes a slug and language that exist in the index.
 */
export async function loadGuide(locale: Locale, slug: string): Promise<ComponentType> {
  const guide = (await import(`@/content/blog/${locale}/${slug}.mdx`)) as { default: ComponentType };
  return guide.default;
}
