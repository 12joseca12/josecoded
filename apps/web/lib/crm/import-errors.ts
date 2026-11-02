import type { ImportErrorKey } from './import-types';

/** Imports a person may make per hour (the Server Action counts hers in `crm_imports`). */
export const IMPORTS_PER_HOUR = 10;

/** What the database says when it refuses an import, as a key of `crm.import.errors`. */
export function importRpcErrorKey(error: { code?: string; message?: string }): ImportErrorKey {
  const message = error.message ?? '';
  if (/too_many_rows/.test(message)) return 'too_many_rows';
  if (/contact_quota_exceeded/.test(message)) return 'contactQuota';
  if (error.code === '42501' || /forbidden/.test(message)) return 'forbidden';
  return 'failed';
}
