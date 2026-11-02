import type { MDXComponents } from "mdx/types";

import { ProseImage } from "@/components/ui/Prose/ProseImage";
import { ProsePre, ProseTable } from "@/components/ui/Prose/ProseScroll";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { img: ProseImage, pre: ProsePre, table: ProseTable, ...components };
}
