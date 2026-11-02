'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { acceptUserStoryInputSchema, convertUserStoryInputSchema, rejectUserStoryInputSchema } from '@josecoded/types';

import { requireStaff } from '@/lib/auth/staff';
import { fieldsOf, localeOf } from '@/lib/crm/action-support';
import { parseAmount, parseHours } from '@/lib/stories/estimate';
import { nextActions } from '@/lib/stories/status';

import type { ServerSupabase } from '@/lib/supabase/server';
import type { FormState, StoryStatus } from '@josecoded/types';

// Server Actions of K6 (task 6.12): the decision on a story a client proposed. D52 and DATOS §14.4 give it to the
// admin and to the closer who owns the client; nobody else, and the database is who enforces it: the three RPCs
// refuse (42501) a story outside the person's portfolio and check the status under lock. An action is a public
// endpoint: `requireStaff()` comes first, the form is read after it, and the status is read here only so the answer
// for a stale screen is «ya ha cambiado» instead of a raw error. Nothing about who decides is read from the form.

type Fields = Record<string, string>;
type State = FormState<Fields>;

const NEXT = '/crm/clientes';

type Failure =
  | 'invalid'
  | 'notFound'
  | 'invalidTransition'
  | 'forbidden'
  | 'hoursInvalid'
  | 'noteTooLong'
  | 'reasonRequired'
  | 'failed';

/** What the database says when a rule is broken, as a key of `crmClients.errors`. Unknown → `failed`. */
function failureOf(error: { code?: string; message?: string }): Failure {
  const message = error.message ?? '';
  if (/story_not_proposed|story_not_accepted/.test(message)) return 'invalidTransition';
  if (/story_not_found/.test(message) || error.code === 'P0002') return 'notFound';
  if (/estimate_required/.test(message)) return 'hoursInvalid';
  if (/reason_required/.test(message)) return 'reasonRequired';
  if (/note_too_long/.test(message)) return 'noteTooLong';
  return error.code === '42501' ? 'forbidden' : 'failed';
}

/** The status of a story as this person reads it (RLS: a closer gets nothing for a client that is not hers). */
async function statusOf(supabase: ServerSupabase, id: string): Promise<StoryStatus | null> {
  const { data } = await supabase.from('client_user_stories').select('status').eq('id', id).maybeSingle();
  return data?.status ?? null;
}

function refresh() {
  // the list, the file, the counter of stories in the summary and the rail
  revalidatePath('/[locale]/crm', 'layout');
}

/** «Decidir historia»: `decision=accept` with hours, amount, note and «crear tarea», or `decision=reject` with a reason. */
export async function decideStory(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const { role, supabase } = await requireStaff({ locale, next: NEXT });
  const t = await getTranslations({ locale, namespace: 'crmClients.errors' });

  const values = fieldsOf(data, ['story_id', 'decision', 'hours', 'amount', 'note', 'reason']);
  const decision = values.decision;
  if (decision !== 'accept' && decision !== 'reject') return { status: 'error', formError: t('invalid') };
  const id = acceptUserStoryInputSchema.shape.story_id.safeParse(values.story_id);
  if (!id.success) return { status: 'error', formError: t('invalid') };

  const current = await statusOf(supabase, id.data);
  if (!current) return { status: 'error', formError: t('notFound'), values };
  if (!nextActions(current, role).includes(decision)) return { status: 'error', formError: t('invalidTransition'), values };

  if (decision === 'reject') {
    const parsed = rejectUserStoryInputSchema.safeParse({ story_id: id.data, reason: values.reason ?? '' });
    if (!parsed.success) return { status: 'error', fieldErrors: { reason: t('reasonRequired') }, values };
    const { error } = await supabase.rpc('reject_user_story', { p_story_id: parsed.data.story_id, p_note: parsed.data.reason });
    if (error) return { status: 'error', formError: t(failureOf(error)), values };
    refresh();
    return { status: 'ok' };
  }

  const hours = parseHours(values.hours);
  if (hours === null) return { status: 'error', fieldErrors: { hours: t('hoursInvalid') }, values };
  const amount = parseAmount(values.amount);
  if (amount === 'invalid') return { status: 'error', fieldErrors: { amount: t('amountInvalid') }, values };
  const parsed = acceptUserStoryInputSchema.safeParse({
    story_id: id.data,
    estimate_hours: hours,
    estimate_amount: amount,
    note: values.note?.trim() || null,
    // a checkbox sends its value only when it is on
    create_task: data.get('create_task') === 'on',
  });
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path[0] === 'note')
      ? { status: 'error', fieldErrors: { note: t('noteTooLong') }, values }
      : { status: 'error', formError: t('invalid'), values };
  }
  const { error } = await supabase.rpc('accept_user_story', {
    p_story_id: parsed.data.story_id,
    p_estimate_hours: parsed.data.estimate_hours,
    // the generated types mark every argument as non-null; the SQL function takes null for «no amount» and «no note»
    p_estimate_amount: parsed.data.estimate_amount as number,
    p_note: parsed.data.note as string,
    p_create_task: parsed.data.create_task,
  });
  if (error) return { status: 'error', formError: t(failureOf(error)), values };
  refresh();
  return { status: 'ok' };
}

/** «Convertir en tarea»: an accepted story, whose estimate was agreed outside the web, becomes a task of the client. */
export async function convertStory(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const { role, supabase } = await requireStaff({ locale, next: NEXT });
  const t = await getTranslations({ locale, namespace: 'crmClients.errors' });

  const parsed = convertUserStoryInputSchema.safeParse(fieldsOf(data, ['story_id']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };

  const current = await statusOf(supabase, parsed.data.story_id);
  if (!current) return { status: 'error', formError: t('notFound') };
  if (!nextActions(current, role).includes('convert')) return { status: 'error', formError: t('invalidTransition') };

  const { error } = await supabase.rpc('convert_user_story', { p_story_id: parsed.data.story_id });
  if (error) return { status: 'error', formError: t(failureOf(error)) };
  refresh();
  return { status: 'ok' };
}
