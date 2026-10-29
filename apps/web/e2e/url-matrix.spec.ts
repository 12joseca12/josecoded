import { expect, test } from '@playwright/test';

// Permanent URL matrix of task 0.1/1.5, run against the local preview (wrangler dev --local on
// .open-next). Slugs are translated in English (v2.3): /en/business, not /en/negocios.
const cases: [path: string, status: number, lang?: string][] = [
  ['/', 200, 'es'],
  ['/en', 200, 'en'],
  ['/servicios', 200, 'es'],
  ['/en/services', 200, 'en'],
  ['/es/servicios', 308],
  ['/en/servicios', 308],
  // retired pages (P1, P4): a real 301 to /servicios
  ['/negocios', 301],
  ['/empresas', 301],
  ['/en/business', 301],
  ['/en/companies', 301],
  ['/auth', 308],
  ['/no-existe', 404],
  ['/en/no-existe', 404],
  ['/en/', 308],
  ['/servicios/', 308],
  // deep Spanish paths must 404, never 500
  ['/servicios/x', 404],
  ['/a/b/c', 404],
  ['/legal/aviso-legal', 404],
  // localized routes whose page arrives in a later task: 404 in both languages, never 500
  ['/area-clientes', 404],
  ['/en/client-area', 404],
  ['/en/client-area/tasks', 404],
  ['/en/a/b', 404],
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
  expect(await location('/es/servicios')).toBe('/servicios');
  expect(await location('/en/servicios')).toBe('/en/services');
  expect(await location('/en/')).toBe('/en');
  expect(await location('/servicios/')).toBe('/servicios');
});

test('every non-canonical URL reaches its canonical form in one hop', async ({ request }) => {
  for (const [from, to] of [
    ['/es/', '/'],
    ['/es/servicios/', '/servicios'],
    ['/en/servicios/', '/en/services'],
    ['/en/servicios', '/en/services'],
    ['/en/', '/en'],
    ['/servicios/', '/servicios'],
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
    ['/en/servicios', '/en/services'],
    ['/en/area-clientes', '/en/client-area'],
    ['/en/area-clientes/tareas', '/en/client-area/tasks'],
    ['/en/area-clientes/pack/ampliar', '/en/client-area/plan/upgrade'],
    ['/en/auth/registro', '/en/auth/sign-up'],
    ['/en/perfil', '/en/profile'],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers()['location'] ?? '', 'http://x').pathname).toBe(to);
  }
});

test('the retired pages land on the anchor of their successor', async ({ request }) => {
  for (const [from, to] of [
    ['/negocios', '/servicios#packs'],
    ['/empresas', '/servicios#por-hora'],
    ['/es/negocios', '/servicios#packs'],
    ['/en/business', '/en/services#packs'],
    ['/en/companies', '/en/services#hourly'],
    ['/en/negocios', '/en/services#packs'],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(res.headers()['location'], from).toBe(to);
    const next = await request.get(to.split('#')[0] ?? to, { maxRedirects: 0 });
    expect(next.status(), `${from} -> ${to}`).toBe(200);
  }
});

test('every spelling of the bare /auth reaches the login in one hop', async ({ request }) => {
  for (const [from, to] of [
    ['/auth', '/auth/login'],
    ['/auth/', '/auth/login'],
    ['/es/auth', '/auth/login'],
    ['/es/auth/', '/auth/login'],
    ['/en/auth', '/en/auth/login'],
    ['/en/auth/', '/en/auth/login'],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers()['location'] ?? '', 'http://x').pathname, from).toBe(to);
  }
});

test('dynamic children inherit the translated prefix', async ({ request }) => {
  const redirect = await request.get('/en/proyectos/hazmefila', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(new URL(redirect.headers()['location'] ?? '', 'http://x').pathname).toBe(
    '/en/projects/hazmefila',
  );
  // the page arrives in a later task: 404, never 500
  for (const path of ['/en/projects/hazmefila', '/proyectos/hazmefila', '/en/client-area/tasks/7']) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
  }
});
