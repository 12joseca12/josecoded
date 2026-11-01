import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';
import { serviceClient } from '../tests/helpers/supabase-test-clients';

// Client area against Supabase local (seed accounts: Ana is a client, Bob and the others are not).
// Everything here skips itself without a stack; CI starts one (ci.yml, job e2e).
test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

const widths = [360, 900, 1440] as const;

test.describe('home of the area', () => {
  test('a client sees her project, the phase and the nav of a client', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu proyecto');
    await expect(page.getByRole('listitem').filter({ hasText: 'Construcción' })).toHaveAttribute('aria-current', 'step');
    const nav = page.getByRole('navigation', { name: 'Área de clientes' });
    for (const name of ['Mi proyecto', 'Tareas', 'Material', 'Pack', 'Recomiéndame', 'Mi cuenta']) {
      await expect(nav.getByRole('link', { name })).toBeVisible();
    }
    await expect(nav.getByRole('link', { name: 'Mi proyecto' })).toHaveAttribute('aria-current', 'page');
    // contact is always there
    await expect(page.getByRole('main').getByRole('link', { name: 'Escribir por WhatsApp' })).toBeVisible();
  });

  test('someone with the referral signal sees Recomiéndame first, and no project entries', async ({ page, context, baseURL }) => {
    // the signal is write-once and the seed leaves it empty: set it as the callback would
    await serviceClient().from('user_profiles').update({ first_audience: 'referral' }).eq('user_id', '00000000-0000-4000-8000-0000000000a3').is('first_audience', null);
    await signInAs(context, baseURL as string, 'bob');
    await page.goto('/area-clientes');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Recomienda');
    const nav = page.getByRole('navigation', { name: 'Área de clientes' });
    await expect(nav.getByRole('link', { name: 'Recomiéndame' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Mi cuenta' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Tareas' })).toHaveCount(0);
    await expect(page.getByRole('main').getByRole('link', { name: 'Escribir por WhatsApp' })).toBeVisible();
  });

  test('the English area lives under /en/client-area', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/en/client-area');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your project');
    await expect(page.getByRole('navigation', { name: 'Client area' }).getByRole('link', { name: 'Tasks' })).toHaveAttribute(
      'href',
      '/en/client-area/tasks',
    );
  });

  for (const width of widths) {
    test(`home at ${width}px: no horizontal scroll and no serious axe violations`, async ({ page, context, baseURL }) => {
      await signInAs(context, baseURL as string, 'ana');
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/area-clientes');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expectNoSeriousViolations(page);
    });
  }
});
