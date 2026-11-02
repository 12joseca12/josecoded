import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { datoText } from '@/components/home/dato';
import { DemoCard } from '@/components/scenes/demo-card';
import { JsonLd } from '@/components/seo';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { Surface } from '@/components/ui/surface';
import { getSectionAvailability } from '@/lib/content/sections';
import { LAB_DEMOS } from '@/lib/lab/demos';
import { resolveLocale } from '@/lib/locale';
import { breadcrumbJsonLd, graphOf } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'lab.meta' });
  return pageMetadata({ locale, pathname: '/lab', title: t('title'), description: t('description') });
}

// P22 (pantallas v2.0): the demos of the lab. Without two real demos the section does not exist in production
// (spec D44): the page answers 404 there, like the header, the menu, ⌘K, the footer and the sitemap.
export default async function LabPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  if (!getSectionAvailability().lab) notFound();
  const t = await getTranslations({ locale, namespace: 'lab' });

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} citable={datoText(String(t.raw('head.citable')))} />
      <PageSection id="demos" lead={t('list.title')}>
        <ul className={styles.list}>
          {LAB_DEMOS.map((demo) => {
            const name = t(`demos.${demo.id}.name`);
            return (
              <li key={demo.slug}>
                <Surface as="article" radius="tcard" interactive aria-label={name} data-cell="" data-testid="demo-card">
                  <div className={styles.inner}>
                    <DemoCard
                      name={name}
                      lead={datoText(String(t.raw(`demos.${demo.id}.lead`)))}
                      href={`/lab/${demo.slug}`}
                      linkLabel={t('card.try')}
                      linkName={t('card.tryNamed', { name })}
                      tags={{ label: t('card.tags'), items: demo.tags.map((tag) => t(`tag.${tag}`)) }}
                    />
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      </PageSection>
      <JsonLd
        data={graphOf(
          breadcrumbJsonLd([
            { name: t('home'), url: absoluteUrl(locale, '/') },
            { name: t('title'), url: absoluteUrl(locale, '/lab') },
          ]),
        )}
      />
    </>
  );
}
