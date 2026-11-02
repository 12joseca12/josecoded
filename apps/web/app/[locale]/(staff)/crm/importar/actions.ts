'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { conflictResolutionInputSchema, importResultSchema, localeSchema } from '@josecoded/types';

import { requireAdmin } from '@/lib/auth/guards';
import { requireStaff } from '@/lib/auth/staff';
import { fieldsOf, localeOf } from '@/lib/crm/action-support';
import { CsvError } from '@/lib/crm/csv';
import {
  analyzeImport,
  buildImportRows,
  checksumOf,
  cleanFileName,
  importPayloadSchema,
} from '@/lib/crm/import-analysis';
import { importRpcErrorKey, IMPORTS_PER_HOUR } from '@/lib/crm/import-errors';
import { mappingSchema } from '@/lib/crm/import-mapping';

import type {
  ImportDone,
  ImportErrorKey,
  ImportOutcome,
  PreviewOutcome,
} from '@/lib/crm/import-types';
import type { FormState, Json } from '@josecoded/types';

// Server Actions of K4 (task 6.10). An action is a public endpoint: the file text and the mapping come from the
// browser and are worth nothing until parsed, mapped and validated again here, so what reaches the database is built
// by this code and never by the client. The RPC adds the last guards (owner is the caller, 500 rows, conflicts).

const inputSchema = z.object({
  locale: localeSchema.catch('es'),
  text: z.string(),
  mapping: mappingSchema.nullable(),
  fileName: z.string().max(1000).optional(),
});

const REFUSED = new Set<string>(['bad_mapping', 'no_valid_rows']);

/** The reason a parser or a builder refused, as a key of `crm.import.errors`. */
function refusal(error: unknown): ImportErrorKey {
  if (error instanceof CsvError) return error.code;
  if (error instanceof Error && REFUSED.has(error.message)) return error.message as ImportErrorKey;
  throw error;
}

/** Parses, maps and validates the text; the first 20 rows and the totals come back, nothing is written and no duplicate is looked up. */
export async function previewImport(input: {
  locale: string;
  text: string;
  mapping: Record<string, number> | null;
}): Promise<PreviewOutcome> {
  const parsed = inputSchema.safeParse(input);
  const locale = parsed.success ? parsed.data.locale : 'es';
  await requireStaff({ locale, next: '/crm/importar' });
  if (!parsed.success) return { status: 'error', error: 'bad_mapping' };
  try {
    return { status: 'ok', analysis: analyzeImport(parsed.data.text, parsed.data.mapping) };
  } catch (error) {
    return { status: 'error', error: refusal(error) };
  }
}

/** Imports the file through `crm_import_contacts_csv` with the person's own JWT. */
export async function importContacts(input: {
  locale: string;
  text: string;
  mapping: Record<string, number> | null;
  fileName?: string;
}): Promise<ImportOutcome> {
  const parsed = inputSchema.safeParse(input);
  const locale = parsed.success ? parsed.data.locale : 'es';
  const { supabase, user } = await requireStaff({ locale, next: '/crm/importar' });
  if (!parsed.success || !parsed.data.mapping) return { status: 'error', error: 'bad_mapping' };
  const { text, mapping } = parsed.data;

  let built;
  try {
    built = buildImportRows(text, mapping);
  } catch (error) {
    return { status: 'error', error: refusal(error) };
  }
  const payload = importPayloadSchema.safeParse({
    rows: built.rows,
    file_name: cleanFileName(parsed.data.fileName ?? ''),
    checksum: await checksumOf(text),
  });
  if (!payload.success) return { status: 'error', error: 'bad_mapping' };

  // The web never holds the service key, and `increment_quota` is only granted to it: the hourly limit counts the
  // imports this person already has (RLS lets her read hers), which is what the limit is about.
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from('crm_imports')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .gte('created_at', since);
  if ((count ?? 0) >= IMPORTS_PER_HOUR) return { status: 'error', error: 'hourly' };

  const { data, error } = await supabase.rpc('crm_import_contacts_csv', {
    p_rows: payload.data.rows as Json,
    p_file_name: payload.data.file_name,
    p_checksum: payload.data.checksum,
  });
  if (error) return { status: 'error', error: importRpcErrorKey(error) };
  const result = importResultSchema.safeParse(data);
  if (!result.success) return { status: 'error', error: 'failed' };

  const done: ImportDone = result.data;
  if (result.data.replayed) {
    const { data: first } = await supabase
      .from('crm_imports')
      .select('created_at')
      .eq('id', result.data.import_id)
      .maybeSingle();
    if (first) done.importedAt = first.created_at;
  }

  // the inbox, the counters of the rail and the history under the wizard
  revalidatePath('/[locale]/crm', 'layout');
  return { status: 'ok', result: done };
}

type ResolveState = FormState<{ note: string }>;

/** The admin decides a conflict (Q22): the note and the four resolutions are all the form carries; who is who comes from the database. */
export async function resolveConflict(
  _previous: ResolveState,
  data: FormData,
): Promise<ResolveState> {
  const locale = localeOf(data);
  const t = await getTranslations({ locale, namespace: 'crm.import.errors' });
  // admin only, checked here and not in the page that shows the buttons
  const { supabase } = await requireAdmin({ locale, next: '/crm/importar?tab=conflictos' });

  const values = fieldsOf(data, ['conflict_id', 'resolution', 'note']);
  const parsed = conflictResolutionInputSchema.safeParse({
    ...values,
    note: values.note?.trim() || undefined,
  });
  if (!parsed.success) return { status: 'error', formError: t('failed'), values };

  const { error } = await supabase.rpc('admin_import_conflict_resolve', {
    p_id: parsed.data.conflict_id,
    p_resolution: parsed.data.resolution,
    ...(parsed.data.note ? { p_note: parsed.data.note } : {}),
  });
  if (error) {
    const message = error.message ?? '';
    const key = /conflict_not_pending/.test(message)
      ? 'conflictResolved'
      : /conflict_not_found/.test(message)
        ? 'conflictGone'
        : error.code === '42501'
          ? 'forbidden'
          : 'failed';
    return { status: 'error', formError: t(key), values };
  }

  revalidatePath('/[locale]/crm', 'layout');
  return { status: 'ok' };
}
