/**
 * The signed-in user's access token, for reading or claiming a saved thread. The Supabase browser client is imported
 * only here, on demand (it must not reach the first-load chunks, see `lib/supabase/browser.ts`).
 */
export async function accessToken(): Promise<string | undefined> {
  try {
    const { createClient } = await import('@/lib/supabase/browser');
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}
