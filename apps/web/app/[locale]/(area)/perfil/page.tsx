import { getTranslations } from 'next-intl/server';

import { signOut } from '@/app/[locale]/(auth)/auth/actions';
import { MfaPanel } from '@/components/auth/mfa-panel';
import { ProfileForm } from '@/components/auth/profile-form';
import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from './perfil.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'profile' });
  return { title: t('metaTitle') };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await resolveLocale(params);
  const { user, supabase } = await requireUser({
    locale,
    next: getPathname({ href: '/perfil', locale }),
  });
  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'profile' });

  const [{ data: profile }, { data: staff }, { data: factors }, { data: aal }] = await Promise.all([
    supabase.from('user_profiles').select('display_name, locale').eq('user_id', user.id).maybeSingle(),
    supabase.from('staff_members').select('role').eq('user_id', user.id).maybeSingle(),
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const isAdmin = staff?.role === 'admin';
  const totp = factors?.totp?.[0] ?? null;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <TwoToneHeading
          level="h1"
          lead={t('title.lead')}
          tail={t('title.tail')}
        />
        <p className={styles.lede}>{t('lede')}</p>
      </header>

      <div className={styles.grid}>
        <Surface as="section" aria-labelledby="profile-account" radius="tcard">
          <div className={styles.body}>
            <h2 id="profile-account" className={styles.title}>
              {t('account.title')}
            </h2>
            <dl className={styles.facts}>
              <dt>{t('account.email')}</dt>
              <dd>{user.email}</dd>
            </dl>
            <p className={styles.help}>{t('account.emailHelp')}</p>
            <form action={signOut}>
              <Field kind="hidden" name="locale" value={locale} />
              <Button type="submit" variant="ghost" icon="log-out">
                {t('account.signOut')}
              </Button>
            </form>
          </div>
        </Surface>

        <Surface as="section" aria-labelledby="profile-prefs" radius="tcard">
          <div className={styles.body}>
            <h2 id="profile-prefs" className={styles.title}>
              {t('form.title')}
            </h2>
            <ProfileForm
              locale={locale}
              displayName={profile?.display_name ?? ''}
              profileLocale={profile?.locale ?? locale}
              labels={{
                form: t('form.title'),
                displayName: t('form.displayName'),
                displayNameHelp: t('form.displayNameHelp'),
                locale: t('form.locale'),
                localeEs: t('form.localeEs'),
                localeEn: t('form.localeEn'),
                submit: t('form.submit'),
                saved: t('form.saved'),
              }}
            />
          </div>
        </Surface>

        {isAdmin ? (
          <Surface as="section" aria-labelledby="profile-security" radius="tcard">
            <div className={styles.body}>
              <h2 id="profile-security" className={styles.title}>
                {t('security.title')}
              </h2>
              {query.mfa || aal?.currentLevel !== 'aal2' ? (
                <p className={styles.notice} role="status">
                  {t('security.required')}
                </p>
              ) : null}
              <MfaPanel
                locale={locale}
                factorId={totp?.id ?? null}
                verified={aal?.currentLevel === 'aal2'}
                labels={{
                  lede: t('security.lede'),
                  enrolled: t('security.enrolled'),
                  enrol: t('security.enrol'),
                  scan: t('security.scan'),
                  qrAlt: t('security.qrAlt'),
                  secret: t('security.secret'),
                  codeLabel: t('security.codeLabel'),
                  codeHelp: t('security.codeHelp'),
                  verify: t('security.verify'),
                  challenge: t('security.challenge'),
                  challengeSubmit: t('security.challengeSubmit'),
                  remove: t('security.remove'),
                  removeHelp: t('security.removeHelp'),
                  verified: t('security.verified'),
                  removed: t('security.removed'),
                  form: t('security.title'),
                }}
              />
            </div>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
