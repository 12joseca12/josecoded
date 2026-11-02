import type { StoryDecidedVars } from './story-decided.es';
import type { EmailTemplate } from './types';

export const storyDecidedEn: EmailTemplate<StoryDecidedVars> = {
  subject: ({ status }) => (status === 'rejected' ? 'About your user story' : 'Your user story has been accepted'),
  paragraphs: ({ status }) => [
    status === 'rejected'
      ? 'We have reviewed the user story you proposed and, for now, we will not take it forward.'
      : 'We have reviewed the user story you proposed and we have accepted it.',
    "You can see the details and Jose's note in your client area.",
  ],
  action: { label: 'Open my area', path: 'login' },
};
