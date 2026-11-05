import type { MDXComponents } from "mdx/types";

import { CaseSection } from "@/components/projects/CaseSection/CaseSection";
import { ProseImage } from "@/components/ui/Prose/ProseImage";
import { ProsePre, ProseTable } from "@/components/ui/Prose/ProseScroll";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { CaseSection, img: ProseImage, pre: ProsePre, table: ProseTable, ...components };
}
