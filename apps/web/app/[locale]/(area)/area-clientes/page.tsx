import { getTranslations } from 'next-intl/server';

import { AreaGrid } from '@/components/area/area-card';
import { BlogFirst } from '@/components/area/home/blog-first';
import { BusinessFirst } from '@/components/area/home/business-first';
import { CompanyFirst } from '@/components/area/home/company-first';
import { ContactStrip } from '@/components/area/home/contact-strip';
import { NeutralHome } from '@/components/area/home/neutral-home';
import { ProjectSummary } from '@/components/area/home/project-summary';
import { ProposalSummary } from '@/components/area/home/proposal-summary';
import { ReferralFirst } from '@/components/area/home/referral-first';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { resolveAreaVariant } from '@/lib/area/audience';
import { getAreaContext, getComments, getTasks } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from './area.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area' });
  return { title: t('metaTitle') };
}

/**
 * Home of the area, personalised without asking: by project (client), by proposal, or by the
 * origin the visitor signed up from (DT §1.12). The shell keeps Recomiéndame, Mi cuenta and contact
 * in every variant.
 */
export default async function AreaHomePage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes', locale }) });
  const context = await getAreaContext();
  if (!context) return null; // the guard above redirected an anonymous visitor

  const { client, lead, profile, session } = context;
  const variant = resolveAreaVariant({ client, lead, profile });
  const t = await getTranslations({ locale, namespace: `area.home.${variant}` });
  const tHome = await getTranslations({ locale, namespace: 'area.home' });
  const name = profile?.display_name ?? '';

  const [tasks, news] = client
    ? await Promise.all([getTasks(client.id), getComments(client.id, { limit: 3 })])
    : [[], []];

  return (
    <>
      <header className={styles.head}>
        {name ? <p className={styles.greeting}>{tHome('greeting', { name })}</p> : null}
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        {variant === 'client' ? null : <p className={styles.lede}>{t('lede')}</p>}
      </header>
      <AreaGrid>
        {variant === 'client' && client ? (
          <ProjectSummary locale={locale} userId={session.user.id} client={client} tasks={tasks} news={news} />
        ) : null}
        {variant === 'proposal' && lead ? <ProposalSummary locale={locale} lead={lead} /> : null}
        {variant === 'referral' ? <ReferralFirst locale={locale} /> : null}
        {variant === 'business' ? <BusinessFirst locale={locale} /> : null}
        {variant === 'company' ? <CompanyFirst locale={locale} /> : null}
        {variant === 'blog' ? <BlogFirst locale={locale} /> : null}
        {variant === 'neutral' ? <NeutralHome locale={locale} /> : null}
        <ContactStrip locale={locale} />
      </AreaGrid>
    </>
  );
}
