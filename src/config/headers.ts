import type { SiteConfig } from "./site";

interface HeaderRule {
  source: string;
  has?: { type: "host"; value: string }[];
  headers: { key: string; value: string }[];
}

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

export const previewHostPattern = ".*\\.workers\\.dev";

export function buildHeaders(site: SiteConfig): HeaderRule[] {
  return [
    { source: "/:locale/dev/:path*", headers: [noindex] },
    { source: "/:path*", has: [{ type: "host", value: previewHostPattern }], headers: [noindex] },
    ...(site.indexable ? [] : [{ source: "/:path*", headers: [noindex] }]),
  ];
}
