import { NotificationsView } from '@/components/admin/notifications';
import { PricesView } from '@/components/admin/pricing';
import { TeamView } from '@/components/admin/team';
import { TextsView } from '@/components/admin/texts';
import { StaffShell } from '@/components/staff/staff-shell';
import { loadMessages } from '@/i18n/messages';
import { PREVIEW_IDENTITY, previewTeam } from '@/lib/dev/crm-fixtures';
import { previewRules } from '@/lib/dev/notifications-fixtures';
import { previewCatalogue } from '@/lib/dev/pricing-fixtures';
import { previewTexts } from '@/lib/dev/texts-fixtures';

import type { AdminPreviewScreen } from '@/lib/dev/admin-previews';
import type { Locale } from '@josecoded/types';

const CURRENT_PATH: Record<AdminPreviewScreen, string> = { equipo: '/admin/equipo', precios: '/admin/contenido', notificaciones: '/admin/notificaciones', 'contenido-textos': '/admin/contenido' };

/**
 * One screen of /admin with fixtures instead of Supabase, inside the real `StaffShell`; it composes the same view the
 * real page composes. Gated by `requireDevUi()` in the route.
 */
export function AdminPreview({ locale, screen }: { locale: Locale; screen: AdminPreviewScreen }) {
  return (
    <StaffShell locale={locale} zone="admin" role="admin" identity={PREVIEW_IDENTITY.admin} currentPath={CURRENT_PATH[screen]}>
      {screen === 'precios' ? <PricesView locale={locale} catalogue={previewCatalogue()} /> : null}
      {screen === 'notificaciones' ? <NotificationsPreview /> : null}
      {screen === 'contenido-textos' ? <TextsPreview /> : null}
      {screen === 'equipo' ? <TeamPreview locale={locale} /> : null}
    </StaffShell>
  );
}

function TeamPreview({ locale }: { locale: Locale }) {
  const { members, invites } = previewTeam();
  return <TeamView locale={locale} members={members} invites={invites} />;
}

function NotificationsPreview() {
  const { state, candidates } = previewRules();
  return <NotificationsView rules={state} candidates={candidates} editable />;
}

async function TextsPreview() {
  const [es, en] = await Promise.all([loadMessages('es'), loadMessages('en')]);
  return <TextsView {...previewTexts(es, en)} />;
}
