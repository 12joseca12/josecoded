import { getTranslations } from 'next-intl/server';

import { Surface } from '@/components/ui/surface';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { Link } from '@/i18n/navigation';
import { env } from '@/lib/env';

import { AuthProviders } from './auth-providers';
import styles from './auth-screen.module.css';
import { EmailForm } from './email-form';

import type { Locale } from '@josecoded/types';

/**
 * The sign-in / sign-up screen: the two modes are the same flow (passwordless, a first sign-in
 * creates the account), only the copy and the link to the sibling change. Server component: the
 * only client islands are the email form and the CAPTCHA.
 *
 * A11y: one `h1`; the provider buttons are a labelled group; an error from the callback is a
 * `role="alert"`; the divider text is real text, not a decoration; the card is a `section` named by
 * its heading.
 */
export async function AuthScreen({
  mode,
  locale,
  next,
  audience,
  error,
  email,
}: {
  mode: 'login' | 'signUp';
  locale: Locale;
  next?: string;
  audience?: string;
  error?: string;
  email?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  const copy = mode === 'login' ? 'login' : 'signUp';
  const headingId = 'auth-heading';
  const sibling = mode === 'login' ? '/auth/registro' : '/auth/login';

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby={headingId}>
        <header className={styles.head}>
          <TwoToneHeading
            id={headingId}
            level="h1"
            lead={t(`${copy}.title.lead`)}
            tail={t(`${copy}.title.tail`)}
          />
          <p className={styles.lede}>{t(`${copy}.lede`)}</p>
        </header>

        <Surface radius="tcard">
          <div className={styles.body}>
            {error ? (
              <p className={styles.alert} role="alert">
                {t('errors.callback')}
              </p>
            ) : null}
            <AuthProviders
              locale={locale}
              next={next}
              audience={audience}
              label={t('providers.label')}
              names={{ google: t('providers.google'), github: t('providers.github') }}
            />
            <p className={styles.divider}>{t('providers.or')}</p>
            <EmailForm
              locale={locale}
              siteKey={env.client.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              next={next}
              audience={audience}
              defaultEmail={email}
              labels={{
                email: t('email.label'),
                help: t('email.help'),
                submit: t('email.submit'),
                form: t(`${copy}.title.lead`),
              }}
            />
          </div>
        </Surface>

        <p className={styles.switch}>
          {t(`${copy}.switchPrompt`)}{' '}
          <Link href={sibling} className={styles.link}>
            {t(`${copy}.switchLink`)}
          </Link>
        </p>
        <p className={styles.legal}>
          {t.rich('legal', {
            notice: (chunks) => (
              <Link href="/legal/aviso-legal" className={styles.link}>
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/legal/privacidad" className={styles.link}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>
    </div>
  );
}
