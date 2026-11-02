import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { latestOtp, signInAs, supabaseIsUp } from './helpers/supabase';

// D1 «Equipo» (task 6.13, B33) against Supabase local: Jose invites a closer with her rate, she signs in with the code
// of her mailbox (the invitation is claimed on that first sign-in) and lands in /crm; Jose then sees her in the table
// and cancels a second invitation. Cloud sessions have no local Supabase: the spec skips itself there and runs in the
// gate. `ADMIN_REQUIRE_MFA=false` (CI and local E2E) lifts the TOTP step for the new closer, as for every spec.
test.describe.configure({ mode: 'serial' });

test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

const stamp = Date.now();
const closer = `e2e-closer-${stamp}@example.com`;
const spare = `e2e-spare-${stamp}@example.com`;

test('Jose invites a closer: the rate is mandatory, the invitation shows up with it', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/admin/equipo');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Equipo');
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: 'Invitar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Invitar al equipo' });
  await dialog.getByLabel('Email').fill(closer);
  await dialog.getByRole('button', { name: 'Enviar invitación' }).click();
  await expect(dialog.getByText(/porcentaje entre 0 y 100/)).toBeVisible(); // no rate, no invitation

  await dialog.getByLabel('Tasa de comisión').fill('12,5');
  await dialog.getByRole('button', { name: 'Enviar invitación' }).click();
  await expect(dialog).toBeHidden();

  const row = page.getByRole('table', { name: 'Invitaciones pendientes' }).getByRole('row', { name: new RegExp(closer) });
  await expect(row).toContainText('12,5');
});

test('the invited closer signs in with her code, claims the invitation and reaches /crm; Jose sees her in the team', async ({
  page,
  browser,
  baseURL,
}) => {
  const guest = await browser.newContext({ baseURL });
  const closerPage = await guest.newPage();
  await closerPage.goto('/auth/login?next=%2Fcrm');
  await closerPage.getByLabel('Email').fill(closer);
  await expect(closerPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 15_000 });
  await closerPage.getByRole('button', { name: 'Enviarme el código' }).click();
  await closerPage.waitForURL('**/auth/codigo**');
  await closerPage.getByLabel('Código de 6 cifras').fill(await latestOtp(closer));
  await closerPage.getByRole('button', { name: 'Entrar' }).click();
  await closerPage.waitForURL('**/crm**');
  await expect(closerPage.getByRole('heading', { level: 1 })).toBeVisible();
  await closerPage.goto('/admin/equipo');
  await expect(closerPage.getByRole('heading', { level: 1 })).not.toContainText('Equipo'); // the admin does not exist for her (404)
  await guest.close();

  await signInAs(page.context(), baseURL as string, 'jose');
  await page.goto('/admin/equipo');
  const members = page.getByRole('table', { name: 'Personas del equipo' });
  const row = members.getByRole('row', { name: new RegExp(closer.split('@')[0] as string) });
  await expect(row).toContainText('Activo');
  await expect(row).toContainText('12,5');
  await expect(page.getByRole('table', { name: 'Invitaciones pendientes' }).getByRole('row', { name: new RegExp(closer) })).toHaveCount(0);
});

test('Jose cancels an open invitation', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/admin/equipo');
  await page.getByRole('button', { name: 'Invitar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Invitar al equipo' });
  await dialog.getByLabel('Email').fill(spare);
  await dialog.getByLabel('Tasa de comisión').fill('10');
  await dialog.getByRole('button', { name: 'Enviar invitación' }).click();
  await expect(dialog).toBeHidden();

  const table = page.getByRole('table', { name: 'Invitaciones pendientes' });
  await table.getByRole('row', { name: new RegExp(spare) }).getByRole('button', { name: /^Anular/ }).click();
  await page.getByRole('dialog', { name: 'Anular invitación' }).getByRole('button', { name: 'Anular', exact: true }).click();
  await expect(table.getByRole('row', { name: new RegExp(spare) })).toHaveCount(0);
});
