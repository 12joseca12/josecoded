import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { ProformaPrint } from "@/components/admin/ProformaPrint/ProformaPrint";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchProforma } from "@/lib/admin/proforma";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { proformaPrintLabels } from "./labels";

interface ProformaPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: ProformaPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.proformaPrint.meta.title"), robots: { index: false, follow: false } };
}

async function ProformaSection({ locale, id }: { locale: Locale; id: string }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchProforma(client, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.proformaPrint.error.title")}
        text={t("admin.proformaPrint.error.text")}
        retryLabel={t("admin.proformaPrint.error.retry")}
        loadingLabel={t("admin.proformaPrint.error.retrying")}
      />
    );
  }
  return (
    <ProformaPrint
      proforma={result.proforma}
      locale={locale}
      backHref={`/${locale}/admin/cobros?tab=proformas`}
      labels={proformaPrintLabels(t)}
    />
  );
}

export default async function ProformaPage({ params }: ProformaPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("admin.proformaPrint.loading")}
          fallback={<Skeleton height="24rem" />}
        >
          {null}
        </LoadingRegion>
      }
    >
      <ProformaSection locale={locale} id={id} />
    </Suspense>
  );
}
