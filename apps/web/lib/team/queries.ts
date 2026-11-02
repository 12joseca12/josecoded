import type { TeamInvite, TeamMember } from './team';
import type { ServerSupabase } from '@/lib/supabase/server';

// The read of D1. Admin only: the page calls `requireAdmin()` first, and the database refuses anyone else
// (`admin_staff_list()` raises `forbidden`; `staff_invites` and the other tables are admin-readable by RLS).
// `admin_staff_list()` reads what the JWT cannot (the email from auth.users, the verified TOTP factor).

export async function getTeam(supabase: ServerSupabase): Promise<{ members: TeamMember[]; invites: TeamInvite[] }> {
  const [staff, invites, pending] = await Promise.all([
    supabase.rpc('admin_staff_list'),
    supabase
      .from('staff_invites')
      .select('id, email, role, commission_rate, expires_at')
      .is('claimed_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('closer_commissions').select('closer_id, amount').eq('status', 'pending'),
  ]);
  if (staff.error) throw new Error(staff.error.message);
  if (invites.error) throw new Error(invites.error.message);
  if (pending.error) throw new Error(pending.error.message);

  const owed = new Map<string, number>();
  for (const row of pending.data ?? []) owed.set(row.closer_id, (owed.get(row.closer_id) ?? 0) + Number(row.amount));

  return {
    members: (staff.data ?? []).map((row) => ({
      id: row.user_id,
      name: row.display_name || row.email || '—',
      email: row.email ?? '',
      role: row.role,
      disabled: row.disabled_at !== null,
      // the admin earns no commission: his rate is not a number to show
      rate: row.role === 'admin' ? null : Number(row.commission_rate),
      telegram: row.telegram_linked,
      totp: row.mfa_enrolled,
      portfolio: { all: row.contacts_count },
      pendingCount: row.commissions_pending,
      pendingAmount: owed.get(row.user_id) ?? 0,
    })),
    invites: (invites.data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      rate: Number(row.commission_rate),
      expiresAt: row.expires_at,
    })),
  };
}
