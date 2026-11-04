"use server";

import { redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { handleSignOut } from "@/lib/auth/handler";

export async function signOut(locale: string): Promise<void> {
  await handleSignOut(process.env);
  redirect(`/${isLocale(locale) ? locale : "es"}/entrar`);
}
