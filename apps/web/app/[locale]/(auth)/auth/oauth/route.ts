import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';

import { oauthSignInSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { safeNext } from '@/lib/auth/next-param';
import { env } from '@/lib/env';
import { createServerSupabase } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

// Starts the OAuth flow (PKCE; the verifier is kept in a cookie by the server client). It is a GET
// route handler reached by a plain link, not a form: a form posting to a Server Action that answers
// with an external redirect would need the provider in `form-action`, and the CSP keeps it at 'self'.
// Starting a flow is safe on GET (PKCE binds the return to this browser; nothing changes server-side).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: candidate } = await params;
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  const { searchParams, origin } = new URL(request.url);
  const fail = () =>
    NextResponse.redirect(`${origin}${getPathname({ href: '/auth/login', locale })}?error=callback`);

  const parsed = oauthSignInSchema.safeParse({
    provider: searchParams.get('provider') ?? undefined,
    next: searchParams.get('next') || undefined,
    audience: searchParams.get('audience') || undefined,
  });
  if (!parsed.success) return fail();

  const next = safeNext(parsed.data.next, getPathname({ href: '/area-clientes', locale }));
  const query = new URLSearchParams({ next });
  if (parsed.data.audience) query.set('audience', parsed.data.audience);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: {
      redirectTo: `${env.client.NEXT_PUBLIC_SITE_URL}${getPathname({ href: '/auth/callback', locale })}?${query}`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return fail();
  return NextResponse.redirect(data.url);
}
