import { TeamView } from '@/components/admin/team';
import { StaffShell } from '@/components/staff/staff-shell';
import { PREVIEW_IDENTITY, previewTeam } from '@/lib/dev/crm-fixtures';

import type { AdminPreviewScreen } from '@/lib/dev/admin-previews';
import type { Locale } from '@josecoded/types';

const CURRENT_PATH: Record<AdminPreviewScreen, string> = { equipo: '/admin/equipo' };

/**
 * One screen of /admin with fixtures instead of Supabase, inside the real `StaffShell`; it composes the same view the
 * real page composes. Gated by `requireDevUi()` in the route.
 */
export function AdminPreview({ locale, screen }: { locale: Locale; screen: AdminPreviewScreen }) {
  const { members, invites } = previewTeam();
  return (
    <StaffShell locale={locale} zone="admin" role="admin" identity={PREVIEW_IDENTITY.admin} currentPath={CURRENT_PATH[screen]}>
      <TeamView locale={locale} members={members} invites={invites} />
    </StaffShell>
  );
}
