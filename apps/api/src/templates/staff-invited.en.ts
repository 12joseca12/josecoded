import type { StaffInvitedVars } from './staff-invited.es';
import type { EmailTemplate } from './types';

export const staffInvitedEn: EmailTemplate<StaffInvitedVars> = {
  subject: 'You have been invited to the josecoded.com team',
  paragraphs: ({ role }) => [
    `Jose has invited you to josecoded.com as ${role === 'admin' ? 'an administrator' : 'a closer'}.`,
    'Sign in with this same email: there is no password to create, a one-time code will be sent to you.',
    'Your first sign-in will ask you to set up an authenticator (a one-time code app) before you can see the CRM.',
  ],
  action: { label: 'Sign in', path: 'login' },
};
