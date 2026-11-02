import type { FormState } from '@josecoded/types';

/**
 * B32: the sheets of D1 render and answer `ok` without writing anything. B33 replaces this with the Server Actions
 * (`inviteStaff`, `setRate`, `reassignContacts`, `setStaff`, `resendInvite`, `cancelInvite`), each behind `requireAdmin()`.
 */
export async function stubTeamAction(): Promise<FormState<never>> {
  return { status: 'ok' };
}
