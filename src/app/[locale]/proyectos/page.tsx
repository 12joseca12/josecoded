import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/metadata";

import styles from "./page.module.css";

interface ProjectsProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProjectsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/proyectos",
    title: "projects.metaTitle",
    description: "projects.metaDescription",
  });
}

export default async function ProjectsPage({ params }: ProjectsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  return (
    <section className={styles.page}>
      <Heading level={1} size="h2">
        {t("projects.title")}
      </Heading>
      <EmptyState
        headingLevel={2}
        title={t("projects.emptyTitle")}
        text={t("projects.emptyText")}
      />
    </section>
  );
}
