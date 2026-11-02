import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  return <main>{t("home.name")}</main>;
}
