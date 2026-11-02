import { getTranslations } from 'next-intl/server';

import { Action } from '@/components/ui/action';
import { initials, staffNav } from '@/lib/staff/nav';

import { StaffRail } from './staff-nav';
import styles from './staff-shell.module.css';
import { StaffTabBar } from './staff-tab-bar';

import type { StaffNavView } from './staff-nav';
import type { StaffRole } from '@/lib/auth/staff';
import type { StaffNavItem, StaffZone } from '@/lib/staff/nav';
import type { Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

/** README §4 A, provisional: `danger` (coral, a new token) or `pending` (amber) for what is overdue. */
const OVERDUE_TONE: 'danger' | 'pending' = 'danger';

export interface StaffShellProps {
  locale: Locale;
  /** Which of the two shells: `/crm` (admin and closers) or `/admin` (the admin only). */
  zone: StaffZone;
  role: StaffRole;
  /** Name for the foot of the rail and rate of a closer in percent. */
  identity: { name: string | null; rate: number };
  /** Contacts with the next action past due: the badge of Contactos. */
  overdue?: number;
  children: ReactNode;
}

/**
 * Frame of `/crm` and `/admin` (ref/crm README §3.1): from 64rem a rail with the destinations, the group «Más»
 * and who you are; below it a top bar and a bottom bar of four with a «Más» sheet. One component, two sets of
 * destinations (`staffNav`). It renders the `<main id="main">`, so a screen puts its `h1` and content in
 * `children` and no `<main>` of its own.
 *
 * A11y: the skip link is the first tab stop; the rail and the bar are `nav` landmarks with the same name (only
 * one is ever displayed); the current destination carries `aria-current="page"`; every target is at least
 * 2.5rem tall in the rail and 2.75rem on touch.
 */
export async function StaffShell({ locale, zone, role, identity, overdue = 0, children }: StaffShellProps) {
  const [t, a11y] = await Promise.all([
    getTranslations({ locale, namespace: 'crm' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);
  const nav = staffNav(zone, role);
  const view = (items: readonly StaffNavItem[]): StaffNavView[] =>
    items.map((item) => ({
      ...item,
      label: t(`nav.${item.id}`),
      ...(item.id === 'contacts' && overdue > 0
        ? { badge: { count: overdue, label: t('shell.overdueCount', { count: overdue }) } }
        : {}),
    }));

  const home = zone === 'admin' ? '/admin' : '/crm';
  const label = t(`shell.navLabel.${zone}`);
  const brand = (
    <>
      josecoded <span className={styles.zone}>{t(`shell.zone.${zone}`)}</span>
    </>
  );
  const name = identity.name ?? '';
  const avatar = (
    <span className={styles.avatar} aria-hidden="true">
      {initials(identity.name)}
    </span>
  );

  return (
    <div className={styles.app} data-zone={zone} data-overdue={OVERDUE_TONE}>
      <a className="skip" href="#main">
        {a11y('skipToContent')}
      </a>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.rail}>
        <Action href={home} className={styles.brand}>
          {brand}
        </Action>
        <StaffRail
          label={label}
          moreLabel={t('shell.moreGroup')}
          primary={view(nav.primary)}
          more={view(nav.more)}
        />
        <div className={styles.foot}>
          <Action href="/crm/ajustes" className={styles.me}>
            {avatar}
            <span className={styles.meText}>
              <span className={styles.meName}>{name}</span>
              <span className={styles.meRole}>
                {role === 'admin' ? t('shell.role.admin') : t('shell.role.closer', { rate: identity.rate })}
              </span>
            </span>
          </Action>
        </div>
      </div>
      <header className={styles.topbar}>
        <Action href={home} className={styles.brand}>
          {brand}
        </Action>
        <div className={styles.topbarEnd}>
          <Action href="/crm/ajustes" className={styles.iconLink} aria-label={t('shell.account')}>
            {avatar}
          </Action>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.page}>
        {children}
      </main>
      <StaffTabBar
        label={label}
        items={view(nav.bar)}
        sheetItems={view(nav.sheet)}
        moreButton={t('shell.moreButton')}
        moreSections={t('shell.moreSections')}
        close={t('shell.close')}
      />
    </div>
  );
}
