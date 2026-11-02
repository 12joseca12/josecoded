import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  AFFILIATE_CODE_DB_RE,
  CONTACT_KINDS,
  CONTACT_STATUSES,
  createLeadInputSchema,
  importOrganizationsRowSchema,
  interactionPayloadSchema,
  TERMINAL_CONTACT_STATUSES,
  type ContactStatus,
} from '../src';

const migrations = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'supabase', 'migrations');
const sql = readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(migrations, f), 'utf8').replace(/--.*$/gm, ''))
  .join('\n');

function sqlArray(fn: string, label: string): string[] {
  const body = new RegExp(`function private\\.${fn}\\([\\s\\S]*?\\$\\$([\\s\\S]*?)\\$\\$`, 'i').exec(sql)?.[1] ?? '';
  const line = label ? new RegExp(`when '${label}'\\s+then p_status in \\(([^)]*)\\)`).exec(body) : /in \(([^)]*)\)/.exec(body);
  if (!line) throw new Error(`${fn}/${label} not found`);
  return [...line[1]!.matchAll(/'([^']+)'/g)].map((v) => v[1]!);
}

describe('crm value lists mirror the SQL checks (enums: test/enums.test-d.ts)', () => {
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

describe('affiliate code contract', () => {
  it('AFFILIATE_CODE_DB_RE is the literal check of affiliates.code in the migrations', () => {
    expect(sql).toContain(`check (code ~ '${AFFILIATE_CODE_DB_RE.source}')`);
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
    expect(createLeadInputSchema.safeParse({ ...base, affiliate_code: 'ANA-TEST' }).success).toBe(false);
    // packs.code check of the database (the admin can create packs beyond P1-P5, task 1.8e)
    expect(createLeadInputSchema.safeParse({ ...base, pack_code: 'LANDING' }).success).toBe(true);
    expect(createLeadInputSchema.safeParse({ ...base, pack_code: 'p1' }).success).toBe(false);
    expect(createLeadInputSchema.safeParse({ ...base, pack_code: 'P' }).success).toBe(false);
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
