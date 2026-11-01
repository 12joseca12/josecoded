// Real adapters of LeadsRepo and AffiliatesRepo (service role). `create_lead` is the only way a lead is written by
// the gateway (DATOS §4.3): one transaction, idempotent by key, race-safe.
import { callRpc, type RpcClient } from './scheduled-jobs';

import type { AffiliatesRepo, CreatedLead, LeadsRepo } from '../ports';
import type { Database } from '@josecoded/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createLeadsRepo(client: RpcClient): LeadsRepo {
  return {
    async create(payload): Promise<CreatedLead> {
      const rows = await callRpc(client, 'create_lead', { p: payload as never });
      const row = rows?.[0];
      if (!row) throw new Error('create_lead: no row returned');
      return { leadId: row.lead_id, contactId: row.contact_id, created: row.created };
    },
  };
}

export function createAffiliatesRepo(admin: () => SupabaseClient<Database>): AffiliatesRepo {
  return {
    async findOwner(code) {
      const { data, error } = await admin().from('affiliates').select('user_id').eq('code', code).maybeSingle();
      if (error) throw new Error(`affiliates: ${error.message}`);
      return data ? { userId: data.user_id } : null;
    },
    async userEmail(userId) {
      const { data, error } = await admin().auth.admin.getUserById(userId);
      if (error) throw new Error(`auth.admin.getUserById: ${error.message}`);
      return data.user?.email ?? null;
    },
  };
}
