import type { ProjectMeta } from "@/content/schemas";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { localePath } from "@/lib/seo/routes";

import type { ProjectCardProps } from "./ProjectCard";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" });

export function projectCardProps(
  slug: string,
  meta: ProjectMeta,
  locale: Locale,
  t: (key: MessageKey) => string,
): ProjectCardProps {
  return {
    title: meta.title,
    href: localePath(locale, `/proyectos/${slug}`),
    kindLabel: t(`projects.kind.${meta.kind}`),
    status: meta.status,
    statusLabel: t(`projects.status.${meta.status}`),
    headline: meta.headline,
    roleLabel: t("projects.card.role"),
    role: meta.role,
    period: meta.period,
    stack: meta.stack,
    viewLabel: t("projects.card.view"),
    ...(meta.metric
      ? {
          metric: {
            label: meta.metric.label,
            value: meta.metric.value,
            source: t("projects.card.metricSource")
              .replace("{source}", meta.metric.source)
              .replace("{date}", dateFormat.format(new Date(meta.metric.date))),
          },
        }
      : {}),
  };
}
