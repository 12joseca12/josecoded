import type { SupabaseGateway } from '../../src/adapters/supabase';
import type { AuthUser } from '@josecoded/types';

export interface FakeSupabaseGateway extends SupabaseGateway {
  /** token -> user that `verifyUser` accepts. */
  sessions: Map<string, AuthUser>;
  admins: Set<string>;
  /** When set, verifyUser/isAdmin throw it (Supabase unreachable). */
  outage?: Error;
}

/** In-memory SupabaseGateway (working-agreements §17.1): same port as adapters/supabase.ts. */
export function createFakeSupabaseGateway(
  sessions: Record<string, AuthUser> = {},
  admins: string[] = [],
): FakeSupabaseGateway {
  const fake: FakeSupabaseGateway = {
    sessions: new Map(Object.entries(sessions)),
    admins: new Set(admins),
    async verifyUser(jwt) {
      if (fake.outage) throw fake.outage;
      return fake.sessions.get(jwt) ?? null;
    },
    async isAdmin(userId) {
      if (fake.outage) throw fake.outage;
      return fake.admins.has(userId);
    },
    admin() {
      throw new Error('the fake gateway has no service client');
    },
  };
  return fake;
}
