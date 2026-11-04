import { notFound } from "next/navigation";

import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { nexoStates } from "@/types/nexo";

import { NexoShowcase } from "./nexo-showcase";

export default async function NexoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  const states = nexoStates.map((state) => ({
    state,
    name: t(`dev.nexo.state.${state}`),
    label: t(`chat.nexo.label.${state}`),
  }));

  return (
    <NexoShowcase
      states={states}
      labels={{
        title: t("dev.nexo.title"),
        switcher: t("dev.nexo.switcher"),
        preview: t("dev.nexo.preview"),
        sizes: t("dev.nexo.sizes"),
        gallery: t("dev.nexo.gallery"),
        reducedMotion: t("dev.nexo.reducedMotion"),
      }}
    />
  );
}
