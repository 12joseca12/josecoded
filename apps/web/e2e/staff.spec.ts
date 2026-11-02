import { expect, test } from '@playwright/test';

import { signInAs, supabaseIsUp } from './helpers/supabase';

// CRM guard (task 6.0) against Supabase local. The web under test runs with ADMIN_REQUIRE_MFA=false
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

test('an active closer sees the CRM', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'CRM' })).toBeVisible();
});

test('a deactivated closer gets a 404', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'dani');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(404);
});

test('the admin sees the CRM too', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  const response = await page.goto('/crm');
  expect(response?.status()).toBe(200);
});
