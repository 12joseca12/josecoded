'use server';

import { cookies, headers } from 'next/headers';
import { redirect as redirectTo } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { localeSchema, signInEmailSchema, verifyOtpSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { afterSignIn } from '@/lib/auth/after-sign-in';
import { safeNext } from '@/lib/auth/next-param';
import { forgetPendingEmail, readPendingEmail, rememberPendingEmail } from '@/lib/auth/pending-email';
import { allowAttempt } from '@/lib/auth/rate-limit';
import { env } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';

import type { FormState, Locale } from '@josecoded/types';

// Server Actions of the passwordless sign-in (plan 4.1, DATOS §8.1). Next compares Origin and Host on
// every action call (CSRF), and nothing here trusts the client: every field is parsed with zod, `next`
// goes through `safeNext` and the locale is checked against the closed list. The CAPTCHA has a single
// layer: the Turnstile token goes to Supabase Auth (`options.captchaToken`), which verifies it with
// its own secret before sending anything. Verifying it here too would spend the single-use token twice.
// The OAuth start is a GET route handler (`../oauth/route.ts`), so `form-action 'self'` stays strict.

type EmailFields = { email: string; turnstileToken: string };
type CodeFields = { token: string };

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

  const next = safeNext(parsed.data.next, areaHome(locale));
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      captchaToken: parsed.data.turnstileToken,
      shouldCreateUser: true,
      // read by the `handle_new_user` trigger to give the profile its language
      data: { locale },
      emailRedirectTo: `${env.client.NEXT_PUBLIC_SITE_URL}${getPathname({ href: '/auth/callback', locale })}?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === 'captcha_failed') return { status: 'error', formError: t('captcha') };
    return {
      status: 'error',
      formError: error.code === 'over_email_send_rate_limit' || error.status === 429 ? t('rateLimited') : t('generic'),
    };
  }

  await rememberPendingEmail(parsed.data.email);
  const query = new URLSearchParams({ next });
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

  // the address comes from the cookie set when the code was sent, never from the form or the URL
  const parsed = verifyOtpSchema.safeParse({
    email: await readPendingEmail(),
    token: str(data, 'token')?.replace(/\s/g, ''),
    next: str(data, 'next') || undefined,
    audience: str(data, 'audience') || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: { token: t('invalidCode') } };
  }

  const ip = (await headers()).get('cf-connecting-ip');
  if (!(await allowAttempt('otp', { ip, subject: parsed.data.email }))) {
    return { status: 'error', formError: t('rateLimited') };
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

  await forgetPendingEmail();
  const ref = (await cookies()).get('ref')?.value;
  await afterSignIn(supabase, result.user, { ref, audience: parsed.data.audience });
  redirectTo(safeNext(parsed.data.next, areaHome(locale)));
}

export async function signOut(data: FormData): Promise<void> {
  const locale = localeOf(data);
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirectTo(getPathname({ href: '/', locale }));
}
