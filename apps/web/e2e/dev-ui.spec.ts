import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Screenshot specs inject a stylesheet (addStyleTag) to freeze motion; the site's CSP (style-src 'self')
// would block it. CSP itself is covered by csp.spec.ts, which never bypasses it.
test.use({ bypassCSP: true });

// The /dev/ui catalogue (working-agreements §15.4, §16.4): every primitive of components/ui ×
// variants × sizes × states. The build of this suite sets NEXT_PUBLIC_DEV_UI=1 (as ci.yml does).
// Axe is blocking for serious/critical; one reference screenshot per primitive at 360 and 1440
// (e2e/dev-ui.spec.ts-snapshots/). Re-generate them on purpose with `pnpm e2e -- --update-snapshots`.

const primitives = [
  'Button',
  'ArrowLink',
  'Icon',
  'IconTile',
  'Kbd',
  'Chip',
  'LiveDot',
  'Pending',
  'Surface',
  'TwoToneHeading',
  'Typography',
] as const;

const widths = [360, 1440] as const;

const wcag = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function blockingViolations(page: import('@playwright/test').Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(wcag).analyze();
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

for (const path of ['/dev/ui', '/en/dev/ui']) {
  test(`${path}: no serious or critical axe violations (desktop, mobile, reduced motion)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      expect(await blockingViolations(page), `${width}px`).toEqual([]);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await blockingViolations(page), 'reduced motion').toEqual([]);
  });
}

test('the catalogue is not indexable and has one h1 and a main landmark', async ({ page }) => {
  await page.goto('/dev/ui');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('main')).toBeVisible();
});

test('Tab reaches the first button and shows the violet focus ring', async ({ page }) => {
  await page.goto('/dev/ui');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((el) => {
    const style = getComputedStyle(el);
    return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
  });
  expect(outline.style).toBe('solid');
  expect(outline.width).toBe('2px');
  expect(outline.color).toBe('rgb(185, 173, 255)'); // --violet-soft
});

test('a disabled button is out of the tab order and does not scale', async ({ page }) => {
  await page.goto('/dev/ui');
  const disabled = page.getByRole('button', { name: 'Enviar' }).first();
  await expect(disabled).toBeDisabled();
  expect(await disabled.evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5');
});

for (const width of widths) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const name of primitives) {
      test(`${name}`, async ({ page }) => {
        await page.goto('/dev/ui');
        await expect(page.locator(`[data-primitive="${name}"]`)).toHaveScreenshot(`${name}-${width}.png`);
      });
    }

    test('Backdrop (light field and grain, at rest)', async ({ page }) => {
      await page.goto('/dev/ui');
      await page.addStyleTag({ content: 'main { visibility: hidden; }' });
      await expect(page).toHaveScreenshot(`Backdrop-${width}.png`);
    });
  });
}
