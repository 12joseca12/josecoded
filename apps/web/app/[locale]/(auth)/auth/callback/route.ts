import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';

import { originAudienceSchema } from '@josecoded/types';

import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { afterSignIn } from '@/lib/auth/after-sign-in';
import { safeNext } from '@/lib/auth/next-param';
import { createServerSupabase } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

// OAuth return (and magic-link return) of the passwordless sign-in: exchanges the PKCE `code` for a
// session (cookies set by the server client), writes the origin signal, claims an invited client and
// goes to `next`, which only ever is an internal path (`safeNext`). On any failure the visitor lands
// on the login with a message, never on a blank page.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: candidate } = await params;
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const fail = () =>
    NextResponse.redirect(`${origin}${getPathname({ href: '/auth/login', locale })}?error=callback`);
  if (!code) return fail();

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail();

  const audience = originAudienceSchema.safeParse(searchParams.get('audience'));
  await afterSignIn(supabase, data.user, {
    ref: request.cookies.get('ref')?.value,
    audience: audience.success ? audience.data : undefined,
  });

  const next = safeNext(searchParams.get('next'), getPathname({ href: '/area-clientes', locale }));
  return NextResponse.redirect(`${origin}${next}`);
}
