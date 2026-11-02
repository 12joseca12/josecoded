import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { UpgradeForm } from '@/components/area/upgrade-form';
import { Button } from '@/components/ui/button';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getClientExtras, getUpgradeRequests } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from '../../area.module.css';
import { requestUpgrade } from '../actions';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.plan.upgrade' });
  return { title: t('metaTitle') };
}

export default async function UpgradePage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes/pack/ampliar', locale }) });
  const context = await getAreaContext();
  if (!context?.client) notFound();
  const t = await getTranslations({ locale, namespace: 'area.plan.upgrade' });

  const [extras, requests] = await Promise.all([
    getClientExtras(context.client.id),
    getUpgradeRequests(context.client.id, 1),
  ]);
  const pending = requests.some((request) => request.status === 'pending');
  // an extra the client already has (included or active) is not offered again
  const owned = extras.filter((extra) => extra.status === 'included' || extra.status === 'active').map((e) => e.extra_code);

  return (
    <>
      <header className={styles.head}>
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        <p className={styles.lede}>{t('lede')}</p>
      </header>
      <AreaGrid>
        <AreaCard id="upgrade-form" title={t('form')} span="full">
          {pending ? (
            <p role="status">{t('pendingBlocked')}</p>
          ) : (
            <UpgradeForm
              currentPack={context.client.pack_code}
              ownedExtras={owned}
              locale={locale}
              action={requestUpgrade}
              labels={{
                packLegend: t('packLegend'),
                packNone: t('packNone'),
                extrasLegend: t('extrasLegend'),
                extraMonthly: t('extraMonthly'),
                total: t('total'),
                totalHelp: t('totalHelp'),
                nothing: t('nothing'),
                noOptions: t('noOptions'),
                submit: t('submit'),
                form: t('form'),
              }}
            />
          )}
          <div>
            <Button href="/area-clientes/pack" variant="ghost">
              {t('back')}
            </Button>
          </div>
        </AreaCard>
      </AreaGrid>
    </>
  );
}
