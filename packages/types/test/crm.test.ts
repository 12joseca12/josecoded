import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  AFFILIATE_LEVELS,
  ASSET_SOURCES,
  CHAT_CASES,
  CLIENT_EXTRA_STATUSES,
  COMMENT_STATUSES,
  CONTACT_KINDS,
  CONTACT_SOURCES,
  CONTACT_STATUSES,
  CONTACT_VIAS,
  createLeadInputSchema,
  DRAFT_AUTHORS,
  DRAFT_STATUSES,
  importOrganizationsRowSchema,
  INTERACTION_ACTORS,
  INTERACTION_CHANNELS,
  INTERACTION_DIRECTIONS,
  INTERACTION_KINDS,
  interactionPayloadSchema,
  LEAD_SOURCES,
  LEAD_STATUSES,
  ORG_KINDS,
  PROJECT_PHASES,
  REWARD_STATUSES,
  REWARD_TYPES,
  TASK_STATUSES,
  TERMINAL_CONTACT_STATUSES,
  UPGRADE_STATUSES,
  type ContactStatus,
} from '../src';

const migrations = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'supabase', 'migrations');
const sql = readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(migrations, f), 'utf8').replace(/--.*$/gm, ''))
  .join('\n');

function sqlEnum(name: string): string[] {
  const m = new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`, 'i').exec(sql);
  if (!m) throw new Error(`enum ${name} not found in supabase/migrations`);
  return [...m[1]!.matchAll(/'([^']+)'/g)].map((v) => v[1]!);
}

function sqlArray(fn: string, label: string): string[] {
  const body = new RegExp(`function private\\.${fn}\\([\\s\\S]*?\\$\\$([\\s\\S]*?)\\$\\$`, 'i').exec(sql)?.[1] ?? '';
  const line = label ? new RegExp(`when '${label}'\\s+then p_status in \\(([^)]*)\\)`).exec(body) : /in \(([^)]*)\)/.exec(body);
  if (!line) throw new Error(`${fn}/${label} not found`);
  return [...line[1]!.matchAll(/'([^']+)'/g)].map((v) => v[1]!);
}

describe('crm value lists mirror the SQL enums (until database.ts is generated)', () => {
  it.each([
    ['org_kind', ORG_KINDS],
    ['contact_kind', CONTACT_KINDS],
    ['contact_source', CONTACT_SOURCES],
    ['chat_case', CHAT_CASES],
    ['interaction_kind', INTERACTION_KINDS],
    ['interaction_channel', INTERACTION_CHANNELS],
    ['interaction_direction', INTERACTION_DIRECTIONS],
    ['interaction_actor', INTERACTION_ACTORS],
    ['draft_author', DRAFT_AUTHORS],
    ['draft_status', DRAFT_STATUSES],
    ['lead_status', LEAD_STATUSES],
    ['lead_source', LEAD_SOURCES],
    ['contact_via', CONTACT_VIAS],
    ['project_phase', PROJECT_PHASES],
    ['task_status', TASK_STATUSES],
    ['asset_source', ASSET_SOURCES],
    ['client_extra_status', CLIENT_EXTRA_STATUSES],
    ['upgrade_status', UPGRADE_STATUSES],
    ['affiliate_level', AFFILIATE_LEVELS],
    ['reward_type', REWARD_TYPES],
    ['reward_status', REWARD_STATUSES],
    ['comment_status', COMMENT_STATUSES],
  ] as const)('%s', (name, values) => {
    expect(sqlEnum(name)).toEqual([...values]);
  });

  it.each(CONTACT_KINDS)('statuses of %s match private.contact_status_ok()', (kind) => {
    expect(sqlArray('contact_status_ok', kind)).toEqual([...CONTACT_STATUSES[kind]]);
  });

  it('terminal statuses match private.contact_status_terminal()', () => {
    expect(sqlArray('contact_status_terminal', '')).toEqual([...TERMINAL_CONTACT_STATUSES]);
  });

  it('ContactStatus narrows by kind', () => {
    expectTypeOf<'pending'>().toMatchTypeOf<ContactStatus<'agency'>>();
    expectTypeOf<'pending'>().not.toMatchTypeOf<ContactStatus<'lead'>>();
  });
});

describe('createLeadInputSchema', () => {
  const base = { email: 'nuevo@example.test', source: 'web_form', idempotency_key: 'k1-abcdef' };

  it('applies the defaults of create_lead()', () => {
    expect(createLeadInputSchema.parse(base)).toMatchObject({ via: 'client', locale: 'es', meta: {} });
  });

  it('needs an email or a phone, a known source and a key', () => {
    expect(createLeadInputSchema.safeParse({ ...base, email: undefined }).success).toBe(false);
    expect(createLeadInputSchema.safeParse({ ...base, email: undefined, phone: '+34600000000' }).success).toBe(true);
    expect(createLeadInputSchema.safeParse({ ...base, source: 'whatsapp' }).success).toBe(false);
    expect(createLeadInputSchema.safeParse({ ...base, idempotency_key: undefined }).success).toBe(false);
  });

  it('checks the affiliate code and pack code formats', () => {
    expect(createLeadInputSchema.safeParse({ ...base, affiliate_code: 'ANA-TEST01' }).success).toBe(true);
    expect(createLeadInputSchema.safeParse({ ...base, affiliate_code: 'ana-test01' }).success).toBe(false);
    expect(createLeadInputSchema.safeParse({ ...base, pack_code: 'P0' }).success).toBe(false);
  });
});

describe('interactionPayloadSchema', () => {
  it('types the payloads written by the database', () => {
    expect(interactionPayloadSchema.safeParse({ kind: 'status_change', payload: { from: 'new', to: 'contacted' } }).success).toBe(true);
    expect(interactionPayloadSchema.safeParse({ kind: 'status_change', payload: {} }).success).toBe(false);
    expect(interactionPayloadSchema.safeParse({ kind: 'lead_created', payload: { source: 'web_form', via: 'client' } }).success).toBe(true);
    expect(interactionPayloadSchema.safeParse({ kind: 'note', payload: { any: 1 } }).success).toBe(true);
    expect(interactionPayloadSchema.safeParse({ kind: 'nope', payload: {} }).success).toBe(false);
  });
});

describe('importOrganizationsRowSchema', () => {
  it('accepts a sheet row and rejects an out-of-range fit', () => {
    expect(importOrganizationsRowSchema.safeParse({ name: 'Agencia Test', kind: 'agency', fit: 4 }).success).toBe(true);
    expect(importOrganizationsRowSchema.safeParse({ name: 'Agencia Test', kind: 'agency', fit: 6 }).success).toBe(false);
    expect(importOrganizationsRowSchema.safeParse({ name: '', kind: 'agency' }).success).toBe(false);
  });
});
