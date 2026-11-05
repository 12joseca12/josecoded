import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageGraph } from "@/components/seo/PageGraph/PageGraph";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
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
    <>
      <PageGraph
        nodes={[
          buildBreadcrumbList(
            site.origin,
            crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
          ),
        ]}
      />
      <PageHead
        title={t("projects.title")}
        lead={t("projects.lead")}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <section className={styles.page} aria-label={t("projects.title")}>
        <EmptyState
          headingLevel={2}
          title={t("projects.emptyTitle")}
          text={t("projects.emptyText")}
          action={
            <div className={styles.actions}>
              <Button href={localePath(locale, "/sobre-mi")} icon={<ArrowIcon />}>
                {t("projects.about")}
              </Button>
              <Button href={localePath(locale, "/contacto")} variant="light">
                {t("projects.contact")}
              </Button>
            </div>
          }
        />
      </section>
    </>
  );
}
