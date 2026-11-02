// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  context: null as unknown,
  insert: vi.fn(),
  deleteRow: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  createSignedUrl: vi.fn(),
  remove: vi.fn(),
  deletedRows: [{ id: 'x' }] as unknown[],
  row: null as null | { id?: string; storage_path: string; file_name?: string | null },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const supabase = {
  from: () => ({
    insert: async (row: unknown) => {
      mocks.insert(row);
      return { error: null };
    },
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.row }) }) }),
    delete: () => ({
      eq: (...args: unknown[]) => {
        mocks.deleteRow(...args);
        const result = { data: mocks.deletedRows, error: null };
        // awaited bare (rollback of a failed upload) or chained with `.select('id')` (deleteAsset)
        return Object.assign(Promise.resolve(result), { select: async () => result });
      },
    }),
  }),
  storage: {
    from: () => ({
      createSignedUploadUrl: mocks.createSignedUploadUrl,
      createSignedUrl: mocks.createSignedUrl,
      remove: mocks.remove,
    }),
  },
};
vi.mock('@/lib/supabase/server', () => ({ createServerSupabase: async () => supabase }));
vi.mock('@/lib/area/queries', () => ({ getAreaContext: async () => mocks.context }));

import { deleteAsset, prepareAssetUpload } from './actions';

const clientContext = { client: { id: 'client-1' }, isAdmin: false, session: { supabase, user: { id: 'me' } } };
const intent = { fileName: '../report.pdf', mimeType: 'application/pdf', sizeBytes: 1000 };
const UUID = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.context = clientContext;
  mocks.row = null;
  mocks.deletedRows = [{ id: 'x' }];
  mocks.remove.mockResolvedValue({ error: null });
  mocks.createSignedUploadUrl.mockResolvedValue({ data: { token: 'tok' }, error: null });
});

describe('prepareAssetUpload', () => {
  it('creates the row for the own client under clients/<client>/<id> and returns the upload token', async () => {
    const result = await prepareAssetUpload(intent);
    expect(result).toMatchObject({ ok: true, token: 'tok' });
    const row = mocks.insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(row).toMatchObject({ client_id: 'client-1', uploaded_by_user_id: 'me', source: 'client', file_name: 'report.pdf', mime_type: 'application/pdf', size_bytes: 1000 });
    expect(row.storage_path).toBe(`clients/client-1/${row.id as string}`);
    expect(mocks.createSignedUploadUrl).toHaveBeenCalledWith(row.storage_path);
  });

  it.each([
    ['an SVG', { ...intent, mimeType: 'image/svg+xml' }],
    ['HTML', { ...intent, mimeType: 'text/html' }],
    ['a file over 25 MiB', { ...intent, sizeBytes: 26_214_401 }],
    ['an empty size', { ...intent, sizeBytes: 0 }],
    ['a name that cleans to nothing', { ...intent, fileName: '..' }],
  ])('refuses %s', async (_label, input) => {
    expect(await prepareAssetUpload(input)).toEqual({ ok: false, reason: 'invalid' });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('refuses a user without a client and staff', async () => {
    mocks.context = { ...clientContext, client: null };
    expect(await prepareAssetUpload(intent)).toEqual({ ok: false, reason: 'failed' });
    mocks.context = { ...clientContext, isAdmin: true };
    expect(await prepareAssetUpload(intent)).toEqual({ ok: false, reason: 'failed' });
    mocks.context = null;
    expect(await prepareAssetUpload(intent)).toEqual({ ok: false, reason: 'failed' });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('removes the row when Storage refuses the token', async () => {
    mocks.createSignedUploadUrl.mockResolvedValue({ data: null, error: new Error('no') });
    expect(await prepareAssetUpload(intent)).toEqual({ ok: false, reason: 'failed' });
    expect(mocks.deleteRow).toHaveBeenCalledWith('id', expect.any(String));
  });
});

describe('deleteAsset', () => {
  it('removes the object first and then the row', async () => {
    mocks.row = { id: UUID, storage_path: 'clients/client-1/a1' };
    const order: string[] = [];
    mocks.remove.mockImplementation(async () => {
      order.push('object');
      return { error: null };
    });
    mocks.deleteRow.mockImplementation(() => void order.push('row'));
    expect(await deleteAsset(UUID)).toEqual({ ok: true });
    expect(order).toEqual(['object', 'row']);
  });

  it('aborts, keeping the row, when Storage fails to remove the object', async () => {
    mocks.row = { id: UUID, storage_path: 'clients/client-1/a1' };
    mocks.remove.mockResolvedValue({ error: new Error('storage down') });
    expect(await deleteAsset(UUID)).toEqual({ ok: false });
    expect(mocks.deleteRow).not.toHaveBeenCalled();
  });

  it('reports failure when the delete touched no row (RLS)', async () => {
    mocks.row = { id: UUID, storage_path: 'clients/client-1/a1' };
    mocks.deletedRows = [];
    expect(await deleteAsset(UUID)).toEqual({ ok: false });
  });

  it('does nothing for an id that is not a uuid or not visible', async () => {
    expect(await deleteAsset('nope')).toEqual({ ok: false });
    mocks.row = null;
    expect(await deleteAsset(UUID)).toEqual({ ok: false });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
