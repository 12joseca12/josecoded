import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { datoText } from '@/components/home/dato';
import { projectArt } from '@/components/home/projects-data';
import { PrevNext } from '@/components/projects/prev-next';
import { ScreenGallery } from '@/components/projects/screen-gallery';
import { StoreLinks } from '@/components/projects/store-links';
import { JsonLd } from '@/components/seo';
import { CheckList } from '@/components/shared/check-list';
import { ClosingCompact } from '@/components/shared/closing-compact';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { projects } from '@/content/projects';
import { isPendingDato } from '@/lib/content/dato';
import { hasOneLiner, projectBySlug, proofLinks, rankedProjects } from '@/lib/content/projects';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { breadcrumbJsonLd, graphOf, softwareApplicationJsonLd, webProjectJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl, siteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Href } from '@josecoded/types';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

// an empty alt is not text: the glyph art is decoration
const DECORATIVE = '';

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params as unknown as LocaleParams);
  const sheet = projectBySlug(slug);
  if (!sheet) notFound();
  const t = await getTranslations({ locale, namespace: 'projects' });
  const real = hasOneLiner(sheet, locale);
  const status = t(`status.${sheet.status}`);
  const title = sheet.type === 'app' ? t('case.titleApp', { name: sheet.name, status }) : t('case.titleWeb', { name: sheet.name, status });
  return pageMetadata({
    locale,
    pathname: '/proyectos/[slug]',
    params: { slug },
    title: clip(title, 48),
    description: real ? clip(sheet.texts[locale].oneLiner, 155) : t('meta.fallbackDescription', { name: sheet.name }),
    // a sheet whose sentence is still pending is a thin page: it exists for the home's link, not for the index
    noindex: !real,
  });
}

// P8 (pantallas v2.0): a medium case study. Blocks whose text is still a `{{DATO}}` are left out of production.
export default async function ProjectCasePage({ params }: { params: Params }) {
  const { slug } = await params;
  const locale = await resolveLocale(params as unknown as LocaleParams);
  const sheet = projectBySlug(slug);
  if (!sheet) notFound();
  const t = await getTranslations({ locale, namespace: 'projects' });
  const texts = sheet.texts[locale];
  const links = proofLinks(sheet);
  const ranked = rankedProjects();
  const index = ranked.findIndex((candidate) => candidate.slug === slug);
  const neighbour = (offset: number) => {
    const other = ranked[index + offset];
    return other ? { name: other.name, href: `/proyectos/${other.slug}` as Href } : undefined;
  };

  const challenge = datoText(texts.challenge);
  const result = datoText(texts.result);
  const workPending = isPendingDato(texts.work);
  const workLines = workPending ? [] : texts.work.split('\n').map((line) => line.trim()).filter(Boolean);
  const work = workPending ? datoText(texts.work) : null;
  const status = t(`status.${sheet.status}`);
  const url = absoluteUrl(locale, '/proyectos/[slug]', { slug });

  const appNode =
    sheet.type === 'app'
      ? softwareApplicationJsonLd({
          siteUrl: siteUrl(),
          name: sheet.name,
          url,
          operatingSystem: 'iOS, Android',
          applicationCategory: sheet.applicationCategory,
          installUrls: links.filter((link) => link.kind === 'appStore' || link.kind === 'play').map((link) => link.href),
        })
      : webProjectJsonLd({ siteUrl: siteUrl(), name: sheet.name, url, webUrl: sheet.proofs.webUrl });

  return (
    <>
      <PageHead
        lead={sheet.name}
        tail={t('case.headTail', { kind: t(`kind.${sheet.type}`), status })}
        citable={datoText(texts.oneLiner)}
        actions={
          <StoreLinks
            groupLabel={t('case.links', { name: sheet.name })}
            links={links}
            labels={{
              appStore: t('case.proof.appStore'),
              play: t('case.proof.play'),
              web: t('case.proof.web'),
              repo: t('case.proof.repo'),
            }}
          />
        }
        aside={
          sheet.screenshots.length === 0 ? (
            <div className={styles.art}>
              <Image src={projectArt(sheet.art, env.client.NEXT_PUBLIC_HERO_MEDIA_VERSION)} alt={DECORATIVE} width={801} height={722} priority />
            </div>
          ) : undefined
        }
      />

      {sheet.screenshots.length > 0 ? (
        <PageSection id="capturas" lead={t('case.gallery')}>
          <ScreenGallery shots={sheet.screenshots} kind={sheet.type} alt={(n) => t('case.galleryAlt', { n, name: sheet.name })} />
        </PageSection>
      ) : null}

      {challenge ? (
        <PageSection id="reto" lead={t('case.challenge')}>
          <p className={styles.text}>{challenge}</p>
        </PageSection>
      ) : null}

      {work || workLines.length > 0 ? (
        <PageSection id="que-hice" lead={t('case.work')}>
          {work ?? <CheckList items={workLines.map((line) => ({ id: line, text: line }))} />}
        </PageSection>
      ) : null}

      {!sheet.hideStack && sheet.stack.length > 0 ? (
        <PageSection id="stack" lead={t('case.stack')}>
          <ul className={styles.stack}>
            {sheet.stack.map((item) => (
              <li key={item}>
                <Chip>{item}</Chip>
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {result ? (
        <PageSection id="resultado" lead={t('case.result')}>
          <p className={styles.text}>{result}</p>
        </PageSection>
      ) : null}

      <div className={styles.pager}>
        <PrevNext
          label={t('case.pager')}
          prev={neighbour(-1)}
          next={neighbour(1)}
          labels={{ prev: t('case.prev'), next: t('case.next') }}
        />
      </div>

      <ClosingCompact
        lead={t('case.closing.lead')}
        tail={t('case.closing.accent')}
        primary={
          <Button href="/propuesta" icon="sparkles">
            {t('case.closing.cta')}
          </Button>
        }
        moreLabel={t('case.closing.more')}
      />

      <JsonLd
        data={graphOf(
          appNode,
          breadcrumbJsonLd([
            { name: t('case.home'), url: absoluteUrl(locale, '/') },
            { name: t('case.breadcrumb'), url: absoluteUrl(locale, '/proyectos') },
            { name: sheet.name, url },
          ]),
        )}
      />
    </>
  );
}
