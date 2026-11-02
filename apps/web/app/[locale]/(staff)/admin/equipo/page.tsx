import { getTranslations } from 'next-intl/server';

import { TeamView } from '@/components/admin/team';
import { requireAdmin } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';
import { getTeam } from '@/lib/team/queries';
import { TEAM_PATH } from '@/lib/team/team';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'adminTeam' });
  return { title: t('metaTitle') };
}

/**
 * D1, the team. The page reads (`admin_staff_list()`, the open invitations, the pending amounts) and `TeamView` draws
 * the same screen as `/dev/admin/equipo/admin`; the writes are the Server Actions of `./actions`, each behind
 * `requireAdmin()` again.
 */
export default async function AdminTeamPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { supabase } = await requireAdmin({ locale, next: TEAM_PATH });
  const { members, invites } = await getTeam(supabase);
  return <TeamView locale={locale} members={members} invites={invites} />;
}
