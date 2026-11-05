import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActivityComposer } from "@/components/crm/ActivityComposer/ActivityComposer";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline/ActivityTimeline";
import { ContactHead } from "@/components/crm/ContactHead/ContactHead";
import { DealCard } from "@/components/crm/DealCard/DealCard";
import { ReassignSheet } from "@/components/crm/ReassignSheet/ReassignSheet";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { fetchContactDetail } from "@/lib/crm/contact-detail";
import { isOpenStage } from "@/lib/crm/contacts";
import {
  activityComposerLabels,
  activityTimelineLabels,
  contactHeadLabels,
  dealCardLabels,
  reassignLabels,
} from "@/lib/crm/detail-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

import styles from "../../crm.module.css";
import { changeStageAction } from "../actions";
import { addActivityAction, reassignContactAction } from "./actions";
import detail from "./detail.module.css";

interface ContactProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: ContactProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.contact.meta.title") };
}

interface SectionProps {
  locale: Locale;
  id: string;
  role: UserRole;
}

async function ContactSection({ locale, id, role }: SectionProps) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchContactDetail(client, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.contact.error.title")}
        text={t("crm.contact.error.text")}
        retryLabel={t("crm.contact.error.retry")}
        loadingLabel={t("crm.contact.error.retrying")}
      />
    );
  }

  const { contact, activities, people } = result;
  const names = Object.fromEntries(people.map((person) => [person.id, person.name]));
  const labels = dealCardLabels(t);
  const changeStage = changeStageAction.bind(null, locale);
  const dealOptions = contact.deals
    .filter((deal) => isOpenStage(deal.stage))
    .map((deal) => ({
      id: deal.id,
      label: `${labels.stages[deal.stage]} (${labels.vias[deal.via]})`,
    }));
  const deals = [...contact.deals].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const nowIso = new Date().toISOString();

  return (
    <>
      <ContactHead
        contact={contact}
        ownerName={contact.owner_id === null ? null : (names[contact.owner_id] ?? null)}
        locale={locale}
        nowIso={nowIso}
        labels={contactHeadLabels(t)}
        actions={
          role === "admin" ? (
            <ReassignSheet
              contactId={contact.id}
              currentOwnerId={contact.owner_id}
              owners={people.filter((person) => person.assignable)}
              labels={reassignLabels(t)}
              reassign={reassignContactAction.bind(null, locale)}
            />
          ) : null
        }
      />
      <section className={detail.section} aria-labelledby="deals-title">
        <Heading level={2} size="h3" id="deals-title">
          {t("crm.contact.deals.title")}
        </Heading>
        {deals.length === 0 ? (
          <EmptyState
            headingLevel={3}
            title={t("crm.contact.deals.emptyTitle")}
            text={t("crm.contact.deals.emptyText")}
          />
        ) : (
          <div className={detail.deals}>
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                contactName={contact.full_name}
                locale={locale}
                labels={labels}
                changeStage={changeStage}
              />
            ))}
          </div>
        )}
      </section>
      <section className={detail.section} aria-labelledby="activity-title">
        <Heading level={2} size="h3" id="activity-title">
          {t("crm.contact.activity.title")}
        </Heading>
        <ActivityComposer
          contactId={contact.id}
          deals={dealOptions}
          labels={activityComposerLabels(t)}
          add={addActivityAction.bind(null, locale)}
        />
        <ActivityTimeline
          activities={activities}
          authors={names}
          locale={locale}
          labels={activityTimelineLabels(t)}
        />
      </section>
    </>
  );
}

export default async function ContactPage({ params }: ContactProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <div className={detail.back}>
        <Link href={`/${locale}/crm/contactos`} className={detail.backLink}>
          {t("crm.contact.back")}
        </Link>
      </div>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("crm.contact.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="4rem" />
                <Skeleton height="10rem" />
                <Skeleton height="8rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <ContactSection locale={locale} id={id} role={member.role} />
      </Suspense>
    </>
  );
}
