import { expect, test } from '@playwright/test';

// Task 2.11: what crawlers and models read. The build under test is a development one (both optional sections on).

test('robots.txt names the AI crawlers, hides the private areas and points at the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const text = await res.text();
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
    expect(text).toContain(`User-Agent: ${bot}`);
  }
  for (const path of ['/admin', '/area-clientes', '/en/client-area', '/auth', '/perfil', '/en/profile']) {
    expect(text).toContain(`Disallow: ${path}\n`);
  }
  expect(text).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test('sitemap.xml lists both languages with hreflang and no private route', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('hreflang="en"');
  expect(xml).toContain('hreflang="x-default"');
  expect(xml).toMatch(/<loc>[^<]*\/en\/services<\/loc>/);
  for (const hidden of ['/auth', '/perfil', '/area-clientes', '/admin', '/chat', '/dev']) expect(xml).not.toContain(hidden);
});

test('llms.txt and llms-full.txt are plain text with prices and no pending marker', async ({ request }) => {
  for (const path of ['/llms.txt', '/llms-full.txt']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('# josecoded');
    expect(text).toContain('40 €/h');
    expect(text).not.toContain('{{DATO');
  }
});

for (const [path, lang] of [
  ['/', 'es'],
  ['/en', 'en'],
] as const) {
  test(`the home ${path} has a description and a JSON-LD graph without SearchAction`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /900|€900/);
    const graph = await page.locator('script[type="application/ld+json"]').first().textContent();
    const nodes = (JSON.parse(graph ?? '{}') as { '@graph': { '@type': string | string[] }[] })['@graph'];
    const types = nodes.flatMap((node) => [node['@type']].flat());
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
    expect(graph).not.toContain('SearchAction');
    expect(graph).not.toContain('{{DATO');
  });
}
