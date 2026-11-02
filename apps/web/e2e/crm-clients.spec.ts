import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';

// Clients of /crm (task 6.12, K6) against Supabase local. Seed: Jose's client Ana (0401, story «Reservas» proposed by
// her) and Carla's client «Cliente de Carla» (0410, no stories). The tests run in order and share the database
// (the acceptance changes the story): `supabase db reset` before a new run. Cloud sessions have no local Supabase:
// the spec skips itself there and runs in the gate. Not covered here, by design: Carla accepting a story of her own
// client (the seed has none; closers.test.sql proves the RPC for her and the action's unit tests the form).
test.describe.configure({ mode: 'serial' });

test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

const ANA = '00000000-0000-4000-8000-000000000401';

test('Carla sees only her own client, with no owner column, and Ana (Jose\'s) is a 404 by URL', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/clientes');
  const table = page.getByRole('table', { name: 'Clientes' });
  await expect(table.getByRole('row', { name: /Cliente de Carla/ })).toBeVisible();
  await expect(table.getByRole('row', { name: /Ana/ })).toHaveCount(0);
  await expect(table.getByRole('columnheader', { name: 'Dueño' })).toHaveCount(0);
  await expectNoSeriousViolations(page);

  const response = await page.goto(`/crm/clientes/${ANA}`);
  expect(response?.status()).toBe(404);
});

test('Jose sees both clients, opens Ana and rejects nothing without a reason, then accepts «Reservas» with 6 h and a task', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/crm/clientes');
  const table = page.getByRole('table', { name: 'Clientes' });
  await expect(table.getByRole('row', { name: /Cliente de Carla/ })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Dueño' })).toBeVisible();
  await table.getByRole('link', { name: /Ana/ }).click();
  await expect(page).toHaveURL(new RegExp(ANA));
  const story = page.getByRole('article', { name: 'Reservas' });
  await expect(story).toContainText('Por decidir');
  await expectNoSeriousViolations(page);

  await story.getByRole('button', { name: /^Decidir/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Decidir historia' });
  await dialog.getByRole('radio', { name: 'Rechazar' }).check({ force: true });
  await dialog.getByRole('button', { name: 'Rechazar historia' }).click();
  await expect(dialog).toBeVisible();
  await expect(story).toContainText('Por decidir');

  await dialog.getByRole('radio', { name: 'Aceptar' }).check({ force: true });
  await dialog.getByLabel('Estimación').fill('6');
  await dialog.getByLabel('Nota para el cliente (opcional)').fill('Encaja con lo que ya tienes.');
  await dialog.getByRole('button', { name: 'Aceptar historia' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Historia aceptada y tarea creada' })).toBeVisible();
  await expect(story).toContainText('En tareas');
  await expect(story).toContainText('6 h');
  // the button that opened the sheet is gone with the old status: the card takes the focus
  await expect(story).toBeFocused();
  await expect(page.getByRole('list').filter({ hasText: 'Reservas' }).getByText('Pendiente')).toBeVisible();
});

test('a decided story offers no more decisions, and Carla\'s client has none to decide', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto(`/crm/clientes/${ANA}`);
  await expect(page.getByRole('button', { name: /^Decidir|^Convertir/ })).toHaveCount(0);

  await page.goto('/crm/clientes?stories=1');
  await expect(page.getByText('Ningún cliente con estos filtros')).toBeVisible();
});
