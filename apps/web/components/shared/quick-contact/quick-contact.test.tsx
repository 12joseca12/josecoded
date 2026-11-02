import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { QuickContact } from '.';

const labels = {
  group: 'Formas de contacto rápidas',
  whatsapp: 'Escribir por WhatsApp',
  book: 'Reservar 20 min',
  linkedin: 'LinkedIn',
  email: 'Email',
  copy: 'Copiar email',
  copied: 'Copiado',
  failed: 'No se pudo copiar',
};

type WithUmami = Window & { umami?: { track: ReturnType<typeof vi.fn> } };

afterEach(() => {
  delete (window as WithUmami).umami;
});

describe('QuickContact', () => {
  it('renders only the ways that have data, copies the email and tracks each click', async () => {
    const trackSpy = vi.fn();
    (window as WithUmami).umami = { track: trackSpy };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    render(
      <QuickContact
        page="partners"
        labels={labels}
        whatsapp="https://wa.me/34600000000"
        book="https://cal.com/josecoded/20min"
        email="freelance@josecoded.com"
      />,
    );
    expect(screen.queryByRole('link', { name: /linkedin/i })).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);

    fireEvent.click(screen.getByRole('link', { name: labels.whatsapp }));
    expect(trackSpy).toHaveBeenCalledWith('quick_contact', { channel: 'whatsapp', page: 'partners' });

    fireEvent.click(screen.getByRole('button', { name: labels.copy }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('freelance@josecoded.com');
    expect(trackSpy).toHaveBeenCalledWith('quick_contact', { channel: 'email', page: 'partners' });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Copiado'));
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <QuickContact page="contact" labels={labels} book="https://cal.com/josecoded/20min" email="a@b.co" primary="book" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
