import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadInbox } from "@/components/crm/LeadInbox/LeadInbox";
import { OwnLeadList } from "@/components/crm/OwnLeadList/OwnLeadList";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { FilterTabs } from "@/components/staff/FilterTabs/FilterTabs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildOfferLabels } from "@/lib/admin/lead-offer";
import { requireZone } from "@/lib/auth/session";
import { fetchInbox, parseInboxTab, toInboxCards, toOwnItems } from "@/lib/crm/inbox";
import { inboxLabels, localeLabels, ownLeadsLabels, viaLabels } from "@/lib/crm/inbox-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import type { InboxTab } from "@/types/inbox";

import styles from "../crm.module.css";
import { claimLeadAction } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

interface LeadsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: LeadsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.leads.meta.title") };
}

interface SectionProps {
  locale: Locale;
  userId: string;
  role: UserRole;
  params: SearchParams;
}

async function LeadsSection({ locale, userId, role, params }: SectionProps) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchInbox(client, userId, role);

  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.leads.error.title")}
        text={t("crm.leads.error.text")}
        retryLabel={t("crm.leads.error.retry")}
        loadingLabel={t("crm.leads.error.retrying")}
      />
    );
  }

  const tab = parseInboxTab(params, result.hasTeam);
  const base = `/${locale}/crm/interesados`;
  const href = (target: InboxTab) => (target === "inbox" ? base : `${base}?tab=${target}`);
  const tabs: { key: InboxTab; count: number }[] = [
    { key: "inbox", count: result.inbox.length },
    { key: "mine", count: result.mine.length },
    ...(result.hasTeam ? [{ key: "team" as const, count: result.team.length }] : []),
  ];
  const offers = buildOfferLabels(t);

  const body = () => {
    if (tab === "inbox") {
      return (
        <>
          {result.inbox.length > 0 ? (
            <p className={styles.note}>{t("crm.leads.inbox.note")}</p>
          ) : null}
          <LeadInbox
            cards={toInboxCards(result.inbox, locale, offers, viaLabels(t), localeLabels(t))}
            labels={inboxLabels(t)}
            claim={claimLeadAction.bind(null, locale)}
            contactBase={`/${locale}/crm/contactos`}
            empty={
              <EmptyState
                headingLevel={2}
                title={t("crm.leads.inbox.empty.title")}
                text={t("crm.leads.inbox.empty.text")}
              />
            }
          />
          {result.inbox.length >= result.limit ? (
            <p className={styles.note}>
              {t("crm.leads.limit").replace("{count}", String(result.limit))}
            </p>
          ) : null}
        </>
      );
    }
    const rows = tab === "mine" ? result.mine : result.team;
    if (rows.length === 0) {
      const scope = tab === "mine" ? "mineEmpty" : "teamEmpty";
      return (
        <EmptyState
          headingLevel={2}
          title={t(`crm.leads.own.${scope}.title`)}
          text={t(`crm.leads.own.${scope}.text`)}
        />
      );
    }
    return (
      <OwnLeadList
        items={toOwnItems(rows, locale, offers)}
        labels={ownLeadsLabels(t, tab)}
        locale={locale}
        people={tab === "team" ? result.people : null}
      />
    );
  };

  return (
    <>
      <FilterTabs
        label={t("crm.leads.tabs.label")}
        items={tabs.map((entry) => ({
          key: entry.key,
          label: t(`crm.leads.tabs.${entry.key}`),
          count: entry.count,
          href: href(entry.key),
          current: entry.key === tab,
        }))}
      />
      {body()}
    </>
  );
}

export default async function LeadsPage({ params, searchParams }: LeadsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const t = await getTranslator(locale);
  const query = await searchParams;
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("crm.leads.title")}
        </Heading>
        <p className={styles.lead}>{t("crm.leads.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("crm.leads.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="3rem" />
                <Skeleton height="8rem" />
                <Skeleton height="8rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <LeadsSection locale={locale} userId={member.userId} role={member.role} params={query} />
      </Suspense>
    </>
  );
}
