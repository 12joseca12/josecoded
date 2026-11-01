import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

// The public shell (task 2.3): skip link, header, ☰ menu, language switch, ⌘K trigger and footer.
// Axe blocks on serious/critical (working-agreements §16.4). The `toHaveScreenshot` assertions at the
// end need baselines from the `update-snapshots` workflow (spec `shell.spec.ts`), never from a local run.

const wcag = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function blockingViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(wcag).analyze();
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

// Interactions need React hydrated: the first click or key press before that does nothing.
async function open(page: Page, path: string) {
  await page.goto(path);
  // React stores its props on a DOM node when it hydrates it
  await page.waitForFunction(() =>
    Object.keys(document.querySelector('header button') ?? {}).some((key) => key.startsWith('__reactProps')),
  );
}

const header = (page: Page) => page.getByRole('banner');
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menú' });

test.describe('desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the first tab stop is the skip link and it moves to <main>', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('the bar has the sections that have content (Lab and Blog show outside production; e2e builds with NEXT_PUBLIC_SITE_ENV=development), language, search, chat and login, and no Contacto', async ({ page }) => {
    await page.goto('/');
    const nav = header(page).getByRole('navigation', { name: 'Principal' });
    await expect(nav.getByRole('link')).toHaveText(['Sobre mí', 'Servicios', 'Proyectos', 'Lab', 'Blog']);
    await expect(header(page).getByRole('link', { name: 'Contacto' })).toHaveCount(0);
    await expect(header(page).getByRole('link', { name: 'Para agencias' })).toBeHidden();
    await expect(header(page).getByRole('link', { name: 'English' })).toHaveText('EN');
    await expect(header(page).getByRole('button', { name: 'Buscar' })).toBeVisible();
    await expect(header(page).getByRole('link', { name: 'Abrir el chat' })).toHaveAttribute('href', '/chat');
    await expect(header(page).getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/auth/login');
    await expect(menuButton(page)).toBeHidden();
  });

  test('the page of the current section carries aria-current', async ({ page }) => {
    await page.goto('/servicios');
    const nav = header(page).getByRole('navigation', { name: 'Principal' });
    await expect(nav.getByRole('link', { name: 'Servicios' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Proyectos' })).not.toHaveAttribute('aria-current', /.+/);
  });

  test('the language switch goes to the translated URL and back', async ({ page }) => {
    await open(page, '/servicios');
    await header(page).getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/services$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(header(page).getByRole('link', { name: 'Sobre mí' })).toHaveCount(0);
    await header(page).getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  // the palette (task 2.16) registers itself with the shell: the trigger and ⌘K / Ctrl+K are live
  test('the search trigger opens the palette and Ctrl+K toggles it (aria-expanded false -> true -> false)', async ({ page }) => {
    await open(page, '/');
    const search = header(page).getByRole('button', { name: 'Buscar' });
    await expect(search).toHaveAttribute('aria-expanded', 'false');
    await expect(search).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(search).not.toHaveAttribute('aria-disabled', /.*/);
    await page.keyboard.press('Control+k');
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('dialog', { name: 'Ir a' })).toBeVisible();
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Control+k');
    await expect(search).toHaveAttribute('aria-expanded', 'false');
    await search.click();
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(search).toHaveAttribute('aria-expanded', 'false');
    await expect(search).toBeFocused();
  });

  test('the brand goes to #top on the home and to the home elsewhere', async ({ page }) => {
    await open(page, '/');
    await expect(header(page).getByRole('link', { name: 'josecoded, inicio' })).toHaveAttribute('href', '#top');
    await open(page, '/servicios');
    await expect(header(page).getByRole('link', { name: 'josecoded, inicio' })).toHaveAttribute('href', '/');
  });

  test('the header gains its band once the page scrolls past 80 px', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => (document.body.style.minHeight = '3000px'));
    await expect(header(page)).not.toHaveAttribute('data-scrolled', /.+/);
    await page.mouse.wheel(0, 400);
    await expect(header(page)).toHaveAttribute('data-scrolled', 'true');
    // the band fades in (200 ms): wait for the colour instead of reading it at once
    await expect(header(page)).toHaveCSS('background-color', /^rgba?\(7, 6, 15/);
    await page.mouse.wheel(0, -400);
    await expect(header(page)).not.toHaveAttribute('data-scrolled', /.+/);
  });

  test('the footer lists the sections, agencies, contact, client area and legal with the review date', async ({
    page,
  }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('navigation', { name: 'Pie' }).getByRole('link')).toHaveText([
      'Sobre mí',
      'Servicios',
      'Proyectos',
      'Lab',
      'Blog',
      'Para agencias',
      'Contacto',
      'Área de clientes',
      'Legal',
    ]);
    await expect(footer.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    await expect(footer.locator('time')).toHaveText(/\d{1,2} \S+ \d{4}/);
  });

  for (const path of ['/', '/en', '/servicios']) {
    test(`${path}: no serious or critical axe violations`, async ({ page }) => {
      await page.goto(path);
      expect(await blockingViolations(page)).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await blockingViolations(page)).toEqual([]);
    });
  }
});

test.describe('mobile 360', () => {
  test.use({ viewport: { width: 360, height: 812 } });

  test('the bar shows search and chat as icons, login and the ☰ button, without overflow', async ({ page }) => {
    await page.goto('/');
    await expect(header(page).getByRole('navigation', { name: 'Principal' })).toBeHidden();
    await expect(header(page).getByRole('link', { name: 'English' }).first()).toBeHidden();
    await expect(menuButton(page)).toBeVisible();
    const box = await header(page).getByRole('link', { name: 'Abrir el chat' }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('the menu is a disclosure that closes by every way and returns the focus', async ({ page }) => {
    await open(page, '/');
    const button = menuButton(page);
    const panel = page.getByRole('navigation', { name: 'Menú' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();

    // Escape
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByRole('link')).toHaveText([
      'Sobre mí',
      'Servicios',
      'Proyectos',
      'Lab',
      'Blog',
      'Para agencias',
      'Contacto',
    ]);
    await panel.getByRole('link', { name: 'Servicios' }).focus();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();

    // a tap outside
    await button.click();
    await page.mouse.click(20, 400);
    await expect(panel).toBeHidden();

    // focus outside: Tab from the last control of the panel walks on to the page
    await button.click();
    await page.getByRole('group', { name: 'Idioma' }).getByRole('link', { name: 'English' }).focus();
    await page.keyboard.press('Tab');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();

    // the wheel
    await page.evaluate(() => (document.body.style.minHeight = '3000px'));
    await button.click();
    await expect(panel).toBeVisible();
    await page.mouse.move(20, 600);
    await page.mouse.wheel(0, 200);
    await expect(panel).toBeHidden();

    // choosing a link
    await button.click();
    await panel.getByRole('link', { name: 'Servicios' }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('growing the window past 67.5rem closes the open menu', async ({ page }) => {
    await open(page, '/');
    // at 1200 px the button is display:none, so it is found by CSS, not by role
    const button = page.locator('button[aria-label="Menú"]');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('the menu holds the segmented language switch with the current language marked', async ({ page }) => {
    await open(page, '/servicios');
    await menuButton(page).click();
    const group = page.getByRole('group', { name: 'Idioma' });
    await expect(group.locator('[aria-current]')).toHaveText('Español');
    await group.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/services$/);
  });

  test('axe: closed and open, with and without reduced motion', async ({ page }) => {
    await open(page, '/en');
    expect(await blockingViolations(page)).toEqual([]);
    await page.getByRole('button', { name: 'Menu' }).click();
    expect(await blockingViolations(page)).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await blockingViolations(page)).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 360, height: 812 } });

  test('☰ becomes a link to the footer index and ⌘K disappears', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Menú: ir al índice del pie' })).toBeVisible();
    await expect(menuButton(page)).toBeHidden();
    await expect(header(page).getByRole('button', { name: 'Buscar' })).toBeHidden();
    await expect(page.getByRole('contentinfo')).toHaveAttribute('id', 'pie');
  });
});

test.describe('page transition', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('navigating between pages keeps the header mounted (only the page swaps)', async ({ page }) => {
    await open(page, '/');
    await header(page).evaluate((el) => el.setAttribute('data-probe', 'same-node'));
    await header(page).getByRole('link', { name: 'Servicios' }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Servicios');
    await expect(header(page)).toHaveAttribute('data-probe', 'same-node');
  });
});

// Reference screenshots: baselines come from the update-snapshots workflow (CI Chromium).
for (const width of [360, 1440] as const) {
  test.describe(`screenshots ${width}`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });

    test('header and footer', async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'main { visibility: hidden; }' });
      await expect(header(page)).toHaveScreenshot(`header-${width}.png`);
      await expect(page.getByRole('contentinfo')).toHaveScreenshot(`footer-${width}.png`);
    });
  });
}

test.describe('screenshot menu 360', () => {
  test.use({ viewport: { width: 360, height: 812 }, reducedMotion: 'reduce' });

  test('menu open', async ({ page }) => {
    await page.goto('/');
    await page.addStyleTag({ content: 'main { visibility: hidden; }' });
    await menuButton(page).click();
    await expect(page.getByRole('navigation', { name: 'Menú' })).toBeVisible();
    await expect(page).toHaveScreenshot('menu-open-360.png', { clip: { x: 0, y: 0, width: 360, height: 520 } });
  });
});
