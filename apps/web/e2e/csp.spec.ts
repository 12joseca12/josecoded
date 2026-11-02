import { expect, test } from '@playwright/test';

// Security headers and the Content-Security-Policy by hash. The worker hashes the inline scripts of each HTML response;
// a page that works with that policy produces no `securitypolicyviolation`.

const PAGES = ['/', '/en', '/servicios', '/en/services', '/this-page-does-not-exist'];

test('every HTML response carries the policy, HSTS and the rest of the hardening headers', async ({ request }) => {
  for (const path of PAGES) {
    const res = await request.get(path);
    const headers = res.headers();
    const csp = headers['content-security-policy'] ?? '';
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).toContain("object-src 'none'");
    // script-src: same-origin files and exact hashes, never unsafe-inline or unsafe-eval
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src ')) ?? '';
    expect(scriptSrc, path).toMatch(/'sha256-[A-Za-z0-9+/=]+'/);
    expect(scriptSrc, path).not.toMatch(/unsafe-(inline|eval)/);
    expect(headers['strict-transport-security'], path).toMatch(/max-age=\d+/);
    expect(headers['x-content-type-options'], path).toBe('nosniff');
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy'], path).toContain('camera=()');
    expect(headers['cross-origin-opener-policy'], path).toBe('same-origin');
  }
});

test('static assets get the hardening headers from public/_headers', async ({ request }) => {
  const res = await request.get('/hero/poster.webp');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['strict-transport-security']).toMatch(/max-age=\d+/);
});

for (const path of PAGES) {
  test(`${path} runs under the policy without violations (intro, hero, menu)`, async ({ page }) => {
    const problems: string[] = [];
    await page.addInitScript(() => {
      const w = window as unknown as { __csp: string[] };
      w.__csp = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        w.__csp.push(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    page.on('console', (message) => {
      if (/content security policy|refused to (load|execute|apply|connect)/i.test(message.text())) problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

    await page.goto(`${path}${path === '/' || path === '/en' ? '?intro' : ''}`);
    // the intro, the hero scene and the lazy chunks all start after load
    await page.waitForTimeout(4000);
    const menu = page.getByRole('button', { name: /^(Menú|Menu)$/ });
    if (await menu.isVisible()) {
      await menu.click();
      await page.keyboard.press('Escape');
    }
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);

    const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    expect(violations).toEqual([]);
    expect(problems).toEqual([]);
  });
}
