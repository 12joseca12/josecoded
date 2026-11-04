import { productionOrigin, type SiteConfig } from "./site.ts";

interface HeaderRule {
  source: string;
  has?: { type: "host"; value: string }[];
  headers: { key: string; value: string }[];
}

export interface CspOptions {
  nonce: string;
  development: boolean;
}

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

export const previewHostPattern = ".*\\.workers\\.dev";

const productionHost = new URL(productionOrigin).hostname;

export const productionHostPattern = `(.+\\.)?${productionHost.replaceAll(".", "\\.")}`;

export const turnstileOrigin = "https://challenges.cloudflare.com";

const strictTransportSecurity = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};

const deniedFeatures = [
  "accelerometer",
  "autoplay",
  "bluetooth",
  "camera",
  "display-capture",
  "geolocation",
  "gyroscope",
  "hid",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "serial",
  "usb",
  "xr-spatial-tracking",
];

export const baselineHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: deniedFeatures.map((feature) => `${feature}=()`).join(", ") },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

export function buildCsp({ nonce, development }: CspOptions): string {
  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        turnstileOrigin,
        ...(development ? ["'unsafe-eval'"] : []),
      ],
    ],
    ["style-src", ["'self'", `'nonce-${nonce}'`]],
    ["style-src-attr", ["'unsafe-inline'"]],
    ["img-src", ["'self'", "data:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'", ...(development ? ["ws:", "wss:"] : [])]],
    ["frame-src", [turnstileOrigin]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ...(development ? [] : [["upgrade-insecure-requests", []] as [string, string[]]]),
  ];
  return directives
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

export function buildHeaders(site: SiteConfig): HeaderRule[] {
  return [
    { source: "/:path*", headers: baselineHeaders },
    {
      source: "/:path*",
      has: [{ type: "host", value: productionHostPattern }],
      headers: [strictTransportSecurity],
    },
    { source: "/:locale/dev/:path*", headers: [noindex] },
    { source: "/:path*", has: [{ type: "host", value: previewHostPattern }], headers: [noindex] },
    ...(site.indexable ? [] : [{ source: "/:path*", headers: [noindex] }]),
  ];
}
