import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  chatContextFactsSchema,
  chatContextPublishedSchema,
  chatVisitorMessageEventSchema,
  type ChatContextFacts,
} from '../src';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'supabase');
const migrations = join(root, 'migrations');
const sql = readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(migrations, f), 'utf8').replace(/--.*$/gm, ''))
  .join('\n');
const seed = readFileSync(join(root, 'seed', 'seed.sql'), 'utf8');

describe('chatContextFactsSchema', () => {
  it('accepts the empty default of the column and fills the lists', () => {
    expect(chatContextFactsSchema.parse({})).toEqual({ stack: [], links: {}, dos: [], donts: [] });
  });

  it('accepts the facts of the seeded contexts', () => {
    const facts = [...seed.matchAll(/'(\{"availability"[\s\S]*?\})'/g)].map(
      (m) => JSON.parse(m[1]!) as unknown,
    );
    expect(facts).toHaveLength(2);
    for (const f of facts) expect(chatContextFactsSchema.safeParse(f).success).toBe(true);
  });

  it('only lets prices come from pricing.json', () => {
    expect(chatContextFactsSchema.safeParse({ rates_ref: 'pricing' }).success).toBe(true);
    expect(chatContextFactsSchema.safeParse({ rates_ref: 'manual' }).success).toBe(false);
    expect(chatContextFactsSchema.safeParse({ prices: { P1: 900 } }).success).toBe(false);
  });

  it('links are https URLs or site paths under snake_case keys', () => {
    const ok = { links: { servicios: '/servicios#packs', github: 'https://github.com/example' } };
    expect(chatContextFactsSchema.safeParse(ok).success).toBe(true);
    expect(
      chatContextFactsSchema.safeParse({ links: { web: 'http://example.test' } }).success,
    ).toBe(false);
    expect(
      chatContextFactsSchema.safeParse({ links: { web: 'javascript:alert(1)' } }).success,
    ).toBe(false);
    expect(chatContextFactsSchema.safeParse({ links: { 'Bad Key': '/x' } }).success).toBe(false);
  });

  it('rejects empty facts', () => {
    expect(chatContextFactsSchema.safeParse({ dos: [''] }).success).toBe(false);
    expect(chatContextFactsSchema.safeParse({ availability: '  ' }).success).toBe(false);
  });

  it('infers the parsed shape', () => {
    expectTypeOf<ChatContextFacts['stack']>().toEqualTypeOf<string[]>();
    expectTypeOf<ChatContextFacts['rates_ref']>().toEqualTypeOf<'pricing' | undefined>();
  });
});

describe('chat RPC and event payloads', () => {
  it('chatContextPublishedSchema matches the jsonb of chat_context_published()', () => {
    expect(sql).toMatch(
      /jsonb_build_object\('version', c\.version, 'title', c\.title, 'body_md', c\.body_md, 'facts', c\.facts\)/,
    );
    expect(
      chatContextPublishedSchema.safeParse({ version: 1, title: null, body_md: 'x', facts: {} })
        .success,
    ).toBe(true);
    expect(
      chatContextPublishedSchema.safeParse({ version: 0, title: null, body_md: 'x', facts: {} })
        .success,
    ).toBe(false);
  });

  it('chatVisitorMessageEventSchema has the keys the trigger enqueues, never the content', () => {
    const body =
      /function private\.chat_message_after_insert\(\)[\s\S]*?\$\$([\s\S]*?)\$\$/.exec(sql)?.[1] ??
      '';
    const keys = [...body.matchAll(/'(\w+)', (?:new|v_thread)\./g)].map((m) => m[1]!).sort();
    expect(keys).toEqual(Object.keys(chatVisitorMessageEventSchema.shape).sort());
    expect(keys).not.toContain('content');
  });
});
