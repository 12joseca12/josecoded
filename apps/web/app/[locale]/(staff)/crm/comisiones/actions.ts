'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import {
  commissionApproveInputSchema,
  commissionPayInputSchema,
  commissionRejectInputSchema,
} from '@josecoded/types';

import { requireAdmin } from '@/lib/auth/guards';
import { fieldsOf, localeOf } from '@/lib/crm/action-support';
import { canTransition } from '@/lib/crm/commissions';
import { toInputParts, toNextActionAt } from '@/lib/crm/next-action';

import type { ServerSupabase } from '@/lib/supabase/server';
import type { CommissionStatus, FormState } from '@josecoded/types';

// Server Actions of K5 (task 6.11): approve, reject and mark a commission as paid. Only the admin. An action is a
// public endpoint: `requireAdmin()` comes first, before the form is read, and the buttons that show or hide in the
// page are not the guard. The status is read and checked here so the answer is `invalidTransition` (the screen was
// stale), and the RPC checks it again under lock: the database is the authority. Nothing here moves money: «pagada»
// is the record that the admin made the transfer by hand.

type ApproveState = FormState<{ commission_id: string }>;
type RejectState = FormState<{ reason: string }>;
type PayState = FormState<{ paid_at: string; note: string }>;

const NEXT = '/crm/comisiones';

type Failure = 'invalid' | 'invalidTransition' | 'notFound' | 'reasonRequired' | 'futureDate' | 'forbidden' | 'failed';

/** What the database says when a rule is broken, as a key of `crmCommissions.errors`. Unknown → `failed`. */
function failureOf(error: { code?: string; message?: string }): Failure {
  const message = error.message ?? '';
  if (/commission_not_pending|commission_not_approved/.test(message)) return 'invalidTransition';
  if (/reason_required/.test(message)) return 'reasonRequired';
  return error.code === '42501' ? 'forbidden' : 'failed';
}

/** The current status of a commission, read with the admin's JWT (RLS lets the admin read all). `null`: it does not exist. */
async function statusOf(supabase: ServerSupabase, id: string): Promise<CommissionStatus | null> {
  const { data } = await supabase.from('closer_commissions').select('status').eq('id', id).maybeSingle();
  return data?.status ?? null;
}

type Transition = {
  id: string;
  to: CommissionStatus;
  call: (supabase: ServerSupabase) => PromiseLike<{ error: { code?: string; message?: string } | null }>;
};

/** Shared by the three: checks the transition against the current status, calls the RPC and refreshes the screen. */
async function transition(supabase: ServerSupabase, { id, to, call }: Transition): Promise<Failure | null> {
  const current = await statusOf(supabase, id);
  if (!current) return 'notFound';
  if (!canTransition(current, to)) return 'invalidTransition';
  const { error } = await call(supabase);
  if (error) return failureOf(error);
  // the list, the totals and the counter of the rail
  revalidatePath('/[locale]/crm', 'layout');
  return null;
}

/** `pending → approved`. */
export async function approveCommission(_previous: ApproveState, data: FormData): Promise<ApproveState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: NEXT });
  const t = await getTranslations({ locale, namespace: 'crmCommissions.errors' });

  const parsed = commissionApproveInputSchema.safeParse(fieldsOf(data, ['commission_id']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };
  const { commission_id: id } = parsed.data;

  const failure = await transition(supabase, {
    id,
    to: 'approved',
    call: (client) => client.rpc('admin_commission_approve', { p_id: id }),
  });
  return failure ? { status: 'error', formError: t(failure) } : { status: 'ok' };
}

/** `pending → rejected`, with the reason the closer will read in her row. */
export async function rejectCommission(_previous: RejectState, data: FormData): Promise<RejectState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: NEXT });
  const t = await getTranslations({ locale, namespace: 'crmCommissions.errors' });

  const values = fieldsOf(data, ['commission_id', 'reason']);
  const parsed = commissionRejectInputSchema.safeParse(values);
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path[0] === 'reason')
      ? { status: 'error', fieldErrors: { reason: t('reasonRequired') }, values: { reason: values.reason ?? '' } }
      : { status: 'error', formError: t('invalid') };
  }
  const { commission_id: id, reason } = parsed.data;

  const failure = await transition(supabase, {
    id,
    to: 'rejected',
    call: (client) => client.rpc('admin_commission_reject', { p_id: id, p_reason: reason }),
  });
  return failure ? { status: 'error', formError: t(failure), values: { reason } } : { status: 'ok' };
}

/** `approved → paid`: records the day of the transfer and a note. The transfer itself is done outside the web. */
export async function markCommissionPaid(_previous: PayState, data: FormData): Promise<PayState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: NEXT });
  const t = await getTranslations({ locale, namespace: 'crmCommissions.errors' });

  const values = fieldsOf(data, ['commission_id', 'paid_at', 'note']);
  const parsed = commissionPayInputSchema.safeParse({ ...values, note: values.note?.trim() || undefined });
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path[0] === 'paid_at')
      ? { status: 'error', fieldErrors: { paid_at: t('invalid') }, values }
      : { status: 'error', formError: t('invalid'), values };
  }
  const { commission_id: id, paid_at: day, note } = parsed.data;
  // a payment is a thing that already happened: not a day that has not come, on the Madrid clock
  const today = toInputParts(new Date().toISOString())?.date ?? day;
  if (day > today) {
    return { status: 'error', fieldErrors: { paid_at: t('futureDate') }, values };
  }

  const failure = await transition(supabase, {
    id,
    to: 'paid',
    call: (client) =>
      client.rpc('admin_commission_mark_paid', {
        p_id: id,
        p_paid_at: toNextActionAt(day, '12:00'),
        p_note: note ?? '',
      }),
  });
  return failure ? { status: 'error', formError: t(failure), values } : { status: 'ok' };
}
