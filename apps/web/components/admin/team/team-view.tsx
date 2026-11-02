import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/staff/page-head';

import { InvitationTable } from './invitation-table';
import { InviteStaffSheet } from './invite-staff-sheet';
import { TeamTable } from './team-table';
import styles from './team-table.module.css';

import type { TeamInvite, TeamMember } from '@/lib/team/team';
import type { Locale } from '@josecoded/types';

/**
 * D1, the team, as a view of already-read data (admin only: the page guards with `requireAdmin()` and each Server
 * Action will again): the page fetches and the dev preview feeds it fixtures. Only the sentences of the sheets travel
 * to the browser. The one violet action is «Invitar».
 */
export async function TeamView({
  locale,
  members,
  invites,
}: {
  locale: Locale;
  members: readonly TeamMember[];
  invites: readonly TeamInvite[];
}) {
  const [t, messages] = await Promise.all([getTranslations({ locale, namespace: 'adminTeam' }), getMessages()]);
  return (
    <NextIntlClientProvider messages={{ adminTeam: { sheets: messages.adminTeam.sheets } }}>
      <PageHead title={t('title')} tone={t('tone')} lead={t('lead')} actions={<InviteStaffSheet />} />
      <TeamTable members={members} locale={locale} />
      <section className={styles.section} aria-labelledby="team-invitations">
        <div className={styles.sectionHead}>
          <h2 id="team-invitations">{t('invitations.title')}</h2>
          <span className={styles.caption}>{t('invitations.expiry')}</span>
        </div>
        {invites.length > 0 ? (
          <InvitationTable invites={invites} locale={locale} />
        ) : (
          <EmptyState title={t('invitations.emptyTitle')} text={t('invitations.emptyText')} />
        )}
      </section>
    </NextIntlClientProvider>
  );
}
