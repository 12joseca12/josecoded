import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { collectErrors, hydrated } from './helpers/reduced-motion';

import type { Page, Route } from '@playwright/test';

// CI does not run the gateway (`wrangler dev` of apps/api needs its own secrets and a fake AI), so the gateway and
// Cloudflare's script are replaced here; the page, its CSP and the browser's CORS rules are the real ones. The contract of
// the answers is the one of apps/api/src/modules/assistant.routes.ts (and its tests).

const THREAD_ID = '3f0f7a1e-8a52-4a8a-9d6f-6d1b2f6f3f10';
const msg = (n: number, sender: 'visitor' | 'assistant' | 'jose', content: string, type = 'text') => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  sender_role: sender,
  content,
  message_type: type,
  created_at: `2026-11-02T10:00:0${n}.000Z`,
});
const thread = (over: Record<string, unknown> = {}) => ({ id: THREAD_ID, case: 'client', locale: 'es', status: 'open', ai_enabled: true, context_version: 1, ...over });

interface Gateway {
  calls: { method: string; path: string; body: unknown }[];
  current?: unknown;
  messageStatus?: number;
}

async function stub(page: Page, gateway: Gateway = { calls: [] }) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile={render(el,o){o&&o.callback&&o.callback('tok');return 'w1'},reset(){},remove(){}}`,
    }),
  );
  await page.route('**/api/v1/assistant/**', async (route: Route) => {
    const request = route.request();
    const cors = {
      'access-control-allow-origin': request.headers().origin ?? '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, POST',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const path = new URL(request.url()).pathname.replace(/^.*\/assistant/, '');
    const body = request.method() === 'POST' ? request.postDataJSON() : undefined;
    gateway.calls.push({ method: request.method(), path, body });
    const json = (status: number, data: unknown) =>
      route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(status < 400 ? { ok: true, data } : data) });
    if (path.startsWith('/threads/current')) {
      return gateway.current ? json(200, gateway.current) : json(404, { ok: false, error: { code: 'not_found', message: 'No conversation' } });
    }
    if (path === '/threads') return json(201, { threadId: THREAD_ID, case: 'client', contextVersion: 1, aiEnabled: true });
    if (path.endsWith('/messages')) {
      if (gateway.messageStatus === 429) return json(429, { ok: false, error: { code: 'quota_exceeded', message: 'Daily limit reached' } });
      return json(201, { visitor: msg(1, 'visitor', (body as { content: string }).content), assistant: msg(2, 'assistant', 'Para una tienda pequeña bastan unas semanas.'), aiEnabled: true });
    }
    if (path.endsWith('/case')) return json(200, { thread: thread({ case: (body as { case: string }).case }), message: msg(3, 'assistant', `case_switch:${(body as { case: string }).case}`, 'case_switch') });
    if (path.endsWith('/quick-contact')) return json(201, { saved: true, notified: 'telegram' });
    return json(404, { ok: false, error: { code: 'not_found', message: 'x' } });
  });
}

async function open(page: Page, url = '/chat') {
  await page.goto(url);
  await hydrated(page, 'form button');
}

test('first message creates the thread with the bot check, then shows the reply; the page is indexable', async ({ page }) => {
  const errors = collectErrors(page);
  const gateway: Gateway = { calls: [] };
  await stub(page, gateway);
  await open(page);
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  await expect(page.getByText(/soy el asistente de Jose/)).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.getByLabel('Tu mensaje').fill('Quiero una tienda online');
  await page.getByLabel('Tu mensaje').press('Enter');
  await expect(page.getByText('Para una tienda pequeña bastan unas semanas.')).toBeVisible();
  await expect(page.getByRole('log').getByText('Quiero una tienda online')).toBeVisible();

  const posts = gateway.calls.filter((c) => c.method === 'POST');
  expect(posts.map((c) => c.path)).toEqual(['/threads', `/threads/${THREAD_ID}/messages`]);
  expect(posts[0]?.body).toMatchObject({ case: 'client', locale: 'es', originPath: '/chat', turnstileToken: 'tok' });
  expect(errors).toEqual([]);
});

test('an existing thread is restored, Jose having joined shows the handover and the case change reaches the gateway', async ({ page }) => {
  const gateway: Gateway = {
    calls: [],
    current: { thread: thread({ ai_enabled: false, status: 'handed_over' }), messages: [msg(1, 'visitor', 'Hola'), msg(2, 'jose', 'Hola, soy Jose, cuéntame.')] },
  };
  await stub(page, gateway);
  await open(page, '/chat?case=partner');
  await expect(page.getByText('Hola, soy Jose, cuéntame.')).toBeVisible();
  await expect(page.getByText('Jose ha entrado en la conversación.')).toBeVisible();
  await page.getByRole('button', { name: 'Soy una agencia o consultora' }).click();
  await expect(page.getByText(/Ahora hablas como: Soy una agencia/)).toBeVisible();
  expect(gateway.calls.some((c) => c.path === `/threads/${THREAD_ID}/case` && JSON.stringify(c.body) === '{"case":"partner"}')).toBe(true);
});

test('the daily limit replaces the composer with the kind notice', async ({ page }) => {
  await stub(page, { calls: [], messageStatus: 429 });
  await open(page);
  await page.getByLabel('Tu mensaje').fill('Otra pregunta');
  await page.getByLabel('Tu mensaje').press('Enter');
  await expect(page.getByText('Hoy ya hemos hablado bastante.')).toBeVisible();
  await expect(page.getByLabel('Tu mensaje')).toHaveCount(0);
});

test('leaving an email creates the contact through the gateway', async ({ page }) => {
  const gateway: Gateway = {
    calls: [],
    current: { thread: thread(), messages: [msg(1, 'visitor', 'Precio?'), msg(2, 'assistant', 'Eso te lo cuenta mejor Jose directamente.', 'quick_contact')] },
  };
  await stub(page, gateway);
  await open(page);
  await page.getByLabel('Tu email o teléfono').fill('ana@example.com');
  await page.getByRole('button', { name: 'Que me escriba Jose' }).click();
  await expect(page.getByText('Recibido. Jose te escribirá.')).toBeVisible();
  const call = gateway.calls.find((c) => c.path.endsWith('/quick-contact'));
  expect(call?.body).toEqual({ channel: 'email', email: 'ana@example.com' });
});
