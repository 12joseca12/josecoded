import { getFormatter, getTranslations } from 'next-intl/server';

import { formatPrice } from '@josecoded/pricing';

import { AreaEmpty } from '@/components/area/area-empty';

import styles from '../referral-leads/referral-leads.module.css';

import type { AreaReward } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

/** Rewards earned: months of maintenance or an amount in euros, pending or paid, always in words. */
export async function RewardsList({ locale, rewards }: { locale: Locale; rewards: readonly AreaReward[] }) {
  const t = await getTranslations({ locale, namespace: 'area.referrals' });
  const format = await getFormatter({ locale });

  if (rewards.length === 0) return <AreaEmpty title={t('rewardsEmptyTitle')}>{t('rewardsEmptyBody')}</AreaEmpty>;

  return (
    <ul className={styles.list} aria-label={t('rewardsList')}>
      {rewards.map((reward) => (
        <li key={reward.id} className={styles.item}>
          <span>
            {reward.type === 'maintenance_months'
              ? t('rewardMonths', { count: reward.amount })
              : t('rewardAmount', { amount: formatPrice(reward.amount, locale) })}
          </span>
          <span className={styles.meta}>
            {t('rewardLine', {
              status: t(`rewardStatus.${reward.status}`),
              date: format.dateTime(new Date(reward.paid_at ?? reward.created_at), {
                dateStyle: 'medium',
                timeZone: 'Europe/Madrid',
              }),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
