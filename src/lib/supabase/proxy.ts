import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { readSupabasePublicConfig } from "@/lib/auth/env";
import { requestPathHeader } from "@/lib/auth/guards";

import { sessionCookieOptions } from "./cookies";

export async function refreshSession(
  request: NextRequest,
  env: Record<string, string | undefined> = process.env,
): Promise<NextResponse> {
  request.headers.set(requestPathHeader, request.nextUrl.pathname);
  let response = NextResponse.next({ request });
  const config = readSupabasePublicConfig(env);
  if (!config) return response;

  const client = createServerClient(config.supabaseUrl, config.publishableKey, {
    cookieOptions: sessionCookieOptions(config.loopback),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries, headers) => {
        for (const { name, value } of entries) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of entries) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  try {
    await client.auth.getClaims();
  } catch {
    return response;
  }
  return response;
}
