import createMDX from "@next/mdx";
import type { NextConfig } from "next";

import { buildHeaders } from "./src/config/headers.ts";
import { site } from "./src/config/site.ts";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  redirects: () =>
    Promise.resolve([
      { source: "/", destination: "/es", permanent: true },
      {
        source: "/:locale(es|en)/servicios/packs",
        destination: "/:locale/servicios/a-medida",
        permanent: true,
      },
      { source: "/servicios/packs", destination: "/es/servicios/a-medida", permanent: true },
    ]),
  headers: () => Promise.resolve(buildHeaders(site)),
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug", ["rehype-autolink-headings", { behavior: "wrap" }]],
  },
});

export default withMDX(nextConfig);
