import type { AiClient, AiCompletion, QuotaStore, TurnstileVerdict, TurnstileVerifier } from '../../src/ports';
import type { Notifier } from '@josecoded/types';

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
