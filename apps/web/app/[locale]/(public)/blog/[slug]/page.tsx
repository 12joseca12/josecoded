import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { NotifyBlock } from '@/components/blog/notify-block';
import { PostHeader } from '@/components/blog/post-header';
import { ReadingProgress } from '@/components/blog/reading-progress';
import { ShareRow } from '@/components/blog/share-row';
import { datoText } from '@/components/home/dato';
import { JsonLd } from '@/components/seo';
import { ClosingCompact } from '@/components/shared/closing-compact';
import { Prose } from '@/components/shared/prose';
import { Toc } from '@/components/shared/toc';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { isPendingVisible } from '@/components/ui/pending';
import { blogPost, blogSlugs } from '@/lib/content/blog';
import { hasDato } from '@/lib/content/dato';
import { loadGuide } from '@/lib/content/guide-loader';
import { getSectionAvailability } from '@/lib/content/sections';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';
import { blogPostingJsonLd, breadcrumbJsonLd, graphOf } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl, siteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Locale } from '@josecoded/types';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return blogSlugs(isPendingVisible()).map((slug) => ({ slug }));
}

const PROFICIENCY = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Expert' } as const;

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** The guide of the request, or a 404: where the blog does not exist (fewer than three real guides in production) every slug is a 404 too. */
async function load(params: Params) {
  const { slug } = await params;
  const locale: Locale = await resolveLocale(params as unknown as LocaleParams);
  const post = getSectionAvailability().blog ? blogPost(locale, slug, isPendingVisible()) : undefined;
  if (!post) notFound();
  return { locale, slug, post };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug, post } = await load(params);
  const t = await getTranslations({ locale, namespace: 'blog.article' });
  return pageMetadata({
    locale,
    pathname: '/blog/[slug]',
    params: { slug },
    title: clip(post.title, 48),
    description: hasDato(post.description) ? clip(post.description, 155) : t('fallbackDescription'),
    hasTranslation: post.hasTranslation,
    // the other language's text under this language's address is a duplicate: it can be followed, not indexed
    noindex: post.fallback,
  });
}

// P10 (pantallas v2.0): a guide. The MDX is compiled at build (`@next/mdx`); the worker only renders the component.
export default async function BlogPostPage({ params }: { params: Params }) {
  const { locale, slug, post } = await load(params);
  const [t, tArticle] = await Promise.all([getTranslations({ locale, namespace: 'blog' }), getTranslations({ locale, namespace: 'blog.article' })]);
  const Guide = await loadGuide(post.locale, slug);

  const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const label = (iso: string) => day.format(new Date(iso));
  const url = absoluteUrl(locale, '/blog/[slug]', { slug });
  const otherLocale: Locale = post.locale;
  const labAvailable = getSectionAvailability().lab;

  return (
    <>
      <ReadingProgress />
      <article lang={post.fallback ? post.locale : undefined} className={styles.article}>
        <PostHeader
          title={datoText(post.title)}
          description={datoText(post.description)}
          date={{ iso: post.date, label: label(post.date) }}
          updated={post.updated ? { iso: post.updated, label: tArticle('updated', { date: label(post.updated) }) } : undefined}
          readingLabel={t('card.minutes', { minutes: post.readingMinutes })}
          levelLabel={post.level ? `${tArticle('level.label')}: ${tArticle(`level.${post.level}`)}` : undefined}
          tags={post.tags}
          tagsLabel={t('card.tags')}
          languageNote={post.fallback ? t(`card.only.${otherLocale}`) : undefined}
          back={{ href: '/blog', label: tArticle('back') }}
          otherLanguage={
            post.fallback
              ? { note: tArticle('otherLanguage.note', { language: tArticle(`otherLanguage.${otherLocale}`) }), linkLabel: tArticle('otherLanguage.link', { language: tArticle(`otherLanguage.${otherLocale}`) }), locale: otherLocale, slug }
              : undefined
          }
        />
        <div className={styles.layout}>
          <div className={styles.rail}>
            <Toc label={tArticle('contents')} items={post.headings} />
          </div>
          <div className={styles.body}>
            <Prose>
              <Guide />
            </Prose>
          </div>
        </div>
      </article>

      <div className={styles.after}>
        {post.labSlug && labAvailable ? (
          <section className={styles.demo} aria-labelledby="demo-title">
            <h2 id="demo-title" className={styles.demoTitle}>
              {tArticle('demo.title')}
            </h2>
            <p className={styles.demoText}>{tArticle('demo.text')}</p>
            <div>
              <ArrowLink href={`/lab/${post.labSlug}`} emphasis="strong">
                {tArticle('demo.cta')}
              </ArrowLink>
            </div>
          </section>
        ) : null}
        <ShareRow title={tArticle('share.title')} label={tArticle('share.label')} url={url} labels={{ copy: tArticle('share.copy'), copied: tArticle('share.copied'), failed: tArticle('share.failed') }} />
        <NotifyBlock locale={locale} siteKey={env.client.NEXT_PUBLIC_TURNSTILE_SITE_KEY} labels={{ title: tArticle('notify.title'), text: tArticle('notify.text'), email: tArticle('notify.email'), submit: tArticle('notify.submit'), sent: tArticle('notify.sent') }} />
      </div>

      <ClosingCompact
        lead={tArticle('closing.lead')}
        tail={tArticle('closing.accent')}
        primary={
          <Button href="/propuesta" icon="sparkles">
            {tArticle('closing.cta')}
          </Button>
        }
        moreLabel={tArticle('closing.more')}
      />

      <JsonLd
        data={graphOf(
          blogPostingJsonLd({
            siteUrl: siteUrl(),
            locale: post.locale,
            url,
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            proficiencyLevel: post.level ? PROFICIENCY[post.level] : undefined,
            keywords: post.tags,
          }),
          breadcrumbJsonLd([
            { name: t('home'), url: absoluteUrl(locale, '/') },
            { name: tArticle('crumb'), url: absoluteUrl(locale, '/blog') },
            { name: post.title, url },
          ]),
        )}
      />
    </>
  );
}
