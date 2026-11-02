import { env } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Call to the gateway (`apps/api`) made by the admin's own session: it adds `Authorization: Bearer <access
 * token>` and nothing else decides who the caller is (the gateway validates the JWT and the role). Server
 * only. The token is the one of the cookie session that the guard already validated with `getUser()`.
 * The path must start with a single `/`: the token must never travel to another host.
 */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('adminFetch takes a path of the gateway');
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('no session');

  // the caller's headers first, then ours: a header named in any case cannot shadow the JWT
  const headers = Object.fromEntries(
    [...new Headers(init.headers)]
      .map(([name, value]) => [name.toLowerCase(), value] as const)
      .filter(([name]) => name !== 'authorization'),
  );
  return fetch(`${env.client.NEXT_PUBLIC_JOSECODED_API_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { ...headers, Authorization: `Bearer ${token}` },
  });
}
