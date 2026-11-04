import { type NextRequest, NextResponse } from "next/server";

import { buildCsp } from "@/config/headers";
import { createNonce, nonceHeader } from "@/lib/security/nonce";

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp({ nonce, development: process.env.NODE_ENV === "development" });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(nonceHeader, nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
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
