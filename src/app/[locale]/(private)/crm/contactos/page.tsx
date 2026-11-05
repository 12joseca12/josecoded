import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ContactFilters } from "@/components/crm/ContactFilters/ContactFilters";
import { ContactTable } from "@/components/crm/ContactTable/ContactTable";
import { NewContactSheet } from "@/components/crm/NewContactSheet/NewContactSheet";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import {
  contactFilterLabels,
  contactTableLabels,
  newContactLabels,
} from "@/lib/crm/contact-labels";
import { fetchContacts, hasActiveFilters, parseContactFilters } from "@/lib/crm/contacts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

import styles from "../crm.module.css";
import { changeStageAction, createContactAction } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

interface ContactsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: ContactsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.contacts.meta.title") };
}

interface SectionProps {
  locale: Locale;
  role: UserRole;
  params: SearchParams;
}

async function ContactsSection({ locale, role, params }: SectionProps) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const filters = parseContactFilters(params);
  const result = await fetchContacts(client, filters);

  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.contacts.error.title")}
        text={t("crm.contacts.error.text")}
        retryLabel={t("crm.contacts.error.retry")}
        loadingLabel={t("crm.contacts.error.retrying")}
      />
    );
  }

  const active = hasActiveFilters(filters);
  const isAdmin = role === "admin";
  const showOwner = isAdmin || result.owners.length > 1;
  const owners = Object.fromEntries(result.owners.map((owner) => [owner.id, owner.name]));

  return (
    <>
      <ContactFilters
        action={`/${locale}/crm/contactos`}
        filters={filters}
        owners={result.owners}
        showOwner={showOwner}
        allowNoOwner={isAdmin}
        active={active}
        labels={contactFilterLabels(t)}
      />
      {result.rows.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title={t(active ? "crm.contacts.emptyFiltered.title" : "crm.contacts.empty.title")}
          text={t(active ? "crm.contacts.emptyFiltered.text" : "crm.contacts.empty.text")}
        />
      ) : (
        <>
          <ContactTable
            rows={result.rows}
            owners={owners}
            showOwner={showOwner}
            locale={locale}
            nowIso={result.nowIso}
            labels={contactTableLabels(t)}
            changeStage={changeStageAction.bind(null, locale)}
          />
          {result.rows.length >= result.limit ? (
            <p className={styles.note}>
              {t("crm.contacts.limit").replace("{count}", String(result.limit))}
            </p>
          ) : null}
        </>
      )}
    </>
  );
}

export default async function ContactsPage({ params, searchParams }: ContactsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const t = await getTranslator(locale);
  const query = await searchParams;
  return (
    <>
      <header className={styles.headRow}>
        <div className={styles.head}>
          <Heading level={1} size="h2">
            {t("crm.contacts.title")}
          </Heading>
          <p className={styles.lead}>{t("crm.contacts.lead")}</p>
        </div>
        <NewContactSheet
          labels={newContactLabels(t)}
          create={createContactAction.bind(null, locale)}
        />
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("crm.contacts.loading")}
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
        <ContactsSection locale={locale} role={member.role} params={query} />
      </Suspense>
    </>
  );
}
