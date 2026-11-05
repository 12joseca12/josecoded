import type { ComponentType } from "react";

export interface ContentHeading {
  id: string;
  label: string;
}

export interface ContentEntry<Meta> {
  slug: string;
  meta: Meta;
  headings: ContentHeading[];
  load: () => Promise<{ default: ComponentType }>;
}
