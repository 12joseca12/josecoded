import { cookies } from 'next/headers';

import { emailSchema } from '@josecoded/types';

import { env } from '@/lib/env';

// The address a code was just sent to travels between the two sign-in steps in a short-lived httpOnly
// cookie, not in the URL (a URL ends up in history, Referer, server logs and analytics). It is only a
// convenience of the screen: the code itself is what proves the address.

export const PENDING_EMAIL_COOKIE = 'jc_otp_email';
const TEN_MINUTES = 600; // same as `otp_expiry` in supabase/config.toml

export async function rememberPendingEmail(email: string): Promise<void> {
  (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.client.NEXT_PUBLIC_SITE_URL.startsWith('https://'),
    path: '/',
    maxAge: TEN_MINUTES,
  });
}

/** The remembered address, or undefined when absent, expired or not an email. */
export async function readPendingEmail(): Promise<string | undefined> {
  const value = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value;
  const parsed = emailSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export async function forgetPendingEmail(): Promise<void> {
  (await cookies()).delete(PENDING_EMAIL_COOKIE);
}
