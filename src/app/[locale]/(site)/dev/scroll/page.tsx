import { notFound } from "next/navigation";

import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import { ScrollDemo } from "./scroll-demo";

export default async function ScrollPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  const blocks = [
    { id: "intro", title: `${t("dev.scroll.block")} 1`, body: t("dev.scroll.intro"), tall: false },
    { id: "tall", title: `${t("dev.scroll.block")} 2`, body: t("dev.scroll.tall"), tall: true },
    { id: "short", title: `${t("dev.scroll.block")} 3`, body: t("dev.scroll.short"), tall: false },
    { id: "last", title: `${t("dev.scroll.block")} 4`, body: t("dev.scroll.short"), tall: false },
  ];

  return (
    <ScrollDemo
      title={t("dev.scroll.title")}
      progressLabel={t("dev.scroll.progress")}
      more={t("dev.scroll.more")}
      blocks={blocks}
    />
  );
}
