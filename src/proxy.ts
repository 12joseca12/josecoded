import { type NextRequest, NextResponse } from "next/server";

import { buildCsp } from "@/config/headers";
import { isSessionPath } from "@/lib/auth/guards";
import { createNonce, nonceHeader } from "@/lib/security/nonce";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp({ nonce, development: process.env.NODE_ENV === "development" });
  request.headers.set(nonceHeader, nonce);
  request.headers.set("Content-Security-Policy", csp);
  const response = isSessionPath(request.nextUrl.pathname)
    ? await refreshSession(request)
    : NextResponse.next({ request });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
