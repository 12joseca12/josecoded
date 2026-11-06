import "server-only";

import { NextResponse } from "next/server";

import { buildChatRuntime, type ChatRuntime } from "./deps";
import type { ChatResult } from "./process";
import { visitorCookieMaxAge, visitorCookieName } from "./visitor-token";

const noStore = { "cache-control": "no-store" };

export function runtimeOf(): ChatRuntime | null {
  return buildChatRuntime(process.env);
}

export function ipOf(request: Request): string | null {
  return request.headers.get("cf-connecting-ip");
}

export function cookieOf(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === visitorCookieName) return value.join("=");
  }
  return undefined;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function respond<T extends object>(result: ChatResult<T>, secure: boolean): Response {
  if (result.body === null) return new Response(null, { status: result.http, headers: noStore });
  const response = NextResponse.json(result.body, { status: result.http, headers: noStore });
  if (result.setCookie) {
    response.cookies.set(visitorCookieName, result.setCookie, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: visitorCookieMaxAge,
    });
  }
  return response;
}

export function isSecureOrigin(request: Request): boolean {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}
