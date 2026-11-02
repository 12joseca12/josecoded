import { getTranslations } from 'next-intl/server';

import { emailSchema } from '@josecoded/types';

import { Surface } from '@/components/ui/surface';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { Link } from '@/i18n/navigation';

import styles from './auth-screen.module.css';
import { OtpForm } from './otp-form';

import type { Locale } from '@josecoded/types';

/**
 * Second step: the 6-digit code. The address comes from a short-lived httpOnly cookie set when the code
 * was sent (never from the URL, which ends up in history, Referer and logs); the action reads the same
 * cookie, so the form does not carry it. Without a usable email (no cookie, or it expired) the screen
 * says so and offers the way back instead of an empty form.
 */
export async function CodeScreen({
  locale,
  email,
  next,
  audience,
}: {
  locale: Locale;
  email?: string;
  next?: string;
  audience?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  const valid = email !== undefined && emailSchema.safeParse(email).success;
  const headingId = 'code-heading';
  const back = (
    <Link
      href={{ pathname: '/auth/login', query: next ? { next } : {} }}
      className={styles.link}
    >
      {t('code.otherEmail')}
    </Link>
  );

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby={headingId}>
        <header className={styles.head}>
          <TwoToneHeading
            id={headingId}
            level="h1"
            lead={t('code.title.lead')}
            tail={t('code.title.tail')}
          />
          <p className={styles.lede}>
            {valid ? t('code.lede', { email: email as string }) : t('code.missingEmail')}
          </p>
        </header>
        <Surface radius="tcard">
          <div className={styles.body}>
            {valid ? (
              <OtpForm
                locale={locale}
                next={next}
                audience={audience}
                labels={{
                  code: t('code.label'),
                  help: t('code.help'),
                  submit: t('code.submit'),
                  form: t('code.metaTitle'),
                }}
                actions={back}
              />
            ) : (
              back
            )}
          </div>
        </Surface>
      </section>
    </div>
  );
}
