import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';
import { z } from 'zod';

import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

// «Download» of the client material: a plain link (GET), not a form, so the CSP keeps `form-action 'self'`.
// It answers with a redirect to a 60-second signed URL for a file the session can read (the select goes
// through RLS: a file of another client is simply not found). The URL never sits in a page.
const BUCKET = 'client-assets';
const SIGNED_DOWNLOAD_SECONDS = 60;
const idSchema = z.uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: candidate } = await params;
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  const { searchParams, origin } = new URL(request.url);
  const failed = () =>
    NextResponse.redirect(`${origin}${getPathname({ href: '/area-clientes/material', locale })}?error=download`);

  const id = idSchema.safeParse(searchParams.get('asset'));
  if (!id.success) return failed();

  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from('client_assets')
    .select('storage_path, file_name')
    .eq('id', id.data)
    .maybeSingle();
  if (!row) return failed();

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, SIGNED_DOWNLOAD_SECONDS, { download: row.file_name ?? true });
  if (!signed) return failed();
  const response = NextResponse.redirect(signed.signedUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
