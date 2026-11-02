import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

vi.mock('@/app/[locale]/(auth)/auth/actions', () => ({
  requestOtp: vi.fn(async () => ({ status: 'idle' })),
  verifyOtp: vi.fn(async () => ({ status: 'idle' })),
}));

import { EmailForm } from './email-form';
import { OtpForm } from './otp-form';

afterEach(() => {
  delete window.turnstile;
  document.head.querySelectorAll('script').forEach((script) => script.remove());
});

describe('OtpForm', () => {
  const labels = { code: 'Code', help: 'Check spam', submit: 'Sign in', form: 'Enter the code' };

  it('is one numeric one-time-code field of six digits, with next as a hidden field and no email in the form', async () => {
    const { container } = render(
      <OtpForm locale="es" next="/area-clientes" labels={labels} actions={<a href="/auth/login">Other</a>} />,
    );
    const input = screen.getByLabelText('Code');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('maxlength')).toBe('6');
    expect(input.getAttribute('pattern')).toBe('[0-9]{6}');
    expect(input.getAttribute('name')).toBe('token');
    expect(container.querySelector('input[name="email"]')).toBeNull();
    expect(container.querySelector('input[name="next"]')?.getAttribute('value')).toBe('/area-clientes');
    expect(screen.getByRole('link', { name: 'Other' })).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('EmailForm', () => {
  const labels = { email: 'Email', help: 'No password', submit: 'Send code', form: 'Sign in' };

  it('is an email field with autocomplete and mounts the CAPTCHA for the login action', async () => {
    const render$ = vi.fn(() => 'w1');
    window.turnstile = { render: render$, reset: vi.fn(), remove: vi.fn() };
    const { container } = render(<EmailForm locale="en" siteKey="site-key" labels={labels} />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(container.querySelector('input[name="locale"]')?.getAttribute('value')).toBe('en');
    await waitFor(() =>
      expect(render$).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ sitekey: 'site-key', action: 'login', language: 'en' }),
      ),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('carries the audience of the page in a hidden field', () => {
    window.turnstile = { render: vi.fn(() => 'w'), reset: vi.fn(), remove: vi.fn() };
    const { container } = render(<EmailForm locale="es" siteKey="k" audience="company" labels={labels} />);
    expect(container.querySelector('input[name="audience"]')?.getAttribute('value')).toBe('company');
  });
});
