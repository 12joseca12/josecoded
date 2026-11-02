import { describe, expect, it } from 'vitest';

import {
  accessTone,
  clientsHref,
  clientsHrefFromEntries,
  filterClients,
  hasClientFilters,
  parseClientQuery,
  phaseFilled,
} from './clients';

import type { ClientRow } from './clients';

const row = (patch: Partial<ClientRow>): ClientRow => ({
  id: '1',
  contactId: 'c1',
  name: 'Ana Ruiz',
  organization: 'Panadería La Espiga',
  email: 'ana@espiga.test',
  packCode: 'P2',
  packOption: 'Pedidos / reservas',
  phase: 'build',
  access: { state: 'active' },
  ownerId: null,
  storiesPending: 0,
  ...patch,
});

describe('parseClientQuery', () => {
  it('keeps a search, a known access filter and the stories toggle', () => {
    expect(parseClientQuery({ q: ' espiga ', access: 'invited', stories: '1' })).toEqual({ q: 'espiga', access: 'invited', stories: true });
  });

  it('drops what is not a known value (a stray ?access=admin means nothing)', () => {
    expect(parseClientQuery({ access: 'admin', stories: 'yes', q: ' ' })).toEqual({ q: null, access: null, stories: false });
    expect(parseClientQuery({})).toEqual({ q: null, access: null, stories: false });
  });

  it('takes the first value of a repeated parameter and bounds the search to 80 characters', () => {
    expect(parseClientQuery({ access: ['none', 'active'] }).access).toBe('none');
    expect(parseClientQuery({ q: 'x'.repeat(200) }).q).toHaveLength(80);
  });
});

describe('clientsHref', () => {
  it('writes only the filters that are on, and nothing for the empty query', () => {
    expect(clientsHref({ q: null, access: null, stories: false })).toBe('/crm/clientes');
    expect(clientsHref({ q: 'ana', access: 'none', stories: true })).toBe('/crm/clientes?q=ana&access=none&stories=1');
  });

  it('applies a patch on top, null removes a filter', () => {
    const query = { q: 'ana', access: 'none' as const, stories: false };
    expect(clientsHref(query, { access: null })).toBe('/crm/clientes?q=ana');
    expect(clientsHref(query, { stories: true })).toBe('/crm/clientes?q=ana&access=none&stories=1');
  });
});

describe('clientsHrefFromEntries', () => {
  it('rebuilds the URL a plain GET of the filter form would reach, dropping empty fields', () => {
    expect(clientsHrefFromEntries([['q', ' ana '], ['access', ''], ['stories', '1']])).toBe('/crm/clientes?q=ana&stories=1');
    expect(clientsHrefFromEntries([['q', ''], ['stories', 'on']])).toBe('/crm/clientes');
  });
});

describe('hasClientFilters', () => {
  it('is true when any filter is on', () => {
    expect(hasClientFilters({ q: null, access: null, stories: false })).toBe(false);
    expect(hasClientFilters({ q: null, access: null, stories: true })).toBe(true);
    expect(hasClientFilters({ q: 'a', access: null, stories: false })).toBe(true);
  });
});

describe('filterClients', () => {
  const rows = [
    row({ id: '1', name: 'Ana Ruiz', organization: 'Panadería La Espiga', access: { state: 'active' }, storiesPending: 1 }),
    row({ id: '2', name: 'Laura Campos', organization: 'Fisio Campos', access: { state: 'none' }, storiesPending: 0 }),
    row({ id: '3', name: 'Ramón Peña', organization: 'Cooperativa Olivar Alto', access: { state: 'invited', at: '2026-10-28T10:00:00Z' } }),
  ];

  it('searches the person and the business, without caring about case or accents', () => {
    const ids = (q: string) => filterClients(rows, { q, access: null, stories: false }).map((r) => r.id);
    expect(ids('ESPIGA')).toEqual(['1']);
    expect(ids('pena')).toEqual(['3']);
    expect(ids('campos')).toEqual(['2']);
    expect(ids('zzz')).toEqual([]);
  });

  it('filters by the state of the portal access', () => {
    const ids = (access: 'none' | 'invited' | 'active') => filterClients(rows, { q: null, access, stories: false }).map((r) => r.id);
    expect(ids('none')).toEqual(['2']);
    expect(ids('invited')).toEqual(['3']);
    expect(ids('active')).toEqual(['1']);
  });

  it('keeps the clients with stories to decide when the toggle is on, and combines filters', () => {
    expect(filterClients(rows, { q: null, access: null, stories: true }).map((r) => r.id)).toEqual(['1']);
    expect(filterClients(rows, { q: null, access: 'none', stories: true })).toEqual([]);
  });
});

describe('accessTone', () => {
  it('is live with access, active when invited and muted when not invited', () => {
    expect(accessTone({ state: 'active' })).toBe('live');
    expect(accessTone({ state: 'invited', at: 'x' })).toBe('active');
    expect(accessTone({ state: 'none' })).toBe('muted');
  });
});

describe('phases', () => {
  it('counts the steps reached, for the mini bar («3/5»)', () => {
    expect(phaseFilled('kickoff')).toBe(1);
    expect(phaseFilled('build')).toBe(3);
    expect(phaseFilled('delivered')).toBe(5);
    expect(phaseFilled('maintenance')).toBe(5);
  });
});
