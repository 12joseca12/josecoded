import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { FallText } from '.';

// Pending reads the validated public env on import (lib/env.ts)
vi.hoisted(() => {
  const env = {
    NEXT_PUBLIC_SITE_URL: 'https://josecoded.com',
    NEXT_PUBLIC_JOSECODED_API_URL: 'https://api.josecoded.com',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    NEXT_PUBLIC_CAL_LINK: 'josecoded/20min',
    NEXT_PUBLIC_WHATSAPP_NUMBER: '34600000000',
    NEXT_PUBLIC_HERO_MEDIA_VERSION: '1',
  };
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
});

it('keeps accessible text and splits visible chars into indivisible words', () => {
  const { container } = render(<FallText as="h1" text="Jose Carlos Sánchez" />);
  expect(container.querySelector('h1 .sr-only')?.textContent).toBe('Jose Carlos Sánchez');
  const hidden = container.querySelector('h1 [aria-hidden="true"]')!;
  expect(hidden.querySelectorAll('.w')).toHaveLength(3);
  expect(hidden.querySelectorAll('.ch')).toHaveLength(17);
  expect(container.querySelectorAll('h1')).toHaveLength(1);
});

it('serves every char with its final letter, so the page is complete without JavaScript', () => {
  const { container } = render(<FallText as="p" text="Hola mundo" />);
  const letters = [...container.querySelectorAll<HTMLElement>('.ch')];
  expect(letters.map((el) => el.textContent).join('')).toBe('Holamundo');
  for (const el of letters) expect(el.dataset.ch).toBe(el.textContent);
});

it('splits by code point, not by UTF-16 unit', () => {
  const { container } = render(<FallText text="a😀b" />);
  expect(container.querySelectorAll('.ch')).toHaveLength(3);
});

it('does not split a pending {{DATO}} marker: it is shown whole, with no falling letters', () => {
  const { container } = render(<FallText as="span" text="{{DATO: nombre de pila}}" />);
  expect(container.querySelectorAll('.ch')).toHaveLength(0);
  expect(container.textContent).toBe('{{DATO: nombre de pila}}');
});

it('has no accessibility violations inside a heading', async () => {
  const { container } = render(
    <main>
      <FallText as="h1" text="Jose Carlos Sánchez" />
    </main>,
  );
  expect(await axe(container)).toHaveNoViolations();
});
