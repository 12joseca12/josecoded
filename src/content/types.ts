import type { ComponentType } from "react";

export interface ContentEntry<Meta> {
  slug: string;
  meta: Meta;
  load: () => Promise<{ default: ComponentType }>;
}
