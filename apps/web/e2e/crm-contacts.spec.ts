import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';

// Contacts of /crm (task 6.2: inbox K2 and detail K3) against Supabase local. Seed: jose is the admin, carla an active
// closer with three contacts and an open lead (Lead de Carla), dani a deactivated closer with Lead de Dani, ana a client.
// Cloud sessions have no local Supabase: these specs skip themselves there and run in the gate with `supabase start`.
const CARLA_LEAD = '00000000-0000-4000-8000-000000000211';
const CARLA_AGENCY = '00000000-0000-4000-8000-000000000212';
const CARLA_CLIENT = '00000000-0000-4000-8000-000000000210';
const DANI_LEAD = '00000000-0000-4000-8000-000000000220';

test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

test('a closer sees her portfolio only, with no owner column or filter', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  const response = await page.goto('/crm/contactos');
  expect(response?.status()).toBe(200);
  const table = page.getByRole('table', { name: /Contactos/ });
  await expect(table.getByRole('link', { name: 'Lead de Carla' })).toBeVisible();
  await expect(table.getByRole('link', { name: 'Lead de Dani' })).toHaveCount(0);
  await expect(table.getByRole('columnheader', { name: 'Dueño' })).toHaveCount(0);
  await expect(page.getByLabel('Dueño')).toHaveCount(0);
  await expectNoSeriousViolations(page);
});

test('a closer asking for another closer’s contact by URL gets a 404', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  const response = await page.goto(`/crm/contactos/${DANI_LEAD}`);
  expect(response?.status()).toBe(404);
});

test('a closer ignores an owner filter in the URL', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/contactos?owner=00000000-0000-4000-8000-0000000000a6');
  await expect(page.getByRole('link', { name: 'Lead de Carla' })).toBeVisible();
});

test('?due=1 lists the overdue contacts first and marks them', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/contactos?due=1');
  const rows = page.getByRole('row');
  await expect(rows.filter({ hasText: 'Agencia de Carla' })).toContainText('Vencida:');
  await expect(rows.filter({ hasText: 'Lead de Carla' })).toHaveCount(0);
});

test('changing the status asks for the next action and leaves a status_change in the history', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/contactos');
  await page.getByRole('button', { name: 'Estado y siguiente acción de Agencia de Carla' }).click();
  const sheet = page.getByRole('dialog', { name: 'Estado y siguiente acción' });
  await sheet.getByRole('radio', { name: 'Invitación enviada' }).check();
  // the seed gives the agency a next action and the form preselects it: empty it, or there is nothing to ask for
  await sheet.getByLabel('Siguiente acción').fill('');
  await sheet.getByLabel('Fecha').fill('');
  await sheet.getByRole('button', { name: 'Guardar' }).click();
  await expect(sheet.getByText(/necesita siguiente acción|Dinos qué toca hacer/)).toBeVisible();
  await sheet.getByLabel('Siguiente acción').fill('Seguimiento si no responde');
  await sheet.getByLabel('Fecha').fill('2026-12-01');
  await sheet.getByRole('button', { name: 'Guardar' }).click();
  await expect(sheet).toBeHidden();
  await page.goto(`/crm/contactos/${CARLA_AGENCY}`);
  await expect(page.getByText('Estado: Pendiente → Invitación enviada')).toBeVisible();
});

test('a closer never sees «Cerrar cobrado»: she can ask Jose to close', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto(`/crm/contactos/${CARLA_LEAD}`);
  await expect(page.getByRole('button', { name: 'Cerrar cobrado' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reasignar' })).toHaveCount(0);
  await expect(page.getByText('Carla Méndez')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pedir cierre a Jose' }).click();
  await page.getByRole('dialog', { name: 'Pedir cierre a Jose' }).getByRole('button', { name: 'Pedir cierre' }).click();
  await page.reload();
  await expect(page.getByRole('group', { name: 'Siguiente acción' })).toContainText('Jose: cerrar cobrado');
});

test('a closer can invite the portal access of her client and sees the state', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto(`/crm/contactos/${CARLA_CLIENT}`);
  await expect(page.getByText('Sin invitar al portal')).toBeVisible();
  await page.getByRole('button', { name: 'Habilitar acceso' }).click();
  const sheet = page.getByRole('dialog', { name: 'Habilitar acceso al portal' });
  // her field is the email of the contact and cannot be changed
  await expect(sheet.getByLabel('Email')).toBeDisabled();
});

test('the admin sees everyone with the owner, filters by it and reassigns', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/crm/contactos');
  const table = page.getByRole('table', { name: /Contactos/ });
  await expect(table.getByRole('columnheader', { name: 'Dueño' })).toBeVisible();
  await expect(table.getByRole('link', { name: 'Lead de Dani' })).toBeVisible();
  await expect(table.getByRole('row', { name: /Lead de Carla/ })).toContainText('Carla');

  await page.goto(`/crm/contactos/${DANI_LEAD}`);
  await page.getByRole('button', { name: 'Reasignar' }).click();
  const sheet = page.getByRole('dialog', { name: 'Reasignar contacto' });
  await sheet.getByLabel('Nuevo dueño').selectOption({ label: 'Carla' });
  await sheet.getByRole('button', { name: 'Reasignar' }).click();
  await expect(sheet).toBeHidden();

  // and Carla now sees it
  await context.clearCookies();
  await signInAs(context, baseURL as string, 'carla');
  const response = await page.goto(`/crm/contactos/${DANI_LEAD}`);
  expect(response?.status()).toBe(200);
});

test('the admin closes a lead as paid and the contact becomes an active client', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto(`/crm/contactos/${CARLA_LEAD}`);
  await page.getByRole('button', { name: 'Cerrar cobrado' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cerrar cobrado' });
  await dialog.getByLabel('Importe cobrado (sin IVA)').fill('1.400');
  await dialog.getByRole('button', { name: 'Cerrar cobrado' }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByText('Cliente activo').first()).toBeVisible();
  // es-ES writes four digits without a thousands separator («1400,00 €»)
  await expect(page.getByText(/Cobrado 1\.?400,00\s€/)).toBeVisible();
});

test('the overdue list of K1 links to the contacts', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm');
  await expect(page.getByRole('list', { name: 'Contactos con la acción vencida' }).getByRole('link', { name: /Agencia de Carla/ })).toBeVisible();
});

test('the new contact sheet opens with ?nuevo=1 and a closer’s contact is hers', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/contactos?nuevo=1');
  const sheet = page.getByRole('dialog', { name: 'Nuevo contacto' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel('Dueño')).toHaveCount(0);
  await sheet.getByLabel('Nombre').fill('Contacto manual E2E');
  await sheet.getByLabel('Siguiente acción').fill('Primer contacto');
  await sheet.getByLabel('Fecha').fill('2026-12-01');
  await sheet.getByRole('button', { name: 'Crear contacto' }).click();
  await expect(page).toHaveURL(/\/crm\/contactos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Contacto manual E2E');
});
