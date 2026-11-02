import type { EmailTemplate } from './types';

export type StoryDecidedVars = { status: 'accepted' | 'rejected' | 'converted' };

export const storyDecidedEs: EmailTemplate<StoryDecidedVars> = {
  subject: ({ status }) => (status === 'rejected' ? 'Sobre tu historia de usuario' : 'Tu historia de usuario se ha aceptado'),
  paragraphs: ({ status }) => [
    status === 'rejected'
      ? 'Hemos revisado la historia de usuario que propusiste y, por ahora, no la vamos a llevar adelante.'
      : 'Hemos revisado la historia de usuario que propusiste y la hemos aceptado.',
    'Puedes ver el detalle y la nota de Jose en tu área de cliente.',
  ],
  action: { label: 'Abrir mi área', path: 'login' },
};
