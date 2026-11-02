import { getTranslations } from 'next-intl/server';

import { datoText } from '@/components/home/dato';
import { projectArt, projectHref } from '@/components/home/projects-data';
import { ProjectFilter } from '@/components/projects/project-filter';
import { ProjectCard } from '@/components/scenes';
import { JsonLd } from '@/components/seo';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { rankedProjects } from '@/lib/content/projects';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { breadcrumbJsonLd, graphOf } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl } from '@/lib/seo/urls';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'projects.meta' });
  return pageMetadata({ locale, pathname: '/proyectos', title: t('title'), description: t('description') });
}

// P7 (pantallas v2.0): the projects in use, stacked, in the order of the index (proofs, never a reduced sheet or this
// site first). The filter lives in the URL; every card is in the HTML.
export default async function ProjectsPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'projects' });
  const version = env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION;

  const items = rankedProjects().map((sheet) => ({
    slug: sheet.slug,
    kind: sheet.type,
    card: (
      <ProjectCard
        slug={sheet.slug}
        name={sheet.name}
        lead={datoText(sheet.texts[locale].oneLiner)}
        kind={sheet.type}
        kindLabel={t(`kind.${sheet.type}`)}
        art={projectArt(sheet.art, version)}
        href={projectHref(sheet.slug)}
        linkLabel={t('card.view')}
        linkName={t('card.viewNamed', { name: sheet.name })}
      />
    ),
  }));

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} citable={t('head.citable')} />
      <PageSection id="lista" lead={t('title')}>
        <ProjectFilter
          items={items}
          labels={{
            legend: t('filter.legend'),
            all: t('filter.all'),
            app: t('filter.app'),
            web: t('filter.web'),
            empty: t('filter.empty'),
            emptyText: t('filter.emptyText'),
          }}
        />
      </PageSection>
      <JsonLd
        data={graphOf(
          breadcrumbJsonLd([
            { name: t('case.home'), url: absoluteUrl(locale, '/') },
            { name: t('title'), url: absoluteUrl(locale, '/proyectos') },
          ]),
        )}
      />
    </>
  );
}
