import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadDetail } from "@/components/admin/LeadDetail/LeadDetail";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { OwnerCard } from "@/components/admin/OwnerCard/OwnerCard";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { leadDetailLabels } from "@/lib/admin/lead-labels";
import { buildOfferLabels } from "@/lib/admin/lead-offer";
import { fetchLeadDetail } from "@/lib/admin/leads";
import { requireZone } from "@/lib/auth/session";
import { staffNav } from "@/lib/staff/nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../../admin.module.css";
import { assignLead, discardLead } from "../actions";
import detail from "./detail.module.css";

interface LeadPageProps {
  params: Promise<{ locale: string; id: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: LeadPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.leads.detail.meta.title") };
}

async function LeadSection({ locale, id }: { locale: Locale; id: string }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchLeadDetail(client, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.leads.detail.error.title")}
        text={t("admin.leads.detail.error.text")}
        retryLabel={t("admin.leads.detail.error.retry")}
        loadingLabel={t("admin.leads.detail.error.retrying")}
      />
    );
  }

  const { lead, assignees, dealStage } = result;
  const labels = leadDetailLabels(t);
  const contacts = staffNav.crm.find((entry) => entry.key === "contacts");
  const contactHref =
    lead.contact_id && contacts?.ready ? `/${locale}/crm${contacts.path}/${lead.contact_id}` : null;

  return (
    <>
      <header className={styles.head}>
        <Link href={`/${locale}/admin/interesados`}>{t("admin.leads.detail.back")}</Link>
        <Heading level={1} size="h2">
          {lead.full_name}
        </Heading>
      </header>
      <div className={detail.grid}>
        <LeadDetail lead={lead} locale={locale} labels={labels} offerLabels={buildOfferLabels(t)} />
        <OwnerCard
          lead={lead}
          assignees={assignees}
          dealStage={dealStage}
          locale={locale}
          labels={labels}
          contactHref={contactHref}
          assign={assignLead.bind(null, locale)}
          discard={discardLead.bind(null, locale)}
        />
      </div>
    </>
  );
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !uuidPattern.test(id)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("admin.leads.detail.loading")}
          fallback={
            <div className={styles.skeleton}>
              <Skeleton height="2.5rem" />
              <Skeleton height="8rem" />
              <Skeleton height="8rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <LeadSection locale={locale} id={id} />
    </Suspense>
  );
}
