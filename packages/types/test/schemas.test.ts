import { describe, expect, it } from 'vitest';

import { aiProposalSchema } from '../src';
import fixture from './fixtures/ai-proposal.json';

describe('aiProposalSchema', () => {
  it('accepts the shared fixture', () => {
    expect(aiProposalSchema.safeParse(fixture).success).toBe(true);
  });

  it('accepts an app pack only with isApp true', () => {
    expect(aiProposalSchema.safeParse({ ...fixture, pack: 'APP_MVP', isApp: true }).success).toBe(
      true,
    );
    expect(aiProposalSchema.safeParse({ ...fixture, pack: 'APP_MVP', isApp: false }).success).toBe(
      false,
    );
    expect(aiProposalSchema.safeParse({ ...fixture, pack: 'P1', isApp: true }).success).toBe(false);
  });

  it('rejects unknown packs, extras and sources', () => {
    expect(aiProposalSchema.safeParse({ ...fixture, pack: 'P9' }).success).toBe(false);
    expect(aiProposalSchema.safeParse({ ...fixture, extras: ['nope'] }).success).toBe(false);
    expect(aiProposalSchema.safeParse({ ...fixture, source: 'human' }).success).toBe(false);
  });
});

// Task 1.8e: inputs of the closer, content, story, catalogue and quote RPCs.
describe('1.8e inputs', () => {
  it('csvContactRowSchema needs a name and one way to identify the person; defaults kind and tags', async () => {
    const { csvContactRowSchema } = await import('../src');
    expect(csvContactRowSchema.parse({ display_name: 'Ana', email: 'ana@example.test' })).toMatchObject({ kind: 'lead', tags: [] });
    expect(csvContactRowSchema.safeParse({ display_name: 'Ana' }).success).toBe(false);
    expect(csvContactRowSchema.safeParse({ display_name: '', email: 'ana@example.test' }).success).toBe(false);
    expect(csvContactRowSchema.safeParse({ display_name: 'Ana', phone: '+34600000000', kind: 'client' }).success).toBe(false);
  });

  it('csvImportInputSchema caps at 500 rows and wants a sha-256 checksum', async () => {
    const { csvImportInputSchema } = await import('../src');
    const row = { display_name: 'Ana', email: 'ana@example.test' };
    const checksum = 'a'.repeat(64);
    expect(csvImportInputSchema.safeParse({ rows: Array(500).fill(row), file_name: 'a.csv', checksum }).success).toBe(true);
    expect(csvImportInputSchema.safeParse({ rows: Array(501).fill(row), file_name: 'a.csv', checksum }).success).toBe(false);
    expect(csvImportInputSchema.safeParse({ rows: [row], file_name: 'a.csv', checksum: 'xyz' }).success).toBe(false);
  });

  it('importResultSchema carries the number of conflicts and nothing about the other side', async () => {
    const { importResultSchema } = await import('../src');
    const ok = { import_id: crypto.randomUUID(), created: 2, updated: 1, skipped: 0, conflicts: 1, errors: [{ row: 5, reason: 'invalid' }] };
    expect(importResultSchema.parse(ok)).toEqual(ok);
    expect(importResultSchema.parse({ ...ok, replayed: true }).replayed).toBe(true);
  });

  it('staffInviteInputSchema requires the commission rate between 0 and 100 (Q21)', async () => {
    const { staffInviteInputSchema } = await import('../src');
    const base = { email: 'carla@example.test', role: 'closer' };
    expect(staffInviteInputSchema.safeParse({ ...base, commission_rate: 10 }).success).toBe(true);
    expect(staffInviteInputSchema.safeParse(base).success).toBe(false);
    expect(staffInviteInputSchema.safeParse({ ...base, commission_rate: 101 }).success).toBe(false);
  });

  it('contentEntrySchema validates by kind: editable namespaces only, no {{DATO}} marker, settings without hiddenPacks', async () => {
    const { contentEntrySchema } = await import('../src');
    const ok = { kind: 'message_override', key: 'home.hero.title', locale: 'es', draft: { value: 'Hola' } };
    expect(contentEntrySchema.safeParse(ok).success).toBe(true);
    expect(contentEntrySchema.safeParse({ ...ok, key: 'auth.login.title' }).success).toBe(false);
    expect(contentEntrySchema.safeParse({ ...ok, key: 'home' }).success).toBe(false);
    expect(contentEntrySchema.safeParse({ ...ok, draft: { value: 'Hola {{DATO: x}}' } }).success).toBe(false);
    const settings = {
      kind: 'settings',
      key: 'settings',
      draft: { sections: { lab: true, blog: true, partners: true, projects: true, chat: true }, prices: { showPrices: true }, home: { scenes: [] } },
    };
    expect(contentEntrySchema.safeParse(settings).success).toBe(true);
    expect(contentEntrySchema.safeParse({ ...settings, locale: 'es' }).success).toBe(false);
  });

  it('pack, option, extra and settings inputs: whole euros, codes as in the database, absent keys keep the value', async () => {
    const { extraInputSchema, packInputSchema, packOptionInputSchema, pricingSettingsInputSchema } = await import('../src');
    expect(packInputSchema.safeParse({ code: 'LANDING', price: 500 }).success).toBe(true);
    expect(packInputSchema.safeParse({ code: 'landing' }).success).toBe(false);
    expect(packInputSchema.safeParse({ code: 'P2', price: 12.5 }).success).toBe(false);
    expect(packOptionInputSchema.safeParse({ code: 'plus', price: 6000 }).success).toBe(true);
    expect(extraInputSchema.safeParse({ code: 'seo_full', billing: 'yearly', visible: false }).success).toBe(true);
    expect(extraInputSchema.safeParse({ code: 'SEO' }).success).toBe(false);
    expect(pricingSettingsInputSchema.safeParse({ hourly: 40, feature: 150 }).success).toBe(true);
    expect(pricingSettingsInputSchema.safeParse({ hourly: 0, feature: 150 }).success).toBe(false);
  });

  it('userStoryInputSchema caps the criteria at 12; quote inputs take extras only', async () => {
    const { acceptUserStoryInputSchema, quoteItemInputSchema, userStoryInputSchema } = await import('../src');
    const story = { title: 'Reservas', as_a: 'dueña', i_want: 'reservar', so_that: 'no perder citas' };
    expect(userStoryInputSchema.parse(story).acceptance_criteria).toEqual([]);
    expect(userStoryInputSchema.safeParse({ ...story, acceptance_criteria: Array(13).fill('x') }).success).toBe(false);
    expect(acceptUserStoryInputSchema.parse({ story_id: crypto.randomUUID(), estimate_hours: 6, estimate_amount: null })).toMatchObject({ create_task: true, note: null });
    const quote = crypto.randomUUID();
    expect(quoteItemInputSchema.parse({ quote_id: quote, extra_code: 'seo_full' }).quantity).toBe(1);
    expect(quoteItemInputSchema.safeParse({ quote_id: quote, extra_code: 'seo_full', quantity: 0 }).success).toBe(false);
  });
});
