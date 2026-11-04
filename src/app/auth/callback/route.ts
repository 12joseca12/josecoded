import { NextResponse } from "next/server";

import { features } from "@/config/features";
import { site } from "@/config/site";
import { defaultLocale, isLocale } from "@/i18n/config";
import { loginPath, resolveDestination, safeNext } from "@/lib/auth/guards";
import { readSessionState } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<Response> {
  if (!features.googleSignIn) return new NextResponse(null, { status: 404 });
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const next = safeNext(locale, url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const client = await createSupabaseServerClient();
  const fallback = new URL(loginPath(locale, next), site.origin);
  if (!client || !code) return NextResponse.redirect(fallback);
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(fallback);
  const state = await readSessionState(client);
  return NextResponse.redirect(new URL(resolveDestination(state, locale, next), site.origin));
}
