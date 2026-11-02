import type { Locale } from '@josecoded/types';

/**
 * Where a client file lives in the private bucket: `clients/<client id>/<asset id>`. The database
 * checks the same shape (`client_assets_path`) and the storage policies compare the client folder, so
 * a name chosen by the user never reaches a path: it is only a label stored in `file_name`.
 */
export function assetStoragePath(clientId: string, assetId: string): string {
  return `clients/${clientId}/${assetId}`;
}

const MAX_NAME = 255;

/**
 * Display name of an uploaded file: path segments (`../x.pdf`, `C:\\docs\\x.pdf`), control characters
 * and bidi overrides are dropped, runs of whitespace collapse, and the length is capped.
 */
export function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
   
  const stripped = base.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim();
  const clean = stripped === '.' || stripped === '..' ? '' : stripped;
  return clean.slice(0, MAX_NAME);
}

/** «10 KB», «2,4 MB» (language of the visitor). */
export function formatBytes(bytes: number, locale: Locale): string {
  const units = [
    ['byte', 1],
    ['kilobyte', 1024],
    ['megabyte', 1024 * 1024],
  ] as const;
  const [unit, size] = [...units].reverse().find(([, factor]) => bytes >= factor) ?? units[0];
  const value = bytes / size;
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: unit === 'megabyte' && value < 10 ? 1 : 0,
  }).format(value);
}
