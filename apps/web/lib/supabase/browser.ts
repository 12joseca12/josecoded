import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/lib/env';
import { supabaseCookieOptions } from '@/lib/supabase/cookie-options';

import type { Database } from '@josecoded/types';

/**
 * Supabase client for the browser (session in cookies, shared with the server clients of 4.1).
 * Never import this from a module in the initial bundle: load it with `import()` where it is needed
 * (the header's user menu does it only when a session cookie exists; `check-hero-bundle`, 2.9,
 * fails if supabase-js reaches a first-load chunk of the home).
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.client.NEXT_PUBLIC_SUPABASE_URL,
    env.client.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookieOptions: supabaseCookieOptions() },
  );
}
