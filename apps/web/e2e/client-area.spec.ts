import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';
import { SEED, clientFor, serviceClient } from '../tests/helpers/supabase-test-clients';

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

const ANA_PENDING_TASK = '00000000-0000-4000-8000-000000000502';

test.describe('tasks', () => {
  test('the list groups the seeded tasks and the detail shows only visible comments', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes/tareas');
    await expect(page.getByRole('heading', { level: 2, name: 'Pendientes' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Hechas' })).toBeVisible();
    await page.getByRole('link', { name: 'Seed: review the design' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seed: review the design');
    await expect(page.getByText('Seed: visible comment')).toBeVisible();
    await expect(page.getByText('Seed: internal comment')).toHaveCount(0);
    await expectNoSeriousViolations(page);
  });

  test('a client comments on a task and the comment appears; the box is cleared', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto(`/area-clientes/tareas/${ANA_PENDING_TASK}`);
    const body = `Comentario de prueba ${Date.now()}`;
    await page.getByLabel('Escribe un comentario').fill(body);
    await page.getByRole('button', { name: 'Enviar comentario' }).click();
    await expect(page.getByText('Comentario enviado.')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Comentarios de la tarea' }).getByText(body)).toBeVisible();
    await expect(page.getByLabel('Escribe un comentario')).toHaveValue('');
  });

  test("another user opening Ana's task by URL gets a 404, and a non-client has no tasks section", async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'bob');
    expect((await page.goto(`/area-clientes/tareas/${ANA_PENDING_TASK}`))?.status()).toBe(404);
    expect((await page.goto('/area-clientes/tareas'))?.status()).toBe(404);
    expect((await page.goto('/area-clientes/tareas/not-a-uuid'))?.status()).toBe(404);
  });
});

test.describe('material', () => {
  test('a client uploads a PDF, sees it in the list and can download it; the page has no serious axe violations', async ({
    page,
    context,
    baseURL,
  }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes/material');
    const name = `informe-${Date.now()}.pdf`;
    await page.locator('input[type="file"][name="file"]').setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.alloc(10_240, 0x20) });
    await page.getByRole('button', { name: 'Subir archivo' }).click();
    await expect(page.getByText('Archivo subido.')).toBeVisible();
    await expect(page.getByRole('link', { name: `Descargar ${name}` })).toBeVisible();
    await expectNoSeriousViolations(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: `Descargar ${name}` }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(name);
  });

  test('a type outside the allowlist is refused before anything is sent', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes/material');
    await page.locator('input[type="file"][name="file"]').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
    await page.getByRole('button', { name: 'Subir archivo' }).click();
    // not a bare getByRole('alert'): the Next route announcer is a second live region with that role
    await expect(page.getByRole('alert').filter({ hasText: 'no se admite' })).toBeVisible();
  });

  test("another user has no material section and cannot list Ana's folder in the bucket", async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'bob');
    expect((await page.goto('/area-clientes/material'))?.status()).toBe(404);
    const bob = await clientFor('bob');
    const { data } = await bob.storage.from('client-assets').list(`clients/${SEED.clients.ana}`);
    expect(data ?? []).toEqual([]);
  });
});

test.describe('plan and upgrade', () => {
  test.beforeEach(async () => {
    // a clean slate: the seed has no request, and a previous run may have left one pending
    await serviceClient().from('upgrade_requests').delete().eq('client_id', SEED.clients.ana);
  });
  test.afterAll(async () => {
    if (await supabaseIsUp()) await serviceClient().from('upgrade_requests').delete().eq('client_id', SEED.clients.ana);
  });

  test('the plan page shows the pack and the seeded extra', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes/pack');
    await expect(page.getByText(/^P2/).first()).toBeVisible();
    await expect(page.getByText(/SEO básico · Incluido/)).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('Ana requests P3: 1.100 € is shown, the database stores it as pending, and a second request is blocked', async ({
    page,
    context,
    baseURL,
  }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes/pack/ampliar');
    await expect(page.getByRole('radio', { name: /P1|P2/ })).toHaveCount(0);
    await page.getByRole('radio', { name: /P3/ }).check();
    await expect(page.getByText('1.100 €')).toBeVisible();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await page.waitForURL('**/area-clientes/pack?requested=1');
    await expect(page.getByText('Solicitud enviada.')).toBeVisible();

    const { data } = await serviceClient().from('upgrade_requests').select('computed_price, status, to_pack_code').eq('client_id', SEED.clients.ana);
    expect(data).toEqual([{ computed_price: 1100, status: 'pending', to_pack_code: 'P3' }]);

    await page.goto('/area-clientes/pack/ampliar');
    await expect(page.getByText(/Ya tienes una solicitud pendiente/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toHaveCount(0);
  });
});

test.describe('referrals', () => {
  test('an affiliate sees the link with her code, the three rules, her referred lead and the pending reward', async ({
    page,
    context,
    baseURL,
  }) => {
    await signInAs(context, baseURL as string, 'bob');
    await page.goto('/area-clientes/recomiendame');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Recomiéndame');
    await expect(page.getByText(/\/\?ref=BOB-TEST01$/)).toBeVisible();
    await expect(page.getByText(/^Si ya eres cliente/)).toBeVisible();
    await expect(page.getByText(/^Pendiente · /)).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('copying the link says so', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await signInAs(context, baseURL as string, 'bob');
    await page.goto('/area-clientes/recomiendame');
    await page.getByRole('button', { name: 'Copiar enlace' }).click();
    await expect(page.getByText('Enlace copiado.')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/\?ref=BOB-TEST01$/);
  });

  test('a client reaches Recomiéndame too, in English as well', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/en/client-area/referrals');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Refer me');
    await expect(page.getByText(/\/\?ref=ANA-TEST01$/)).toBeVisible();
  });
});
