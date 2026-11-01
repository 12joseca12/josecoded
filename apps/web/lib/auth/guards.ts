import { notFound, redirect } from 'next/navigation';

import { getPathname } from '@/i18n/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

import { safeNext } from './next-param';

import type { ServerSupabase, User } from '@/lib/supabase/server';
import type { Locale } from '@josecoded/types';

export interface GuardOptions {
  locale: Locale;
  /** Path the visitor asked for (already localized); returned to after signing in. */
  next?: string;
}

export interface Session {
  user: User;
  supabase: ServerSupabase;
}

function loginHref({ locale, next }: GuardOptions): string {
  const base = getPathname({ href: '/auth/login', locale });
  return next ? `${base}?next=${encodeURIComponent(safeNext(next))}` : base;
}

/**
 * Guard of a private page, called from its layout or page (there is no middleware, DT §1.7).
 * `getUser()` asks the Auth server to validate the token: a cookie alone proves nothing. Real
 * authority is still RLS; this only decides what to render.
 */
export async function requireUser(options: GuardOptions): Promise<Session> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(loginHref(options));
  return { user: data.user, supabase };
}

/**
 * Admin guard (DATOS §8.1): the user must be in `staff_members` with role `admin` (anyone else gets a
 * 404, the admin does not exist for them) AND have verified a TOTP code in this session (`aal2`).
 * An admin below `aal2` is sent to the profile, where the factor is enrolled or verified.
 */
export async function requireAdmin(options: GuardOptions): Promise<Session> {
  const session = await requireUser(options);
  const { data: staff } = await session.supabase
    .from('staff_members')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (staff?.role !== 'admin') notFound();

  const { data: aal } = await session.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    const profile = getPathname({ href: '/perfil', locale: options.locale });
    redirect(`${profile}?mfa=1`);
  }
  return session;
}
