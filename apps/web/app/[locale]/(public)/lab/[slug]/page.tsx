import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { datoText } from '@/components/home/dato';
import { DemoFrame } from '@/components/lab/demo-frame';
import { DemoMeta } from '@/components/lab/demo-meta';
import { DemoPoster } from '@/components/lab/demo-poster';
import { JsonLd } from '@/components/seo';
import { ClosingCompact } from '@/components/shared/closing-compact';
import { PageHead } from '@/components/shared/page-head';
import { Prose } from '@/components/shared/prose';
import { Toc } from '@/components/shared/toc';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { hasDato } from '@/lib/content/dato';
import { getSectionAvailability } from '@/lib/content/sections';
import { LAB_DEMOS, labDemo } from '@/lib/lab/demos';
import { resolveLocale } from '@/lib/locale';
import { breadcrumbJsonLd, graphOf } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { IslandLabels } from '@/components/lab/islands/types';
import type { LocaleParams } from '@/lib/locale';
import type { Locale } from '@josecoded/types';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return LAB_DEMOS.map((demo) => ({ slug: demo.slug }));
}

/** The demo of the request, or a 404: where the lab does not exist (fewer than two real demos in production) every slug is a 404 too. */
async function load(params: Params) {
  const { slug } = await params;
  const locale: Locale = await resolveLocale(params as unknown as LocaleParams);
  const demo = getSectionAvailability().lab ? labDemo(slug) : undefined;
  if (!demo) notFound();
  return { locale, slug, demo };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug, demo } = await load(params);
  const t = await getTranslations({ locale, namespace: 'lab' });
  const lead = String(t.raw(`demos.${demo.id}.lead`));
  return pageMetadata({
    locale,
    pathname: '/lab/[slug]',
    params: { slug },
    title: t(`demos.${demo.id}.name`),
    description: hasDato(lead) ? lead : t('meta.description'),
  });
}

// P23 (pantallas v2.0): a demo. The frame serves a still from the server and loads the island on the first interaction.
export default async function LabDemoPage({ params }: { params: Params }) {
  const { locale, slug, demo } = await load(params);
  const t = await getTranslations({ locale, namespace: 'lab' });
  const name = t(`demos.${demo.id}.name`);
  const text = (key: 'lead' | 'what' | 'how' | 'input' | 'motion' | 'stack') => datoText(String(t.raw(`demos.${demo.id}.${key}`)));
  // a whole subtree of messages (the island's texts), which the typed key of `t.raw` does not name
  const labels = (t.raw as (key: string) => unknown)('island') as IslandLabels;
  const url = absoluteUrl(locale, '/lab/[slug]', { slug });

  return (
    <>
      <PageHead lead={name} tail={t('demo.headTail')} citable={text('lead')}
        actions={
          <ArrowLink href="/lab" icon="arrow-left">
            {t('demo.back')}
          </ArrowLink>
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <DemoFrame
            id={demo.id}
            label={t('demo.frameLabel', { name })}
            poster={<DemoPoster id={demo.id} labels={labels} />}
            labels={labels}
            texts={{ start: t('demo.start'), restart: t('demo.restart'), still: t('demo.still'), running: t('demo.running'), stopped: t('demo.stopped') }}
          />
          <Prose>
            <h2 id="que-muestra">{t('demo.what')}</h2>
            <p>{text('what')}</p>
            <h2 id="como-esta-hecho">{t('demo.how')}</h2>
            <p>{text('how')}</p>
          </Prose>
        </div>
        <aside className={styles.rail}>
          <Toc
            label={t('demo.contents')}
            items={[
              { id: 'que-muestra', label: t('demo.what') },
              { id: 'como-esta-hecho', label: t('demo.how') },
            ]}
          />
          <DemoMeta
            title={t('demo.meta.title')}
            tags={{ term: t('demo.meta.tag'), label: t('card.tags'), items: demo.tags.map((tag) => t(`tag.${tag}`)) }}
            facts={[
              { id: 'input', term: t('demo.meta.input'), value: text('input') },
              { id: 'motion', term: t('demo.meta.motion'), value: text('motion') },
              { id: 'stack', term: t('demo.meta.stack'), value: text('stack') },
            ]}
          />
        </aside>
      </div>
      <ClosingCompact
        lead={t('demo.closing.lead')}
        tail={t('demo.closing.accent')}
        primary={
          <Button href="/propuesta" variant="ghost">
            {t('demo.closing.cta')}
          </Button>
        }
        moreLabel={t('demo.closing.more')}
      />
      <JsonLd
        data={graphOf(
          breadcrumbJsonLd([
            { name: t('home'), url: absoluteUrl(locale, '/') },
            { name: t('demo.crumb'), url: absoluteUrl(locale, '/lab') },
            { name, url },
          ]),
        )}
      />
    </>
  );
}
