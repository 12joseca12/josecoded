"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { buildChatRuntime } from "@/lib/chat/server/deps";
import { processSend } from "@/lib/chat/server/process";
import { visitorCookieMaxAge, visitorCookieName } from "@/lib/chat/server/visitor-token";

export async function sendFromForm(formData: FormData): Promise<void> {
  const rawLocale = formData.get("locale");
  const locale = typeof rawLocale === "string" && isLocale(rawLocale) ? rawLocale : "es";
  const body = formData.get("body");
  const store = await cookies();
  const runtime = buildChatRuntime(process.env);
  const result = await processSend(
    { body: typeof body === "string" ? body : "", locale, pagePath: `/${locale}/chat` },
    { ip: (await headers()).get("cf-connecting-ip"), cookie: store.get(visitorCookieName)?.value },
    runtime?.deps ?? null,
  );
  if (result.setCookie) {
    store.set(visitorCookieName, result.setCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: visitorCookieMaxAge,
    });
  }
  redirect(`/${locale}/chat${result.body?.status === "sent" ? "" : "?error=1"}`);
}
