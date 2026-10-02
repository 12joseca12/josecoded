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
