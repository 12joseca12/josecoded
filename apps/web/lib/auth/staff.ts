import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { getPathname } from '@/i18n/navigation';

import { requireUser } from './guards';

import type { GuardOptions, Session } from './guards';
import type { ServerSupabase } from '@/lib/supabase/server';

export type StaffRole = 'admin' | 'closer';

export interface StaffSession extends Session {
  role: StaffRole;
}

/** Own row of `staff_members` (RLS lets a member read only his). `disabled_at` is newer than the generated types. */
interface StaffRow {
  role: string;
  disabled_at: string | null;
}

/** One query per request: the layout and the page of a screen share the same session object, hence the same key. */
const loadStaffRow = cache(async (supabase: ServerSupabase, userId: string): Promise<StaffRow | null> => {
  const { data } = await supabase
    .from('staff_members')
    .select('role, disabled_at' as 'role')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as StaffRow | null) ?? null;
});

/**
 * Guard of the CRM (DATOS §14.12.4, Q24): an active `admin` or `closer` of `staff_members` (anyone else, a
 * deactivated closer included, gets a 404: the CRM does not exist for them) with a verified second factor
 * (`aal2`) for both roles. Below `aal2` the person goes to the profile, where the TOTP is enrolled or verified.
 * `ADMIN_REQUIRE_MFA=false` lifts the factor only in local and E2E runs, as it does for the gateway.
 * Real authority is RLS; this only decides what to render.
 */
export async function requireStaff(options: GuardOptions): Promise<StaffSession> {
  const session = await requireUser(options);
  const staff = await loadStaffRow(session.supabase, session.user.id);
  if (!staff || (staff.role !== 'admin' && staff.role !== 'closer') || staff.disabled_at !== null) notFound();

  if (process.env.ADMIN_REQUIRE_MFA !== 'false') {
    const { data: aal } = await session.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== 'aal2') {
      const profile = getPathname({ href: '/perfil', locale: options.locale });
      redirect(`${profile}?mfa=1`);
    }
  }
  return { ...session, role: staff.role };
}
