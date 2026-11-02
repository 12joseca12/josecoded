// Zod-free constants that a Client Component needs (import them as `@josecoded/types/constants`).
//
// The main barrel evaluates every schema, so a value imported from it puts zod (~390 KB raw, ~90 KB
// gzipped) into the client bundle of the page. Anything a browser module needs as a VALUE and that
// the schemas also use lives here, once; the schemas import it from here and the barrel re-exports it.
// Types never need this: `import type` is erased.

/** Audience hints a public page may carry into the sign-up (DT §1.12). `referral` comes from the `ref` cookie only. */
export const ORIGIN_AUDIENCES = ['business', 'company', 'blog'] as const;

/** Client-side upload limits; the bucket enforces the same ones (20261028100400_client_assets.sql). */
export const ASSET_MAX_BYTES = 26_214_400;
export const ASSET_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;
