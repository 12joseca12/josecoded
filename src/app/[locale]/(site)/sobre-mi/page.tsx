import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { FactList } from "@/components/about/FactList/FactList";
import { LinkRow } from "@/components/about/LinkRow/LinkRow";
import { StackGroups } from "@/components/about/StackGroups/StackGroups";
import { Timeline } from "@/components/about/Timeline/Timeline";
import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { BlockScroll } from "@/components/site/BlockScroll/BlockScroll";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { availability } from "@/config/availability";
import { features } from "@/config/features";
import { site } from "@/config/site";
import { getCv } from "@/content";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import {
  resolveAvailability,
  resolveCvHref,
  resolveEducation,
  resolveExperience,
  resolveProfileLinks,
  resolveStack,
  yearsLabel,
} from "@/lib/about/cv";
import { buildContactHref } from "@/lib/contact/ways";
import { nonceHeader } from "@/lib/security/nonce";
import { buildBreadcrumbList, buildGraph, buildPerson, buildProfilePage } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";
import type { FactItem, StackGroupBlock } from "@/types/about";

import styles from "./page.module.css";

interface AboutProps {
  params: Promise<{ locale: string }>;
}

const path = "/sobre-mi";
const valueIds = ["scope", "delivery", "quality", "decisions"] as const;
const key = (suffix: string) => `about.${suffix}` as MessageKey;

export async function generateMetadata({ params }: AboutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path,
    title: "about.meta.title",
    description: "about.meta.description",
    openGraphType: "profile",
  });
}

export default async function AboutPage({ params }: AboutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, requestHeaders] = await Promise.all([getTranslator(locale), headers()]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;
  const cv = getCv();

  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.about"), href: localePath(locale, path) },
  ];
  const graph = buildGraph(
    await buildPerson(site.origin, locale),
    buildProfilePage(site.origin, locale, path, {
      name: t("about.meta.title"),
      description: t("about.meta.description"),
    }),
    buildBreadcrumbList(
      site.origin,
      crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
    ),
  );

  const facts = (group: "values", ids: readonly string[]): FactItem[] =>
    ids.map((id) => ({
      id,
      title: t(key(`${group}.${id}.title`)),
      text: t(key(`${group}.${id}.text`)),
    }));

  const stack: StackGroupBlock[] = resolveStack(cv.stack).map((entry) => {
    const title = t(key(`stack.groups.${entry.group}`));
    return {
      id: entry.group,
      title,
      listLabel: t("about.stack.listLabel").replace("{group}", title),
      items: entry.items.map((item) => {
        const parts = [
          item.level ? t(key(`stack.levels.${item.level}`)) : null,
          item.years === null
            ? null
            : yearsLabel(item.years, t("about.stack.years.one"), t("about.stack.years.many")),
        ].filter((part) => part !== null);
        return { name: item.name, detail: parts.length > 0 ? parts.join(" · ") : null };
      }),
    };
  });

  const experience = resolveExperience(cv.experience);
  const education = resolveEducation(cv.education);
  const cvHref = resolveCvHref(cv.file, locale, features.cvDownload);
  const cvEnglishHref = locale === "es" ? resolveCvHref(cv.file, "en", features.cvDownload) : null;
  const availabilityLine = resolveAvailability(availability, {
    remote: t("about.availability.remote"),
    hybrid: t("about.availability.hybrid"),
    remoteOrHybrid: t("about.availability.remoteOrHybrid"),
  });
  const profiles = resolveProfileLinks().map((link) => ({
    ...link,
    label: t(key(`closing.links.${link.id}`)),
  }));

  return (
    <>
      <JsonLd data={graph} nonce={nonce} />
      <BlockScroll />
      <PageHead
        title={t("about.head.title")}
        accent={t("about.head.accent")}
        lead={t("about.head.lead")}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      >
        {cvHref ? (
          <div className={styles.actions} role="group" aria-label={t("about.actions.label")}>
            <Button href={cvHref} download icon={<ArrowIcon />}>
              {t("about.closing.cv")}
            </Button>
            {cvEnglishHref ? (
              <Button href={cvEnglishHref} variant="ghost" download lang="en" icon={<ArrowIcon />}>
                {t("about.actions.cvEn")}
              </Button>
            ) : null}
          </div>
        ) : null}
        {availabilityLine ? <p className={styles.availability}>{availabilityLine}</p> : null}
      </PageHead>
      <div className={styles.sections}>
        {experience.length > 0 || education.length > 0 ? (
          <PageSection
            id="trayectoria"
            title={t("about.timeline.title")}
            lead={t("about.timeline.lead")}
            size="wide"
          >
            {experience.length > 0 ? (
              <Timeline label={t("about.timeline.listLabel")} entries={experience} />
            ) : null}
            {education.length > 0 ? (
              <>
                <Heading level={3} size="h3">
                  {t("about.timeline.educationTitle")}
                </Heading>
                <Timeline label={t("about.timeline.educationLabel")} entries={education} />
              </>
            ) : null}
          </PageSection>
        ) : null}
        <PageSection
          id="stack"
          title={t("about.stack.title")}
          lead={t("about.stack.lead")}
          size="wide"
        >
          <StackGroups groups={stack} />
        </PageSection>
        <PageSection
          id="como-trabajo"
          title={t("about.values.title")}
          lead={t("about.values.lead")}
          size="wide"
        >
          <FactList items={facts("values", valueIds)} variant="numbered" />
        </PageSection>
        <PageSection id="contacto" title={t("about.closing.title")} lead={t("about.closing.lead")}>
          <div className={styles.actions}>
            <Button href={buildContactHref(locale, "contratacion")} icon={<ArrowIcon />}>
              {t("about.closing.cta")}
            </Button>
          </div>
          {profiles.length > 0 ? (
            <LinkRow
              label={t("about.closing.profiles")}
              newTabLabel={t("about.closing.newTab")}
              items={profiles}
            />
          ) : null}
        </PageSection>
      </div>
    </>
  );
}
