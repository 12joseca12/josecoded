import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHead } from '@/components/staff/page-head';
import { requireAdmin } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';
import { TEAM_PATH } from '@/lib/team/team';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'adminTeam' });
  return { title: t('metaTitle') };
}

/**
 * D1. B32 draws the screen (`TeamView`, see `/dev/admin/equipo/admin`); B33 reads `staff_members` / `staff_invites`
 * and wires the Server Actions. Until then the real page shows a placeholder: the sheets answer `ok` without writing,
 * so they must not be offered on real data.
 */
export default async function AdminTeamPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireAdmin({ locale, next: TEAM_PATH });
  const t = await getTranslations({ locale, namespace: 'adminTeam' });
  return (
    <>
      <PageHead title={t('title')} tone={t('tone')} lead={t('lead')} />
      <EmptyState title={t('pending.title')} text={t('pending.text')} />
    </>
  );
}
