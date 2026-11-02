import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { signInAs, supabaseIsUp } from './helpers/supabase';

// CSV import of /crm (task 6.10, K4) against Supabase local. `contacts-30.csv` has 30 rows: 26 new, 2 that Carla already
// has (seed), 1 that is Jose's (Recruiter Test, seed) and 1 with no way to reach the person. The tests run in order and
// share the database: `supabase db reset` before a new run (the file is an idempotent import, a second run would only
// replay it). Cloud sessions have no local Supabase: the spec skips itself there and runs in the gate.
const FILE = fileURLToPath(new URL('./fixtures/contacts-30.csv', import.meta.url));

test.describe.configure({ mode: 'serial' });

test.beforeEach(async () => {
  test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
});

test('Carla uploads 30 rows: the preview flags one, the import says what happened and nothing of Jose’s contact', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/importar');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Importar contactos');
  await expect(page.getByRole('tab', { name: /Conflictos/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Conflictos/ })).toHaveCount(0);

  await page.getByLabel('Fichero CSV').setInputFiles(FILE);
  await expect(page.getByText('contacts-30.csv')).toBeVisible();
  await page.getByRole('button', { name: 'Revisar columnas' }).click();

  await expect(page.getByRole('heading', { name: '2. Comprueba las columnas' })).toBeFocused();
  await expect(page.getByLabel('Campo para «Email»')).toHaveValue('email');
  const preview = page.getByRole('table', { name: /Primeras 20 de 30 filas/ });
  await expect(preview.getByRole('row')).toHaveCount(21);
  await expect(page.getByText('Inválidas').locator('..')).toContainText('1');
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: 'Importar 29 filas' }).click();
  const result = page.getByRole('status').filter({ hasText: 'creados' });
  await expect(result).toContainText('26 creados');
  await expect(result).toContainText('2 actualizados');
  await expect(result).toContainText('1 inválida');
  await expect(result).toContainText('1 pendiente de revisión del administrador');
  await expect(page.getByText('Recruiter Test')).toHaveCount(0);
  await expect(page.getByText('Jose', { exact: true })).toHaveCount(0);

  // the inbox of this import: 25 on the first page and the 26th on the second
  const link = page.getByRole('link', { name: 'Ver los 26 en Contactos' });
  await link.click();
  await expect(page).toHaveURL(/\/crm\/contactos\?import=[0-9a-f-]{36}/);
  await expect(page.getByRole('table', { name: /Contactos/ }).getByRole('row')).toHaveCount(26);
  await page.goto(`${page.url()}&page=2`);
  await expect(page.getByRole('table', { name: /Contactos/ }).getByRole('row')).toHaveCount(2);
});

test('the same file again changes nothing and says it was already imported; the history shows the pending row', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/importar');
  await page.getByLabel('Fichero CSV').setInputFiles(FILE);
  await page.getByRole('button', { name: 'Revisar columnas' }).click();
  await page.getByRole('button', { name: 'Importar 29 filas' }).click();
  await expect(page.getByText(/Ya importado el .* \(sin cambios\)/)).toBeVisible();

  const history = page.getByRole('table', { name: 'Historial de importaciones' });
  await expect(history.getByRole('row', { name: /contacts-30\.csv/ })).toHaveCount(1);
  await expect(page.getByText('Fila 30 · contacts-30.csv')).toBeVisible();
  // the seed leaves another pending row of Carla («Fila 4 · seed.csv»): look at the badge of this file's row
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Fila 30 · contacts-30.csv' }).getByText('Pendiente', { exact: true }),
  ).toBeVisible();
  // she learns that the row waits, never who has the contact
  await expect(page.getByText('Recruiter Test')).toHaveCount(0);
  await expectNoSeriousViolations(page);
});

test('a closer asking for the conflicts tab gets the import tab', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/importar?tab=conflictos');
  await expect(page.getByRole('heading', { name: '1. Sube o pega el CSV' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Conflictos/ })).toHaveCount(0);
});

test('Jose sees both faces of the conflict, assigns the contact to Carla and she sees it in her inbox', async ({
  page,
  context,
  baseURL,
}) => {
  await signInAs(context, baseURL as string, 'jose');
  await page.goto('/crm/importar');
  await expect(page.getByRole('link', { name: /Conflictos/ })).toBeVisible();
  await page.getByRole('link', { name: /Conflictos/ }).click();
  await expect(page).toHaveURL(/tab=conflictos/);

  const card = page.getByRole('article', { name: /Fila 30 de contacts-30\.csv/ });
  await expect(card.getByRole('region', { name: 'Fila importada' })).toContainText(
    'Recruiter Test',
  );
  await expect(card.getByRole('region', { name: 'Contacto existente' })).toContainText('Jose');
  await expectNoSeriousViolations(page);

  await card.getByLabel('Nota (opcional)').fill('La conoce de la feria');
  await card.getByRole('button', { name: 'Asignar a Carla' }).click();
  const dialog = page.getByRole('dialog', { name: 'Asignar a Carla' });
  await expect(dialog).toContainText('El contacto pasa a Carla');
  await dialog.getByRole('button', { name: 'Asignar a Carla' }).click();
  await expect(page.getByRole('article', { name: /Fila 30 de contacts-30\.csv/ })).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Conflictos resueltos' })).toContainText(
    'Asignada a Carla',
  );

  await context.clearCookies();
  await signInAs(context, baseURL as string, 'carla');
  await page.goto('/crm/contactos?q=Recruiter');
  await expect(page.getByRole('link', { name: 'Recruiter Test' })).toBeVisible();
  await page.goto('/crm/importar');
  await expect(page.getByText('Resuelta: asignada a ti')).toBeVisible();
});
