import type { ClientInvitedVars } from './client-invited.es';
import type { EmailTemplate } from './types';

export const clientInvitedEn: EmailTemplate<ClientInvitedVars> = {
  subject: 'Your client area at josecoded.com',
  paragraphs: () => [
    'You now have access to your client area at josecoded.com, where you can follow your project, its tasks and your files.',
    'Sign in with this same email: there is no password to create, a one-time code will be sent to you.',
  ],
  action: { label: 'Sign in', path: 'login' },
};
