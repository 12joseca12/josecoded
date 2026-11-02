import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { renderIntl } from '@/tests/helpers/render-intl';
import { serverIntlMock } from '@/tests/helpers/server-intl';

vi.mock('next-intl/server', () => serverIntlMock);
vi.mock('@/app/[locale]/(area)/area-clientes/material/actions', () => ({ downloadAsset: vi.fn() }));

import { AssetList } from './asset-list';

const asset = (id: string, source: 'client' | 'admin', file_name: string | null, size: number) => ({
  id,
  source,
  file_name,
  mime_type: 'application/pdf',
  size_bytes: size,
  title: null,
  created_at: '2026-10-20T10:00:00Z',
});

describe('AssetList', () => {
  it('names each download button after its file and tells who uploaded it in words', async () => {
    const { container } = renderIntl(
      await AssetList({ locale: 'es', assets: [asset('a1', 'client', 'logo.png', 10_240), asset('a2', 'admin', '<b>brief</b>.pdf', 2_000_000)] }),
    );
    expect(screen.getByRole('button', { name: 'Descargar logo.png' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Descargar <b>brief</b>.pdf' })).toBeTruthy();
    expect(container.querySelector('b')).toBeNull(); // the name is text
    expect(screen.getByText(/^Tuyo · 10 kB/)).toBeTruthy();
    expect(screen.getByText(/^De Jose · /)).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the empty state', async () => {
    renderIntl(await AssetList({ locale: 'es', assets: [] }));
    expect(screen.getByText('Aún no hay archivos')).toBeTruthy();
  });
});
