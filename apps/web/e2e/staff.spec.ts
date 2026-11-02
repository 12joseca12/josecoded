import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';

// CRM guard (task 6.0) and shell and summary (task 6.1) against Supabase local. The web under test runs with ADMIN_REQUIRE_MFA=false
// (apps/web/.dev.vars, like the admin), because the seed accounts have no TOTP factor.
// Seed: carla is an active closer, dani a deactivated one, ana a client, jose the admin.
test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

test('an anonymous visitor is sent to the login, remembering /crm', async ({ page }) => {
  await page.goto('/crm');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fcrm/);
});

test('a client gets a 404', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'ana');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(404);
});

test('an active closer sees the summary, the closer navigation and the team in numbers without names', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Resumen');

  const nav = page.getByRole('navigation', { name: 'Navegación del CRM' });
  for (const name of ['Resumen', 'Contactos', 'Clientes', 'Comisiones', 'Importar', 'Ajustes']) {
    await expect(nav.getByRole('link', { name })).toBeVisible();
  }
  await expect(nav.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page');
  // lo exclusivo del admin no existe para un closer
  await expect(nav.getByRole('link', { name: 'Administración' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'Administración' })).toHaveCount(0);

  const team = page.getByRole('region', { name: 'Equipo' });
  await expect(team).toBeVisible();
  await expect(team).toContainText('Contactos del equipo');
  await expect(team).toContainText('Agregados de todos, sin nombres');
  // Dani is another closer and Jose the admin: only numbers cross the line of the portfolio
  for (const other of ['Dani', 'Jose']) await expect(team).not.toContainText(other);
});

test('a deactivated closer gets a 404', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'dani');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(404);
});

test('the admin sees the CRM too, with the way into Administración and the counters of C1', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'jose');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('navigation', { name: 'Navegación del CRM' }).getByRole('link', { name: 'Administración' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Administración' })).toBeVisible();
});

test('the CRM answers in English under /en/crm', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/en/crm');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Summary');
  await expect(
    page.getByRole('navigation', { name: 'CRM navigation' }).getByRole('link', { name: 'Contacts' }),
  ).toHaveAttribute('href', '/en/crm/contactos');
});

const widths = [360, 900, 1440] as const;

for (const width of widths) {
  test(`summary at ${width}px: no horizontal scroll and no serious axe violations`, async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'carla');
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/crm');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectNoSeriousViolations(page);
  });
}

test('on a phone the bar has four destinations of at least 44px and «Más» opens a sheet', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/crm');

  const bar = page.getByRole('navigation', { name: 'Navegación del CRM' });
  const tabs = bar.locator('a, button');
  await expect(tabs).toHaveCount(4);
  for (const name of ['Contactos', 'Clientes', 'Comisiones', 'Más']) {
    const box = await bar.getByRole(name === 'Más' ? 'button' : 'link', { name }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }

  await bar.getByRole('button', { name: 'Más' }).click();
  const sheet = page.getByRole('dialog', { name: 'Más' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('link', { name: 'Importar' })).toBeVisible();
  await expect(sheet.getByRole('link', { name: 'Ajustes' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  // the focus goes back to the button that opened it
  await expect(bar.getByRole('button', { name: 'Más' })).toBeFocused();
});
