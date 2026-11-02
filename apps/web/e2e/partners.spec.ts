import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

test('partners page: one h1, quick contact ways, the partner assistant case and no price', async ({ page }) => {
  await page.goto('/partners');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const quick = page.getByTestId('quick-contact');
  await expect(quick.getByRole('link')).toHaveCount(2); // WhatsApp and the call (email and LinkedIn are pending data)
  await expect(page.getByRole('link', { name: /asistente/i })).toHaveAttribute('href', /\/chat\?case=partner/);
  await expect(page.getByRole('main').getByText(/€/)).toHaveCount(0);
});

test('partners page has the agency form with its company field and the Service graph without an Offer', async ({ page, request }) => {
  await page.goto('/partners');
  await expect(page.getByLabel('Agencia o empresa')).toBeVisible();
  const html = await (await request.get('/partners')).text();
  expect(html).toContain('BusinessAudience');
  expect(html).not.toContain('"@type":"Offer"');
});

for (const [path, name] of [['/partners', 'partners-es'], ['/en/partners', 'partners-en']] as const) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page, { name, freeze: true });
  });
}
