import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { PayoutStatement } from "@/components/freelance/PayoutStatement/PayoutStatement";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { PrintButton } from "@/components/ui/PrintButton/PrintButton";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { fetchFeeSummaries, fetchPayoutDetail } from "@/lib/freelance/fees";
import { statementLabels } from "@/lib/freelance/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../../freelance.module.css";

interface StatementProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: StatementProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("freelance.pay.meta.statement"), robots: { index: false, follow: false } };
}

async function StatementSection({
  locale,
  id,
  name,
}: {
  locale: Locale;
  id: string;
  name: string;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const [detail, summaries] = await Promise.all([
    fetchPayoutDetail(client, id),
    fetchFeeSummaries(client),
  ]);
  if (detail.status === "missing") notFound();
  if (detail.status === "error" || summaries.status === "error") {
    return (
      <RefreshError
        title={t("freelance.pay.error.title")}
        text={t("freelance.pay.error.text")}
        retryLabel={t("freelance.pay.error.retry")}
        loadingLabel={t("freelance.pay.error.retrying")}
      />
    );
  }
  const labels = statementLabels(t);
  return (
    <>
      <div className={styles.print} data-print="hide">
        <PrintButton label={labels.print} />
        <p className={styles.muted}>{labels.printHint}</p>
      </div>
      <PayoutStatement
        payout={detail.payout}
        items={detail.items}
        projectNames={Object.fromEntries(
          summaries.data.map((row) => [row.fee_id, row.project_name]),
        )}
        beneficiary={name}
        locale={locale}
        labels={labels}
      />
    </>
  );
}

export default async function FreelanceStatementPage({ params }: StatementProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("freelance", locale);
  const t = await getTranslator(locale);
  return (
    <div className={styles.stack}>
      <header className={styles.head} data-print="hide">
        <Link href={`/${locale}/freelance/pagos`} variant="inline">
          {t("freelance.pay.statement.back")}
        </Link>
        <Heading level={1} size="h2">
          {t("freelance.pay.statement.title")}
        </Heading>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("freelance.pay.loading")}
            fallback={<Skeleton height="16rem" />}
          >
            {null}
          </LoadingRegion>
        }
      >
        <StatementSection locale={locale} id={id} name={member.fullName} />
      </Suspense>
    </div>
  );
}
