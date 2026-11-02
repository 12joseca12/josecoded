import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';

// Commissions of /crm (task 6.11, K5) against Supabase local. The seed has one commission: Carla's, for «Cliente de
// Carla» (P1), 10 % of 1.000,00 € = 100,00 €, pending. The tests run in order and share the database (approve, then
// pay): `supabase db reset` before a new run. Cloud sessions have no local Supabase: the spec skips itself there and
// runs in the gate. Not covered here, by design: the change of Carla's rate in D1 (the screen arrives with 6.13; the
// database test of DATOS §14.9.4 proves that `percent` stays frozen) and the rejection (it needs a second pending row;
// the Server Action and the dialog are covered by the unit tests and the previews).
test.describe.configure({ mode: 'serial' });

test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

const ROW = /Cliente de Carla/;

test('Carla sees her pending commission with its frozen percent and no buttons, and no closer column or filter', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/comisiones');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Comisiones');

  const table = page.getByRole('table', { name: 'Comisiones por fecha de cierre' });
  const row = table.getByRole('row', { name: ROW });
  await expect(row).toContainText('Pendiente');
  await expect(row).toContainText('100,00');
  await expect(row).toContainText('10 %');
  await expect(row).not.toContainText('tasa actual');
  await expect(table.getByRole('columnheader', { name: 'Closer' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Aprobar|Rechazar|Marcar pagada/ })).toHaveCount(0);
  await expect(page.getByLabel('Closer')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Pendientes/ })).toContainText('100,00');
  await expectNoSeriousViolations(page);
});

test('Jose cannot pay a pending commission: no button, and the approval asks for confirmation before it records anything', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/crm/comisiones');
  const row = page.getByRole('table', { name: 'Comisiones por fecha de cierre' }).getByRole('row', { name: ROW });
  await expect(row.getByRole('button', { name: /Marcar pagada/ })).toHaveCount(0);
  await expectNoSeriousViolations(page);

  await row.getByRole('button', { name: /^Aprobar/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Aprobar comisión' });
  await expect(dialog).toContainText('100,00');
  await expect(dialog).toContainText('Carla');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog).toBeHidden();
  await expect(row).toContainText('Pendiente');
  await expect(row.getByRole('button', { name: /^Aprobar/ })).toBeFocused();

  await row.getByRole('button', { name: /^Aprobar/ }).click();
  await dialog.getByRole('button', { name: /^Aprobar 100,00/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Comisión aprobada' })).toBeVisible();
  await expect(row).toContainText('Aprobada');
  // the button that opened the dialog is gone with the old status: the row takes the focus
  await expect(row).toBeFocused();
  await expect(row.getByRole('button', { name: /Marcar pagada/ })).toBeVisible();
  await expect(row.getByRole('button', { name: /^Aprobar|^Rechazar/ })).toHaveCount(0);
});

test('Carla sees it approved; Jose marks it paid with a date and the note, and she sees it paid on that day', async ({
  page,
  context,
  baseURL,
  browser,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/comisiones');
  const carlaRow = page.getByRole('table', { name: 'Comisiones por fecha de cierre' }).getByRole('row', { name: ROW });
  await expect(carlaRow).toContainText('Aprobada');
  await expect(page.getByRole('link', { name: /Aprobadas/ })).toContainText('100,00');

  const adminContext = await browser.newContext();
  await signInAs(adminContext, baseURL as string, 'jose');
  const admin = await adminContext.newPage();
  await admin.goto('/crm/comisiones');
  const row = admin.getByRole('table', { name: 'Comisiones por fecha de cierre' }).getByRole('row', { name: ROW });
  await row.getByRole('button', { name: /Marcar pagada/ }).click();
  const dialog = admin.getByRole('dialog', { name: 'Marcar pagada' });
  await expect(dialog).toContainText('Esto solo registra el pago');
  await dialog.getByLabel('Fecha de pago').fill('2026-11-01');
  await dialog.getByLabel('Nota (opcional)').fill('transferencia del 1 nov');
  await dialog.getByRole('button', { name: 'Registrar pago' }).click();
  await expect(admin.getByRole('status').filter({ hasText: 'Pago registrado' })).toBeVisible();
  await expect(row).toContainText('Pagada');
  await expect(row).toContainText('1 nov');
  await expect(row.getByRole('button')).toHaveCount(0);
  await expect(admin.getByRole('link', { name: /Pagadas/ })).toContainText('100,00');
  await adminContext.close();

  await page.reload();
  await expect(carlaRow).toContainText('Pagada');
  await expect(carlaRow).toContainText('1 nov');
});

test('a total filters the list by status and a second press clears it; a closer id in the URL changes nothing for Carla', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/crm/comisiones');
  await page.getByRole('link', { name: /Rechazadas/ }).click();
  await expect(page).toHaveURL(/status=rejected/);
  await expect(page.getByRole('link', { name: /Rechazadas/ })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByText('Ninguna comisión con estos filtros')).toBeVisible();
  await page.getByRole('link', { name: /Rechazadas/ }).click();
  await expect(page).toHaveURL(/\/crm\/comisiones$/);

  const carla = await context.browser()!.newContext();
  await signInAs(carla, baseURL as string, 'carla');
  const carlaPage = await carla.newPage();
  await carlaPage.goto('/crm/comisiones?closer=00000000-0000-4000-8000-0000000000a6');
  await expect(carlaPage.getByRole('table', { name: 'Comisiones por fecha de cierre' }).getByRole('row', { name: ROW })).toBeVisible();
  await carla.close();
});
