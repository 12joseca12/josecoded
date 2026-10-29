import { getTranslations } from 'next-intl/server';

import { Backdrop } from '@/components/layout/backdrop';
import { ShellProvider } from '@/components/layout/shell-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

import styles from './page-frame.module.css';

import type { ReactNode } from 'react';

/**
 * Frame of every public page: the skip link first (first tab stop), the light field, the header,
 * `<main id="main">` and the footer, all inside the one shell store. The page puts its `h1` and
 * content in `children` and renders no `<main>` of its own.
 */
export async function PageFrame({ children }: { children: ReactNode }) {
  const t = await getTranslations('a11y');

  return (
    <ShellProvider>
      <a className="skip" href="#main">
        {t('skipToContent')}
      </a>
      <Backdrop />
      <SiteHeader />
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <SiteFooter />
    </ShellProvider>
  );
}
