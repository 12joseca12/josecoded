import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderIntl } from '@/tests/helpers/render-intl';

import { GuidedChat } from './guided-chat';

import type { GuidedChatLabels } from './guided-chat';

// The widget is Cloudflare's: here it only reports a token when the test says so.
const widget = vi.hoisted(() => ({ onToken: undefined as undefined | ((token: string | null) => void) }));
vi.mock('@/components/forms/turnstile', () => ({
  Turnstile: ({ onToken }: { onToken?: (token: string | null) => void }) => {
    widget.onToken = onToken;
    return <div data-testid="widget" />;
  },
}));
vi.mock('@/lib/proposal/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/proposal/api')>()),
  generateProposal: vi.fn(async () => ({ status: 'down' as const, reason: 'down' as const })),
}));

const labels = {
  progress: 'Pregunta {current} de {total}',
  chatLabel: 'Conversación',
  back: 'Atrás',
  verify: 'Verificación',
  generating: 'Preparando',
  business: { question: '¿Qué negocio tienes?', chips: { restaurant: 'Restaurante', clinic: 'Clínica', shop: 'Tienda', services: 'Servicios' }, other: 'Otro', otherHelp: 'Ayuda', next: 'Siguiente' },
  needs: {
    question: '¿Qué necesitas?',
    legend: 'Elige',
    chips: { presence: 'Presencia', bookings: 'Reservas', orders: 'Pedidos', management: 'Gestión', automation: 'Automatizar', app: 'App' },
    text: 'Cuéntame',
    next: 'Siguiente',
  },
  sales: { question: '¿Vendes?', options: { none: 'No', orders: 'Pedidos', bookings: 'Reservas', both: 'Ambos' } },
  timeline: { question: '¿Para cuándo?', options: { asap: 'Cuanto antes', one_month: 'En un mes', three_months: 'En tres meses', flexible: 'Sin prisa' } },
  errors: { captcha: 'Espera a la verificación.', rate: 'rate', quota: 'quota', down: 'down', invalid: 'invalid' },
  card: {} as GuidedChatLabels['card'],
  send: {} as GuidedChatLabels['send'],
  contact: 'Escribirme',
} satisfies GuidedChatLabels;

function setup() {
  return renderIntl(<GuidedChat locale="es" apiUrl="http://api" siteKey="k" labels={labels} />);
}

describe('GuidedChat', () => {
  it('does not take focus on load and moves it to each new question', () => {
    setup();
    expect(document.activeElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Restaurante' }));
    expect(document.activeElement?.textContent).toBe('¿Qué necesitas?');
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Reservas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(document.activeElement?.textContent).toBe('¿Para cuándo?');
  });

  it('keeps the thread a plain log (no extra aria-live)', () => {
    setup();
    const log = screen.getByRole('log', { name: 'Conversación' });
    expect(log.hasAttribute('aria-live')).toBe(false);
  });

  it('keeps the last options aria-disabled until the check has a token, and says why when pressed early', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurante' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Reservas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    const option = screen.getByRole('button', { name: 'En un mes' });
    expect(option.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(option);
    expect(screen.getByRole('alert').textContent).toContain('Espera a la verificación.');
    act(() => widget.onToken?.('tok'));
    expect(screen.getByRole('button', { name: 'En un mes' }).hasAttribute('aria-disabled')).toBe(false);
  });

  it('puts the check in an unnamed form, which is not a landmark', () => {
    setup();
    expect(screen.queryByRole('form')).toBeNull();
  });
});
