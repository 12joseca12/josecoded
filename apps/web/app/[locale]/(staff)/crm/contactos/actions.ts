'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
  addNoteInputSchema,
  changeStatusInputSchema,
  closePaidInputSchema,
  inviteAccessInputSchema,
  newContactInputSchema,
  reassignContactInputSchema,
  requestCloseInputSchema,
  setNextActionInputSchema,
} from '@josecoded/types';

import { buildClosePaidArgs } from '@/lib/admin/close-paid';
import { requireAdmin } from '@/lib/auth/guards';
import { requireStaff } from '@/lib/auth/staff';
import { fieldsOf, localeOf, organizationKindFor, rpcErrorKey } from '@/lib/crm/action-support';
import { getAffiliateLevel } from '@/lib/crm/contact-detail';
import { toNextActionAt } from '@/lib/crm/next-action';
import { canTransition, requiresNextAction, statusesFor } from '@/lib/crm/status';

import type { FormState } from '@josecoded/types';

// Server Actions of the contacts screens (K2, K3). An action is a public endpoint: each one validates its input with
// zod, asks who the person is and re-checks the role before it writes. The write goes through the person's own JWT,
// so RLS and the triggers of the database (owner scope, closer guards, next action required) have the last word.
// Owner, actor and role are never read from the form.

type Fields = Record<string, string>;
type State = FormState<Fields>;

const NEXT_ACTION_KEYS = ['next_action', 'next_action_date', 'next_action_time'] as const;

function refresh() {
  // the rail badge (overdue count) lives in the layout of the zone
  revalidatePath('/[locale]/crm', 'layout');
}

export async function changeContactStatus(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  const { role, supabase } = await requireStaff({ locale, next: '/crm/contactos' });

  const parsed = changeStatusInputSchema.safeParse(fieldsOf(data, ['contact_id', 'status', ...NEXT_ACTION_KEYS]));
  if (!parsed.success) return { status: 'error', fieldErrors: { status: t('invalid') } };
  const input = parsed.data;

  const { data: contact } = await supabase.from('crm_contacts').select('id, kind, status').eq('id', input.contact_id).maybeSingle();
  if (!contact) return { status: 'error', formError: t('notFound') };
  if (!canTransition(contact.kind, contact.status, input.status, role)) {
    return { status: 'error', fieldErrors: { status: t('statusNotAllowed') } };
  }

  const patch: { status: string; next_action: string | null; next_action_at: string | null } = {
    status: input.status,
    next_action: null,
    next_action_at: null,
  };
  if (requiresNextAction(contact.kind, input.status)) {
    if (!input.next_action) return { status: 'error', fieldErrors: { next_action: t('nextActionRequired') } };
    if (!input.next_action_date) return { status: 'error', fieldErrors: { next_action_date: t('nextActionRequired') } };
  }
  if (input.next_action && input.next_action_date) {
    patch.next_action = input.next_action;
    patch.next_action_at = toNextActionAt(input.next_action_date, input.next_action_time);
  }

  const { data: updated, error } = await supabase.from('crm_contacts').update(patch).eq('id', input.contact_id).select('id');
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)) };
  if (!updated?.length) return { status: 'error', formError: t('notFound') };

  refresh();
  return { status: 'ok' };
}

export async function setContactNextAction(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  const { supabase } = await requireStaff({ locale, next: '/crm/contactos' });

  const parsed = setNextActionInputSchema.safeParse(fieldsOf(data, ['contact_id', ...NEXT_ACTION_KEYS]));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0] === 'next_action_date' ? 'next_action_date' : 'next_action';
    return { status: 'error', fieldErrors: { [field]: t('nextActionRequired') } };
  }
  const input = parsed.data;

  const { data: updated, error } = await supabase
    .from('crm_contacts')
    .update({ next_action: input.next_action, next_action_at: toNextActionAt(input.next_action_date, input.next_action_time) })
    .eq('id', input.contact_id)
    .select('id');
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)) };
  if (!updated?.length) return { status: 'error', formError: t('notFound') };

  refresh();
  return { status: 'ok' };
}

export async function addContactNote(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  const { role, supabase } = await requireStaff({ locale, next: '/crm/contactos' });

  const parsed = addNoteInputSchema.safeParse(fieldsOf(data, ['contact_id', 'body']));
  if (!parsed.success) return { status: 'error', fieldErrors: { body: t('noteInvalid') }, values: { body: String(data.get('body') ?? '') } };

  // the actor follows the role, never the form (the closer guard of the database forces it anyway)
  const { error } = await supabase.from('crm_interactions').insert({
    contact_id: parsed.data.contact_id,
    kind: 'note',
    direction: 'internal',
    actor: role === 'admin' ? 'jose' : 'closer',
    body: parsed.data.body,
  });
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)), values: { body: parsed.data.body } };

  refresh();
  return { status: 'ok' };
}

export async function createContact(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  const { role, user, supabase } = await requireStaff({ locale, next: '/crm/contactos' });

  const keys = ['kind', 'display_name', 'organization', 'email', 'phone', 'linkedin_url', 'status', 'owner_id', ...NEXT_ACTION_KEYS];
  const values = fieldsOf(data, keys);
  const parsed = newContactInputSchema.safeParse(values);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? 'display_name');
    return { status: 'error', fieldErrors: { [field]: t(field === 'email' ? 'emailInvalid' : 'invalid') }, values };
  }
  const input = parsed.data;
  const status = input.status ?? statusesFor(input.kind, role)[0]!;
  if (!statusesFor(input.kind, role).includes(status)) {
    return { status: 'error', fieldErrors: { status: t('statusNotAllowed') }, values };
  }
  if (requiresNextAction(input.kind, status) && (!input.next_action || !input.next_action_date)) {
    return { status: 'error', fieldErrors: { next_action: t('nextActionRequired') }, values };
  }

  // a closer's contact is hers whatever the form says; only the admin chooses an owner
  const ownerId = role === 'admin' ? input.owner_id || null : user.id;

  let organizationId: string | null = null;
  if (input.organization) {
    const name = input.organization;
    const { data: found } = await supabase.from('crm_organizations').select('id').ilike('name', name.replace(/[%_\\]/g, '\\$&')).limit(1).maybeSingle();
    if (found) organizationId = found.id;
    else {
      const { data: created, error } = await supabase
        .from('crm_organizations')
        .insert({ name, name_normalized: name.toLowerCase(), kind: organizationKindFor(input.kind), source: 'manual' })
        .select('id')
        .single();
      if (error) return { status: 'error', formError: t(rpcErrorKey(error)), values };
      organizationId = created.id;
    }
  }

  const { data: contact, error } = await supabase
    .from('crm_contacts')
    .insert({
      kind: input.kind,
      status,
      display_name: input.display_name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      linkedin_url: input.linkedin_url ?? null,
      organization_id: organizationId,
      owner_id: ownerId,
      source: 'manual',
      locale,
      next_action: input.next_action && input.next_action_date ? input.next_action : null,
      next_action_at:
        input.next_action && input.next_action_date ? toNextActionAt(input.next_action_date, input.next_action_time) : null,
    })
    .select('id')
    .single();
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)), values };

  // a lead is an opportunity of the contact: the manual one starts with its open lead, ready to close
  if (input.kind === 'lead') {
    await supabase.from('leads').insert({ contact_id: contact.id, source: 'manual' });
  }

  refresh();
  // /crm has no English slug and is outside the pathnames map
  redirect(`/crm/contactos/${contact.id}`);
}

export async function reassignContact(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  // admin only, checked here and not in the page that shows the button
  const { supabase, user } = await requireAdmin({ locale, next: '/crm/contactos' });

  const parsed = reassignContactInputSchema.safeParse(fieldsOf(data, ['contact_id', 'owner_id']));
  if (!parsed.success) return { status: 'error', fieldErrors: { owner_id: t('ownerInvalid') } };
  const { contact_id, owner_id } = parsed.data;

  let label = t('unassignedName');
  if (owner_id) {
    const { data: staff } = await supabase
      .from('staff_members')
      .select('user_id, display_name, disabled_at' as 'user_id, display_name')
      .eq('user_id', owner_id)
      .maybeSingle();
    const member = staff as unknown as { display_name: string | null; disabled_at: string | null } | null;
    if (!member || member.disabled_at) return { status: 'error', fieldErrors: { owner_id: t('ownerInvalid') } };
    label = member.display_name ?? label;
  }

  const { data: updated, error } = await supabase
    .from('crm_contacts')
    .update({ owner_id: owner_id || null })
    .eq('id', contact_id)
    .select('id');
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)) };
  if (!updated?.length) return { status: 'error', formError: t('notFound') };

  await supabase.from('crm_interactions').insert({
    contact_id,
    kind: 'note',
    direction: 'internal',
    actor: 'jose',
    body: t('reassignedNote', { owner: label }),
    payload: { reassigned_by: user.id, owner_id: owner_id || null },
  });

  refresh();
  return { status: 'ok' };
}

export async function inviteClientAccess(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  const { role, supabase } = await requireStaff({ locale, next: '/crm/contactos' });

  const fields = fieldsOf(data, ['client_id', 'contact_id', 'email']);
  // a closer invites the email of the contact and nothing else: the RPC refuses a different one, and we do not even send it
  if (role !== 'admin') fields.email = '';
  const parsed = inviteAccessInputSchema.safeParse({ email: '', ...fields });
  if (!parsed.success) return { status: 'error', fieldErrors: { email: t('accessInvalidEmail') }, values: fields };

  const { error } = await supabase.rpc('invite_client_access', {
    p_client_id: parsed.data.client_id,
    p_email: parsed.data.email,
  });
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)), values: fields };

  refresh();
  return { status: 'ok' };
}

export async function requestClose(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  const { supabase } = await requireStaff({ locale, next: '/crm/contactos' });

  const parsed = requestCloseInputSchema.safeParse(fieldsOf(data, ['lead_id', 'contact_id']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };

  const { error } = await supabase.rpc('crm_request_close', { p_lead_id: parsed.data.lead_id });
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)) };

  refresh();
  return { status: 'ok' };
}

export async function closeLeadPaid(_previous: State, data: FormData): Promise<State> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crmContacts.errors' });
  // «Cerrar cobrado» is the admin's: a closer never reaches the RPC from here, and the RPC refuses her too
  const { supabase } = await requireAdmin({ locale, next: '/crm/contactos' });

  const values = fieldsOf(data, ['lead_id', 'contact_id', 'amount', 'paid_at', 'commission', 'pack_code']);
  const parsed = closePaidInputSchema.safeParse(values);
  if (!parsed.success) return { status: 'error', fieldErrors: { amount: t('amountInvalid') }, values };
  const input = parsed.data;

  const { data: lead } = await supabase
    .from('leads')
    .select('id, status, pack_code, affiliate_code, contact_id')
    .eq('id', input.lead_id)
    .maybeSingle();
  if (!lead || lead.contact_id !== input.contact_id) return { status: 'error', formError: t('notFound'), values };
  if (lead.status !== 'open') return { status: 'error', formError: t('leadClosed'), values };

  // a manual lead has no pack yet and «Cerrar cobrado» creates the client from it
  const pack = values.pack_code;
  if (!lead.pack_code && pack) {
    const { error } = await supabase.from('leads').update({ pack_code: pack }).eq('id', lead.id);
    if (error) return { status: 'error', formError: t(rpcErrorKey(error)), values };
  }

  const affiliateLevel = lead.affiliate_code ? await getAffiliateLevel(lead.affiliate_code) : null;
  const args = buildClosePaidArgs({
    leadId: lead.id,
    amount: input.amount,
    paidAt: input.paid_at,
    affiliateLevel,
    commission: input.commission,
  });
  const { error } = await supabase.rpc('admin_close_lead_paid', args);
  if (error) return { status: 'error', formError: t(rpcErrorKey(error)), values };

  refresh();
  return { status: 'ok' };
}
