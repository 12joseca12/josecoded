import { PricesView } from '@/components/admin/pricing';
import { TeamView } from '@/components/admin/team';
import { StaffShell } from '@/components/staff/staff-shell';
import { PREVIEW_IDENTITY, previewTeam } from '@/lib/dev/crm-fixtures';
import { previewCatalogue } from '@/lib/dev/pricing-fixtures';

import type { AdminPreviewScreen } from '@/lib/dev/admin-previews';
import type { Locale } from '@josecoded/types';

const CURRENT_PATH: Record<AdminPreviewScreen, string> = { equipo: '/admin/equipo', precios: '/admin/contenido' };

/**
 * One screen of /admin with fixtures instead of Supabase, inside the real `StaffShell`; it composes the same view the
 * real page composes. Gated by `requireDevUi()` in the route.
 */
export function AdminPreview({ locale, screen }: { locale: Locale; screen: AdminPreviewScreen }) {
  return (
    <StaffShell locale={locale} zone="admin" role="admin" identity={PREVIEW_IDENTITY.admin} currentPath={CURRENT_PATH[screen]}>
      {screen === 'precios' ? <PricesView locale={locale} catalogue={previewCatalogue()} /> : <TeamPreview locale={locale} />}
    </StaffShell>
  );
}

function TeamPreview({ locale }: { locale: Locale }) {
  const { members, invites } = previewTeam();
  return <TeamView locale={locale} members={members} invites={invites} />;
}
