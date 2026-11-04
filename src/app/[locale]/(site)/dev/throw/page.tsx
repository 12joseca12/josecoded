import { notFound } from "next/navigation";

import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import { Bomb } from "./bomb";

export default async function ThrowPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  return (
    <>
      <Bomb recovered={t("dev.errors.recovered")} />
    </>
  );
}
