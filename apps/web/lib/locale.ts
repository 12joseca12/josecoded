import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';

export type LocaleParams = Promise<{ locale: string }>;

/** Validates the route locale, opts the render into static generation and returns it typed. */
export async function resolveLocale(params: LocaleParams) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}
