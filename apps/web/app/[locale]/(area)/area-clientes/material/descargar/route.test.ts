// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  row: null as null | { storage_path: string; file_name?: string | null },
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.row }) }) }) }),
    storage: { from: () => ({ createSignedUrl: mocks.createSignedUrl }) },
  }),
}));

import { GET } from './route';

const UUID = '22222222-2222-4222-8222-222222222222';
const call = (query: string, locale = 'es') =>
  GET(new Request(`https://josecoded.com/area-clientes/material/descargar?${query}`) as never, {
    params: Promise.resolve({ locale }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.row = null;
});

describe('GET /area-clientes/material/descargar', () => {
  it('redirects to a 60-second signed URL of a file the session can read, uncached', async () => {
    mocks.row = { storage_path: 'clients/client-1/a1', file_name: 'report.pdf' };
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://x.supabase.co/signed' } });
    const res = await call(`asset=${UUID}`);
    expect(res.headers.get('location')).toBe('https://x.supabase.co/signed');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.createSignedUrl).toHaveBeenCalledWith('clients/client-1/a1', 60, { download: 'report.pdf' });
  });

  it('answers a file of another client (not visible through RLS) and a bad id with the error screen', async () => {
    expect((await call(`asset=${UUID}`, 'en')).headers.get('location')).toBe(
      'https://josecoded.com/en/client-area/files?error=download',
    );
    expect((await call('asset=x')).headers.get('location')).toBe(
      'https://josecoded.com/area-clientes/material?error=download',
    );
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });
});
