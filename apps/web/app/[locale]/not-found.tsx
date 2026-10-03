import { getLocale } from 'next-intl/server';

import { NotFoundContent } from '@/components/layout/not-found-content';

// No params here: the locale is the one the layout set for this request.
export default async function NotFound() {
  const locale = await getLocale();
  return <NotFoundContent locale={locale} />;
}
