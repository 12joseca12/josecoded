import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// public variables lib/env.ts validates on import
const publicEnv = {
  NEXT_PUBLIC_SITE_URL: 'https://josecoded.com',
  NEXT_PUBLIC_JOSECODED_API_URL: 'https://api.josecoded.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  NEXT_PUBLIC_CAL_LINK: 'josecoded/20min',
  NEXT_PUBLIC_WHATSAPP_NUMBER: '34600000000',
  NEXT_PUBLIC_HERO_MEDIA_VERSION: '1',
};

async function renderPending(nodeEnv: string, devUi: string | undefined) {
  for (const [key, value] of Object.entries(publicEnv)) vi.stubEnv(key, value);
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.stubEnv('NEXT_PUBLIC_DEV_UI', devUi);
  vi.resetModules();
  const { Pending } = await import('.');
  return render(<Pending>{'{{DATO: ciudad}}'}</Pending>);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Pending', () => {
  it('shows the marker in development', async () => {
    const { container } = await renderPending('development', undefined);
    expect(container.textContent).toBe('{{DATO: ciudad}}');
  });

  it('renders nothing in production...', async () => {
    const { container } = await renderPending('production', undefined);
    expect(container.textContent).toBe('');
  });

  it('...except in a preview build, which sets NEXT_PUBLIC_DEV_UI=1', async () => {
    const { container } = await renderPending('production', '1');
    expect(container.textContent).toBe('{{DATO: ciudad}}');
  });
});
