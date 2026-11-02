import { describe, expect, it } from 'vitest';

import { contactsHref, hasFilters } from './contacts-url';

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
