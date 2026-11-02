import type { MDXComponents } from 'mdx/types';

// Required by @next/mdx in the App Router. The guide's elements are styled by `Prose` (the article, B05), so nothing
// is replaced here yet.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return components;
}
