import { envClientSchema } from '@josecoded/types';

import type { EnvClient } from '@josecoded/types';
import type { z } from 'zod';

// The schemas live in @josecoded/types (schemas/env.ts); this file only runs them. Server secrets are in
// `env.server.ts` (`server-only`), so their names never reach a client bundle.

export function parse<T extends z.ZodType>(schema: T, source: Record<string, unknown>, label: string) {
  // an empty variable (`FOO=` in a .env file) counts as unset
  const cleaned = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Invalid or missing ${label} environment variables: ${names.join(', ')}`);
  }
  return result.data as z.infer<T>;
}

// Each NEXT_PUBLIC_* is read by its literal name: Next inlines them at build time, which does not
// work through `process.env` as a whole object.
const client: EnvClient = parse(
  envClientSchema,
  {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_JOSECODED_API_URL: process.env.NEXT_PUBLIC_JOSECODED_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_UMAMI_URL: process.env.NEXT_PUBLIC_UMAMI_URL,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_CF_BEACON_TOKEN: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
    NEXT_PUBLIC_CAL_LINK: process.env.NEXT_PUBLIC_CAL_LINK,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_HERO_MEDIA_VERSION: process.env.NEXT_PUBLIC_HERO_MEDIA_VERSION,
    NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV,
    NEXT_PUBLIC_DEV_UI: process.env.NEXT_PUBLIC_DEV_UI,
  },
  'public',
);

export const env = { client };
