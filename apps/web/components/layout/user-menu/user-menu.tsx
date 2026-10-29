'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { MenuItem, MenuPanel } from '@/components/layout/menu-panel';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useRouter } from '@/i18n/navigation';
import { hasSessionCookie } from '@/lib/auth/session-cookie';
import { createDisclosure } from '@/lib/motion/disclosure';

import styles from './user-menu.module.css';

import type { Disclosure } from '@/lib/motion/disclosure';

interface Account {
  email: string;
  signOut: () => Promise<void>;
}

/** Loads Supabase on demand: a visitor without a session cookie never downloads it. */
async function loadAccount(): Promise<Account | null> {
  if (!hasSessionCookie(document.cookie)) return null;
  const { createClient } = await import('@/lib/supabase/browser');
  const client = createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return {
    email: data.user.email ?? '',
    signOut: async () => {
      await client.auth.signOut();
    },
  };
}

/**
 * The last item of the header. Server-rendered pages (static) paint «Login», a link to the sign-in
 * screen. After mount, only if a `sb-*-auth-token` cookie exists, the Supabase browser client is
 * imported and, with a live session, the button becomes the account menu (client area, profile,
 * sign out) as a disclosure. `@supabase/supabase-js` stays out of the initial chunks
 * (`check-hero-bundle`, task 2.9).
 *
 * A11y: Login is a link named «Login» even when only its icon shows (≤ 22.5rem); the account
 * trigger is a button with `aria-expanded`/`aria-controls`; Esc, a link, a tap or focus outside
 * close it and focus returns to the button; the email is plain text.
 */
export function UserMenu() {
  const t = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const disclosure = useRef<Disclosure | null>(null);

  useEffect(() => {
    let alive = true;
    loadAccount().then(
      (loaded) => alive && setAccount(loaded),
      () => undefined, // no session client available: the visitor keeps «Login»
    );
    return () => {
      alive = false;
    };
  }, []);

  // the disclosure is created on the first click, when the button element is at hand
  function toggle(button: HTMLButtonElement) {
    const panel = panelRef.current;
    if (!panel) return;
    disclosure.current ??= createDisclosure(button, panel);
    disclosure.current.toggle();
  }

  useEffect(() => () => disclosure.current?.destroy(), []);

  if (!account) {
    return (
      <span className={styles.login}>
        <Button href="/auth/login" size="sm" icon="log-in" aria-label={t('login')}>
          {t('login')}
        </Button>
      </span>
    );
  }

  return (
    <>
      <span className={styles.login}>
        <Button
          variant="ghost"
          size="sm"
          icon="user"
          aria-label={t('account')}
          aria-expanded="false"
          aria-controls={panelId}
          onClick={(event) => toggle(event.currentTarget)}
        >
          {t('account')}
        </Button>
      </span>
      <MenuPanel id={panelId} ref={panelRef}>
        <div role="group" aria-label={t('userMenu')} className={styles.group}>
          <p className={styles.email}>{account.email}</p>
          <MenuItem href="/area-clientes">{tFooter('clientArea')}</MenuItem>
          <MenuItem href="/perfil">{t('profile')}</MenuItem>
          <MenuItem
            separated
            onClick={() => {
              disclosure.current?.close({ restoreFocus: false });
              void account.signOut().then(() => {
                setAccount(null);
                router.replace('/');
                router.refresh();
              });
            }}
          >
            <Icon name="log-out" />
            {t('signOut')}
          </MenuItem>
        </div>
      </MenuPanel>
    </>
  );
}
