import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

for (const [path, heading, lang] of [
  ['/sobre-mi', 'Stack y formación', 'es'],
  ['/en/about', 'Stack and education', 'en'],
] as const) {
  test(`${path}: one h1, the #stack section and the principles`, async ({ page }) => {
    await page.goto(`${path}#stack`);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('#stack')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: new RegExp(heading) })).toBeVisible();
    await expect(page.locator('#como-trabajo li')).toHaveCount(3);
  });
}

test('the author page carries a ProfilePage and no logos of third parties', async ({ request, page }) => {
  const html = await (await request.get('/sobre-mi')).text();
  expect(html).toContain('"@type":"ProfilePage"');
  await page.goto('/sobre-mi');
  await expect(page.locator('main img')).toHaveCount(0);
});

for (const [path, name] of [['/sobre-mi', 'about-es'], ['/en/about', 'about-en']] as const) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page, { name, freeze: true });
  });
}
