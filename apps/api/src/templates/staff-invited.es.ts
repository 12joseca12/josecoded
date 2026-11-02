import type { EmailTemplate } from './types';

export type StaffInvitedVars = { role: 'admin' | 'closer' };

export const staffInvitedEs: EmailTemplate<StaffInvitedVars> = {
  subject: 'Te han invitado al equipo de josecoded.com',
  paragraphs: ({ role }) => [
    `Jose te ha invitado a josecoded.com como ${role === 'admin' ? 'administrador' : 'closer'}.`,
    'Entra con este mismo email: no hace falta crear contraseña, te llegará un código de acceso.',
    'Tu primer acceso te pedirá activar un autenticador (aplicación de códigos de un solo uso) antes de ver el CRM.',
  ],
  action: { label: 'Entrar', path: 'login' },
};
