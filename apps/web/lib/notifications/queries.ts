import { rulesFromRows } from './rules';

import type { RuleCandidate, RulesState } from './rules';
import type { ServerSupabase } from '@/lib/supabase/server';

// The read of D3. Admin only: the page calls `requireAdmin()` first, and RLS lets only the admin read every rule
// (`notification_rules_select`); `admin_staff_list()` gives the names and raises `forbidden` for anyone else.

export async function getRules(supabase: ServerSupabase): Promise<{ rules: RulesState; candidates: RuleCandidate[] }> {
  const [rows, staff] = await Promise.all([
    supabase.from('notification_rules').select('event, recipient, recipient_user_id, channel, enabled'),
    supabase.rpc('admin_staff_list'),
  ]);
  if (rows.error) throw new Error(rows.error.message);
  if (staff.error) throw new Error(staff.error.message);
  const people = staff.data ?? [];
  const names = new Map(people.map((row) => [row.user_id, row.display_name || row.email || '—']));
  return {
    rules: rulesFromRows(rows.data ?? [], names),
    candidates: people
      .filter((row) => row.role === 'closer' && row.disabled_at === null)
      .map((row) => ({ id: row.user_id, name: row.display_name || row.email || '—' })),
  };
}
