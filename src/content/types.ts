import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";

export interface ContentHeading {
  id: string;
  label: string;
}

export interface ContentEntry<Meta> {
  slug: string;
  meta: Meta;
  headings: ContentHeading[];
  words: number;
  load: () => Promise<{ default: ComponentType<{ components?: MDXComponents }> }>;
}
