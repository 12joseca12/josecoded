import { getLocale, getTranslations } from 'next-intl/server';

import { Bento, BentoCell, DemoCard, PostTeaser, Scene } from '@/components/scenes';
import { ArrowLink } from '@/components/ui/arrow-link';
import { isPendingVisible } from '@/components/ui/pending';
import { getSectionAvailability } from '@/lib/content/sections';

import { datoText } from './dato';
import { getHomeLabBlogContent, labBlogVariant } from './lab-blog-data';

import type { HomeDemo, HomePost } from './lab-blog-data';
import type { Href, Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

/** What a cell says about an article or a demo. */
interface Teaser {
  note?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  href: Href;
  /** Accessible name of the link; absent while the content is a placeholder. */
  name?: string;
}

/**
 * Scene 5 of the home (home-v7 §4): Lab and Blog share one scene. With both: the demo (6) and two
 * guides (3 + 3); only Lab: the demo and two more demos; only Blog: the latest article and two
 * guides; neither: no scene (`getSectionAvailability()`, which is always on outside production).
 * Real items come from the content loaders (4.2 blog, 4.5 lab); where one is missing the cell shows
 * `{{DATO}}` placeholders in development and is left out in production.
 */
export async function LabBlogScene() {
  const variant = labBlogVariant(getSectionAvailability());
  if (!variant) return null;

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('home.scenes.labBlog');
  const nav = await getTranslations('nav');
  const { posts, demos } = getHomeLabBlogContent();
  const showPlaceholders = isPendingVisible();
  const placeholder = (key: 'date' | 'title' | 'lead' | 'demoName' | 'demoLead') => datoText(String(t.raw(`placeholder.${key}`)));
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));

  // an article or a demo, real or (outside production) a placeholder; null when neither exists
  const article = (post: HomePost | undefined): Teaser | null =>
    post
      ? { note: date(post.date), title: post.title, lead: post.description, href: `/blog/${post.slug}`, name: t('readNamed', { title: post.title }) }
      : showPlaceholders
        ? { note: placeholder('date'), title: placeholder('title'), lead: placeholder('lead'), href: '/blog' }
        : null;
  const demo = (item: HomeDemo | undefined): Teaser | null =>
    item
      ? { title: item.name, lead: item.description, href: `/lab/${item.slug}`, name: t('tryNamed', { name: item.name }) }
      : showPlaceholders
        ? { title: placeholder('demoName'), lead: placeholder('demoLead'), href: '/lab' }
        : null;

  const aside =
    variant === 'lab' ? (
      <ArrowLink href="/lab" emphasis="strong">
        {t('allDemos')}
      </ArrowLink>
    ) : (
      <ArrowLink href="/blog" emphasis="strong">
        {t('allGuides')}
      </ArrowLink>
    );

  const featured = variant === 'blog' ? article(posts[0]) : demo(demos[0]);
  const smalls =
    variant === 'lab'
      ? [demo(demos[1]), demo(demos[2])]
      : variant === 'both'
        ? [article(posts[0]), article(posts[1])]
        : [article(posts[1]), article(posts[2])];

  return (
    <Scene
      id="lab-blog"
      lead={datoText(String(t.raw('title.lead'))) ?? (variant === 'blog' ? nav('blog') : nav('lab'))}
      tail={datoText(String(t.raw('title.accent')))}
      aside={aside}
      fill
    >
      <Bento>
        {featured && variant === 'blog' ? (
          <BentoCell span={6} wide icon="book-open" title={t('latest.title')}>
            <PostTeaser size="lg" note={featured.note} title={featured.title} lead={featured.lead} href={featured.href} linkLabel={t('latest.read')} linkName={featured.name} />
          </BentoCell>
        ) : null}
        {featured && variant !== 'blog' ? (
          <BentoCell id="lab" span={6} wide icon="flask-conical" title={nav('lab')}>
            <DemoCard name={featured.title} lead={featured.lead} href={featured.href} linkLabel={t('lab.tryDemo')} linkName={featured.name} />
          </BentoCell>
        ) : null}
        {smalls.map((item, i) =>
          item ? (
            <BentoCell key={i} span={3} icon={variant === 'lab' ? 'flask-conical' : 'file-text'} title={variant === 'lab' ? t('demo.title') : t('guide.title')}>
              <PostTeaser note={item.note} title={item.title} href={item.href} linkLabel={variant === 'lab' ? t('demo.try') : t('latest.read')} linkName={item.name} />
            </BentoCell>
          ) : null,
        )}
      </Bento>
    </Scene>
  );
}
