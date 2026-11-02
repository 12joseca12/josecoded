import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { collectErrors, hydrated } from './helpers/reduced-motion';

import type { Page } from '@playwright/test';

// The home of home-v7 (tasks 2.10–2.17): one test per scene (About, Services, Projects, Lab/Blog,
// closing), run at 1440, at 360 and with reduced motion, each ending with axe over the scene
// (serious and critical fail; the rest goes to test-results/axe-<scene>.json). Then paging, keyboard
// and the palette. Lab and Blog show outside production: e2e builds with NEXT_PUBLIC_SITE_ENV=development.
// Pending texts ({{DATO}}) are asserted as markers, never as final copy.

const setups = [
  { name: '1440', viewport: { width: 1440, height: 900 }, reduced: false },
  { name: '360', viewport: { width: 360, height: 640 }, reduced: false },
  { name: '1440-reduced', viewport: { width: 1440, height: 900 }, reduced: true },
] as const;

async function openHome(page: Page, scene: string) {
  await page.goto('/');
  await hydrated(page, '#servicios input');
  const target = page.locator(`#${scene}`);
  await target.scrollIntoViewIfNeeded();
  return target;
}

for (const setup of setups) {
  test.describe(`home scenes · ${setup.name}`, () => {
    test.use({ viewport: setup.viewport });

    test.beforeEach(async ({ page }) => {
      if (setup.reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('the page has one h1 and every scene is a section named by its heading', async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      for (const [id, heading] of [
        ['sobre-mi', /Quién hay detrás/],
        ['proyectos', /Proyectos en uso/],
        ['hablamos', /¿Empezamos\?/],
      ] as const) {
        await expect(page.locator(`section#${id}`)).toBeAttached();
        await expect(page.locator(`section#${id}`).getByRole('heading', { level: 2 })).toContainText(heading);
      }
      await expect(page.locator('section#servicios')).toBeAttached();
      await expect(page.locator('section#lab-blog')).toBeAttached();
      expect(errors).toEqual([]);
    });

    test('About: the cell about me, the stack list and the example chat, with the exits', async ({ page }) => {
      const scene = await openHome(page, 'sobre-mi');
      await expect(scene.getByRole('article', { name: 'Sobre mí' })).toBeVisible();
      await expect(scene.getByRole('article', { name: 'Con qué trabajo' }).getByRole('list', { name: /Next\.js, React Native/ })).toBeVisible();
      await expect(scene.getByRole('group', { name: 'Ejemplo de conversación' })).toContainText('Hola Jose, ¿me ayudas con la web de mi negocio?');
      await expect(scene.getByRole('link', { name: 'Conóceme' })).toHaveAttribute('href', '/sobre-mi');
      await expect(scene.getByRole('link', { name: 'Escríbeme' })).toHaveAttribute('href', '/contacto');
      // the stack is listed once; the aria-hidden copies and the reversed band add nothing to the tree
      await expect(scene.getByRole('listitem').filter({ hasText: 'Supabase' })).toHaveCount(1);
      await expectNoAxeViolations(page, { name: `sobre-mi-${setup.name}`, include: '#sobre-mi', freeze: true });
    });

    test('Services: the four ways with the panel of the chosen one, five packs and the two rates', async ({ page }) => {
      const scene = await openHome(page, 'servicios');
      const ways = scene.getByRole('group', { name: 'Cómo trabajar conmigo' });
      await expect(ways.getByRole('radio')).toHaveCount(4);
      await expect(ways.getByRole('radio', { name: /Por horas/ })).toBeChecked();
      await expect(scene.getByRole('link', { name: 'Reservar 20 min' }).first()).toBeVisible();
      // choosing «Abierto a empleo» swaps the panel: the CV or, while it is pending, the call and the assistant
      await ways.getByRole('radio', { name: /Abierto a empleo/ }).check({ force: true });
      await expect(scene.getByRole('link', { name: 'Preguntar al asistente' }).last()).toHaveAttribute('href', '/chat?case=recruiter');
      await expect(scene.getByRole('link', { name: 'Reservar 20 min' }).last()).toBeVisible();
      await ways.getByRole('radio', { name: /Encargo a precio fijo/ }).check({ force: true });
      await expect(scene.getByRole('link', { name: 'Pedir propuesta orientativa' })).toHaveAttribute('href', '/propuesta');

      const packs = scene.getByRole('article', { name: 'Packs' });
      await expect(packs.getByRole('link')).toHaveCount(6); // five packs and «Qué incluye cada pack»
      for (const price of ['900 €', '1.400 €', '2.500 €', '4.200 €', '4.000 €']) {
        await expect(packs.getByRole('link', { name: new RegExp(`desde ${price.replace('.', '\\.')} sin IVA`) })).toHaveCount(1);
      }
      await expect(packs.getByRole('link', { name: /App móvil.*desde 4\.000 € sin IVA/ })).toHaveAttribute('href', '/servicios?pack=P5#packs');

      const rates = scene.getByRole('article', { name: 'Tarifas' });
      await expect(rates.getByText('40 €/h')).toBeVisible();
      await rates.getByRole('radio', { name: 'Encargo' }).check({ force: true });
      await expect(rates.getByText('desde 150 €')).toBeVisible();
      await expect(rates.getByRole('link', { name: 'Encargo a precio fijo' })).toHaveAttribute('href', '/servicios#proyecto');
      await expectNoAxeViolations(page, { name: `servicios-${setup.name}`, include: '#servicios', freeze: true });
    });

    test('Projects: 3cat, 3catinfo and this site, each with its own link; the tour is pinned only where it can be', async ({ page }) => {
      const scene = await openHome(page, 'proyectos');
      await expect(scene.getByRole('article')).toHaveCount(3);
      for (const [name, slug] of [
        ['3cat', '3cat'],
        ['3catinfo', '3catinfo'],
        ['josecoded.com', 'josecoded'],
      ] as const) {
        await expect(scene.getByRole('article', { name, exact: true })).toBeAttached();
        await expect(scene.getByRole('link', { name: `Ver proyecto ${name}`, exact: true })).toHaveAttribute('href', `/proyectos/${slug}`);
      }
      await expect(scene.getByText(/HazmeFila|Oportunix/)).toHaveCount(0);
      const pinned = !setup.reduced && setup.name === '1440';
      const position = await scene.locator('[data-tour-sticky]').evaluate((el) => getComputedStyle(el).position);
      expect(position).toBe(pinned ? 'sticky' : 'static');
      await expectNoAxeViolations(page, { name: `proyectos-${setup.name}`, include: '#proyectos', freeze: true });
    });

    test('Lab/Blog: the demo, two guides and the way to the whole list', async ({ page }) => {
      const scene = await openHome(page, 'lab-blog');
      await expect(scene.getByRole('article', { name: 'Lab' })).toBeVisible();
      await expect(scene.getByRole('article', { name: 'Guía' })).toHaveCount(2);
      await expect(scene.getByRole('link', { name: 'Todas las guías' })).toHaveAttribute('href', '/blog');
      // the miniature of the demo is decorative
      await expect(scene.locator('[aria-hidden="true"]').first()).toBeAttached();
      await expectNoAxeViolations(page, { name: `lab-blog-${setup.name}`, include: '#lab-blog', freeze: true });
    });

    test('Closing: the question, WhatsApp as the one solid action, the call, and the ⌘K hint only with a keyboard', async ({ page }) => {
      const scene = await openHome(page, 'hablamos');
      await expect(scene.getByRole('heading', { level: 2 })).toContainText('¿Empezamos? Cuéntame qué necesitas.');
      await expect(scene.getByRole('link', { name: 'Escribir por WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/34600000000/);
      await expect(scene.getByRole('link', { name: 'Reservar 20 min' })).toHaveAttribute('href', 'https://cal.com/josecoded/20min');
      const keys = scene.locator('kbd');
      await expect(keys).toHaveCount(2);
      // a 360 emulation here is still a fine-pointer desktop browser, so the hint exists; hover:none hides it
      await expect(keys.last()).toHaveText('K');
      await expectNoAxeViolations(page, { name: `hablamos-${setup.name}`, include: '#hablamos', freeze: true });
    });
  });
}

test.describe('keyboard and palette · 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Tab reaches the links and radios of every scene, in order, without a trap', async ({ page }) => {
    await page.goto('/');
    await hydrated(page, '#servicios input');
    const seen = new Set<string>();
    for (let i = 0; i < 120 && seen.size < 6; i += 1) {
      await page.keyboard.press('Tab');
      const scene = await page.evaluate(() => document.activeElement?.closest('main > section')?.id ?? '');
      if (scene) seen.add(scene);
    }
    expect([...seen]).toEqual(expect.arrayContaining(['top', 'sobre-mi', 'servicios', 'proyectos', 'lab-blog', 'hablamos']));
  });

  test('⌘K / Ctrl+K opens the palette over the home and Esc closes it; choosing a command goes there', async ({ page }) => {
    await page.goto('/');
    await hydrated(page, '#servicios input');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Ir a' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.type('agencia');
    await expect(dialog.getByRole('option')).toHaveText(['Para agencias']);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.type('precio');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/servicios#packs$/);
  });

  test('the section indicator is absent in the hero, appears after it and follows the scene in view', async ({ page }) => {
    await page.goto('/');
    await hydrated(page, '#servicios input');
    const indicator = page.getByRole('navigation', { name: 'Secciones de la página' });
    await expect(indicator).toBeHidden();
    await page.evaluate(() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'instant' }));
    await expect(indicator).toBeVisible();
    await expect(indicator.getByRole('link', { name: 'Servicios' })).toHaveAttribute('aria-current', 'true');
    await expect(indicator.getByRole('link')).toHaveCount(5);
  });
});

test.describe('paging', () => {
  test('desktop 1440×900: one wheel gesture goes to the next scene and a contrary one during the glide takes over', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await hydrated(page, '#servicios input');
    await expect(page.locator('html')).toHaveAttribute('data-paging', '');
    const top = (id: string) => page.evaluate((s) => Math.round((document.getElementById(s)?.getBoundingClientRect().top ?? 0) + scrollY), id);
    // the layout is settled (the hero fills the first screen) before the first gesture
    await expect.poll(() => top('sobre-mi')).toBe(900);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(900);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(await top('servicios'));
    // down, then up once the wheel lock (700 ms) is over but the glide (up to 950 ms) is still running
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(760);
    await page.mouse.wheel(0, -200);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(await top('servicios'));
  });

  test('phone 390×844: the wheel does not page; the page scrolls natively', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto('/');
    await hydrated(page, '#servicios input');
    await expect(page.locator('html')).not.toHaveAttribute('data-paging', /.*/);
    await context.close();
  });
});

test.describe('reduced motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('no paging, a stacked tour, one static marquee and the chat already written', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = collectErrors(page);
    await page.goto('/');
    await hydrated(page, '#servicios input');
    await expect(page.locator('html')).not.toHaveAttribute('data-paging', /.*/);
    expect(await page.locator('[data-tour-sticky]').evaluate((el) => getComputedStyle(el).position)).toBe('static');
    // the reversed band is gone and the copies are hidden: the stack is listed once
    await expect(page.locator('#sobre-mi ul[aria-label] > li[aria-hidden="true"]').first()).toBeHidden();
    await expect(page.getByRole('group', { name: 'Ejemplo de conversación' })).toContainText('Claro. Cuéntame qué necesitas y te digo cómo lo haría.');
    // no running animation on the page except none: nothing scroll-driven or looping
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect | null)?.target?.closest('[data-hero-stage], header')).length);
    expect(running).toBe(0);
    expect(errors).toEqual([]);
  });
});
