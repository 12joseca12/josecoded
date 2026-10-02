import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <main>
      <h1>{t('notFound.title')}</h1>
    </main>
  );
}
