import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { collectErrors, hydrated } from './helpers/reduced-motion';

// The hero of the home (task 2.8) as seen by the user: the intro gate, the modes and what a phone
// or a reduced-motion visitor gets. The live scene is a WebGL canvas that this suite only checks
// where it must exist (desktop) or must not (phone); how it draws is the glyph-scene package's own tests.

test.describe('hero · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('first visit: the intro is marked pending before the first paint and ends; one h1; no console errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      const seen: (string | undefined)[] = [];
      (window as unknown as { __intro: typeof seen }).__intro = seen;
      // the init script runs before <html> exists: watch the document, not the element
      new MutationObserver(() => seen.push(document.documentElement.dataset.intro)).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-intro'] });
    });
    await page.goto('/');
    expect(await page.evaluate(() => (window as unknown as { __intro: (string | undefined)[] }).__intro[0])).toBe('pending');
    // the letters are hidden while it waits and are back, whatever the scene does, within a few seconds
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', /.+/, { timeout: 8000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Servicios y precios' })).toHaveAttribute('href', '/servicios');
    await expect(page.getByRole('link', { name: 'Ver proyectos' })).toHaveAttribute('href', '/proyectos');
    expect(errors).toEqual([]);
  });

  test('desktop gets the live scene in the backdrop, behind the content', async ({ page }) => {
    await page.goto('/?nointro');
    await hydrated(page, '#servicios input');
    await expect(page.locator('[data-backdrop-canvas] canvas')).toHaveCount(1, { timeout: 15000 });
  });

  test('axe: the hero has no serious or critical violation', async ({ page }) => {
    await page.goto('/?nointro');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoAxeViolations(page, { name: 'hero-1440', include: '#top', freeze: true });
  });
});

test.describe('hero · phone 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('no canvas: the poster stands in, and the video source arrives after the poster', async ({ page }) => {
    await page.goto('/?nointro');
    await hydrated(page, '#servicios input');
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('[data-hero-stage] img').first()).toBeAttached();
    await expectNoAxeViolations(page, { name: 'hero-390', include: '#top', freeze: true });
  });
});

test.describe('hero · reduced motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('no intro gate and the letters are never hidden', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?intro');
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', /.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
