import { projectCardProps } from "@/components/projects/ProjectCard/projectCardProps";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Link } from "@/components/ui/Link/Link";
import { features } from "@/config/features";
import { homeProjectSlugs } from "@/config/home";
import { getProjectMeta } from "@/content/projects-meta";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import styles from "./FeaturedProjects.module.css";
import { pickProjects } from "./pickProjects";
import { ShowcaseProjectCard } from "./ShowcaseProjectCard";

interface FeaturedProjectsProps {
  locale: Locale;
}

export async function FeaturedProjects({ locale }: FeaturedProjectsProps) {
  if (!features.projects) return null;
  const t = await getTranslator(locale);
  const entries = pickProjects(homeProjectSlugs, getProjectMeta);
  if (entries.length === 0) return null;

  return (
    <PageSection
      id="proyectos"
      title={t("home.projects.title")}
      accent={t("home.projects.accent")}
      size="wide"
      fit="content"
    >
      <div className={styles.grid}>
        <ul className={styles.cards}>
          {entries.map(({ slug, meta }) => (
            <li key={slug}>
              <ShowcaseProjectCard {...projectCardProps(slug, meta, locale, t)} />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.foot}>
        <Link href={`/${locale}/proyectos`} variant="arrow">
          {t("home.projects.all")}
        </Link>
      </div>
    </PageSection>
  );
}
