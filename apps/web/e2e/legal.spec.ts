import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';

for (const [path, heading] of [
  ['/legal/aviso-legal', 'Aviso legal'],
  ['/legal/privacidad', 'Política de privacidad'],
  ['/legal/cookies', 'Política de cookies'],
  ['/en/legal/notice', 'Legal notice'],
  ['/en/legal/privacy', 'Privacy policy'],
  ['/en/legal/cookies', 'Cookie policy'],
] as const) {
  test(`${path}: one h1, an index to every section and no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    const sections = await page.locator('main section[id]').count();
    expect(sections).toBeGreaterThan(2);
    await expect(page.getByRole('navigation', { name: /Contenido|Contents/ }).getByRole('link')).toHaveCount(sections);
    await expectNoAxeViolations(page, { name: `legal-${path.replaceAll('/', '-')}`, freeze: true });
  });
}

test('the English texts say the Spanish one is the binding one', async ({ page }) => {
  await page.goto('/en/legal/privacy');
  await expect(page.getByText(/Spanish version is the legally binding one/).first()).toBeVisible();
});

test('a 404 keeps the site frame, a code above the title and useful links in its language', async ({ page }) => {
  const response = await page.goto('/en/nope');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main').getByText('404', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('main').getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/contact');
});
