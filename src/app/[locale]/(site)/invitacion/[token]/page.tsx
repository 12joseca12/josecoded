import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard/AuthCard";
import { buildInvitationLabels } from "@/components/auth/invitation-labels";
import { InvitationAccept } from "@/components/auth/InvitationAccept/InvitationAccept";
import { SignOutButton } from "@/components/staff/StaffShell/SignOutButton";
import { Button } from "@/components/ui/Button/Button";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { homeZone, zonePath } from "@/lib/auth/roles";
import { getSessionState } from "@/lib/auth/session";
import {
  decideInvitationView,
  formatInvitationDate,
  readInvitation,
  type SessionView,
} from "@/lib/invitation/invitation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { InvitationLabels, InvitationSummary } from "@/types/invitation";

import { acceptInvitation, leaveInvitation } from "../actions";
import styles from "./page.module.css";

interface InvitationProps {
  params: Promise<{ locale: string; token: string }>;
}

export async function generateMetadata({ params }: InvitationProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("invitation.title"), robots: { index: false, follow: false } };
}

async function readSession(locale: Locale): Promise<SessionView> {
  const state = await getSessionState();
  if (state === null || state.status === "anonymous") return { kind: "anonymous" };
  if (state.status === "member") {
    return { kind: "member", destination: zonePath(locale, homeZone(state.role)) };
  }
  const client = await createSupabaseServerClient();
  const { data } = client ? await client.auth.getClaims() : { data: null };
  const email = data?.claims.email;
  return { kind: "profileless", email: typeof email === "string" ? email : null };
}

function leadOf(
  summary: Exclude<InvitationSummary, { status: "unknown" }>,
  labels: InvitationLabels,
): string {
  const role = labels.roles[summary.role];
  return summary.inviterName
    ? labels.lead.replace("{inviter}", summary.inviterName).replace("{role}", role)
    : labels.leadAnonymous.replace("{role}", role);
}

export default async function InvitationPage({ params }: InvitationProps) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const service = createSupabaseServiceClient();
  if (service === null) notFound();
  const summary = await readInvitation(service, token);
  if (summary === null) throw new Error("invitation_unreadable");

  const t = await getTranslator(locale);
  const labels = buildInvitationLabels(t);
  const view = decideInvitationView(summary, await readSession(locale));

  if (view.kind === "enter") redirect(view.destination);

  if (view.kind === "gone") {
    const copy = labels.gone[view.reason];
    return (
      <AuthCard title={copy.title} lead={copy.text}>
        <div className={styles.actions}>
          <Button href={`/${locale}/contacto`} variant="light">
            {labels.goneAction}
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (summary.status === "unknown") notFound();
  const lead = leadOf(summary, labels);
  const expires = labels.expires.replace("{date}", formatInvitationDate(summary.expiresAt, locale));

  if (view.kind === "login") {
    const next = `/${locale}/invitacion/${token}`;
    const href = `/${locale}/entrar?email=${encodeURIComponent(summary.email)}&next=${encodeURIComponent(next)}`;
    return (
      <AuthCard title={labels.title} lead={lead}>
        <p className={styles.text}>{expires}</p>
        <p className={styles.text}>{labels.enterHint.replace("{email}", summary.email)}</p>
        <div className={styles.actions}>
          <Button href={href} variant="accent">
            {labels.enter}
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (view.kind === "mismatch") {
    return (
      <AuthCard title={labels.mismatch.title} lead={labels.mismatch.text}>
        <form action={leaveInvitation.bind(null, locale, token)} className={styles.actions}>
          <SignOutButton label={labels.mismatch.action} loadingLabel={labels.mismatch.acting} />
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={labels.acceptTitle} lead={lead}>
      <p className={styles.text}>{expires}</p>
      <InvitationAccept
        token={token}
        locale={locale}
        labels={labels}
        accept={acceptInvitation.bind(null, locale)}
      />
    </AuthCard>
  );
}
