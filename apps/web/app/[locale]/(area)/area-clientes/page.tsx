import { getTranslations } from 'next-intl/server';

import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area' });
  return { title: t('metaTitle') };
}

// Placeholder until task 5.1: the guard and the route exist so that sign-in has somewhere to land.
export default async function AreaPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes', locale }) });
  const t = await getTranslations({ locale, namespace: 'area' });
  return (
    <div style={{ padding: '6rem 1rem' }}>
      <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
      <p>{t('placeholder')}</p>
    </div>
  );
}
