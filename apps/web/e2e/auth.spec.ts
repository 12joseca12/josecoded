import { expect, test } from '@playwright/test';

import { expectNoSeriousViolations } from './helpers/axe';
import { latestOtp, signInAs, supabaseIsUp } from './helpers/supabase';

const widths = [360, 1440] as const;

// --- Without Supabase: guards, screens, accessibility ---------------------------------------------

test.describe('guards', () => {
  const cases: [path: string, login: string][] = [
    ['/area-clientes', '/auth/login?next=%2Farea-clientes'],
    ['/perfil', '/auth/login?next=%2Fperfil'],
    ['/en/client-area', '/en/auth/login?next=%2Fen%2Fclient-area'],
    ['/en/profile', '/en/auth/login?next=%2Fen%2Fprofile'],
  ];
  for (const [path, login] of cases) {
    test(`${path} sends an anonymous visitor to ${login}`, async ({ page }) => {
      await page.goto(path);
      expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(login);
    });
  }
});

test.describe('sign-in screens', () => {
  for (const width of widths) {
    test(`login at ${width}px: one h1, providers, email form, no serious axe violations`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/auth/login');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'Continuar con Google' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Continuar con GitHub' })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enviarme el código' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expectNoSeriousViolations(page);
    });
  }

  test('login is not indexed and the English screens are translated', async ({ page }) => {
    await page.goto('/en/auth/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('link', { name: 'Continue with Google' })).toBeVisible();
    await page.goto('/en/auth/sign-up');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Create your account');
  });

  test('the code screen without an email says so and offers the way back', async ({ page }) => {
    await page.goto('/auth/codigo');
    await expect(page.getByText('No sabemos a qué email enviar el código')).toBeVisible();
    await expect(page.getByRole('link', { name: /Usar otro email/ })).toHaveAttribute('href', '/auth/login');
    await expectNoSeriousViolations(page);
  });

  test('the code screen is a single numeric one-time-code field, and the email is in a cookie, not the URL', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'jc_otp_email', value: 'ana@example.com', url: baseURL as string }]);
    await page.goto('/auth/codigo');
    await expect(page.getByText(/ana@example\.com/)).toBeVisible();
    expect(page.url()).not.toContain('ana');
    const input = page.getByLabel('Código de 6 cifras');
    await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(input).toHaveAttribute('inputmode', 'numeric');
    await expectNoSeriousViolations(page);
  });

  test('an invalid code is refused on the field without leaving the screen', async ({ page, context, baseURL }) => {
    test.skip(!(await supabaseIsUp()), 'needs Supabase local');
    await context.addCookies([{ name: 'jc_otp_email', value: 'ana@example.com', url: baseURL as string }]);
    await page.goto('/auth/codigo');
    await page.getByLabel('Código de 6 cifras').fill('000000');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText(/El código no es correcto/)).toBeVisible();
    await expect(page.getByLabel('Código de 6 cifras')).toBeFocused();
  });
});

// --- With Supabase local (seed accounts, local mailbox) -------------------------------------------

test.describe('session', () => {
  test.beforeEach(async () => {
    test.skip(!(await supabaseIsUp()), 'needs Supabase local (supabase start && supabase db reset)');
  });

  test('a seeded client reaches the area, sees the header menu and signs out', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL as string, 'ana');
    await page.goto('/area-clientes');
    await expect(page).toHaveURL(/\/area-clientes$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/perfil');
    await expect(page.getByText('ana@test')).toBeVisible();
    await expectNoSeriousViolations(page);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.waitForURL('**/');

    await page.goto('/area-clientes');
    await expect(page).toHaveURL(/\/auth\/login\?next=/);
  });

  test('a new visitor signs in with the code from the mailbox and lands on the area', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto('/auth/login?next=%2Fperfil');
    await page.getByLabel('Email').fill(email);
    // the Turnstile test key (always passes) fills the token on its own; wait for it
    await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Enviarme el código' }).click();
    await page.waitForURL('**/auth/codigo**');
    expect(page.url()).not.toContain(encodeURIComponent(email)); // the address travels in a cookie

    await page.getByLabel('Código de 6 cifras').fill(await latestOtp(email));
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/perfil');
    await expect(page.getByText(email)).toBeVisible();
  });
});
