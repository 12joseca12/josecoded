import { getTranslations } from 'next-intl/server';

import { NotificationsView } from '@/components/admin/notifications';
import { requireAdmin } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';
import { getRules } from '@/lib/notifications/queries';
import { NOTIFICATIONS_PATH } from '@/lib/notifications/rules';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'adminNotifications' });
  return { title: t('metaTitle') };
}

/**
 * D3, who hears about what. The page only reads (`notification_rules` and the team) and `NotificationsView` draws the
 * same screen as `/dev/admin/notificaciones/admin`; it is read-only until the Server Action `setRule` and the test
 * message arrive (B43.b).
 */
export default async function AdminNotificationsPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const { supabase } = await requireAdmin({ locale, next: NOTIFICATIONS_PATH });
  const { rules, candidates } = await getRules(supabase);
  return <NotificationsView rules={rules} candidates={candidates} editable={false} />;
}
