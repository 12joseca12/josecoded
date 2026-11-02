'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { requireAdmin } from '@/lib/auth/guards';
import { fieldsOf, localeOf } from '@/lib/crm/action-support';
import { PRICING_PATH } from '@/lib/pricing/catalogue';
import { deleteFormSchema, extraFormSchema, optionFormSchema, packFormSchema, settingsFormSchema } from '@/lib/pricing/schemas';

import type { ServerSupabase } from '@/lib/supabase/server';
import type { FormState } from '@josecoded/types';
import type { z } from 'zod';

// Server Actions of D2 Precios (block B40). Only the admin: `requireAdmin()` is the first thing each one does, before
// the form is read. Each validates with zod (the same bounds as the database and the published file) and calls a
// `admin_pricing_*` RPC through the admin's own JWT, which checks the role again; the database is the authority and
// writes the price history. They write the DRAFT: nothing reaches the site until the catalogue is published. Errors
// never echo what the database said.

type SaveState = FormState<{ code: string; name_es: string; price: string; weeks: string }>;
type PlainState = FormState<{ code: string }>;
type RatesState = FormState<{ hourly: string; feature: string }>;

type Failure = 'invalid' | 'codeTaken' | 'notFound' | 'deleted' | 'optionNeedsApp' | 'forbidden' | 'failed';

/** What the database says when a rule is broken, as a key of `adminPricing.errors`. Unknown → `failed`. */
function failureOf(error: { code?: string; message?: string }): Failure {
  const message = error.message ?? '';
  if (/_deleted/.test(message)) return 'deleted';
  if (/code_taken/.test(message)) return 'codeTaken';
  if (/option_needs_app_pack/.test(message)) return 'optionNeedsApp';
  if (/pack_not_found|item_not_found/.test(message)) return 'notFound';
  if (/invalid_code|name_and_price_required|invalid_rate|invalid_kind/.test(message)) return 'invalid';
  return error.code === '42501' ? 'forbidden' : 'failed';
}

const refresh = () => revalidatePath('/[locale]/admin/contenido', 'page');

const KEYS = {
  pack: ['mode', 'code', 'name_es', 'name_en', 'includes_es', 'includes_en', 'for_whom_es', 'for_whom_en', 'price', 'weeks', 'on_sale', 'visible'],
  option: ['mode', 'pack', 'code', 'name_es', 'name_en', 'includes_es', 'includes_en', 'for_whom_es', 'for_whom_en', 'price', 'weeks', 'visible'],
  extra: ['mode', 'code', 'name_es', 'name_en', 'includes_es', 'includes_en', 'price', 'billing', 'on_sale', 'visible'],
} as const;

type Errors = Awaited<ReturnType<typeof getTranslations<'adminPricing.errors'>>>;

/** One field error for the first field that failed; any other field says «invalid» for the whole form. */
function invalidState(error: z.ZodError, t: Errors): SaveState {
  const field = error.issues[0]?.path[0];
  if (field === 'code') return { status: 'error', fieldErrors: { code: t('code') } };
  if (field === 'name_es') return { status: 'error', fieldErrors: { name_es: t('name') } };
  if (field === 'price') return { status: 'error', fieldErrors: { price: t('price') } };
  if (field === 'weeks') return { status: 'error', fieldErrors: { weeks: t('weeks') } };
  return { status: 'error', formError: t('invalid') };
}

/** `edit` needs the item to exist, `create` needs the code to be free: the RPC upserts by code, so this is the guard. */
async function itemExists(supabase: ServerSupabase, kind: 'pack' | 'option' | 'extra', code: string, pack?: string): Promise<boolean> {
  if (kind === 'pack') return Boolean((await supabase.from('packs').select('code').eq('code', code).maybeSingle()).data);
  if (kind === 'extra') return Boolean((await supabase.from('extras').select('code').eq('code', code).maybeSingle()).data);
  return Boolean((await supabase.from('pack_options').select('code').eq('pack_code', pack ?? '').eq('code', code).maybeSingle()).data);
}

type Parsed = { mode: 'create' | 'edit'; code: string; pack?: string };

/** The part every save shares: guard, parse, create/edit check, RPC, refresh. */
async function save<S extends z.ZodType<Parsed>>(
  data: FormData,
  kind: keyof typeof KEYS,
  schema: S,
  call: (supabase: ServerSupabase, parsed: z.output<S>) => PromiseLike<{ error: { code?: string; message?: string } | null }>,
): Promise<SaveState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: PRICING_PATH });
  const t = await getTranslations({ locale, namespace: 'adminPricing.errors' });

  const parsed = schema.safeParse(fieldsOf(data, KEYS[kind]));
  if (!parsed.success) return invalidState(parsed.error, t);
  const { mode, code, pack } = parsed.data;

  const exists = await itemExists(supabase, kind, code, pack);
  if (mode === 'create' && exists) return { status: 'error', fieldErrors: { code: t('codeTaken') } };
  if (mode === 'edit' && !exists) return { status: 'error', formError: t('notFound') };

  // The checks above are only for a fast, friendly answer: the RPC repeats them atomically (`create` in the payload),
  // so two admins creating the same code at once cannot overwrite each other.
  const { error } = await call(supabase, parsed.data);
  if (error) {
    const failure = failureOf(error);
    return failure === 'codeTaken' ? { status: 'error', fieldErrors: { code: t('codeTaken') } } : { status: 'error', formError: t(failure) };
  }
  refresh();
  return { status: 'ok' };
}

/** Creates a pack or edits the one named by `code` (immutable: the edit form sends it hidden). */
export async function savePack(_previous: SaveState, data: FormData): Promise<SaveState> {
  return save(data, 'pack', packFormSchema, (supabase, { payload }) => supabase.rpc('admin_pricing_set_pack', { p: payload }));
}

/**
 * The option of a pack (`pack` is the pack's code). Only app packs have options: the published file carries no others,
 * so one on a web pack would be saved and never shown.
 */
export async function saveOption(_previous: SaveState, data: FormData): Promise<SaveState> {
  return save(data, 'option', optionFormSchema, async (supabase, { pack, payload }) => {
    const owner = await supabase.from('packs').select('kind').eq('code', pack).maybeSingle();
    if (owner.data?.kind !== 'app') return { error: { message: 'option_needs_app_pack' } };
    return supabase.rpc('admin_pricing_set_option', { p_pack_code: pack, p: payload });
  });
}

export async function saveExtra(_previous: SaveState, data: FormData): Promise<SaveState> {
  return save(data, 'extra', extraFormSchema, (supabase, { payload }) => supabase.rpc('admin_pricing_set_extra', { p: payload }));
}

/** Soft delete (`kind` `pack`, `pack_option` with `P5:plus`, or `extra`): nothing is removed, clients keep their pack. */
async function toggleDeleted(data: FormData, rpc: 'admin_pricing_delete' | 'admin_pricing_restore'): Promise<PlainState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: PRICING_PATH });
  const t = await getTranslations({ locale, namespace: 'adminPricing.errors' });

  const parsed = deleteFormSchema.safeParse(fieldsOf(data, ['kind', 'code']));
  if (!parsed.success) return { status: 'error', formError: t('invalid') };

  const { error } = await supabase.rpc(rpc, { p_kind: parsed.data.kind, p_code: parsed.data.code });
  if (error) return { status: 'error', formError: t(failureOf(error)) };
  refresh();
  return { status: 'ok' };
}

export async function deletePriceItem(_previous: PlainState, data: FormData): Promise<PlainState> {
  return toggleDeleted(data, 'admin_pricing_delete');
}

export async function restorePriceItem(_previous: PlainState, data: FormData): Promise<PlainState> {
  return toggleDeleted(data, 'admin_pricing_restore');
}

/** The hourly rate and the «from» price of a closed feature (whole euros, no VAT). */
export async function saveSettings(_previous: RatesState, data: FormData): Promise<RatesState> {
  const locale = localeOf(data);
  const { supabase } = await requireAdmin({ locale, next: PRICING_PATH });
  const t = await getTranslations({ locale, namespace: 'adminPricing.errors' });

  const values = fieldsOf(data, ['hourly', 'feature']);
  const parsed = settingsFormSchema.safeParse(values);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: 'error', fieldErrors: { [field === 'feature' ? 'feature' : 'hourly']: t('rate') }, values };
  }

  const { error } = await supabase.rpc('admin_pricing_set_settings', { p_hourly: parsed.data.hourly, p_feature: parsed.data.feature });
  if (error) return { status: 'error', formError: t(failureOf(error)), values };
  refresh();
  return { status: 'ok' };
}
