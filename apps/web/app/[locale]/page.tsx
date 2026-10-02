import { getTranslations } from 'next-intl/server';

import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';

// Placeholder: the home (hero, bento scenes) is phase 2.
export default async function HomePage({ params }: { params: LocaleParams }) {
  await resolveLocale(params);
  const t = await getTranslations();

  return (
    <main>
      <h1>{t('site.name')}</h1>
    </main>
  );
}
