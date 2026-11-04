export const productionOrigin = "https://josecoded.com";

const fallbackOrigin = "http://localhost:3000";

export interface SiteConfig {
  origin: string;
  indexable: boolean;
}

function parseOrigin(value: string | undefined): string {
  try {
    return new URL(value ?? "").origin;
  } catch {
    return fallbackOrigin;
  }
}

export function resolveSite(env: Record<string, string | undefined>): SiteConfig {
  const origin = parseOrigin(env.NEXT_PUBLIC_SITE_URL);
  return {
    origin,
    indexable: origin === productionOrigin && env.NEXT_PUBLIC_FORCE_NOINDEX !== "true",
  };
}

export const site = resolveSite(process.env);

export const canonicalOrigin = productionOrigin;
