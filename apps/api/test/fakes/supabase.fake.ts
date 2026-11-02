import type { StaffRole, SupabaseGateway } from '../../src/adapters/supabase';
import type { AuthUser } from '@josecoded/types';

export interface FakeSupabaseGateway extends SupabaseGateway {
  /** token -> user that `verifyUser` accepts. */
  sessions: Map<string, AuthUser>;
  admins: Set<string>;
  /** Active closers (a deactivated one is simply absent). */
  closers: Set<string>;
  /** When set, verifyUser/isAdmin throw it (Supabase unreachable). */
  outage?: Error;
}

/** In-memory SupabaseGateway (working-agreements §17.1): same port as adapters/supabase.ts. */
export function createFakeSupabaseGateway(
  sessions: Record<string, AuthUser> = {},
  admins: string[] = [],
  closers: string[] = [],
): FakeSupabaseGateway {
  const fake: FakeSupabaseGateway = {
    sessions: new Map(Object.entries(sessions)),
    admins: new Set(admins),
    closers: new Set(closers),
    async verifyUser(jwt) {
      if (fake.outage) throw fake.outage;
      return fake.sessions.get(jwt) ?? null;
    },
    async isAdmin(userId) {
      if (fake.outage) throw fake.outage;
      return fake.admins.has(userId);
    },
    async staffRole(userId): Promise<StaffRole | null> {
      if (fake.outage) throw fake.outage;
      return fake.admins.has(userId) ? 'admin' : fake.closers.has(userId) ? 'closer' : null;
    },
    admin() {
      throw new Error('the fake gateway has no service client');
    },
  };
  return fake;
}
