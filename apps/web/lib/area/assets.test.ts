import { describe, expect, it } from 'vitest';

import { assetStoragePath, cleanFileName, formatBytes } from './assets';

describe('assetStoragePath', () => {
  it('is clients/<client>/<asset>, matching the database check', () => {
    expect(assetStoragePath('c1', 'a1')).toBe('clients/c1/a1');
  });
});

describe('cleanFileName', () => {
  it.each([
    ['../x.pdf', 'x.pdf'],
    ['..\\..\\Windows\\x.pdf', 'x.pdf'],
    ['/etc/passwd', 'passwd'],
    ['my   report \t final.pdf', 'my report final.pdf'],
    ['bad\u0000name\u202e.pdf', 'badname.pdf'],
    ['..', ''],
    ['.', ''],
    ['', ''],
  ])('%j -> %j', (input, output) => {
    expect(cleanFileName(input)).toBe(output);
  });

  it('caps the length', () => {
    expect(cleanFileName('a'.repeat(400))).toHaveLength(255);
  });
});

describe('formatBytes', () => {
  it('uses short units in the language of the visitor', () => {
    expect(formatBytes(512, 'en')).toBe('512 byte');
    expect(formatBytes(10 * 1024, 'en')).toBe('10 kB');
    expect(formatBytes(Math.round(2.4 * 1024 * 1024), 'es')).toMatch(/^2,4\s?MB$/);
  });
});
