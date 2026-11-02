// PricingSource over pricing_published() through the real supabase-js client and the in-memory Supabase (plan 3.7b):
// one call per five minutes, the compiled catalogue when the database has nothing or fails, and nothing logged but a reason.
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { pricing as compiled } from '@josecoded/pricing';

import { createCompiledPricingSource, createPricingSource, PRICING_FAILURE_TTL_MS, PRICING_TTL_MS, type PricingCache } from './pricing.supabase.adapter';
import { createRawRpc } from './raw-rpc';
import { createSupabaseAdapters } from './supabase';
import { createFakeSupabase, type FakeSupabase } from '../../test/fakes/supabase-rest.fake';

import type { Env } from '../types/env.types';

const SECRET = 'sb_secret_test_0123456789abcdef';
const env = {
  API_MODE: 'development',
  CORS_ORIGINS: '',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
  SUPABASE_SECRET_KEY: SECRET,
} satisfies Env;

const published = { ...structuredClone(compiled), version: '2026-11-02.1' };
published.packs[1]!.price = 1500;

let sb: FakeSupabase;
let now: number;
let cache: PricingCache;
let errors: MockInstance<typeof console.error>;

function source() {
  const { gateway } = createSupabaseAdapters(env, sb.fetch);
  return createPricingSource(createRawRpc(gateway), { now: () => now, cache });
}

beforeEach(() => {
  sb = createFakeSupabase({ secret: SECRET });
  now = 1_000_000;
  cache = {};
  errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('createPricingSource', () => {
  it('asks the database once and serves the next calls from the cache', async () => {
    sb.pricingPublished = published;
    const pricing = source();
    expect((await pricing.get()).packs[1]?.price).toBe(1500);
    now += PRICING_TTL_MS - 1;
    expect((await pricing.get()).version).toBe('2026-11-02.1');
    expect(sb.rpcCalls.filter((r) => r === 'pricing_published')).toHaveLength(1);
  });

  it('asks again once the five minutes are over and follows a new publication', async () => {
    sb.pricingPublished = published;
    const pricing = source();
    await pricing.get();
    sb.pricingPublished = { ...published, version: '2026-11-02.2' };
    now += PRICING_TTL_MS;
    expect((await pricing.get()).version).toBe('2026-11-02.2');
    expect(sb.rpcCalls.filter((r) => r === 'pricing_published')).toHaveLength(2);
  });

  it('falls back to the compiled catalogue when nothing is published yet, and logs pricing_unavailable', async () => {
    sb.pricingPublished = null;
    const data = await source().get();
    expect(data).toBe(compiled);
    expect(errors).toHaveBeenCalledWith(expect.stringContaining('"action":"pricing_unavailable"'));
  });

  it('falls back when the value is not a valid catalogue, without logging any of it', async () => {
    sb.pricingPublished = { ...published, hourly: -1, packs: [{ code: 'secret-looking-value' }] };
    expect(await source().get()).toBe(compiled);
    const logged = errors.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(logged).toContain('pricing_unavailable');
    expect(logged).not.toContain('secret-looking-value');
  });

  it('falls back when the database fails, keeps the fallback for 30 s and then tries again', async () => {
    sb.pricingPublished = new Error('db down');
    const pricing = source();
    expect(await pricing.get()).toBe(compiled);
    now += PRICING_FAILURE_TTL_MS - 1;
    await pricing.get();
    expect(sb.rpcCalls.filter((r) => r === 'pricing_published')).toHaveLength(1);
    sb.pricingPublished = published;
    now += 1;
    expect((await pricing.get()).version).toBe('2026-11-02.1');
  });

  it('the compiled source answers the file', async () => {
    expect(await createCompiledPricingSource().get()).toBe(compiled);
  });
});
