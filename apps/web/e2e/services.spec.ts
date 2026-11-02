import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

for (const [from, to] of [
  ['/empresas', '/servicios#por-hora'],
  ['/negocios', '/servicios#packs'],
  ['/en/companies', '/en/services#hourly'],
  ['/en/business', '/en/services#packs'],
] as const) {
  test(`${from} answers 301 to ${to}`, async ({ request }) => {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe(to);
  });
}

test('four ways, one primary action each and the prices in the first screens of a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/servicios');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  for (const id of ['por-hora', 'proyecto', 'packs', 'contratacion']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator('#por-hora').getByRole('link', { name: /reservar/i }).first()).toBeVisible();
  await expect(page.locator('#packs').getByText('Desde 900 €').first()).toBeAttached();
  await expect(page.getByText(/sin IVA/i).first()).toBeVisible();
  // the table of packs is in the HTML for crawlers, whatever the viewport
  expect(await page.locator('table th[data-pack]').count()).toBe(5);
});

test('English page uses its own anchors and the sticky bar appears with the packs on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/services');
  await expect(page.locator('#hourly')).toHaveCount(1);
  await page.locator('#packs').scrollIntoViewIfNeeded();
  await expect(page.getByRole('group', { name: /quick actions/i })).toBeVisible();
});

test('FAQPage lists only real answers and the services graph carries the five prices', async ({ request }) => {
  const html = await (await request.get('/servicios')).text();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => JSON.parse(m[1]!.replaceAll('\\u003c', '<')));
  const text = JSON.stringify(blocks);
  expect(text).toContain('FAQPage');
  expect(text).not.toMatch(/FAQPage[^]*\{\{DATO/);
  expect(text).toContain('"minPrice":900');
  expect(text).toContain('"unitCode":"HUR"');
});

for (const [path, name] of [['/servicios', 'services-es'], ['/en/services', 'services-en']] as const) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page, { name, freeze: true });
  });
}
