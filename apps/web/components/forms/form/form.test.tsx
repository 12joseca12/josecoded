import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Field } from '@/components/forms/field';

import { Form } from '.';

import type { FormState } from '@josecoded/types';

type Fields = { email: string };

function setup(action: (previous: FormState<Fields>, data: FormData) => Promise<FormState<Fields>>) {
  return render(
    <Form action={action} submitLabel="Send" label="Sign in" successMessage="Done">
      <Field kind="email" name="email" label="Email" help="We never share it" required />
      <Field kind="textarea" name="note" label="Note" />
      <Field
        kind="select"
        name="topic"
        label="Topic"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />
      <Field kind="checkbox" name="agree" label="I agree" />
      <Field
        kind="radio-group"
        name="pack"
        label="Pack"
        options={[
          { value: 'P1', label: 'P1' },
          { value: 'P2', label: 'P2', description: 'Orders' },
        ]}
      />
    </Form>,
  );
}

describe('Form and Field', () => {
  it('has no axe violations at rest', async () => {
    const { container } = setup(async () => ({ status: 'idle' }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('links label, help and name; hidden fields render a plain hidden input', () => {
    const { container } = render(
      <Form action={async () => ({ status: 'idle' })} submitLabel="Send">
        <Field kind="hidden" name="locale" value="es" />
        <Field kind="email" name="email" label="Email" help="Help text" />
      </Form>,
    );
    expect(container.querySelector('input[type="hidden"][name="locale"]')?.getAttribute('value')).toBe('es');
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(input.getAttribute('aria-describedby') as string)?.textContent).toBe('Help text');
  });

  it('shows the field error from the action, marks it invalid and moves focus to it', async () => {
    const action = vi.fn(async () => ({ status: 'error', fieldErrors: { email: 'Enter a valid email' } }) as FormState<Fields>);
    const { container } = setup(action);
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form') as HTMLFormElement);
    });
    const input = await screen.findByLabelText('Email');
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toContain('error');
    expect(document.activeElement).toBe(input);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('announces a general error in a focusable alert', async () => {
    setup(async () => ({ status: 'error', formError: 'Something failed' }));
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form') as HTMLFormElement);
    });
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Something failed');
    await waitFor(() => expect(document.activeElement).toBe(alert));
  });

  it('announces success politely', async () => {
    setup(async () => ({ status: 'ok' }));
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form') as HTMLFormElement);
    });
    expect((await screen.findByRole('status')).textContent).toBe('Done');
  });

  it('keeps what was typed when the action hands the values back (WCAG 3.3.7)', async () => {
    const action = vi.fn(
      async (_previous: FormState<Fields>, data: FormData) =>
        ({ status: 'error', fieldErrors: { email: 'Enter a valid email' }, values: { email: String(data.get('email')), note: String(data.get('note')) } }) as FormState<Fields>,
    );
    setup(action);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'no-email' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'My long message' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form') as HTMLFormElement);
    });
    await screen.findByText('Enter a valid email');
    expect((screen.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('My long message');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('no-email');
  });

  it('keeps the live region in the DOM from the start and focuses the message when it fills', async () => {
    setup(async () => ({ status: 'ok' }));
    const region = screen.getByRole('status');
    expect(region.textContent).toBe('');
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form') as HTMLFormElement);
    });
    await waitFor(() => expect(screen.getByRole('status')).toBe(region));
    await waitFor(() => expect(region.textContent).toBe('Done'));
    expect(document.activeElement).toBe(region);
  });

  it('does not disable the button while pending: it stays focusable and aria-disabled, and ignores the click', async () => {
    let release: () => void = () => undefined;
    const action = vi.fn(() => new Promise<FormState<Fields>>((resolve) => { release = () => resolve({ status: 'idle' }); }));
    setup(action);
    const button = screen.getByRole('button', { name: 'Send' });
    await act(async () => {
      fireEvent.submit(button.closest('form') as HTMLFormElement);
    });
    await waitFor(() => expect(button.getAttribute('aria-disabled')).toBe('true'));
    expect(button.hasAttribute('disabled')).toBe(false);
    expect((screen.getByLabelText('Email') as HTMLInputElement).readOnly).toBe(true);
    await act(async () => release());
    await waitFor(() => expect(button.hasAttribute('aria-disabled')).toBe(false));
  });
});
