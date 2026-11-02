import type { CommissionRecord } from './commissions';
import type { ServerSupabase } from '@/lib/supabase/server';
import type { Database } from '@josecoded/types';

// The read of K5. `staff_commissions()` joins what the person cannot read directly (the lead's pack, the contact of a
// commission that was reassigned) and returns only her own rows, or all of them to the admin: the web never decides
// whose commissions exist, and a closer's rows never carry another closer's amount.

type Row = Database['public']['Functions']['staff_commissions']['Returns'][number];

/** The columns that may be null in SQL are typed non-null by the generator for table functions: the map says what they are. */
export function toCommissionRecord(row: Row): CommissionRecord {
  return {
    id: row.id,
    closerId: row.closer_id,
    closerName: row.closer_name,
    closerDisabled: row.closer_disabled,
    closerRate: Number(row.closer_rate),
    contactName: row.contact_name,
    organization: row.organization || null,
    packCode: row.pack_code || null,
    packOption: row.pack_option || null,
    closedAt: row.closed_at,
    baseAmount: Number(row.base_amount),
    percent: Number(row.percent),
    amount: Number(row.amount),
    status: row.status,
    approvedAt: row.approved_at || null,
    paidAt: row.paid_at || null,
    paidNote: row.paid_note || null,
    rejectedReason: row.rejected_reason || null,
  };
}

/** Every commission the person may see, the latest closing first. A failure throws: a zero would lie. */
export async function getCommissions(supabase: ServerSupabase): Promise<CommissionRecord[]> {
  const { data, error } = await supabase.rpc('staff_commissions');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCommissionRecord);
}
