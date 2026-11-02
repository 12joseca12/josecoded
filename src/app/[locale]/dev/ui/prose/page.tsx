import { notFound } from "next/navigation";

import { Heading } from "@/components/ui/Heading/Heading";
import { Prose } from "@/components/ui/Prose/Prose";
import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import styles from "./page.module.css";
import Sample from "./sample.mdx";

export default async function ProsePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  return (
    <main className={styles.page}>
      <Heading level={1} size="h2">
        {t("dev.prose.title")}
      </Heading>
      <Prose>
        <Sample />
      </Prose>
    </main>
  );
}
