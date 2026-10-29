import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { ChatTrigger } from '@/components/layout/chat-trigger';
import { LangSwitch } from '@/components/layout/lang-switch';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { NavLinks } from '@/components/layout/nav-links';
import { SearchTrigger } from '@/components/layout/search-trigger';
import { UserMenu } from '@/components/layout/user-menu';
import { Link } from '@/i18n/navigation';
import { getNavItems } from '@/lib/layout/nav';

import { HeaderScrollState } from './header-scroll-state';
import styles from './site-header.module.css';

/**
 * Fixed header of every public page: brand, main navigation, then language → ⌘K → Chat → Login
 * (never «Contacto»: it lives in the menu, ⌘K and the closing of each page). Below 67.5 rem the
 * links and the language go into the ☰ menu. Server Component; the islands that need the browser
 * (scroll state, menu, ⌘K, account) receive only the `nav` messages they use.
 */
export async function SiteHeader() {
  const [locale, messages, t, site] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations('nav'),
    getTranslations('site'),
  ]);
  const items = getNavItems().map(({ key, href, scene }) => ({ href, scene, label: t(key) }));

  return (
    <NextIntlClientProvider locale={locale} messages={{ nav: messages.nav }}>
      <HeaderScrollState>
        <Link href="/" className={styles.brand} aria-label={t('brandLabel')}>
          {site('name')}
        </Link>
        <NavLinks items={items} label={t('primary')} />
        <div className={styles.right}>
          <LangSwitch variant="inline" />
          <SearchTrigger />
          <ChatTrigger href="/chat" label={t('chat')} aria-label={t('chatOpen')} />
          <UserMenu />
          <MobileMenu
            links={items}
            secondary={[{ href: '/partners', label: t('partners') }]}
            contact={{ href: '/contacto', label: t('contact') }}
          >
            <LangSwitch variant="segmented" />
          </MobileMenu>
        </div>
      </HeaderScrollState>
    </NextIntlClientProvider>
  );
}
