import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { CredentialList } from '@/components/about/credential-list';
import { LinkRow } from '@/components/about/link-row';
import { PrinciplesList } from '@/components/about/principles-list';
import { StackGroups } from '@/components/about/stack-groups';
import { Timeline } from '@/components/about/timeline';
import { datoText } from '@/components/home/dato';
import { readFact } from '@/components/home/facts';
import { JsonLd } from '@/components/seo';
import { ClosingCompact } from '@/components/shared/closing-compact';
import { PageHead } from '@/components/shared/page-head';
import { PageSection } from '@/components/shared/page-section';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Button } from '@/components/ui/button';
import { identitySentence } from '@/lib/content/identity';
import { tourProjects } from '@/lib/content/projects';
import { resolveLocale } from '@/lib/locale';
import { fullName } from '@/lib/seo/facts';
import { loadFacts } from '@/lib/seo/facts-server';
import { graphOf, profilePageJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/page-metadata';
import { absoluteUrl, siteUrl } from '@/lib/seo/urls';

import styles from './page.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Href } from '@josecoded/types';
import type { Metadata } from 'next';

const GROUPS = ['mobile', 'web', 'backend', 'quality'] as const;
const CREDENTIALS = ['itil', 'devops', 'psm'] as const;
const PRINCIPLES = ['what', 'price', 'when'] as const;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about.meta' });
  const name = fullName(await loadFacts(locale));
  const named = name ? t('titleNamed', { name }) : undefined;
  return pageMetadata({
    locale,
    pathname: '/sobre-mi',
    title: named && named.length <= 48 ? named : t('title'),
    description: t('description'),
  });
}

// P6 (pantallas v2.0): the author page of the whole site. Everything Jose has not supplied (story, jobs, the
// state of the certifications, the photo) is left out of production, never invented.
export default async function AboutPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  const factsT = await getTranslations({ locale, namespace: 'facts' });
  const facts = await loadFacts(locale);
  const name = fullName(facts);
  const cv = readFact(factsT.raw('cvUrl'));
  const photo = readFact(factsT.raw('photo'));

  const role = facts.city ? t('head.roleCity', { role: t('head.role'), city: facts.city }) : t('head.role');
  const story = datoText(String(t.raw('story.text')));

  const entries = [
    ...tourProjects().map((sheet) => ({
      id: sheet.slug,
      label: sheet.slug === 'josecoded' ? t('timeline.items.josecoded') : sheet.name,
      date: typeof sheet.year === 'number' ? String(sheet.year) : sheet.year,
    })),
    { id: 'freelance', label: String(t.raw('timeline.items.freelance')), date: '{{DATO: fecha}}' },
    { id: 'employment', label: String(t.raw('timeline.items.employment')), date: '{{DATO: fecha}}' },
  ];

  const profileLinks = [
    ...(facts.linkedinUrl ? [{ id: 'linkedin', label: t('links.linkedin'), href: facts.linkedinUrl, own: true }] : []),
    ...(facts.githubUser ? [{ id: 'github', label: t('links.github'), href: `https://github.com/${facts.githubUser}`, own: true }] : []),
    ...(cv.ready ? [{ id: 'cv', label: t('links.cv'), href: cv.value }] : []),
  ];

  return (
    <>
      <PageHead
        id="about-title"
        lead={name ?? t('title')}
        tail={role}
        citable={t('head.citable', { identity: identitySentence((key, values) => t(`identity.${key}`, values), facts) })}
        actions={
          cv.ready ? (
            <Button href={cv.value as Href} icon="download">
              {t('stack.cv')}
            </Button>
          ) : undefined
        }
        aside={
          photo.ready ? (
            <div className={styles.photo}>
              <Image src={photo.value} alt={t('head.photoAlt')} width={480} height={600} priority />
            </div>
          ) : undefined
        }
      />

      {story ? (
        <PageSection id="quien-soy" lead={t('story.title')}>
          <p className={styles.text}>{story}</p>
        </PageSection>
      ) : null}

      <PageSection id="trayectoria" lead={t('timeline.title')} tail={t('timeline.accent')}>
        <Timeline entries={entries} locale={locale} label={t('timeline.label')} />
      </PageSection>

      <PageSection id="como-trabajo" lead={t('principles.title')}>
        <PrinciplesList
          items={PRINCIPLES.map((id) => ({ id, title: t(`principles.items.${id}.title`), text: t(`principles.items.${id}.text`) }))}
        />
      </PageSection>

      <PageSection id="stack" lead={t('stack.title')} tail={t('stack.accent')}>
        <StackGroups
          groups={GROUPS.map((id) => ({
            id,
            title: t(`stack.groups.${id}`),
            items: t.raw(`stack.items.${id}` as 'stack.items.mobile') as string[],
          }))}
        />
        <h3 className={styles.sub}>{t('stack.educationTitle')}</h3>
        <CredentialList
          items={CREDENTIALS.map((id) => ({
            id,
            name: t(`stack.credentials.${id}`),
            status: String(t.raw(`stack.status.${id}`)),
          }))}
        />
        {cv.ready ? (
          <div>
            <ArrowLink href={cv.value as Href} emphasis="strong" icon="download">
              {t('stack.cv')}
            </ArrowLink>
          </div>
        ) : null}
      </PageSection>

      {profileLinks.length > 0 ? (
        <PageSection id="enlaces" lead={t('links.title')}>
          <LinkRow label={t('links.label')} links={profileLinks} />
        </PageSection>
      ) : null}

      <ClosingCompact
        lead={t('closing.lead')}
        tail={t('closing.accent')}
        primary={
          <Button href="/contacto" icon="message-circle">
            {t('closing.cta')}
          </Button>
        }
        moreLabel={t('closing.assistant')}
      />
      <JsonLd data={graphOf(profilePageJsonLd({ siteUrl: siteUrl(), url: absoluteUrl(locale, '/sobre-mi') }))} />
    </>
  );
}
