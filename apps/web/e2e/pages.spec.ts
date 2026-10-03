import { expect, test } from '@playwright/test';

// Every page (404s included) has the right <html lang>, a non-empty <title>, a <main> with an
// <h1>, and the 404s link back to the home of their own language.
//
// Next answers an on-demand notFound() with status 404 and a client-rendered shell (its HTML has
// no <html lang>/<h1>), so the 404s are asserted in the browser, after hydration. Pages that
// render fine on the server are also checked on the raw HTML.
const title = (html: string) => /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';

const notFound: [path: string, lang: 'es' | 'en', home: string, heading: string][] = [
  ['/nope', 'es', '/', 'Página no encontrada'],
  ['/en/nope', 'en', '/en', 'Page not found'],
  ['/a/b/c', 'es', '/', 'Página no encontrada'],
  ['/en/a/b', 'en', '/en', 'Page not found'],
  ['/negocios/x', 'es', '/', 'Página no encontrada'],
  // outside any locale route (a file-like path): the root not-found, default language
  ['/foo.txt', 'es', '/', 'Página no encontrada'],
];

for (const [path, lang, home, heading] of notFound) {
  test(`404 ${path}: status 404, lang=${lang}, title, h1 and a link home`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    expect(await page.title()).not.toBe('');
    await expect(page.getByRole('main')).toBeVisible();
    const link = page.getByRole('main').getByRole('link');
    await expect(link).toHaveAttribute('href', home);
  });
}

const titled: [path: string, lang: string, expected: RegExp][] = [
  ['/', 'es', /^josecoded$/],
  ['/en', 'en', /^josecoded$/],
  ['/negocios', 'es', /^Negocios · josecoded$/],
  ['/en/business', 'en', /^Business · josecoded$/],
];

for (const [path, lang, expected] of titled) {
  test(`${path} has <html lang=${lang}> and the <title> from messages`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<html lang="${lang}"`);
    expect(title(html)).toMatch(expected);
  });
}

test('the home link of a 404 works', async ({ page }) => {
  await page.goto('/en/nope');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/en$/);
  expect(await page.title()).toBe('josecoded');
});
