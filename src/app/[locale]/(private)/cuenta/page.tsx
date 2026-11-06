import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccountCard } from "@/components/account/AccountCard/AccountCard";
import { DeletionCard } from "@/components/account/DeletionCard/DeletionCard";
import { ProfileForm } from "@/components/account/ProfileForm/ProfileForm";
import { SessionActions } from "@/components/account/SessionActions/SessionActions";
import { TotpManage } from "@/components/account/TotpManage/TotpManage";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { TelegramPanel } from "@/components/admin/NotificationPanels/NotificationPanels";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { contact } from "@/config/contact";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchSignIn, fetchTotpEnrolled } from "@/lib/account/auth";
import { fetchDeletion, fetchProfile } from "@/lib/account/data";
import {
  buildDeletionLabels,
  buildProfileLabels,
  buildSessionsLabels,
  buildTotpLabels,
} from "@/lib/account/labels";
import { requiresAal2 } from "@/lib/auth/roles";
import { requireAccount } from "@/lib/auth/session";
import { fill } from "@/lib/notifications/time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

import styles from "./cuenta.module.css";

interface AccountProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AccountProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("account.meta.title") };
}

const alertsPage: Partial<Record<UserRole, string>> = {
  admin: "/admin/notificaciones",
  closer: "/crm/ajustes",
};

function Loading({ label }: { label: string }) {
  return (
    <LoadingRegion
      loading
      label={label}
      fallback={
        <div className={styles.skeleton}>
          <Skeleton height="4rem" />
          <Skeleton height="4rem" />
        </div>
      }
    >
      {null}
    </LoadingRegion>
  );
}

async function SectionError({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  return (
    <LeadsError
      title={t("account.error.title")}
      text={t("account.error.text")}
      retryLabel={t("account.error.retry")}
      loadingLabel={t("account.error.retrying")}
    />
  );
}

async function ProfileSection({
  locale,
  userId,
  email,
}: {
  locale: Locale;
  userId: string;
  email: string | null;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchProfile(client, userId);
  if (result.status !== "ok") return <SectionError locale={locale} />;
  return (
    <ProfileForm
      locale={locale}
      email={email}
      fullName={result.data.fullName}
      profileLocale={result.data.locale}
      labels={buildProfileLabels(t)}
    />
  );
}

async function AccessSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchSignIn(client);
  if (result.status !== "ok") return <SectionError locale={locale} />;
  const labels = buildSessionsLabels(t);
  return (
    <AccountCard id="access" title={labels.title} lead={labels.lead}>
      <ul className={styles.methods} aria-label={labels.methodsTitle}>
        <li className={styles.method}>
          <span className={styles.methodName}>{labels.email}</span>
        </li>
        <li className={styles.method}>
          <span className={styles.methodName}>{labels.google}</span>
          <span className={styles.methodState}>
            {result.data.google ? labels.googleLinked : labels.googleNotLinked}
          </span>
        </li>
      </ul>
      <SessionActions locale={locale} labels={labels} />
    </AccountCard>
  );
}

async function SecuritySection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchTotpEnrolled(client);
  if (result.status !== "ok") return <SectionError locale={locale} />;
  return <TotpManage locale={locale} enrolled={result.data} labels={buildTotpLabels(t)} />;
}

async function PrivacySection({ locale, role }: { locale: Locale; role: UserRole }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const email = contact.ways[0]?.email ?? "";
  const withDeletion = role !== "admin";
  const deletion = withDeletion ? await fetchDeletion(client) : null;
  return (
    <AccountCard id="privacy" title={t("account.privacy.title")} lead={t("account.privacy.lead")}>
      <div className={styles.block}>
        <Link href={`/${locale}/legal/privacidad`}>{t("account.privacy.policy")}</Link>
      </div>
      <div className={styles.block}>
        <Heading level={3} size="h4">
          {t("account.privacy.exportTitle")}
        </Heading>
        <p className={styles.note}>{t("account.privacy.exportText")}</p>
        <p>
          <Link href={`mailto:${email}`}>{fill(t("account.privacy.contact"), { email })}</Link>
        </p>
      </div>
      {deletion === null ? null : deletion.status === "ok" ? (
        <DeletionCard locale={locale} requestedAt={deletion.data} labels={buildDeletionLabels(t)} />
      ) : deletion.status === "unavailable" ? (
        <p className={styles.note}>{t("account.privacy.deletion.unavailable")}</p>
      ) : (
        <SectionError locale={locale} />
      )}
    </AccountCard>
  );
}

export default async function AccountPage({ params }: AccountProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireAccount(locale);
  const t = await getTranslator(locale);
  const alerts = alertsPage[member.role];
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("account.title")}
        </Heading>
        <p className={styles.lead}>{t("account.lead")}</p>
      </header>
      <div className={styles.stack}>
        <Suspense fallback={<Loading label={t("account.loading.profile")} />}>
          <ProfileSection locale={locale} userId={member.userId} email={member.email} />
        </Suspense>
        <Suspense fallback={<Loading label={t("account.loading.access")} />}>
          <AccessSection locale={locale} />
        </Suspense>
        {requiresAal2(member.role) ? (
          <Suspense fallback={<Loading label={t("account.loading.security")} />}>
            <SecuritySection locale={locale} />
          </Suspense>
        ) : null}
        {alerts ? (
          <Suspense fallback={<Loading label={t("account.loading.telegram")} />}>
            <TelegramPanel locale={locale} zone="account" withTest={false} />
            <p className={styles.note}>
              <Link href={`/${locale}${alerts}`}>{t("account.notifications.link")}</Link>
            </p>
          </Suspense>
        ) : null}
        <Suspense fallback={<Loading label={t("account.loading.privacy")} />}>
          <PrivacySection locale={locale} role={member.role} />
        </Suspense>
      </div>
    </>
  );
}
