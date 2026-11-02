import { expect, test } from '@playwright/test';

// Block B06: what the blog adds around itself. The build under test is a development one, where Lab and Blog are both
// on; the rule «fewer than three real guides, no Blog» is covered in unit tests (lib/content/nav.test.ts), because the
// e2e build cannot change the content index.

test('feed.xml is RSS 2.0 with the channel link and a self link, in both languages', async ({ request }) => {
  for (const [path, lang] of [
    ['/feed.xml', 'es'],
    ['/en/feed.xml', 'en'],
  ] as const) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type']).toContain('application/rss+xml');
    const xml = await res.text();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(`<language>${lang}</language>`);
    expect(xml).toMatch(/<link>https?:\/\/[^<]+\/blog<\/link>/);
    expect(xml).toContain(`${path}" rel="self"`);
    expect(xml).not.toContain('{{DATO');
  }
});

test('the header has one Lab/Blog link and the footer keeps Lab and Blog apart', async ({ page }) => {
  await page.goto('/servicios');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Lab/Blog' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Blog', exact: true })).toHaveCount(0);
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Lab', exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Blog', exact: true })).toBeVisible();
});

test('a guide ends with the notify-me form: a labelled email field and its button', async ({ page }) => {
  await page.goto('/blog');
  await page.locator('main a[href^="/blog/"]').first().click();
  const form = page.getByRole('form', { name: 'Avísame de nuevas guías' });
  await expect(form.getByLabel('Correo electrónico')).toBeEnabled();
  await expect(form.getByRole('button', { name: 'Avisarme' })).toBeVisible();
});
