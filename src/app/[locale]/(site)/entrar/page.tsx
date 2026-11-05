import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { buildAuthFormLabels } from "@/components/auth/labels";
import { LoginForm } from "@/components/auth/LoginForm/LoginForm";
import { features } from "@/config/features";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { readSupabasePublicConfig } from "@/lib/auth/env";
import { isInvitationPath, resolveDestination, safeNext } from "@/lib/auth/guards";
import { getSessionState } from "@/lib/auth/session";
import { readContactClientConfig } from "@/lib/contact/env";

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
  const invitation = next !== null && isInvitationPath(locale, next);
  if (state?.status === "inactive" && invitation) redirect(next);
  const rawEmail = Array.isArray(query.email) ? query.email[0] : query.email;
  const invitedEmail =
    invitation && rawEmail !== undefined && z.email().max(320).safeParse(rawEmail).success
      ? rawEmail
      : null;

  const t = await getTranslator(locale);
  const turnstile =
    readSupabasePublicConfig(process.env) !== null ? readContactClientConfig(process.env) : null;

  return (
    <LoginForm
      locale={locale}
      next={next}
      labels={buildAuthFormLabels(t)}
      googleEnabled={features.googleSignIn}
      turnstile={turnstile}
      invitedEmail={invitedEmail}
    />
  );
}
