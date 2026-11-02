import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { datoText } from '@/components/home/dato';
import { JsonLd } from '@/components/seo';
import { PageHead } from '@/components/shared/page-head';
import { Prose } from '@/components/shared/prose';
import { Toc } from '@/components/shared/toc';
import { LEGAL_DOCS, legalContent } from '@/content/legal';
import { assertLegalPublishable } from '@/lib/legal/publishable';
import { resolveLocale } from '@/lib/locale';
import { breadcrumbJsonLd, graphOf } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LegalDoc } from '@/content/legal';
import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; doc: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc }));
}

const KEYS = {
  'aviso-legal': '/legal/aviso-legal',
  privacidad: '/legal/privacidad',
  cookies: '/legal/cookies',
} as const;

const asDoc = (value: string): LegalDoc | undefined => LEGAL_DOCS.find((doc) => doc === value);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const doc = asDoc((await params).doc);
  const locale = await resolveLocale(params as unknown as LocaleParams);
  if (!doc) notFound();
  assertLegalPublishable(doc, locale);
  const content = legalContent(doc, locale);
  return pageMetadata({ locale, pathname: KEYS[doc], title: content.title, description: content.description });
}

// P18 (pantallas v2.0): aviso legal, privacidad and cookies, in a reading column with an index.
export default async function LegalPage({ params }: { params: Params }) {
  const doc = asDoc((await params).doc);
  const locale = await resolveLocale(params as unknown as LocaleParams);
  if (!doc) notFound();
  assertLegalPublishable(doc, locale);
  const t = await getTranslations({ locale, namespace: 'legal' });
  const content = legalContent(doc, locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${content.updated}T00:00:00Z`));

  return (
    <>
      <PageHead lead={content.title} tail={undefined} citable={t('updated', { date })} />
      <div className={styles.layout}>
        <Toc label={t('toc')} items={content.sections.map((section) => ({ id: section.id, label: section.heading }))} />
        <Prose>
          {locale === 'en' ? <p>{t('translation')}</p> : null}
          {content.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{datoText(paragraph)}</p>)}
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{datoText(item)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </Prose>
      </div>
      <JsonLd
        data={graphOf(
          breadcrumbJsonLd([
            { name: t('home'), url: absoluteUrl(locale, '/') },
            { name: content.title, url: absoluteUrl(locale, KEYS[doc]) },
          ]),
        )}
      />
    </>
  );
}
