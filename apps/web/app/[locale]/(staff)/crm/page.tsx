import { getTranslations } from 'next-intl/server';

import { requireStaff } from '@/lib/auth/staff';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'crm' });
  return { title: t('metaTitle') };
}

// Placeholder until task 6.1 (shell and K1). The page guards too: a layout does not re-run on client navigation.
export default async function CrmHomePage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireStaff({ locale, next: '/crm' });
  const t = await getTranslations({ locale, namespace: 'crm' });
  return (
    <main>
      <h1>{t('placeholder.title')}</h1>
      <p>{t('placeholder.lead')}</p>
    </main>
  );
}
