import { describe, expect, it } from 'vitest';

import { checkCatalogs, checkMessages, formatReport, hasMissing, loadCatalogs } from './i18n-check';

describe('checkMessages', () => {
  it('lists pending facts and keys missing in either locale', () => {
    const r = checkMessages(
      { a: 'x', facts: { city: '{{DATO: ciudad}}' }, onlyEs: 'y' },
      { a: 'x', facts: { city: '{{DATO: city}}' }, onlyEn: 'z' },
    );
    expect(r.pendingDato).toEqual(['facts.city']);
    expect(r.missingInEn).toEqual(['onlyEs']);
    expect(r.missingInEs).toEqual(['onlyEn']);
  });

  it('flattens nested objects and arrays into dotted keys', () => {
    const r = checkMessages({ a: { b: ['x', 'y'] } }, { a: { b: ['x'] } });
    expect(r.missingInEn).toEqual(['a.b.1']);
  });

  it('reports a marker that is only present in one locale', () => {
    const r = checkMessages({ k: '{{DATO: x}}' }, { k: 'done' });
    expect(r.pendingDato).toEqual(['k']);
    expect(r.missingInEn).toEqual([]);
  });
});

describe('checkCatalogs (file by file)', () => {
  it('names the screen file that is missing in a locale', () => {
    const report = checkCatalogs({ common: { a: '1' }, home: { b: '2' } }, { common: { a: '1' } });
    expect(report.missingFilesInEn).toEqual(['home']);
    expect(report.missingFilesInEs).toEqual([]);
    expect(hasMissing(report)).toBe(true);
  });

  it('compares the screens present in both and prefixes keys with the file', () => {
    const report = checkCatalogs(
      { common: { a: '1', b: '{{DATO: b}}' } },
      { common: { a: '1', b: '{{DATO: b}}', extra: 'z' } },
    );
    expect(report.files['common']?.missingInEs).toEqual(['extra']);
    expect(report.files['common']?.pendingDato).toEqual(['b']);
    expect(formatReport(report)).toContain('common');
    expect(hasMissing(report)).toBe(true);
  });

  it('pending markers alone do not fail the check', () => {
    const report = checkCatalogs({ c: { a: '{{DATO: a}}' } }, { c: { a: '{{DATO: a}}' } });
    expect(hasMissing(report)).toBe(false);
  });
});

describe('the real catalogs', () => {
  it('have the same screens and keys in es and en', () => {
    const report = checkCatalogs(loadCatalogs('es'), loadCatalogs('en'));
    expect(hasMissing(report)).toBe(false);
  });
});
