import { getTranslations } from 'next-intl/server';

import { AreaNav } from './area-nav';
import styles from './area-shell.module.css';

import type { AreaNavItem } from './area-nav';
import type { Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * Frame of the client area: the navigation (side column on wide screens, a row on a phone) and the
 * screen. The project entries only exist for clients; Recomiéndame and Mi cuenta are always there
 * (the area never hides them, spec D32).
 */
export async function AreaShell({
  locale,
  isClient,
  children,
}: {
  locale: Locale;
  isClient: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'area.nav' });
  const items: AreaNavItem[] = [
    { href: '/area-clientes', label: isClient ? t('project') : t('home') },
    ...(isClient
      ? ([
          { href: '/area-clientes/tareas', label: t('tasks') },
          { href: '/area-clientes/material', label: t('files') },
          { href: '/area-clientes/pack', label: t('plan') },
        ] as const)
      : []),
    { href: '/area-clientes/recomiendame', label: t('referrals') },
    { href: '/perfil', label: t('account') },
  ];

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <AreaNav label={t('label')} items={items} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
