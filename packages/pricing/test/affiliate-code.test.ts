import { describe, expect, it } from 'vitest';

import { AFFILIATE_CODE_DB_RE } from '@josecoded/types';

import { AFFILIATE_CODE_RE, isValidCode, normalizeCode, suggestPrefix } from '../src';

describe('affiliate code contract', () => {
  it('keeps the regex literal shared with the SQL trigger', () => {
    expect(AFFILIATE_CODE_RE.source).toBe('^[A-Z0-9]{3,12}-[A-Z0-9]{6}$');
  });

  it('is the same contract as the database check (AFFILIATE_CODE_DB_RE, tested against the migration)', () => {
    expect(AFFILIATE_CODE_RE.source).toBe(AFFILIATE_CODE_DB_RE.source);
  });

  it('accepts prefix 3–12 plus a 6-character suffix', () => {
    expect(isValidCode('ANA-TEST01')).toBe(true);
    expect(isValidCode('ABC-ABCDEF')).toBe(true);
    expect(isValidCode('ABCDEFGHIJKL-ABCDEF')).toBe(true);
  });

  it('normalizes case and surrounding spaces before validating', () => {
    expect(normalizeCode('  ana-test01 ')).toBe('ANA-TEST01');
    expect(isValidCode(' ana-test01 ')).toBe(true);
  });

  it.each([
    'AB-ABCDEF',
    'ABCDEFGHIJKLM-ABCDEF',
    'ANA-TEST0',
    'ANA-TEST012',
    'ANA_TEST01',
    'ANA-TEST0!',
    '',
    'ANA',
  ])('rejects %j', (code) => {
    expect(isValidCode(code)).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidCode(undefined)).toBe(false);
    expect(isValidCode(12)).toBe(false);
  });

  describe('suggestPrefix', () => {
    it('uses the normalized first name', () => {
      expect(suggestPrefix('Ana María López')).toBe('ANA');
      expect(suggestPrefix('José Carlos')).toBe('JOSE');
      expect(suggestPrefix("  d'Artagnan ")).toBe('DARTAGNAN');
    });
    it('caps at 12 characters', () => {
      expect(suggestPrefix('Wolfeschlegelsteinhausen')).toBe('WOLFESCHLEGE');
    });
    it('falls back when the name is too short or empty', () => {
      expect(suggestPrefix('Al')).toBe('REF');
      expect(suggestPrefix('')).toBe('REF');
      expect(suggestPrefix('李')).toBe('REF');
    });
    it('always yields a prefix that fits the contract', () => {
      for (const name of ['Ana', 'Al', '', 'José', 'Wolfeschlegelsteinhausen']) {
        expect(isValidCode(`${suggestPrefix(name)}-ABCDEF`)).toBe(true);
      }
    });
  });
});
