import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { NeedSomethingLikeThis } from "@/components/projects/NeedSomethingLikeThis/NeedSomethingLikeThis";
import { PrevNext } from "@/components/projects/PrevNext/PrevNext";
import { ProjectHead } from "@/components/projects/ProjectHead/ProjectHead";
import { StoreLinks } from "@/components/projects/StoreLinks/StoreLinks";
import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { StackChips } from "@/components/services/StackChips/StackChips";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { Link } from "@/components/ui/Link/Link";
import { site } from "@/config/site";
import { getProject, listProjects } from "@/content";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { neighbours, projectContactHref, serviceHref } from "@/lib/projects/projects";
import { nonceHeader } from "@/lib/security/nonce";
import { buildBreadcrumbList, buildGraph, buildProject } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";

import styles from "./page.module.css";

interface ProjectProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return listProjects().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProjectProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = getProject(slug);
  if (!isLocale(locale) || !entry) return {};
  const metadata = await buildPageMetadata({
    locale,
    path: `/proyectos/${slug}`,
    title: "projects.metaTitle",
    description: "projects.metaDescription",
  });
  const title = `${entry.meta.title} · ${entry.meta.kind === "app" ? "App" : "Web"}`;
  return {
    ...metadata,
    title,
    description: entry.meta.description,
    openGraph: {
      ...metadata.openGraph,
      title,
      description: entry.meta.description,
    },
    twitter: { ...metadata.twitter, title, description: entry.meta.description },
  };
}

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" });

export default async function ProjectPage({ params }: ProjectProps) {
  const { locale, slug } = await params;
  const entry = getProject(slug);
  if (!isLocale(locale) || !entry) notFound();
  const { meta } = entry;
  const [t, { default: Body }, requestHeaders] = await Promise.all([
    getTranslator(locale),
    entry.load(),
    headers(),
  ]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;
  const { prev, next } = neighbours(listProjects(), slug);
  const listPath = localePath(locale, "/proyectos");
  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.projects"), href: listPath },
    { label: meta.title },
  ];
  const graph = buildGraph(
    buildBreadcrumbList(site.origin, [
      { name: t("nav.home"), path: localePath(locale, "") },
      { name: t("nav.projects"), path: listPath },
      { name: meta.title, path: `${listPath}/${slug}` },
    ]),
    buildProject(site.origin, locale, meta),
  );
  const linkItems = [
    { id: "store_ios", label: t("projects.detail.ios"), href: meta.links.store_ios },
    { id: "store_android", label: t("projects.detail.android"), href: meta.links.store_android },
    { id: "web", label: t("projects.detail.web"), href: meta.links.web },
    { id: "repo", label: t("projects.detail.repo"), href: meta.links.repo },
  ].flatMap(({ id, label, href }) => (href ? [{ id, label, href }] : []));
  const neighbour = (target: typeof prev) =>
    target ? { title: target.meta.title, href: `${listPath}/${target.slug}` } : null;

  return (
    <>
      <JsonLd data={graph} nonce={nonce} />
      <ProjectHead
        title={meta.title}
        headline={meta.headline}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
        kindLabel={t(`projects.kind.${meta.kind}`)}
        status={meta.status}
        statusLabel={t(`projects.status.${meta.status}`)}
        facts={[
          { label: t("projects.detail.role"), value: meta.role },
          { label: t("projects.detail.period"), value: meta.period },
          { label: t("projects.detail.sector"), value: meta.sector },
        ]}
        links={
          <StoreLinks
            label={t("projects.detail.linksLabel")}
            newTab={t("projects.detail.newTab")}
            items={linkItems}
          />
        }
      />
      <div className={styles.page}>
        <div className={styles.stack}>
          <h2 className={styles.stackTitle}>{t("projects.detail.stack")}</h2>
          <StackChips items={meta.stack} />
          <Link href={localePath(locale, "/sobre-mi#stack")} variant="arrow">
            {t("projects.detail.stackMore")}
          </Link>
        </div>
        <Body />
        {meta.metric ? (
          <figure className={styles.metric}>
            <figcaption className={styles.metricTitle}>
              {t("projects.detail.metricTitle")}
            </figcaption>
            <p className={styles.metricValue}>
              <strong>{meta.metric.value}</strong> {meta.metric.label}
            </p>
            <p className={styles.metricSource}>
              {t("projects.card.metricSource")
                .replace("{source}", meta.metric.source)
                .replace("{date}", dateFormat.format(new Date(meta.metric.date)))}
            </p>
          </figure>
        ) : null}
        <NeedSomethingLikeThis
          title={t("projects.need.title")}
          text={t(`projects.need.text.${meta.relatedService}`)}
          service={{
            href: serviceHref(locale, meta.relatedService),
            label: t(`projects.need.service.${meta.relatedService}`),
          }}
          contact={{
            href: projectContactHref(locale, meta.relatedService, slug),
            label: t("projects.need.contact"),
          }}
        />
        <PrevNext
          label={t("projects.prevNext.label")}
          prevLabel={t("projects.prevNext.prev")}
          nextLabel={t("projects.prevNext.next")}
          prev={neighbour(prev)}
          next={neighbour(next)}
        />
      </div>
    </>
  );
}
