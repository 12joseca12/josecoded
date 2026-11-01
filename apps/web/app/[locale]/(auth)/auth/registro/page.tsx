import { getTranslations } from 'next-intl/server';

import { AuthScreen } from '@/components/auth';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('signUp.metaTitle') };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  return (
    <AuthScreen
      mode="signUp"
      locale={locale}
      next={first(query.next)}
      audience={first(query.audience)}
      error={first(query.error)}
      email={first(query.email)}
    />
  );
}
