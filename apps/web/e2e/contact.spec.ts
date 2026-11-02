import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { hydrated } from './helpers/reduced-motion';

test('contact page has one h1 and the four ways as tabs, the client one chosen by default', async ({ page }) => {
  await page.goto('/contacto');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(page.getByRole('tab', { name: 'Soy cliente' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('link', { name: /WhatsApp/ }).first()).toBeVisible();
});

test('?via= picks the way and the other ways keep their text in the document', async ({ page }) => {
  await page.goto('/en/contact?via=partner');
  await expect(page.getByRole('tab', { name: 'I am an agency' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel').filter({ hasText: 'short message' })).toBeVisible();
  // the form of the chosen way is mounted, the others are not
  await expect(page.getByLabel('Agency or company')).toBeVisible();
  const html = await (await page.request.get('/en/contact')).text();
  expect(html).toContain('Book a 20-minute call or write to me');
});

test('the booking loads nothing from Cal.com until it is asked for', async ({ page }) => {
  await page.goto('/contacto');
  await expect(page.locator('iframe[src*="cal.com"]')).toHaveCount(0);
  await hydrated(page, '#reserva button');
  await page.locator('#reserva').getByRole('button', { name: 'Reservar 20 min' }).click();
  await expect(page.locator('iframe[src*="cal.com"]')).toHaveCount(1);
});

test('the booking frame loads under the real CSP and takes focus', async ({ page, request }) => {
  const reachable = await request.get('https://app.cal.com', { timeout: 4000 }).then(
    () => true,
    () => false,
  );
  test.skip(!reachable, 'cal.com is not reachable from this runner');
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy|Refused to frame/i.test(message.text())) violations.push(message.text());
  });
  await page.goto('/contacto');
  await hydrated(page, '#reserva button');
  await page.locator('#reserva').getByRole('button', { name: 'Reservar 20 min' }).click();
  const region = page.locator('#reserva').getByRole('region');
  await expect(region).toBeFocused();
  await expect(region.locator('iframe')).toBeVisible();
  await page.waitForLoadState('load');
  expect(violations).toEqual([]);
});

test('a validation error keeps the message the visitor typed', async ({ page }) => {
  await page.goto('/contacto');
  await hydrated(page, '#vias [role="tab"]');
  await page.getByText('Prefiero dejar mis datos').click();
  await page.getByLabel('Nombre').fill('   ');
  await page.getByLabel('Email').fill('marta@example.com');
  await page.getByLabel('Qué necesitas').fill('Una web con reservas');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Escribe tu nombre.')).toBeVisible();
  await expect(page.getByLabel('Qué necesitas')).toHaveValue('Una web con reservas');
  await expect(page.getByLabel('Email')).toHaveValue('marta@example.com');
  await expect(page.getByLabel('Nombre')).toBeFocused();
});

test('the form works without JavaScript: the server answers with the field error', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/contacto');
  await page.getByText('Prefiero dejar mis datos').click();
  await page.getByLabel('Nombre').fill('   ');
  await page.getByLabel('Email').fill('marta@example.com');
  await page.getByLabel('Qué necesitas').fill('Una web');
  await page.getByRole('button', { name: 'Enviar' }).click();
  // the answer comes in the new document (the folded details start closed again without JavaScript)
  await expect(page.getByText('Escribe tu nombre.')).toBeAttached();
  await context.close();
});

for (const [path, name] of [['/contacto', 'contact-es'], ['/en/contact', 'contact-en']] as const) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page, { name, freeze: true });
  });
}
