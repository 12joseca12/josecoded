import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  calls: [] as [string, ...unknown[]][],
  rows: [] as unknown[],
  selected: '',
}));

class Builder {
  private note(name: string, args: unknown[]) {
    state.calls.push([name, ...args]);
    return this;
  }
  select = (columns: string, ...rest: unknown[]) => {
    state.selected = columns;
    return this.note('select', [columns, ...rest]);
  };
  is = (...a: unknown[]) => this.note('is', a);
  eq = (...a: unknown[]) => this.note('eq', a);
  lte = (...a: unknown[]) => this.note('lte', a);
  or = (...a: unknown[]) => this.note('or', a);
  ilike = (...a: unknown[]) => this.note('ilike', a);
  order = (...a: unknown[]) => this.note('order', a);
  limit = (...a: unknown[]) => this.note('limit', a);
  range = async (...a: unknown[]) => {
    this.note('range', a);
    return { data: state.rows, error: null, count: 60 };
  };
  then = (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null });
}

vi.mock('@/lib/auth/guards', () => ({
  getOptionalSession: async () => ({ user: { id: 'me' }, supabase: { from: () => new Builder() } }),
}));

import { applyContactFilters, getContactPage, parseContactQuery, sanitizeSearch } from './contacts';

const calls = (name: string) => state.calls.filter(([n]) => n === name).map(([, ...args]) => args);

beforeEach(() => {
  state.calls.length = 0;
  state.rows = [];
});

describe('sanitizeSearch', () => {
  it('takes out what would change the meaning of a PostgREST filter', () => {
    expect(sanitizeSearch('a,b)(c*d%e_f"g:h\\')).toBe('a b c d e f g h');
    expect(sanitizeSearch('  Laura   Campos ')).toBe('Laura Campos');
  });
});

describe('applyContactFilters', () => {
  const run = (query: Parameters<typeof applyContactFilters>[1], role: 'admin' | 'closer', organizationIds: string[] | null = null) =>
    applyContactFilters(new Builder() as never, query, { role, userId: 'me', organizationIds, now: new Date('2026-11-02T10:00:00.000Z') });

  it('leaves archived contacts out', () => {
    run({}, 'closer');
    expect(calls('is')).toEqual([['archived_at', null]]);
  });

  it('?due=1 keeps the contacts whose next action is due by now, like the counters of the database', () => {
    run({ due: true }, 'closer');
    expect(calls('lte')).toEqual([['next_action_at', '2026-11-02T10:00:00.000Z']]);
  });

  it('filters by kind and status', () => {
    run({ kind: 'agency', status: 'replied' }, 'admin');
    expect(calls('eq')).toEqual([
      ['kind', 'agency'],
      ['status', 'replied'],
    ]);
  });

  it('searches name, email and the people of a matching company', () => {
    run({ q: 'norte, digital' }, 'closer', ['org-1', 'org-2']);
    expect(calls('or')[0]).toEqual(['display_name.ilike.*norte digital*,email.ilike.*norte digital*,organization_id.in.(org-1,org-2)']);
  });

  it('the admin filters by owner: mine, unassigned or a person', () => {
    run({ owner: 'mine' }, 'admin');
    run({ owner: 'unassigned' }, 'admin');
    run({ owner: '22222222-2222-4222-8222-222222222222' }, 'admin');
    expect(calls('or')).toEqual([['owner_id.is.null,owner_id.eq.me']]);
    expect(calls('is')).toContainEqual(['owner_id', null]);
    expect(calls('eq')).toContainEqual(['owner_id', '22222222-2222-4222-8222-222222222222']);
  });

  it('ignores the owner filter for a closer: another closer’s id in her URL never reaches the query', () => {
    run({ owner: '22222222-2222-4222-8222-222222222222' }, 'closer');
    run({ owner: 'unassigned' }, 'closer');
    expect(calls('eq')).toEqual([]);
    expect(calls('is')).toEqual([['archived_at', null], ['archived_at', null]]);
  });
});

describe('parseContactQuery', () => {
  it('takes the first value of a repeated parameter', () => {
    expect(parseContactQuery({ kind: ['lead', 'agency'], due: '1' })).toEqual({ kind: 'lead', due: true });
  });
});

describe('getContactPage', () => {
  it('orders by next action with the overdue first, then by name, and pages by 25', async () => {
    const page = await getContactPage('closer', { page: '2' });
    expect(calls('order')).toEqual([
      ['next_action_at', { ascending: true, nullsFirst: false }],
      ['display_name', { ascending: true }],
    ]);
    expect(calls('range')).toEqual([[25, 49]]);
    expect(page).toMatchObject({ page: 2, pageSize: 25, total: 60 });
  });

  it('never asks a closer for the owner column nor for the list of staff', async () => {
    state.rows = [{ id: 'c1', display_name: 'Laura', kind: 'client', status: 'active_client', owner_id: 'other-closer', crm_organizations: { name: 'Fisio' }, next_action: null, next_action_at: null, last_interaction_at: null }];
    const page = await getContactPage('closer', {});
    expect(String(calls('select')[0]?.[0])).not.toContain('owner_id');
    expect(page.owners).toBeNull();
    // even if a row came with an owner, it does not travel to the page
    expect(page.rows[0]?.owner_id).toBeNull();
    expect(page.rows[0]?.organization).toBe('Fisio');
  });

  it('gives the admin the owner of each row and the staff list', async () => {
    state.rows = [{ id: 'c1', display_name: 'Laura', kind: 'client', status: 'new', owner_id: 'carla', crm_organizations: null, next_action: null, next_action_at: null, last_interaction_at: null }];
    const page = await getContactPage('admin', {});
    expect(String(calls('select')[0]?.[0])).toContain('owner_id');
    expect(page.rows[0]?.owner_id).toBe('carla');
    expect(page.owners).toEqual([]);
  });
});
