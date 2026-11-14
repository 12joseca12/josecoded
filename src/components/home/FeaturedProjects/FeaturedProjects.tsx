import { ProjectCard } from "@/components/projects/ProjectCard/ProjectCard";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Link } from "@/components/ui/Link/Link";
import { homeProjectSlugs } from "@/config/home";
import { getProject } from "@/content";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import styles from "./FeaturedProjects.module.css";
import { pickProjects } from "./pickProjects";

interface FeaturedProjectsProps {
  locale: Locale;
}

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" });

export async function FeaturedProjects({ locale }: FeaturedProjectsProps) {
  const t = await getTranslator(locale);
  const entries = pickProjects(homeProjectSlugs, getProject);
  if (entries.length === 0) return null;

  return (
    <PageSection id="proyectos" title={t("home.projects.title")} size="wide" fit="content">
      <div className={styles.cards}>
        {entries.map(({ slug, meta }) => (
          <ProjectCard
            key={slug}
            headingLevel={3}
            title={meta.title}
            href={`/${locale}/proyectos/${slug}`}
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
      <div>
        <Link href={`/${locale}/proyectos`} variant="arrow">
          {t("home.projects.all")}
        </Link>
      </div>
    </PageSection>
  );
}
