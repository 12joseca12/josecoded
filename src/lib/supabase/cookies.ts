import type { CookieOptionsWithName } from "@supabase/ssr";

export function sessionCookieOptions(loopback: boolean): CookieOptionsWithName {
  return { httpOnly: true, sameSite: "lax", secure: !loopback, path: "/" };
}
