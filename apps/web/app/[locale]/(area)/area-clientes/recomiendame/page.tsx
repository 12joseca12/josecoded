import { getTranslations } from 'next-intl/server';

import { pricing } from '@josecoded/pricing';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { ReferralLeads } from '@/components/area/referral-leads';
import { ReferralLink } from '@/components/area/referral-link';
import { GetLinkForm } from '@/components/area/referral-link/get-link-form';
import { RewardsList } from '@/components/area/rewards-list';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { getAffiliate, getReferredLeads, getRewards } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { env } from '@/lib/env';
import { resolveLocale } from '@/lib/locale';

import styles from '../area.module.css';
import local from './recomiendame.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.referrals' });
  return { title: t('metaTitle') };
}

/** «Recomiéndame» is open to every signed-in user, client or not (the shell never hides it). */
export default async function ReferralsPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes/recomiendame', locale }) });
  const t = await getTranslations({ locale, namespace: 'area.referrals' });

  const affiliate = await getAffiliate();
  const [leads, rewards] = affiliate
    ? await Promise.all([getReferredLeads(), getRewards(affiliate.id)])
    : [[], []];
  const url = affiliate ? `${env.client.NEXT_PUBLIC_SITE_URL}/?ref=${encodeURIComponent(affiliate.code)}` : '';

  return (
    <>
      <header className={styles.head}>
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        <p className={styles.lede}>{t('lede')}</p>
      </header>
      <AreaGrid>
        <AreaCard id="ref-link" title={affiliate ? t('linkTitle') : t('getTitle')} span="full">
          {affiliate ? (
            <>
              <ReferralLink
                url={url}
                labels={{ link: t('link'), copy: t('copy'), copied: t('copied'), failed: t('copyFailed') }}
              />
              <p className={local.code}>{t('code', { code: affiliate.code })}</p>
            </>
          ) : (
            <>
              <p>{t('getBody')}</p>
              <GetLinkForm locale={locale} submit={t('get')} label={t('form')} />
            </>
          )}
        </AreaCard>

        <AreaCard id="ref-rules" title={t('rulesTitle')} span="full">
          <ul className={local.rules}>
            <li>{t('rules.client', { months: pricing.affiliate.client.maintenanceMonths })}</li>
            <li>{t('rules.standard', { percent: pricing.affiliate.standard.percent })}</li>
            <li>{t('rules.premium', { percent: pricing.affiliate.premium.percent })}</li>
          </ul>
          <p className={local.note}>{t('rulesNote')}</p>
        </AreaCard>

        {affiliate ? (
          <>
            <AreaCard id="ref-leads" title={t('leadsTitle')}>
              <ReferralLeads locale={locale} leads={leads} />
            </AreaCard>
            <AreaCard id="ref-rewards" title={t('rewardsTitle')}>
              <RewardsList locale={locale} rewards={rewards} />
            </AreaCard>
          </>
        ) : null}
      </AreaGrid>
    </>
  );
}
