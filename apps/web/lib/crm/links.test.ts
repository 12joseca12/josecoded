import { describe, expect, it } from 'vitest';

import { safeUrl, whatsappHref } from './links';

describe('safeUrl', () => {
  it('accepts http and https and adds https to a bare domain', () => {
    expect(safeUrl('https://www.linkedin.com/in/ejemplo')).toBe('https://www.linkedin.com/in/ejemplo');
    expect(safeUrl('fisiocampos.test')).toBe('https://fisiocampos.test/');
  });
  it.each([['javascript:alert(1)'], ['data:text/html,x'], ['file:///etc/passwd'], ['  '], [null], [undefined]])('refuses %s', (value) => {
    expect(safeUrl(value as string | null)).toBeNull();
  });
});

describe('whatsappHref', () => {
  it('uses +34 for a Spanish number without prefix', () => {
    expect(whatsappHref('600 000 112')).toBe('https://wa.me/34600000112');
  });
  it('keeps an international number', () => {
    expect(whatsappHref('+34 600 000 112')).toBe('https://wa.me/34600000112');
    expect(whatsappHref('0044 20 7946 0958')).toBe('https://wa.me/442079460958');
  });
  it('is null without enough digits', () => {
    expect(whatsappHref('123')).toBeNull();
    expect(whatsappHref(null)).toBeNull();
  });
});
