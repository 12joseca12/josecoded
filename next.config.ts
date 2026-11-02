import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  redirects: () => Promise.resolve([{ source: "/", destination: "/es", permanent: false }]),
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug", ["rehype-autolink-headings", { behavior: "wrap" }]],
  },
});

export default withMDX(nextConfig);
