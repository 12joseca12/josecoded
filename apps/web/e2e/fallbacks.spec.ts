import { expect, test } from '@playwright/test';

import { hydrated } from './helpers/reduced-motion';

// WebKit only (E2E_WEBKIT=1, see playwright.config.ts): what Safari does without the modern CSS
// (working-agreements §6). Stacked Projects (no scroll-driven animation), an expanded cell that
// changes without a View Transition, and an opaque header (no backdrop-filter blur needed to read).

test.use({ viewport: { width: 1440, height: 900 } });

test('Projects is a stacked column, never a sideways scroll', async ({ page }) => {
  await page.goto('/');
  await hydrated(page, '#servicios input');
  const sticky = page.locator('[data-tour-sticky]');
  const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
  if (supported) test.skip(true, 'this engine pins the tour: the fallback is not what runs');
  expect(await sticky.evaluate((el) => getComputedStyle(el).position)).toBe('static');
  const cards = page.locator('#proyectos [data-tcard]');
  const boxes = await cards.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
  expect(boxes).toHaveLength(3);
  expect(boxes[1]!.top).toBeGreaterThan(boxes[0]!.bottom - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the header has an opaque band once the page scrolls, with or without blur', async ({ page }) => {
  await page.goto('/');
  await hydrated(page, '#servicios input');
  await page.evaluate(() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'instant' }));
  const header = page.getByRole('banner');
  await expect(header).toHaveAttribute('data-scrolled', 'true');
  await expect(header).toHaveCSS('background-color', /^rgba?\(7, 6, 15/);
});

test('the page works without View Transitions: the palette and the stack do not depend on them', async ({ page }) => {
  await page.goto('/');
  await hydrated(page, '#servicios input');
  await page.keyboard.press('Meta+k');
  await expect(page.getByRole('dialog', { name: 'Ir a' })).toBeVisible();
});
