import { createServerClient } from '@supabase/ssr';

import { LOCAL_URL, STAFF, TEST_PASSWORD, elevateToAal2, supabaseIsUp } from '../../tests/helpers/supabase-test-clients';

import type { BrowserContext } from '@playwright/test';

// Helpers of the specs that need Supabase LOCAL (`supabase start && supabase db reset`). The specs
// skip themselves when the stack does not answer, like tests/rls.test.ts does for the RLS suite.
// Never production: LOCAL_URL is checked to be a loopback host by the shared test helper.

export { LOCAL_URL, supabaseIsUp };

const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const MAIL_URL = process.env.SUPABASE_MAIL_URL ?? 'http://127.0.0.1:54324';

/**
 * Signs a seeded account in by password (the seed keeps the password for the RLS tests only; the
 * product has no password UI) and puts the resulting session cookies in the browser context, with
 * the exact names and chunking `@supabase/ssr` uses, so the app sees an ordinary signed-in visitor.
 * Staff accounts (jose, carla, dani) also enrol a throwaway TOTP factor and answer its challenge, so the session is
 * `aal2` like a real one: the database (`private.is_aal2()`) refuses their RPCs below it, with no bypass in the DB.
 */
export async function signInAs(
  context: BrowserContext,
  baseURL: string,
  name: 'jose' | 'ana' | 'bob' | 'sin' | 'carla' | 'dani',
): Promise<void> {
  const jar = new Map<string, string>();
  const client = createServerClient(LOCAL_URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([key, value]) => ({ name: key, value })),
      setAll: (cookies) => {
        for (const cookie of cookies) {
          if (cookie.value) jar.set(cookie.name, cookie.value);
          else jar.delete(cookie.name);
        }
      },
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: `${name}@test`, password: TEST_PASSWORD });
  if (error) throw new Error(`seed login ${name} failed: ${error.message}`);
  if (STAFF.includes(name) && data.user) await elevateToAal2(client, data.user.id);
  await context.addCookies([...jar].map(([key, value]) => ({ name: key, value, url: baseURL })));
}

/** Reads the newest 6-digit code sent to `email` from the local mailbox (Mailpit API, port 54324). */
export async function latestOtp(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const list = await fetch(`${MAIL_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    if (list.ok) {
      const { messages } = (await list.json()) as { messages?: { ID: string }[] };
      const id = messages?.[0]?.ID;
      if (id) {
        const message = (await (await fetch(`${MAIL_URL}/api/v1/message/${id}`)).json()) as { Text?: string };
        const code = /\b(\d{6})\b/.exec(message.Text ?? '')?.[1];
        if (code) return code;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no code received for ${email}`);
}
