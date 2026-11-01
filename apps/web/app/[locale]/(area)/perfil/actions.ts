'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { localeSchema, profileUpdateSchema, totpCodeSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

import type { FormState, Locale } from '@josecoded/types';

// Server Actions of /perfil. Each one asks Supabase for the user first (`getUser` validates the token):
// an action is a public endpoint, the page guard does not protect it. Writes go through the user's own
// JWT, so RLS and the column grants of `user_profiles` (display_name, locale only) are the authority.

const str = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === 'string' ? value : undefined;
};

function localeOf(data: FormData): Locale {
  const parsed = localeSchema.safeParse(str(data, 'currentLocale'));
  return parsed.success ? parsed.data : 'es';
}

export type ProfileFields = { displayName: string; locale: string };

export async function updateProfile(
  _previous: FormState<ProfileFields>,
  data: FormData,
): Promise<FormState<ProfileFields>> {
  const current = localeOf(data);
  const t = await getTranslations({ locale: current, namespace: 'profile.form' });

  const parsed = profileUpdateSchema.safeParse({
    displayName: str(data, 'displayName') ?? '',
    locale: str(data, 'locale'),
  });
  if (!parsed.success) return { status: 'error', formError: t('invalid') };

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'error', formError: t('failed') };

  const { error } = await supabase
    .from('user_profiles')
    .update({
      display_name: parsed.data.displayName === '' ? null : parsed.data.displayName,
      locale: parsed.data.locale,
    })
    .eq('user_id', auth.user.id);
  if (error) return { status: 'error', formError: t('failed') };

  // the chosen language is also the language of the next screen
  if (parsed.data.locale !== current) {
    redirect(getPathname({ href: '/perfil', locale: parsed.data.locale }));
  }
  revalidatePath(getPathname({ href: '/perfil', locale: current }));
  return { status: 'ok' };
}

export type TotpState = FormState<{ code: string }> & {
  enrollment?: { factorId: string; qrCode: string; secret: string };
};

/** Starts a TOTP enrolment. Abandoned (unverified) factors of earlier attempts are removed first. */
export async function enrolTotp(_previous: TotpState, data: FormData): Promise<TotpState> {
  const t = await getTranslations({ locale: localeOf(data), namespace: 'profile.security' });
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'error', formError: t('failed') };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === 'totp' && factor.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const { data: enrolled, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'josecoded',
    friendlyName: auth.user.email ?? 'josecoded',
  });
  if (error || !enrolled) return { status: 'error', formError: t('failed') };
  return {
    status: 'ok',
    enrollment: { factorId: enrolled.id, qrCode: enrolled.totp.qr_code, secret: enrolled.totp.secret },
  };
}

/** Verifies a TOTP code: finishes an enrolment or upgrades the session to `aal2`. */
export async function verifyTotp(_previous: TotpState, data: FormData): Promise<TotpState> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'profile.security' });
  const parsed = totpCodeSchema.safeParse({
    factorId: str(data, 'factorId'),
    code: str(data, 'code')?.replace(/\s/g, ''),
  });
  if (!parsed.success) return { status: 'error', fieldErrors: { code: t('invalidCode') } };

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'error', formError: t('failed') };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: parsed.data.factorId,
    code: parsed.data.code,
  });
  if (error) {
    return error.status !== undefined && error.status >= 500
      ? { status: 'error', formError: t('failed') }
      : { status: 'error', fieldErrors: { code: t('invalidCode') } };
  }
  revalidatePath(getPathname({ href: '/perfil', locale }));
  redirect(getPathname({ href: '/perfil', locale }));
}

/** Removes the TOTP factor. Supabase only allows it from an `aal2` session. */
export async function removeTotp(_previous: TotpState, data: FormData): Promise<TotpState> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'profile.security' });
  const factorId = totpCodeSchema.shape.factorId.safeParse(str(data, 'factorId'));
  if (!factorId.success) return { status: 'error', formError: t('failed') };

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'error', formError: t('failed') };

  const { error } = await supabase.auth.mfa.unenroll({ factorId: factorId.data });
  if (error) return { status: 'error', formError: t('failed') };
  revalidatePath(getPathname({ href: '/perfil', locale }));
  return { status: 'ok' };
}
