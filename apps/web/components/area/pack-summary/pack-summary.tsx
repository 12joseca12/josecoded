import { getFormatter, getTranslations } from 'next-intl/server';

import { formatPrice, pricing } from '@josecoded/pricing';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { extraLabel, packLabel } from '@/lib/area/packs';
import { hasDato } from '@/lib/content/dato';

import styles from './pack-summary.module.css';

import type { AreaClient, AreaExtra, AreaUpgrade } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

function requestSummary(
  t: Awaited<ReturnType<typeof getTranslations<'area.plan'>>>,
  request: AreaUpgrade,
  locale: Locale,
): string {
  const extras = request.extras.map((code) => extraLabel(code, locale)).join(', ');
  const pack = request.to_pack_code ? packLabel(request.to_pack_code, locale) : '';
  if (pack && extras) return t('summaryBoth', { pack, extras });
  return pack ? t('summaryPack', { pack }) : t('summaryExtras', { extras });
}

/**
 * Plan page of a client: what they hired, the extras they have (with their state in words), the
 * pending request if there is one (at most one: the database refuses a second) and the way to ask
 * for an upgrade. Prices come from the list (`pricing.json`); the billable number is the database's.
 */
export async function PackSummary({
  locale,
  client,
  extras,
  requests,
  justRequested,
}: {
  locale: Locale;
  client: AreaClient;
  extras: readonly AreaExtra[];
  requests: readonly AreaUpgrade[];
  justRequested: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'area.plan' });
  const format = await getFormatter({ locale });
  const pack = pricing.packs.find((p) => p.code === client.pack_code);
  const includes = pack?.includes[locale] ?? [];
  const pending = requests.find((request) => request.status === 'pending');
  const history = requests.filter((request) => request.status !== 'pending');

  return (
    <AreaGrid>
      {justRequested ? (
        <p className={styles.notice} role="status" data-span="full">
          {t('requested')}
        </p>
      ) : null}

      <AreaCard id="plan-current" title={t('current')}>
        <p className={styles.big}>{packLabel(client.pack_code, locale)}</p>
        {pack ? (
          <>
            <p className={styles.muted}>{t('listPrice', { price: formatPrice(pack.price, locale) })}</p>
            <p className={styles.muted}>{t('weeks', { count: pack.weeks })}</p>
            {includes.filter(hasDato).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </>
        ) : null}
      </AreaCard>

      <AreaCard id="plan-extras" title={t('extrasTitle')}>
        {extras.length === 0 ? (
          <p className={styles.muted}>{t('extrasEmpty')}</p>
        ) : (
          <ul className={styles.list}>
            {extras.map((extra) => (
              <li key={extra.id}>
                {t('extraLine', { label: extraLabel(extra.extra_code, locale), status: t(`extraStatus.${extra.status}`) })}
                {extra.free ? ` (${t('extraFree')})` : ''}
              </li>
            ))}
          </ul>
        )}
      </AreaCard>

      <AreaCard id="plan-upgrade" title={t('upgradeTitle')} span="full">
        {pending ? (
          <p role="status">
            {t('pending', { summary: `${requestSummary(t, pending, locale)} (${formatPrice(pending.computed_price, locale)})` })}
          </p>
        ) : (
          <>
            <p>{t('upgradeLede')}</p>
            <div className={styles.actions}>
              <Button href="/area-clientes/pack/ampliar">{t('upgradeCta')}</Button>
            </div>
          </>
        )}
        {history.length > 0 ? (
          <>
            <h3 className={styles.sub}>{t('history')}</h3>
            <ul className={styles.list}>
              {history.map((request) => (
                <li key={request.id}>
                  {t('requestLine', {
                    summary: requestSummary(t, request, locale),
                    price: formatPrice(request.computed_price, locale),
                    status: `${t(`requestStatus.${request.status}`)}, ${format.dateTime(new Date(request.created_at), { dateStyle: 'medium', timeZone: 'Europe/Madrid' })}`,
                  })}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </AreaCard>
    </AreaGrid>
  );
}
