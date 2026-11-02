import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  remove: vi.fn(async () => ({ ok: true })),
  refresh: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('@/app/[locale]/(area)/area-clientes/material/actions', () => ({
  prepareAssetUpload: mocks.prepare,
  deleteAsset: mocks.remove,
  refreshMaterial: vi.fn(async () => undefined),
}));
vi.mock('next/navigation', async (importActual) => ({
  ...(await importActual<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('@/lib/supabase/browser', () => ({
  createClient: () => ({ storage: { from: () => ({ uploadToSignedUrl: mocks.upload }) } }),
}));

import { AssetUpload } from './asset-upload';

const labels = {
  label: 'File',
  help: 'Up to 25 MB',
  submit: 'Upload file',
  uploading: 'Uploading…',
  done: 'File uploaded.',
  chooseFirst: 'Choose a file first.',
  tooBig: 'Over 25 MB.',
  notAllowed: 'Type not accepted.',
  failed: 'Upload failed.',
  form: 'Upload a file',
};

function pick(file: File) {
  fireEvent.change(screen.getByLabelText('File'), { target: { files: [file] } });
}
const pdf = () => new File(['x'.repeat(10_000)], 'report.pdf', { type: 'application/pdf' });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
});

describe('AssetUpload', () => {
  it('has no axe violations and restricts the picker to the allowed types', async () => {
    const { container } = render(<AssetUpload locale="es" labels={labels} />);
    expect(screen.getByLabelText('File').getAttribute('accept')).toContain('application/pdf');
    expect(screen.getByLabelText('File').getAttribute('accept')).not.toContain('svg');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('asks for a file before anything is sent', async () => {
    render(<AssetUpload locale="es" labels={labels} />);
    fireEvent.submit(screen.getByRole('form', { name: 'Upload a file' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Choose a file first.');
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it('refuses a type outside the allowlist (an SVG can carry script) and a file over 25 MiB without calling the server', async () => {
    render(<AssetUpload locale="es" labels={labels} />);
    pick(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }));
    fireEvent.submit(screen.getByRole('form', { name: 'Upload a file' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Type not accepted.');

    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 26_214_401 });
    pick(big);
    fireEvent.submit(screen.getByRole('form', { name: 'Upload a file' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Over 25 MB.'));
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it('prepares, uploads to the signed path and refreshes the list', async () => {
    mocks.prepare.mockResolvedValue({ ok: true, assetId: 'a1', path: 'clients/c1/a1', token: 'tok' });
    render(<AssetUpload locale="es" labels={labels} />);
    pick(pdf());
    fireEvent.submit(screen.getByRole('form', { name: 'Upload a file' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('File uploaded.'));
    expect(mocks.prepare).toHaveBeenCalledWith({ fileName: 'report.pdf', mimeType: 'application/pdf', sizeBytes: 10_000 });
    expect(mocks.upload).toHaveBeenCalledWith('clients/c1/a1', 'tok', expect.any(File), { contentType: 'application/pdf' });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('removes the row when the bytes fail to upload, so no row is left without a file', async () => {
    mocks.prepare.mockResolvedValue({ ok: true, assetId: 'a1', path: 'clients/c1/a1', token: 'tok' });
    mocks.upload.mockResolvedValue({ error: new Error('boom') });
    render(<AssetUpload locale="es" labels={labels} />);
    pick(pdf());
    fireEvent.submit(screen.getByRole('form', { name: 'Upload a file' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Upload failed.');
    expect(mocks.remove).toHaveBeenCalledWith('a1');
  });

  it('shows the server refusal', async () => {
    mocks.prepare.mockResolvedValue({ ok: false, reason: 'failed' });
    render(<AssetUpload locale="es" labels={labels} />);
    pick(pdf());
    fireEvent.submit(screen.getByRole('form', { name: 'Upload a file' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Upload failed.');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
