import { z } from 'zod';

// Environment of apps/web (plan 1.5). The schemas live here; apps/web/lib/env.ts only runs them.
// Server secrets never carry NEXT_PUBLIC_ and SUPABASE_SERVICE_ROLE_KEY is NOT part of the web
// (the service role lives only in the gateway and in local scripts).

const nonEmpty = z.string().min(1);

export const envClientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_JOSECODED_API_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: nonEmpty,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: nonEmpty,
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: nonEmpty.optional(),
  NEXT_PUBLIC_CF_BEACON_TOKEN: nonEmpty.optional(),
  NEXT_PUBLIC_CAL_LINK: nonEmpty,
  NEXT_PUBLIC_WHATSAPP_NUMBER: nonEmpty,
  NEXT_PUBLIC_HERO_MEDIA_VERSION: nonEmpty,
  /** `'1'` in local and preview builds to expose the /dev/ui catalogue (task 2.2); absent in production. */
  NEXT_PUBLIC_DEV_UI: z.literal('1').optional(),
});

export const envServerSchema = z.object({
  TURNSTILE_SECRET_KEY: nonEmpty,
  SERVER_KEY: nonEmpty,
  CALCOM_WEBHOOK_SECRET: nonEmpty,
});
