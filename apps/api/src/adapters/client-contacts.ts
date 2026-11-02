// ClientContacts (service role): the address of the client of a `story.decided` event. `clients.user_id` is set once he
// signed in (then the Auth account's email wins, it is the one he reads); before that, the invited email.
import type { ClientContacts } from '../ports';
import type { SupabaseGateway } from './supabase';

// `clients.invite_email` and `user_profiles.locale` are columns database.ts may not carry until it is regenerated.
type Row = { user_id: string | null; invite_email: string | null };

export function createClientContacts(gateway: Pick<SupabaseGateway, 'admin'>): ClientContacts {
  return {
    async contactOf(clientId) {
      const admin = gateway.admin();
      const { data, error } = await admin.from('clients').select('user_id, invite_email').eq('id', clientId).maybeSingle();
      if (error) throw new Error(`clients: ${error.message}`);
      const row = data as Row | null;
      if (!row) return null;
      let email = row.invite_email;
      let locale: 'es' | 'en' = 'es';
      if (row.user_id) {
        const { data: user, error: userError } = await admin.auth.admin.getUserById(row.user_id);
        if (userError) throw new Error(`auth.admin.getUserById: ${userError.message}`);
        email = user.user?.email ?? email;
        const { data: profile } = await admin.from('user_profiles').select('locale').eq('user_id', row.user_id).maybeSingle();
        if (profile?.locale === 'en') locale = 'en';
      }
      return email ? { email, locale } : null;
    },
  };
}
