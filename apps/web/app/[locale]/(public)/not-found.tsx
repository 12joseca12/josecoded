import { getLocale } from 'next-intl/server';

import { NotFoundContent } from '@/components/layout/not-found-content';

// Inside the public frame: a 404 under a public URL keeps the header, the footer and the language switch.
export default async function PublicNotFound() {
  const locale = await getLocale();
  return <NotFoundContent locale={locale} framed />;
}
