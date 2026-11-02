import { describe, expect, it } from 'vitest';

import { contactsHref, contactsHrefFromEntries, hasFilters } from './contacts-url';

describe('contactsHref', () => {
  it('is the bare inbox without filters', () => {
    expect(contactsHref({})).toBe('/crm/contactos');
  });

  it('keeps the other filters when one changes and goes back to the first page', () => {
    expect(contactsHref({ kind: 'lead', due: true, q: 'laura', page: 3 }, { kind: 'agency' })).toBe(
      '/crm/contactos?kind=agency&due=1&q=laura',
    );
  });

  it('removes a filter with null', () => {
    expect(contactsHref({ kind: 'lead', due: true }, { due: null })).toBe('/crm/contactos?kind=lead');
  });

  it('moves the page only when asked', () => {
    expect(contactsHref({ due: true, page: 2 }, { page: 3 })).toBe('/crm/contactos?due=1&page=3');
    expect(contactsHref({ due: true, page: 2 }, { page: 1 })).toBe('/crm/contactos?due=1');
  });

  it('encodes what the person typed', () => {
    expect(contactsHref({}, { q: 'a&b c' })).toBe('/crm/contactos?q=a%26b+c');
  });
});

describe('hasFilters', () => {
  it('ignores the page', () => {
    expect(hasFilters({ page: 2 })).toBe(false);
    expect(hasFilters({ owner: 'mine' })).toBe(true);
  });
});

describe('contactsHrefFromEntries', () => {
  it('is the bare inbox for an empty form', () => {
    expect(
      contactsHrefFromEntries([
        ['q', ''],
        ['status', ''],
        ['owner', ''],
      ]),
    ).toBe('/crm/contactos');
  });

  it('keeps what is filled and drops the empty, the page and files', () => {
    const entries: [string, unknown][] = [
      ['kind', 'lead'],
      ['q', '  laura '],
      ['status', ''],
      ['due', '1'],
      ['page', '4'],
      ['file', new Blob()],
    ];
    expect(contactsHrefFromEntries(entries)).toBe('/crm/contactos?kind=lead&q=laura&due=1');
  });

  it('agrees with contactsHref for the same filters', () => {
    expect(
      contactsHrefFromEntries([
        ['kind', 'agency'],
        ['due', '1'],
        ['owner', 'unassigned'],
      ]),
    ).toBe(contactsHref({ kind: 'agency', owner: 'unassigned', due: true }));
  });
});
