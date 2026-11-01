'use server';

import { cookies, headers } from 'next/headers';
import { redirect as redirectTo } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { oauthSignInSchema, localeSchema, signInEmailSchema, verifyOtpSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { afterSignIn } from '@/lib/auth/after-sign-in';
import { safeNext } from '@/lib/auth/next-param';
import { env } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { verifyTurnstileToken } from '@/lib/turnstile/verify';

import type { FormState, Locale } from '@josecoded/types';

// Server Actions of the passwordless sign-in (plan 4.1, DATOS §8.1). Next compares Origin and Host on
// every action call (CSRF), and nothing here trusts the client: every field is parsed with zod, `next`
// goes through `safeNext`, the locale is checked against the closed list, and the CAPTCHA is verified
// with the secret key before Supabase is asked to send anything.

type EmailFields = { email: string; turnstileToken: string };
type CodeFields = { token: string; email: string };

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

function localeOf(data: FormData): Locale {
  const parsed = localeSchema.safeParse(str(data, 'locale'));
  return parsed.success ? parsed.data : 'es';
}

function areaHome(locale: Locale): string {
  return getPathname({ href: '/area-clientes', locale });
}

/** Sends the 6-digit code and moves to the code screen. Also creates the account on a first sign-in. */
export async function requestOtp(
  _previous: FormState<EmailFields>,
  data: FormData,
): Promise<FormState<EmailFields>> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'auth.errors' });

  const parsed = signInEmailSchema.safeParse({
    email: str(data, 'email')?.trim().toLowerCase(),
    next: str(data, 'next') || undefined,
    audience: str(data, 'audience') || undefined,
    turnstileToken: str(data, 'cf-turnstile-response'),
  });
  if (!parsed.success) {
    const emailInvalid = parsed.error.issues.some((issue) => issue.path[0] === 'email');
    return emailInvalid
      ? { status: 'error', fieldErrors: { email: t('invalidEmail') } }
      : { status: 'error', formError: t('captcha') };
  }

  const ip = (await headers()).get('cf-connecting-ip');
  if (!(await verifyTurnstileToken(parsed.data.turnstileToken, { ip, action: 'login' }))) {
    return { status: 'error', formError: t('captcha') };
  }

  const next = safeNext(parsed.data.next, areaHome(locale));
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      // read by the `handle_new_user` trigger to give the profile its language
      data: { locale },
      emailRedirectTo: `${env.client.NEXT_PUBLIC_SITE_URL}${getPathname({ href: '/auth/callback', locale })}?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return {
      status: 'error',
      formError: error.code === 'over_email_send_rate_limit' || error.status === 429 ? t('rateLimited') : t('generic'),
    };
  }

  const query = new URLSearchParams({ email: parsed.data.email, next });
  if (parsed.data.audience) query.set('audience', parsed.data.audience);
  redirectTo(`${getPathname({ href: '/auth/codigo', locale })}?${query}`);
}

/** Checks the code, starts the session and lands on `next`. */
export async function verifyOtp(
  _previous: FormState<CodeFields>,
  data: FormData,
): Promise<FormState<CodeFields>> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'auth.errors' });

  const parsed = verifyOtpSchema.safeParse({
    email: str(data, 'email')?.trim().toLowerCase(),
    token: str(data, 'token')?.replace(/\s/g, ''),
    next: str(data, 'next') || undefined,
    audience: str(data, 'audience') || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: { token: t('invalidCode') } };
  }

  const supabase = await createServerSupabase();
  const { data: result, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: 'email',
  });
  if (error || !result.user) {
    const unavailable = error?.status !== undefined && error.status >= 500;
    return unavailable
      ? { status: 'error', formError: t('generic') }
      : { status: 'error', fieldErrors: { token: t('invalidCode') } };
  }

  const ref = (await cookies()).get('ref')?.value;
  await afterSignIn(supabase, result.user, { ref, audience: parsed.data.audience });
  redirectTo(safeNext(parsed.data.next, areaHome(locale)));
}

/** Starts the OAuth flow (PKCE; the verifier is kept in a cookie by the server client). */
export async function signInWithProvider(data: FormData): Promise<void> {
  const locale = localeOf(data);
  const parsed = oauthSignInSchema.safeParse({
    provider: str(data, 'provider'),
    next: str(data, 'next') || undefined,
    audience: str(data, 'audience') || undefined,
  });
  const failed = () => redirectTo(`${getPathname({ href: '/auth/login', locale })}?error=callback`);
  if (!parsed.success) return failed();

  const next = safeNext(parsed.data.next, areaHome(locale));
  const query = new URLSearchParams({ next });
  if (parsed.data.audience) query.set('audience', parsed.data.audience);

  const supabase = await createServerSupabase();
  const { data: result, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: {
      redirectTo: `${env.client.NEXT_PUBLIC_SITE_URL}${getPathname({ href: '/auth/callback', locale })}?${query}`,
    },
  });
  if (error || !result.url) return failed();
  redirectTo(result.url);
}

export async function signOut(data: FormData): Promise<void> {
  const locale = localeOf(data);
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirectTo(getPathname({ href: '/', locale }));
}
