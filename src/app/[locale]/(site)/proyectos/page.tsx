import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageGraph } from "@/components/seo/PageGraph/PageGraph";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { site } from "@/config/site";
import { hasPublishedProjects } from "@/content";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildBreadcrumbList } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";

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
    indexable: hasPublishedProjects(),
  });
}

export default async function ProjectsPage({ params }: ProjectsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.projects"), href: localePath(locale, "/proyectos") },
  ];
  return (
    <section className={styles.page}>
      <PageGraph
        nodes={[
          buildBreadcrumbList(
            site.origin,
            crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
          ),
        ]}
      />
      <Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />
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
