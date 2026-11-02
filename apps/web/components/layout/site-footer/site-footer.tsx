import { getFormatter, getLocale, getTranslations } from 'next-intl/server';

import { Action } from '@/components/ui/action';
import { getBuildInfo } from '@/lib/content/build-info';
import { getFooterNavItems } from '@/lib/layout/nav';
import { isLegalPublishable } from '@/lib/legal/publishable';

import styles from './site-footer.module.css';

import type { Href } from '@josecoded/types';

/**
 * Footer of every public page: brand, the sections (Lab and Blog only when they exist), the agencies
 * door, Contacto, client area and legal, and the review date from `build-info.json`. It is the
 * target of «Menú» without JavaScript (`#pie`).
 *
 * A11y: `footer` landmark (contentinfo) with a `nav` named «Pie»; the date is a `<time>`; text-3 on
 * bg 6.0:1, hover text 16.9:1.
 */
export async function SiteFooter() {
  const locale = await getLocale();
  const [t, nav, format] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getFormatter(),
  ]);
  const site = await getTranslations('site');
  const { reviewedAt } = getBuildInfo();

  const links: { href: Href; label: string }[] = [
    ...getFooterNavItems().map(({ key, href }) => ({ href, label: nav(key) })),
    { href: '/partners', label: nav('partners') },
    { href: '/contacto', label: nav('contact') },
    { href: '/area-clientes', label: t('clientArea') },
    ...(isLegalPublishable('aviso-legal', locale === 'en' ? 'en' : 'es') ? [{ href: '/legal/aviso-legal' as Href, label: t('legal') }] : []),
  ];

  return (
    <footer id="pie" className={styles.footer}>
      <span className={styles.brand}>{site('name')}</span>
      <nav aria-label={t('label')} className={styles.links}>
        {links.map(({ href, label }) => (
          <Action key={href} href={href} className={styles.link}>
            {label}
          </Action>
        ))}
      </nav>
      <span className={styles.reviewed}>
        {t('reviewed')}{' '}
        <time dateTime={reviewedAt}>
          {format.dateTime(new Date(`${reviewedAt}T00:00:00Z`), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </time>
      </span>
    </footer>
  );
}
