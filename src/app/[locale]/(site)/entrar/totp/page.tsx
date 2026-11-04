import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildTotpFormLabels } from "@/components/auth/labels";
import { TotpForm } from "@/components/auth/TotpForm/TotpForm";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { loginPath, needsSecondFactor, resolveDestination, safeNext } from "@/lib/auth/guards";
import { getSessionState } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface TotpProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: TotpProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return {
    title: t("auth.totp.meta.title"),
    description: t("auth.totp.meta.description"),
    robots: { index: false, follow: false },
  };
}

export default async function TotpPage({ params, searchParams }: TotpProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = safeNext(locale, rawNext);

  const state = await getSessionState();
  if (state === null) notFound();
  if (state.status !== "member") redirect(loginPath(locale, next));
  if (!needsSecondFactor(state)) redirect(resolveDestination(state, locale, next));

  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const factors = await client.auth.mfa.listFactors();
  if (factors.error) throw new Error("factors_unreadable");
  const verified = factors.data.totp[0];

  const t = await getTranslator(locale);
  return (
    <TotpForm
      locale={locale}
      next={next}
      labels={buildTotpFormLabels(t)}
      mode={verified ? "challenge" : "enroll"}
      factorId={verified?.id ?? null}
      loginHref={loginPath(locale, next)}
      lostDeviceHref={`/${locale}/contacto`}
    />
  );
}
