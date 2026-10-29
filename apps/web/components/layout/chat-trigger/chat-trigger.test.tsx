import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { renderHeaderIntl } from '@/tests/helpers/render-intl';

import { ChatTrigger } from '.';

describe('ChatTrigger', () => {
  it('is a link to the chat whose name contains the visible label', async () => {
    const { container } = renderHeaderIntl(<ChatTrigger href="/chat" label="Chat" aria-label="Abrir el chat" />);
    const link = screen.getByRole('link', { name: 'Abrir el chat' });
    expect(link.getAttribute('href')).toBe('/chat');
    expect(link.textContent).toBe('Chat');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('points to the localized chat from English', () => {
    renderHeaderIntl(<ChatTrigger href="/chat" label="Chat" aria-label="Open the chat" />, 'en');
    expect(screen.getByRole('link').getAttribute('href')).toBe('/en/chat');
  });

  it('is a button without href', () => {
    renderHeaderIntl(<ChatTrigger label="Chat" onClick={() => undefined} />);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });
});
