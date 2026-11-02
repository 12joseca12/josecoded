// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  role: 'closer' as 'admin' | 'closer',
  rpc: vi.fn(),
  recentImports: 0,
  firstImportAt: null as string | null,
  adminGuard: vi.fn(),
  revalidate: vi.fn(),
}));

class Chain {
  constructor(private table: string) {}
  select = () => this;
  eq = () => this;
  gte = () => this;
  maybeSingle = async () => ({
    data: db.firstImportAt ? { created_at: db.firstImportAt } : null,
    error: null,
  });
  then = (resolve: (value: unknown) => unknown) =>
    resolve({ count: this.table === 'crm_imports' ? db.recentImports : 0, error: null });
}
const supabase = {
  from: (table: string) => new Chain(table),
  rpc: (...a: unknown[]) => db.rpc(...a),
};

vi.mock('next/cache', () => ({ revalidatePath: db.revalidate }));
vi.mock('next-intl/server', () => ({
  getTranslations:
    async ({ namespace }: { namespace: string }) =>
    (key: string) =>
      `${namespace}.${key}`,
}));
vi.mock('@/lib/auth/staff', () => ({
  requireStaff: async () => ({ role: db.role, user: { id: 'me' }, supabase }),
}));
vi.mock('@/lib/auth/guards', () => ({
  requireAdmin: async () => {
    db.adminGuard();
    if (db.role !== 'admin') throw new Error('NOT_FOUND');
    return { user: { id: 'me' }, supabase };
  },
}));

import { importRpcErrorKey } from '@/lib/crm/import-errors';

import { importContacts, previewImport, resolveConflict } from './actions';

const CSV =
  'Nombre;Email;Teléfono\nAna;ana@x.es;\nSin contacto;;\n"=HYPERLINK(""http://x.test"")";h@x.es;\n';
const mapping = { display_name: 0, email: 1, phone: 2 };
const importId = '11111111-1111-4111-8111-111111111111';
const ok = {
  import_id: importId,
  created: 2,
  updated: 0,
  skipped: 1,
  conflicts: 0,
  errors: [{ row: 2, reason: 'invalid' }],
};

beforeEach(() => {
  db.role = 'closer';
  db.recentImports = 0;
  db.firstImportAt = null;
  db.rpc.mockReset();
  db.rpc.mockResolvedValue({ data: ok, error: null });
  db.revalidate.mockReset();
  db.adminGuard.mockReset();
});

describe('previewImport', () => {
  it('guesses the mapping, gives the verdict per row and writes nothing', async () => {
    const out = await previewImport({ locale: 'es', text: CSV, mapping: null });
    expect(out.status).toBe('ok');
    if (out.status !== 'ok') return;
    expect(out.analysis.mapping).toEqual(mapping);
    expect(out.analysis).toMatchObject({
      total: 3,
      valid: 2,
      invalid: [{ line: 3, error: 'unreachable' }],
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses what the parser refuses, with a readable key', async () => {
    expect(
      await previewImport({ locale: 'es', text: 'a\n' + 'x\n'.repeat(501), mapping: null }),
    ).toEqual({ status: 'error', error: 'too_many_rows' });
    expect(await previewImport({ locale: 'es', text: '  ', mapping: null })).toEqual({
      status: 'error',
      error: 'empty',
    });
  });

  it('refuses a mapping that is not one: unknown fields, negative or beyond the columns', async () => {
    expect(await previewImport({ locale: 'es', text: CSV, mapping: { owner_id: 1 } })).toEqual({
      status: 'error',
      error: 'bad_mapping',
    });
    expect(await previewImport({ locale: 'es', text: CSV, mapping: { display_name: -1 } })).toEqual(
      { status: 'error', error: 'bad_mapping' },
    );
    expect(await previewImport({ locale: 'es', text: CSV, mapping: { display_name: 9 } })).toEqual({
      status: 'error',
      error: 'bad_mapping',
    });
  });
});

describe('importContacts', () => {
  it('sends every record in its place, valid ones normalized and the invalid one empty, with the checksum of the text', async () => {
    const out = await importContacts({ locale: 'es', text: CSV, mapping, fileName: 'feria.csv' });
    expect(out).toEqual({ status: 'ok', result: ok });
    const [name, args] = db.rpc.mock.calls[0]!;
    expect(name).toBe('crm_import_contacts_csv');
    expect(args.p_file_name).toBe('feria.csv');
    expect(args.p_checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(args.p_rows).toHaveLength(3);
    expect(args.p_rows[0]).toMatchObject({ display_name: 'Ana', email: 'ana@x.es', kind: 'lead' });
    expect(args.p_rows[1]).toEqual({});
    // a formula is just text: it travels as typed, never as a link
    expect(args.p_rows[2].display_name).toBe('=HYPERLINK("http://x.test")');
    expect(db.revalidate).toHaveBeenCalled();
  });

  it('never forwards an owner, a role or a field of the mapping the browser invented', async () => {
    const out = await importContacts({
      locale: 'es',
      text: CSV,
      mapping: { ...mapping, owner_id: 0 } as never,
    });
    expect(out).toEqual({ status: 'error', error: 'bad_mapping' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('refuses an import without a name column or without a valid row, before the database', async () => {
    expect(await importContacts({ locale: 'es', text: CSV, mapping: { email: 1 } })).toEqual({
      status: 'error',
      error: 'bad_mapping',
    });
    expect(
      await importContacts({
        locale: 'es',
        text: 'Nombre,Email\nAna,',
        mapping: { display_name: 0, email: 1 },
      }),
    ).toEqual({
      status: 'error',
      error: 'no_valid_rows',
    });
    expect(await importContacts({ locale: 'es', text: CSV, mapping: null })).toEqual({
      status: 'error',
      error: 'bad_mapping',
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('stops at 10 imports in the last hour', async () => {
    db.recentImports = 10;
    expect(await importContacts({ locale: 'es', text: CSV, mapping })).toEqual({
      status: 'error',
      error: 'hourly',
    });
    expect(db.rpc).not.toHaveBeenCalled();
    db.recentImports = 9;
    expect((await importContacts({ locale: 'es', text: CSV, mapping })).status).toBe('ok');
  });

  it('keeps only the name of the file', async () => {
    await importContacts({ locale: 'es', text: CSV, mapping, fileName: 'C:\\fakepath\\feria.csv' });
    expect(db.rpc.mock.calls[0]![1].p_file_name).toBe('feria.csv');
  });

  it('says when the same file was imported before, and when', async () => {
    db.rpc.mockResolvedValue({ data: { ...ok, replayed: true }, error: null });
    db.firstImportAt = '2026-11-02T10:42:00.000Z';
    const out = await importContacts({ locale: 'es', text: CSV, mapping });
    expect(out).toMatchObject({
      status: 'ok',
      result: { replayed: true, importedAt: '2026-11-02T10:42:00.000Z' },
    });
  });

  it('turns what the database says into a key, and a strange answer into «failed»', async () => {
    db.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'contact_quota_exceeded' },
    });
    expect(await importContacts({ locale: 'es', text: CSV, mapping })).toEqual({
      status: 'error',
      error: 'contactQuota',
    });
    db.rpc.mockResolvedValue({ data: { nope: true }, error: null });
    expect(await importContacts({ locale: 'es', text: CSV, mapping })).toEqual({
      status: 'error',
      error: 'failed',
    });
  });

  it('does not put anything of the rows in the answer: numbers and row numbers only', async () => {
    const out = await importContacts({ locale: 'es', text: CSV, mapping });
    expect(JSON.stringify(out)).not.toContain('ana@x.es');
  });
});

describe('importRpcErrorKey', () => {
  it('maps the known failures', () => {
    expect(importRpcErrorKey({ message: 'too_many_rows' })).toBe('too_many_rows');
    expect(importRpcErrorKey({ code: '42501', message: 'forbidden' })).toBe('forbidden');
    expect(importRpcErrorKey({ message: 'boom' })).toBe('failed');
  });
});

describe('resolveConflict', () => {
  const idle = { status: 'idle' } as const;
  const id = '22222222-2222-4222-8222-222222222222';
  const form = (fields: Record<string, string>) => {
    const data = new FormData();
    data.set('locale', 'es');
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
  };

  it('is the admin’s: a closer never reaches the RPC', async () => {
    await expect(
      resolveConflict(idle, form({ conflict_id: id, resolution: 'discard' })),
    ).rejects.toThrow('NOT_FOUND');
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('resolves with the RPC, passing the note when there is one', async () => {
    db.role = 'admin';
    db.rpc.mockResolvedValue({ data: null, error: null });
    expect(
      await resolveConflict(
        idle,
        form({ conflict_id: id, resolution: 'assign_importer', note: '  la conoce de la feria ' }),
      ),
    ).toEqual({ status: 'ok' });
    expect(db.rpc).toHaveBeenCalledWith('admin_import_conflict_resolve', {
      p_id: id,
      p_resolution: 'assign_importer',
      p_note: 'la conoce de la feria',
    });
    await resolveConflict(idle, form({ conflict_id: id, resolution: 'merge' }));
    expect(db.rpc).toHaveBeenLastCalledWith('admin_import_conflict_resolve', {
      p_id: id,
      p_resolution: 'merge',
    });
    expect(db.revalidate).toHaveBeenCalled();
  });

  it('refuses a resolution that is not one of the four, before the database', async () => {
    db.role = 'admin';
    const out = await resolveConflict(
      idle,
      form({ conflict_id: id, resolution: 'delete_everything' }),
    );
    expect(out).toMatchObject({ status: 'error', formError: 'crm.import.errors.failed' });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('says so when someone resolved it first', async () => {
    db.role = 'admin';
    db.rpc.mockResolvedValue({
      data: null,
      error: { code: '22023', message: 'conflict_not_pending' },
    });
    expect(
      await resolveConflict(idle, form({ conflict_id: id, resolution: 'discard' })),
    ).toMatchObject({
      status: 'error',
      formError: 'crm.import.errors.conflictResolved',
    });
  });
});
