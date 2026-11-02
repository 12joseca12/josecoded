import { getTranslations } from 'next-intl/server';

import { CodeScreen } from '@/components/auth/code-screen';
import { readPendingEmail } from '@/lib/auth/pending-email';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('code.metaTitle') };
}

export default async function CodePage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  return (
    <CodeScreen
      locale={locale}
      email={await readPendingEmail()}
      next={first(query.next)}
      audience={first(query.audience)}
    />
  );
}
