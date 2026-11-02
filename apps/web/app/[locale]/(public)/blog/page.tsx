import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PostCard } from '@/components/blog/post-card';
import { datoText } from '@/components/home/dato';
import { JsonLd } from '@/components/seo';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { isPendingVisible } from '@/components/ui/pending';
import { blogPosts } from '@/lib/content/blog';
import { getSectionAvailability } from '@/lib/content/sections';
import { resolveLocale } from '@/lib/locale';
import { breadcrumbJsonLd, graphOf } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'blog.meta' });
  return pageMetadata({ locale, pathname: '/blog', title: t('title'), description: t('description') });
}

// P9 (pantallas v2.0): the guides, newest first. Without three real guides the section does not exist in production
// (spec D33): the page answers 404 there, like the header, the menu, ⌘K, the footer and the sitemap.
export default async function BlogPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  if (!getSectionAvailability().blog) notFound();
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = blogPosts(locale, isPendingVisible());
  const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <>
      <PageHead lead={t('head.lead')} tail={t('head.accent')} citable={datoText(String(t.raw('head.citable')))} />
      <PageSection id="guias" lead={t('title')}>
        {posts.length === 0 ? (
          <EmptyState title={t('empty.title')} text={t('empty.text')} />
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard
                  slug={post.slug}
                  title={datoText(post.title)}
                  description={datoText(post.description)}
                  date={{ iso: post.date, label: day.format(new Date(post.date)) }}
                  readingLabel={t('card.minutes', { minutes: post.readingMinutes })}
                  tags={post.tags}
                  tagsLabel={t('card.tags')}
                  lang={post.fallback ? post.locale : undefined}
                  languageNote={post.fallback ? t(`card.only.${post.locale}`) : undefined}
                  href={`/blog/${post.slug}`}
                  linkLabel={t('card.read')}
                  linkName={t('card.readNamed', { title: post.title })}
                />
              </li>
            ))}
          </ul>
        )}
      </PageSection>
      <JsonLd
        data={graphOf(
          breadcrumbJsonLd([
            { name: t('home'), url: absoluteUrl(locale, '/') },
            { name: t('title'), url: absoluteUrl(locale, '/blog') },
          ]),
        )}
      />
    </>
  );
}
