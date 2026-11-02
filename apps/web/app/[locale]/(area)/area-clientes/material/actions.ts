'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { assetUploadIntentSchema, localeSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { assetStoragePath, cleanFileName } from '@/lib/area/assets';
import { getAreaContext } from '@/lib/area/queries';
import { createServerSupabase } from '@/lib/supabase/server';

// Server Actions of the client material. Files travel from the browser straight to Storage with a
// one-use signed upload token (a Server Action cannot carry 25 MiB), so the action only does what the
// browser must not decide: it validates the declared file, creates the `client_assets` row for the
// session's own client (RLS: source `client`, uploader = the session) and asks Storage for the token
// of that exact path. The storage policy then only accepts an object whose row already exists.

const BUCKET = 'client-assets';
const idSchema = z.uuid();

export type PrepareUploadResult =
  | { ok: true; assetId: string; path: string; token: string }
  | { ok: false; reason: 'invalid' | 'failed' };

export async function prepareAssetUpload(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PrepareUploadResult> {
  const parsed = assetUploadIntentSchema.safeParse({
    fileName: cleanFileName(String(input.fileName ?? '')),
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });
  if (!parsed.success || parsed.data.fileName === '') return { ok: false, reason: 'invalid' };

  const context = await getAreaContext();
  // staff can read every client through RLS: the area is not their tool, never upload as one
  if (!context?.client || context.isAdmin) return { ok: false, reason: 'failed' };
  const { supabase, user } = context.session;

  const assetId = crypto.randomUUID();
  const path = assetStoragePath(context.client.id, assetId);
  const { error } = await supabase.from('client_assets').insert({
    id: assetId,
    client_id: context.client.id,
    uploaded_by_user_id: user.id,
    source: 'client',
    storage_path: path,
    file_name: parsed.data.fileName,
    mime_type: parsed.data.mimeType,
    size_bytes: parsed.data.sizeBytes,
  });
  if (error) return { ok: false, reason: 'failed' };

  const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (signError || !data) {
    await supabase.from('client_assets').delete().eq('id', assetId);
    return { ok: false, reason: 'failed' };
  }
  return { ok: true, assetId, path, token: data.token };
}

/**
 * Removes one of the client's own uploads: the object first, then the row (so a failure never leaves
 * a row pointing at nothing visible, nor an object without a row). Also used by the browser to undo a
 * row whose upload failed. RLS only lets a client delete what they uploaded themselves.
 */
export async function deleteAsset(assetId: string): Promise<{ ok: boolean }> {
  const id = idSchema.safeParse(assetId);
  if (!id.success) return { ok: false };
  const supabase = await createServerSupabase();
  const { data: row } = await supabase.from('client_assets').select('id, storage_path').eq('id', id.data).maybeSingle();
  if (!row) return { ok: false };
  // both steps must be confirmed: a failed storage removal leaves the row (and the object) in place so the
  // client can retry, and a delete RLS silently turns into zero rows is not reported as done
  const { error: removeError } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
  if (removeError) return { ok: false };
  const { data: deleted, error } = await supabase.from('client_assets').delete().eq('id', row.id).select('id');
  if (error || deleted?.length !== 1) return { ok: false };
  return { ok: true };
}

/** Refreshes the list after the browser finished an upload. */
export async function refreshMaterial(localeInput: string): Promise<void> {
  const locale = localeSchema.catch('es').parse(localeInput);
  revalidatePath(getPathname({ href: '/area-clientes/material', locale }));
}
