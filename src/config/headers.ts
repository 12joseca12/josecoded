import type { SiteConfig } from "./site";

interface HeaderRule {
  source: string;
  has?: { type: "host"; value: string }[];
  headers: { key: string; value: string }[];
}

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

export const privateZoneSource =
  "/:locale/(dev|entrar|admin|crm|area|freelance|invitacion|cuenta)/:path*";

export const previewHostPattern = ".*\\.workers\\.dev";

export function buildHeaders(site: SiteConfig): HeaderRule[] {
  return [
    { source: privateZoneSource, headers: [noindex] },
    { source: "/auth/:path*", headers: [noindex] },
    { source: "/:path*", has: [{ type: "host", value: previewHostPattern }], headers: [noindex] },
    ...(site.indexable ? [] : [{ source: "/:path*", headers: [noindex] }]),
  ];
}
