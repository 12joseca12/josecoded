import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { formatPrice, pricing } from '@josecoded/pricing';

import { JsonLd } from '@/components/seo';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { fontVariables } from '@/lib/fonts';
import { resolveLocale } from '@/lib/locale';
import { loadSiteGraph } from '@/lib/seo/site-graph';
import { isIndexableSite } from '@/lib/seo/urls';

import '@/styles/globals.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'site' });
  const seo = await getTranslations({ locale, namespace: 'seo' });
  const from = formatPrice(Math.min(...pricing.packs.map((pack) => pack.price)), locale);
  return {
    metadataBase: new URL(env.client.NEXT_PUBLIC_SITE_URL),
    // pages set their own title (pageMetadata); this one is the default and the suffix
    title: { default: `${seo('home.title')} · ${t('name')}`, template: `%s · ${t('name')}` },
    // default for pages that do not set one: the description of the home
    description: seo('home.description', { price: from }),
    // previews are never indexed (their header and robots.txt say so too)
    ...(!isIndexableSite() && { robots: { index: false, follow: false } }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LocaleParams;
}) {
  const locale = await resolveLocale(params);

  // suppressHydrationWarning: the intro gate (components/hero/intro-gate-script) sets data-intro on <html>
  // before React hydrates
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body>
        {/* the localized Link needs the locale in the client; no messages travel to the browser
            here: a client component that translates receives the subset it needs */}
        <NextIntlClientProvider locale={locale} messages={null}>
          {children}
        </NextIntlClientProvider>
        <JsonLd data={await loadSiteGraph(locale)} />
      </body>
    </html>
  );
}
