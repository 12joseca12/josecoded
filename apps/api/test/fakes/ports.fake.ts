import type {
  AffiliatesRepo,
  AiClient,
  AiCompletion,
  CreatedLead,
  CreateLeadPayload,
  LeadsRepo,
  QuotaStore,
  TurnstileVerdict,
  TurnstileVerifier,
} from '../../src/ports';
import type { NoticeLedger, Notifier } from '@josecoded/types';

export interface FakeTurnstile extends TurnstileVerifier {
  verdict: TurnstileVerdict;
  calls: { token: string; ip: string; actions: readonly string[] }[];
}

/** TurnstileVerifier that answers `verdict` and records what it was asked. */
export function createFakeTurnstile(verdict: TurnstileVerdict = 'ok'): FakeTurnstile {
  const fake: FakeTurnstile = {
    verdict,
    calls: [],
    async verify(token, ip, actions) {
      fake.calls.push({ token, ip, actions });
      return fake.verdict;
    },
  };
  return fake;
}

export interface FakeQuota extends QuotaStore {
  counts: Map<string, number>;
  /** When set, `hit` throws it (Supabase down). */
  outage?: Error;
  hits: { key: string; limit: number; ttlSeconds: number }[];
}

/** In-memory QuotaStore with the semantics of `increment_quota`: rejected calls keep counting. */
export function createFakeQuota(): FakeQuota {
  const fake: FakeQuota = {
    counts: new Map(),
    hits: [],
    async hit(key, limit, ttlSeconds) {
      if (fake.outage) throw fake.outage;
      fake.hits.push({ key, limit, ttlSeconds });
      const count = (fake.counts.get(key) ?? 0) + 1;
      fake.counts.set(key, count);
      return count <= limit;
    },
  };
  return fake;
}

export interface FakeAi extends AiClient {
  /** Next answers, consumed in order; the last one repeats. An `Error` is thrown, anything else is returned. */
  replies: unknown[];
  requests: AiCompletion[];
}

export function createFakeAi(...replies: unknown[]): FakeAi {
  const fake: FakeAi = {
    replies,
    requests: [],
    async complete(request) {
      fake.requests.push(request);
      const reply = fake.replies.length > 1 ? fake.replies.shift() : fake.replies[0];
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
  return fake;
}

export interface FakeTelegram extends Notifier {
  sent: string[];
  fail?: boolean;
}

export function createFakeTelegram(): FakeTelegram {
  const fake: FakeTelegram = {
    sent: [],
    async sendMessage(text) {
      if (fake.fail) throw new Error('telegram down');
      fake.sent.push(text);
    },
  };
  return fake;
}

export interface FakeNotices extends NoticeLedger {
  sent: Set<string>;
}

export function createFakeNotices(): FakeNotices {
  const fake: FakeNotices = {
    sent: new Set(),
    async markSent(key) {
      fake.sent.add(key);
    },
    async wasSent(key) {
      return fake.sent.has(key);
    },
  };
  return fake;
}

export interface FakeLeads extends LeadsRepo {
  payloads: CreateLeadPayload[];
  /** Set to make `create` throw (a Postgres error text that must never reach the response). */
  failWith?: Error;
}

/** LeadsRepo with the idempotency and the affiliate fallback of `create_lead`. */
export function createFakeLeads(knownCodes: string[] = []): FakeLeads {
  const byKey = new Map<string, CreatedLead>();
  const fake: FakeLeads = {
    payloads: [],
    async create(payload) {
      if (fake.failWith) throw fake.failWith;
      const existing = byKey.get(payload.idempotency_key);
      if (existing) return { ...existing, created: false };
      const stored = structuredClone(payload);
      if (stored.affiliate_code && !knownCodes.includes(stored.affiliate_code)) {
        stored.meta = { ...stored.meta, affiliate_code_rejected: stored.affiliate_code };
        delete stored.affiliate_code;
      }
      fake.payloads.push(stored);
      const created = { leadId: crypto.randomUUID(), contactId: crypto.randomUUID(), created: true };
      byKey.set(payload.idempotency_key, created);
      return created;
    },
  };
  return fake;
}

/** AffiliatesRepo over `{ code: ownerEmail }`. */
export function createFakeAffiliates(owners: Record<string, string> = {}): AffiliatesRepo {
  return {
    async findOwner(code) {
      return code in owners ? { userId: `user-of-${code}` } : null;
    },
    async userEmail(userId) {
      const code = userId.replace('user-of-', '');
      return owners[code] ?? null;
    },
  };
}
