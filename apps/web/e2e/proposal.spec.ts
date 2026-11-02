import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './helpers/axe';
import { hydrated } from './helpers/reduced-motion';

import type { Page } from '@playwright/test';

const PROPOSAL = {
  proposalId: 'b7a1e0a0-3b0d-4b1c-9d3e-1c2d3e4f5a6b',
  proposalToken: 'a'.repeat(40),
  pricingVersion: '2026-09-14',
  pack: { code: 'P2', name: 'Pedidos o reservas', price: 1400, weeks: 2, includes: ['Reservas online', 'Gestión básica'] },
  priceFrom: 1400,
  isApp: false,
  recommendedExtras: [{ code: 'seo_basic', label: 'SEO básico', price: 250, billing: 'one_off' }],
  summary: 'Una web con reservas para tu restaurante.',
  scope: ['Web de presentación', 'Reservas', 'Panel básico'],
  questions: ['¿Tienes ya dominio?'],
  source: 'rules',
  disclaimer: 'Propuesta orientativa: el precio final se cierra contigo.',
};

// Cloudflare's script is not reachable from the runner and the gateway is not running: both are replaced, the page and
// its CSP are the real ones.
async function stubExternals(page: Page, body: unknown = { ok: true, data: PROPOSAL }, status = 200) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile={render(el){const i=document.createElement('input');i.type='hidden';i.name='cf-turnstile-response';i.value='tok';el.closest('form')?.append(i);return 'w1'},reset(){},remove(){}}`,
    }),
  );
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' };
  await page.route('**/api/v1/proposals/generate', (route) =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: cors })
      : route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

test('a restaurant with bookings gets a P2 proposal from 1.400 €, with its price as text', async ({ page }) => {
  await stubExternals(page);
  await page.goto('/propuesta');
  await hydrated(page, '#propuesta button');
  await page.getByRole('button', { name: 'Restaurante' }).click();
  await page.getByRole('checkbox', { name: /Reservas/ }).check();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  // bookings settle the sales question: the next one is the timeline
  await expect(page.getByRole('button', { name: /Sin prisa/ })).toBeVisible();
  await page.getByRole('button', { name: /un mes/i }).click();
  await expect(page.getByText('Pack P2: Pedidos o reservas')).toBeVisible();
  await expect(page.getByText('Desde 1.400 €')).toBeVisible();
  await expect(page.getByText(/precio final se cierra contigo/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver todos los packs/ }).first()).toHaveAttribute('href', /servicios#packs/);
});

test('?q= fills the business field and ?pack= is sent to the gateway as a hint', async ({ page }) => {
  await stubExternals(page);
  let sent: { preselectedPack?: string; answers?: { businessType: string } } = {};
  await page.route('**/api/v1/proposals/generate', async (route) => {
    if (route.request().method() === 'POST') sent = route.request().postDataJSON();
    await route.fallback();
  });
  await page.goto('/propuesta?pack=P3&q=Clinica%20dental');
  await hydrated(page, '#propuesta button');
  await expect(page.getByLabel('Otro tipo de negocio')).toHaveValue('Clinica dental');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('checkbox', { name: /Pedidos/ }).check();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: /Sin prisa/ }).click();
  await expect(page.getByText('Desde 1.400 €')).toBeVisible();
  expect(sent.preselectedPack).toBe('P3');
  expect(sent.answers?.businessType).toBe('Clinica dental');
});

test('a gateway that rate-limits is worded and the visitor can choose again', async ({ page }) => {
  await stubExternals(page, { ok: false, error: { code: 'rate_limited' } }, 429);
  await page.goto('/propuesta');
  await hydrated(page, '#propuesta button');
  await page.getByRole('button', { name: 'Tienda' }).click();
  await page.getByRole('checkbox', { name: /Pedidos/ }).check();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: /Sin prisa/ }).click();
  await expect(page.getByText('Has hecho muchas peticiones seguidas')).toBeVisible();
  await expect(page.locator('p[role="alert"]')).toContainText('muchas peticiones');
  await expect(page.getByRole('button', { name: /Sin prisa/ })).toBeVisible();
});

for (const [path, name] of [['/propuesta', 'proposal-es'], ['/en/proposal', 'proposal-en']] as const) {
  test(`${path} has no serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page, { name, freeze: true });
  });
}
