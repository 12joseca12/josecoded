import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FilterTabs } from "@/components/projects/FilterTabs/FilterTabs";
import { ProjectCard } from "@/components/projects/ProjectCard/ProjectCard";
import { PageGraph } from "@/components/seo/PageGraph/PageGraph";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { site } from "@/config/site";
import { hasPublishedProjects, listProjects } from "@/content";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  filterProjects,
  filtersAvailable,
  parseProjectFilter,
  projectsPath,
} from "@/lib/projects/projects";
import { buildBreadcrumbList } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";
import { projectFilters } from "@/types/projects";

import styles from "./page.module.css";

interface ProjectsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" });

export default async function ProjectsPage({ params, searchParams }: ProjectsProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const all = listProjects();
  const showFilters = filtersAvailable(all);
  const filter = showFilters ? parseProjectFilter(query.tipo) : "all";
  const entries = filterProjects(all, filter);
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
        title={t("projects.head.title")}
        accent={t("projects.head.accent")}
        lead={t("projects.lead")}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <section className={styles.page} aria-label={t("projects.listLabel")}>
        {all.length === 0 ? (
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
        ) : (
          <>
            {showFilters ? (
              <FilterTabs
                label={t("projects.filters.label")}
                items={projectFilters.map((id) => ({
                  id,
                  label: t(`projects.filters.${id}`),
                  href: localePath(locale, projectsPath(id)),
                  active: id === filter,
                }))}
              />
            ) : null}
            <div className={styles.cards}>
              {entries.map(({ slug, meta }) => (
                <ProjectCard
                  key={slug}
                  title={meta.title}
                  href={localePath(locale, `/proyectos/${slug}`)}
                  kindLabel={t(`projects.kind.${meta.kind}`)}
                  status={meta.status}
                  statusLabel={t(`projects.status.${meta.status}`)}
                  headline={meta.headline}
                  roleLabel={t("projects.card.role")}
                  role={meta.role}
                  period={meta.period}
                  stack={meta.stack}
                  viewLabel={t("projects.card.view")}
                  {...(meta.metric
                    ? {
                        metric: {
                          label: meta.metric.label,
                          value: meta.metric.value,
                          source: t("projects.card.metricSource")
                            .replace("{source}", meta.metric.source)
                            .replace("{date}", dateFormat.format(new Date(meta.metric.date))),
                        },
                      }
                    : {})}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
