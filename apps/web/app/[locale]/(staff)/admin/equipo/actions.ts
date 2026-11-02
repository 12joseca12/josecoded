'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { requireAdmin } from '@/lib/auth/guards';
import { fieldsOf, localeOf } from '@/lib/crm/action-support';
import {
  inviteIdSchema,
  inviteStaffSchema,
  reassignContactsSchema,
  setRateSchema,
  setStaffSchema,
} from '@/lib/team/invite';
import { TEAM_PATH } from '@/lib/team/team';

import type { FormState } from '@josecoded/types';

// Server Actions of D1, the team (task 6.13). Only the admin. An action is a public endpoint: `requireAdmin()` is the
// first thing each one does, before the form is read; the buttons the page draws are not the guard. Each one validates
// with zod and calls a RPC through the admin's own JWT, which checks the role again (`private.is_admin()`) and the
// bounds: the database is the authority. The invitation email is not sent here: `admin_staff_invite` queues
// `staff.invited` in the outbox and the gateway sends the fixed template. Errors never echo what the database said.

type InviteState = FormState<{ email: string; rate: string }>;
type RateState = FormState<{ rate: string }>;
type PlainState = FormState<{ id: string }>;

type Failure = 'invalid' | 'alreadyStaff' | 'notFound' | 'self' | 'tooSoon' | 'targetDisabled' | 'forbidden' | 'failed';

/** What the database says when a rule is broken, as a key of `adminTeam.errors`. Unknown → `failed`. */
function failureOf(error: { code?: string; message?: string }): Failure {
  const message = error.message ?? '';
  if (/already_staff/.test(message)) return 'alreadyStaff';
  if (/staff_not_found/.test(message)) return 'notFound';
  if (/cannot_disable_self|cannot_edit_self/.test(message)) return 'self';
  if (/invite_recently_sent/.test(message)) return 'tooSoon';
  if (/staff_disabled/.test(message)) return 'targetDisabled';
  if (/invalid_email|invalid_commission_rate|role_required|invalid_role/.test(message)) return 'invalid';
  return error.code === '42501' ? 'forbidden' : 'failed';
}

const refresh = () => revalidatePath('/[locale]/admin/equipo', 'page');

/** `null` tells `admin_staff_set` to keep the current value; the generated types do not know the argument is optional. */
const KEEP = null as unknown as never;

/** Creates (or renews, for an email that already has an open invitation) the invitation, with the mandatory rate. */
export async function inviteStaff(_previous: InviteState, data: FormData): Promise<InviteState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam.errors' });

  const values = fieldsOf(data, ['email', 'role', 'rate']);
  const parsed = inviteStaffSchema.safeParse(values);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const kept = { email: values.email ?? '', rate: values.rate ?? '' };
    if (field === 'rate') return { status: 'error', fieldErrors: { rate: t('rate') }, values: kept };
    if (field === 'email') return { status: 'error', fieldErrors: { email: t('email') }, values: kept };
    return { status: 'error', formError: t('invalid'), values: kept };
  }
  const { email, role, rate } = parsed.data;

  const { error } = await supabase.rpc('admin_staff_invite', { p_email: email, p_role: role, p_commission_rate: rate });
  if (error) return { status: 'error', formError: t(failureOf(error)), values: { email: values.email ?? '', rate: values.rate ?? '' } };
  refresh();
  return { status: 'ok' };
}

/** The same RPC again with the invitation's own data: extends it 14 days and queues the email once more. */
export async function resendInvite(_previous: PlainState, data: FormData): Promise<PlainState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam.errors' });

  const parsed = inviteIdSchema.safeParse(fieldsOf(data, ['id']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };

  const { data: invite } = await supabase
    .from('staff_invites')
    .select('email, role, commission_rate')
    .eq('id', parsed.data.id)
    .is('claimed_at', null)
    .maybeSingle();
  if (!invite) return { status: 'error', formError: t('notFound') };

  const { error } = await supabase.rpc('admin_staff_invite', {
    p_email: invite.email,
    p_role: invite.role,
    p_commission_rate: Number(invite.commission_rate),
  });
  if (error) return { status: 'error', formError: t(failureOf(error)) };
  refresh();
  return { status: 'ok' };
}

/** Deletes an invitation that nobody has claimed (RLS lets only the admin delete; a claimed one is history). */
export async function cancelInvite(_previous: PlainState, data: FormData): Promise<PlainState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam.errors' });

  const parsed = inviteIdSchema.safeParse(fieldsOf(data, ['id']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };

  const { data: removed, error } = await supabase
    .from('staff_invites')
    .delete()
    .eq('id', parsed.data.id)
    .is('claimed_at', null)
    .select('id');
  if (error) return { status: 'error', formError: t(failureOf(error)) };
  if (!removed?.length) return { status: 'error', formError: t('notFound') };
  refresh();
  return { status: 'ok' };
}

/** Deactivates or reactivates a person. Never oneself: the admin row has no button, and this refuses it too. */
export async function setStaff(_previous: PlainState, data: FormData): Promise<PlainState> {
  const locale = localeOf(data);
  const { user, supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam.errors' });

  const parsed = setStaffSchema.safeParse(fieldsOf(data, ['id', 'disabled']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };
  if (parsed.data.id === user.id) return { status: 'error', formError: t('self') };

  const { error } = await supabase.rpc('admin_staff_set', {
    p_user_id: parsed.data.id,
    p_disabled: parsed.data.disabled,
    p_commission_rate: KEEP,
    p_notes: KEEP,
  });
  if (error) return { status: 'error', formError: t(failureOf(error)) };
  refresh();
  return { status: 'ok' };
}

/** Changes the rate for closings to come; commissions already created keep the percent they froze. */
export async function setRate(_previous: RateState, data: FormData): Promise<RateState> {
  const locale = localeOf(data);
  const { user, supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam.errors' });

  const values = fieldsOf(data, ['user_id', 'rate']);
  const parsed = setRateSchema.safeParse(values);
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path[0] === 'rate')
      ? { status: 'error', fieldErrors: { rate: t('rate') }, values: { rate: values.rate ?? '' } }
      : { status: 'error', formError: t('invalid') };
  }
  // the admin earns no commission: his row has no rate to edit
  if (parsed.data.user_id === user.id) return { status: 'error', formError: t('self'), values: { rate: values.rate ?? '' } };

  const { error } = await supabase.rpc('admin_staff_set', {
    p_user_id: parsed.data.user_id,
    p_disabled: KEEP,
    p_commission_rate: parsed.data.rate,
    p_notes: KEEP,
  });
  if (error) return { status: 'error', formError: t(failureOf(error)), values: { rate: values.rate ?? '' } };
  refresh();
  return { status: 'ok' };
}

/** Moves the whole portfolio of a person to another (the admin may receive it: his contacts are the ones with no owner). */
export async function reassignContacts(_previous: PlainState, data: FormData): Promise<PlainState> {
  const locale = localeOf(data);
  const { user, supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam.errors' });

  const parsed = reassignContactsSchema.safeParse(fieldsOf(data, ['from', 'to']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };
  const { from, to } = parsed.data;
  if (from === user.id) return { status: 'error', formError: t('self') };
  if (from === to) return { status: 'error', formError: t('sameTarget') };

  const { error } = await supabase.rpc('admin_reassign_contacts', { p_from: from, p_to: to });
  if (error) return { status: 'error', formError: t(failureOf(error)) };
  // the counters of the rail and every list of /crm change with the owner
  revalidatePath('/[locale]/crm', 'layout');
  refresh();
  return { status: 'ok' };
}
