import type { FormState } from '@josecoded/types';

/**
 * B39: the sheet of D2 Precios renders and answers `ok` without writing anything. B40 replaces this with the Server
 * Actions (`savePack`, `saveOption`, `saveExtra`), each behind `requireAdmin()`.
 */
export async function stubPriceAction(): Promise<FormState<never>> {
  return { status: 'ok' };
}
