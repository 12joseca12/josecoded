import { cache } from 'react';

import { getOptionalSession } from '@/lib/auth/guards';

import type { StaffRole } from '@/lib/auth/staff';

// The few figures of K1 that the counters RPCs do not carry: the leads by status, the commissions with their
// amount, the last import with its file and author, and the first story waiting for a decision. They are plain
// reads with the JWT of the person, so RLS decides the scope (a closer's own portfolio, the admin's whole CRM);
// like the counters they throw when they cannot be read: a zero would lie.

/** The statuses of an open lead that K1 lists, in the order of the pipeline. */
export const OPEN_LEAD_STATUSES = ['new', 'contacted', 'proposal_sent'] as const;
export type OpenLeadStatus = (typeof OPEN_LEAD_STATUSES)[number];

export interface Money {
  count: number;
  amount: number;
}

export interface LastImport {
  fileName: string | null;
  at: string;
  created: number;
  updated: number;
  skipped: number;
  /** Who imported it. Only the admin sees the others' imports, so only he gets a name. */
  author: string | null;
}

export interface SummaryExtras {
  leads: Record<OpenLeadStatus, number>;
  commissions: { pending: Money; approved: Money };
  lastImport: LastImport | null;
  /** The first proposed story: the client it belongs to, named by its company or, without one, by the person. */
  nextStory: { clientId: string; name: string } | null;
}

/** Count and total of the commissions in `status`; the amounts are `numeric`, so they may arrive as strings. */
export function sumCommissions(
  rows: readonly { status: string; amount: number | string | null }[],
): SummaryExtras['commissions'] {
  const total = (status: string): Money =>
    rows
      .filter((row) => row.status === status)
      .reduce<Money>(
        (sum, row) => ({ count: sum.count + 1, amount: sum.amount + Number(row.amount ?? 0) }),
        { count: 0, amount: 0 },
      );
  return { pending: total('pending'), approved: total('approved') };
}

/** «Panadería La Espiga» for a company, the person's name for a contact without one. */
export function storyClientName(
  contact: { display_name: string; crm_organizations: { name: string } | null } | null,
): string | null {
  return contact ? (contact.crm_organizations?.name ?? contact.display_name) : null;
}

export const getSummaryExtras = cache(async (role: StaffRole): Promise<SummaryExtras> => {
  const session = await getOptionalSession();
  if (!session) throw new Error('no session');
  const { supabase } = session;
  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(error.message);
  };

  const leadCount = async (status: OpenLeadStatus) => {
    const { count, error } = await supabase
      .from('crm_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'lead')
      .eq('status', status)
      .is('archived_at', null);
    fail(error);
    return count ?? 0;
  };

  const [leads, commissions, imports, story] = await Promise.all([
    Promise.all(OPEN_LEAD_STATUSES.map(leadCount)),
    supabase
      .from('closer_commissions')
      .select('status, amount')
      .in('status', ['pending', 'approved']),
    supabase
      .from('crm_imports')
      .select('owner_id, file_name, created_at, created_count, updated_count, skipped_count')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('client_user_stories')
      .select('client_id')
      .eq('status', 'proposed')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  fail(commissions.error);
  fail(imports.error);
  fail(story.error);

  let author: string | null = null;
  if (role === 'admin' && imports.data) {
    const { data } = await supabase
      .from('staff_members')
      .select('display_name')
      .eq('user_id', imports.data.owner_id)
      .maybeSingle();
    author = data?.display_name ?? null;
  }

  let nextStory: SummaryExtras['nextStory'] = null;
  if (story.data) {
    // `clients.contact_id` is not readable by a JWT: the staff RPC is the way from a client to its contact
    const { data: clients } = await supabase.rpc('staff_clients', {
      p_client_id: story.data.client_id,
    });
    const contactId = clients?.[0]?.contact_id;
    if (contactId) {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('display_name, crm_organizations(name)')
        .eq('id', contactId)
        .maybeSingle();
      const name = storyClientName(contact as Parameters<typeof storyClientName>[0]);
      if (name) nextStory = { clientId: story.data.client_id, name };
    }
  }

  return {
    leads: { new: leads[0] ?? 0, contacted: leads[1] ?? 0, proposal_sent: leads[2] ?? 0 },
    commissions: sumCommissions(commissions.data ?? []),
    lastImport: imports.data
      ? {
          fileName: imports.data.file_name,
          at: imports.data.created_at,
          created: imports.data.created_count,
          updated: imports.data.updated_count,
          skipped: imports.data.skipped_count,
          author,
        }
      : null,
    nextStory,
  };
});
