import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/lib/env';
import { supabaseCookieOptions } from '@/lib/supabase/cookie-options';

import type { Database } from '@josecoded/types';

/**
 * Supabase client for Server Components, Server Actions and route handlers. It carries the USER's
 * session (cookies), so every query runs under their JWT and RLS is the authority. The web never
 * holds the secret / service key (it lives only in the gateway), and nothing here may ask for it.
 *
 * `cookies().set` throws inside a Server Component render (only actions and handlers may write
 * cookies); the session refresh is then skipped and the next action or handler persists it.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.client.NEXT_PUBLIC_SUPABASE_URL,
    env.client.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: supabaseCookieOptions(),
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
          } catch {
            // called from a Server Component: nothing to persist here
          }
        },
      },
    },
  );
}

export type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

export type { User } from '@supabase/supabase-js';
