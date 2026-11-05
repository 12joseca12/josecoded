import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildAuthFormLabels } from "@/components/auth/labels";
import { LoginForm } from "@/components/auth/LoginForm/LoginForm";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { readSupabasePublicConfig } from "@/lib/auth/env";
import { resolveDestination, safeNext } from "@/lib/auth/guards";
import { getSessionState } from "@/lib/auth/session";
import { readContactClientConfig } from "@/lib/contact/env";
import { getFeatures } from "@/lib/settings/features";

interface LoginProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: LoginProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return {
    title: t("auth.meta.title"),
    description: t("auth.meta.description"),
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({ params, searchParams }: LoginProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = safeNext(locale, rawNext);

  const state = await getSessionState();
  if (state?.status === "member") redirect(resolveDestination(state, locale, next));

  const [t, { googleSignIn }] = await Promise.all([getTranslator(locale), getFeatures()]);
  const turnstile =
    readSupabasePublicConfig(process.env) !== null ? readContactClientConfig(process.env) : null;

  return (
    <LoginForm
      locale={locale}
      next={next}
      labels={buildAuthFormLabels(t)}
      googleEnabled={googleSignIn}
      turnstile={turnstile}
    />
  );
}
