import { expect, test } from '@playwright/test';

// Permanent URL matrix of task 0.1/1.5, run against the local preview (wrangler dev --local on
// .open-next). Slugs are translated in English (v2.3): /en/business, not /en/negocios.
const cases: [path: string, status: number, lang?: string][] = [
  ['/', 200, 'es'],
  ['/en', 200, 'en'],
  ['/negocios', 200, 'es'],
  ['/en/business', 200, 'en'],
  ['/es/negocios', 308],
  ['/en/negocios', 308],
  ['/no-existe', 404],
  ['/en/no-existe', 404],
  ['/en/', 308],
  ['/negocios/', 308],
];

for (const [path, status, lang] of cases) {
  test(`GET ${path} -> ${status}`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(status);
    if (lang) expect(await res.text()).toContain(`<html lang="${lang}"`);
  });
}

test('the redirects point at the canonical URL', async ({ request }) => {
  const location = async (path: string) =>
    new URL((await request.get(path, { maxRedirects: 0 })).headers()['location'] ?? '', 'http://x')
      .pathname;
  expect(await location('/es/negocios')).toBe('/negocios');
  expect(await location('/en/negocios')).toBe('/en/business');
  expect(await location('/en/')).toBe('/en');
  expect(await location('/negocios/')).toBe('/negocios');
});

test('every non-canonical URL reaches its canonical form in one hop', async ({ request }) => {
  for (const [from, to] of [
    ['/es/', '/'],
    ['/es/negocios/', '/negocios'],
    ['/en/negocios/', '/en/business'],
    ['/en/negocios', '/en/business'],
    ['/en/', '/en'],
    ['/negocios/', '/negocios'],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    const location = new URL(res.headers()['location'] ?? '', 'http://x').pathname;
    expect(location, from).toBe(to);
    // the target itself must not redirect again
    const next = await request.get(to, { maxRedirects: 0 });
    expect(next.status(), `${from} -> ${to}`).toBe(200);
  }
});

test('translated slugs redirect even when the page does not exist yet', async ({ request }) => {
  for (const [from, to] of [
    ['/en/sobre-mi', '/en/about'],
    ['/en/contacto', '/en/contact'],
    ['/en/proyectos', '/en/projects'],
    ['/en/empresas', '/en/companies'],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers()['location'] ?? '', 'http://x').pathname).toBe(to);
  }
});
