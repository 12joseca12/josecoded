import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';

// /admin (task 6.1) against Supabase local, with ADMIN_REQUIRE_MFA=false like the CRM guard spec.
// Seed: jose is the admin, carla an active closer, dani a deactivated one, ana a client.
test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

test('an anonymous visitor is sent to the login, remembering /admin', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fadmin/);
});

for (const who of ['carla', 'dani', 'ana'] as const) {
  test(`${who} gets a 404 on /admin`, async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, who);
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(404);
  });
}

test('the admin sees Resumen with the counters of C1 and the state of Omen', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Resumen');

  const nav = page.getByRole('navigation', { name: 'Navegación de administración' });
  for (const name of ['Resumen', 'Clientes', 'Equipo']) await expect(nav.getByRole('link', { name })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page');

  const admin = page.getByRole('region', { name: 'Administración' });
  for (const label of [
    'Leads abiertos',
    'Acciones vencidas',
    'Comisiones pendientes',
    'Conflictos de importación',
    'Historias propuestas',
    'Contenido sin publicar',
  ]) {
    await expect(admin.getByText(label)).toBeVisible();
  }
  // the gateway is not part of this run: Omen is either online or reported as offline, never missing
  await expect(admin.getByText(/Omen (en línea|sin conexión)/)).toBeVisible();
});

test('on a phone the admin bar has Resumen, Clientes, Equipo and «Más», each at least 44px', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  const bar = page.getByRole('navigation', { name: 'Navegación de administración' });
  await expect(bar.locator('a, button')).toHaveCount(4);
  for (const name of ['Resumen', 'Clientes', 'Equipo', 'Más']) {
    const box = await bar.getByRole(name === 'Más' ? 'button' : 'link', { name }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

for (const width of [360, 900, 1440] as const) {
  test(`admin summary at ${width}px: no horizontal scroll and no serious axe violations`, async ({
    page,
    context,
    baseURL,
  }) => {
    await signInAs(context, baseURL as string, 'jose');
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectNoSeriousViolations(page);
  });
}
