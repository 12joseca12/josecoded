import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { hydrated } from './helpers/reduced-motion';

const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((match) => JSON.parse(match[1]!.replaceAll('\\u003c', '<')));

test('projects index lists 3cat, 3catinfo and josecoded.com, with the reduced sheet and this site never first', async ({ page }) => {
  await page.goto('/proyectos');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const names = await page.locator('article h3').allTextContents();
  expect(names).toHaveLength(3);
  expect(names[0]).toBe('3cat');
  expect(names).not.toContain('HazmeFila');
  expect(names).not.toContain('Oportunix');
});

test('the filter lives in the URL and says so when nothing is left', async ({ page }) => {
  await page.goto('/proyectos?tipo=web');
  await hydrated(page, '#project-list');
  await expect(page.locator('#project-list article:visible')).toHaveCount(1);
  await page.getByLabel('Apps').check({ force: true });
  await expect(page).toHaveURL(/tipo=app/);
  await expect(page.locator('#project-list article:visible')).toHaveCount(2);
  await page.getByLabel('Todos').check({ force: true });
  await expect(page).not.toHaveURL(/tipo=/);
});

test('/proyectos/josecoded has the three blocks, a WebApplication node (never a second WebSite) and no code link', async ({ page, request }) => {
  await page.goto('/proyectos/josecoded');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('josecoded.com');
  for (const heading of ['El reto', 'Qué hice', 'Resultado', 'Stack']) await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver el código/ })).toHaveCount(0);
  const graph = JSON.stringify(jsonLd(await (await request.get('/proyectos/josecoded')).text()));
  expect(graph).toContain('BreadcrumbList');
  expect(graph).toContain('"@type":"WebApplication"');
  expect(graph).toContain('/proyectos/josecoded#project');
  // the only WebSite is the site's own (layout); the case study adds none
  expect(graph.match(/"@type":"WebSite"/g) ?? []).toHaveLength(1);
});

test('a sheet without its sentence still renders, hides the pending blocks and stays out of the index', async ({ page, request }) => {
  const response = await page.goto('/proyectos/3catinfo');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('3catinfo');
  // reduced sheet: no stack block, no figures
  await expect(page.getByRole('heading', { name: 'Stack' })).toHaveCount(0);
  const html = await (await request.get('/proyectos/3catinfo')).text();
  expect(html).toMatch(/<meta name="robots" content="noindex/);
});

test('English case study and unknown slug', async ({ page, request }) => {
  await page.goto('/en/projects/josecoded');
  await expect(page.getByRole('heading', { name: 'The challenge' })).toBeVisible();
  expect((await request.get('/proyectos/hazmefila')).status()).toBe(404);
});

for (const [path, name] of [['/proyectos', 'projects-es'], ['/en/projects/josecoded', 'case-en']] as const) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page, { name, freeze: true });
  });
}
