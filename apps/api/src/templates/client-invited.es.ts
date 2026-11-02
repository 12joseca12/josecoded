import type { EmailTemplate } from './types';

export type ClientInvitedVars = Record<string, never>;

export const clientInvitedEs: EmailTemplate<ClientInvitedVars> = {
  subject: 'Tu área de cliente en josecoded.com',
  paragraphs: () => [
    'Ya tienes acceso al área de cliente de josecoded.com, donde ves el estado de tu proyecto, las tareas y el material.',
    'Entra con este mismo email: no hace falta crear contraseña, te llegará un código de acceso.',
  ],
  action: { label: 'Entrar', path: 'login' },
};
