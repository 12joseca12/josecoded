import createMDX from "@next/mdx";
import type { NextConfig } from "next";

import { site } from "./src/config/site.ts";

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  redirects: () => Promise.resolve([{ source: "/", destination: "/es", permanent: true }]),
  headers: () =>
    Promise.resolve([
      { source: "/:locale/dev/:path*", headers: [noindex] },
      ...(site.indexable ? [] : [{ source: "/:path*", headers: [noindex] }]),
    ]),
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug", ["rehype-autolink-headings", { behavior: "wrap" }]],
  },
});

export default withMDX(nextConfig);
