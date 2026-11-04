import createMDX from "@next/mdx";
import type { NextConfig } from "next";

import { buildHeaders } from "./src/config/headers.ts";
import { site } from "./src/config/site.ts";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  redirects: () => Promise.resolve([{ source: "/", destination: "/es", permanent: true }]),
  headers: () => Promise.resolve(buildHeaders(site)),
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug", ["rehype-autolink-headings", { behavior: "wrap" }]],
  },
});

export default withMDX(nextConfig);
