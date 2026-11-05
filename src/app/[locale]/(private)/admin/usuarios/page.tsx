import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { InvitationList } from "@/components/admin/InvitationList/InvitationList";
import { InviteSheet } from "@/components/admin/InviteSheet/InviteSheet";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { UserTable } from "@/components/admin/UserTable/UserTable";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchUsers } from "@/lib/admin/users";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../admin.module.css";
import { inviteUser, renewInvitation, revokeInvitation } from "./actions";
import { invitationListLabels, inviteSheetLabels, userTableLabels } from "./labels";
import page from "./usuarios.module.css";

interface UsersProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: UsersProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.users.meta.title") };
}

async function UsersSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchUsers(client);

  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.users.error.title")}
        text={t("admin.users.error.text")}
        retryLabel={t("admin.users.error.retry")}
        loadingLabel={t("admin.users.error.retrying")}
      />
    );
  }

  const { users, invitations } = result;
  const parents = users
    .filter(
      (user) =>
        user.role === "closer" &&
        user.is_active &&
        user.archived_at === null &&
        user.parent_closer_id === null,
    )
    .map((user) => ({ id: user.id, name: user.full_name }));
  const inviters = new Map(users.map((user) => [user.id, user.full_name]));
  const onlyAdmin =
    users.length > 0 && users.every((user) => user.role === "admin") && invitations.length === 0;

  return (
    <>
      <div className={page.toolbar}>
        <InviteSheet
          locale={locale}
          labels={inviteSheetLabels(t)}
          parents={parents}
          invite={inviteUser.bind(null, locale)}
        />
      </div>
      <section className={page.block}>
        <Heading level={2} size="h4">
          {t("admin.users.table.title")}
        </Heading>
        {users.length === 0 ? (
          <EmptyState
            headingLevel={3}
            title={t("admin.users.empty.title")}
            text={t("admin.users.empty.text")}
          />
        ) : (
          <UserTable rows={users} locale={locale} labels={userTableLabels(t)} />
        )}
        {onlyAdmin ? (
          <EmptyState
            headingLevel={3}
            title={t("admin.users.empty.title")}
            text={t("admin.users.empty.text")}
          />
        ) : null}
      </section>
      <section className={page.block}>
        <Heading level={2} size="h4">
          {t("admin.users.invitations.title")}
        </Heading>
        {invitations.length === 0 ? (
          <p className={styles.note}>{t("admin.users.invitations.empty")}</p>
        ) : (
          <InvitationList
            rows={invitations}
            inviters={inviters}
            locale={locale}
            labels={invitationListLabels(t)}
            renew={renewInvitation.bind(null, locale)}
            revoke={revokeInvitation.bind(null, locale)}
          />
        )}
      </section>
    </>
  );
}

export default async function UsersPage({ params }: UsersProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.users.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.users.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.users.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <UsersSection locale={locale} />
      </Suspense>
    </>
  );
}
