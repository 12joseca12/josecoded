import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, type Page } from "@playwright/test";

interface StaffMessages {
  auth: {
    login: {
      emailLabel: string;
      send: string;
      codeTitle: string;
      codeLabel: string;
      verify: string;
    };
    totp: { enrollStart: string; codeLabel: string; verify: string };
  };
}

const { login, totp } = (JSON.parse(readFileSync("messages/es.json", "utf8")) as StaffMessages)
  .auth;

export const mockOrigin = `http://localhost:${process.env.MOCK_BACKEND_PORT ?? 3199}`;

export const otpCode = "123456";
export const totpCode = "654321";

export interface Tag {
  readonly value: string;
  mailbox: (email: string) => string;
  reset: (page: Page) => Promise<void>;
}

export function withTag(): Tag {
  const value = randomUUID().replaceAll("-", "").slice(0, 12);
  return {
    value,
    mailbox(email) {
      const [local = "", domain = ""] = email.split("@");
      return `${local}+${value}@${domain}`;
    },
    async reset(page) {
      await page.request.post(`${mockOrigin}/__auth/reset?tag=${value}`);
    },
  };
}

export async function openLogin(page: Page, query = "") {
  await page.goto(`/es/entrar${query}`);
  await expect(page.getByLabel(login.emailLabel)).toBeVisible();
  await expect(page.locator("[data-fake-turnstile]")).toBeAttached();
  await page.waitForTimeout(150);
}

export async function requestCode(page: Page, tag: Tag, email: string) {
  await page.getByLabel(login.emailLabel).fill(tag.mailbox(email));
  await page.getByRole("button", { name: login.send }).click();
  await expect(page.getByRole("heading", { level: 1, name: login.codeTitle })).toBeVisible();
}

export async function submitCode(page: Page, code: string) {
  await page.getByLabel(login.codeLabel).fill(code);
  await page.getByRole("button", { name: login.verify }).click();
}

export async function signInOtp(page: Page, tag: Tag, email: string, query = "") {
  await openLogin(page, query);
  await requestCode(page, tag, email);
  await submitCode(page, otpCode);
}

export async function signInAdmin(page: Page, tag: Tag, query = "") {
  await signInOtp(page, tag, "enrolled@example.com", query);
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).not.toHaveURL(/\/entrar/, { timeout: 20_000 });
}

export async function signInCloser(page: Page, tag: Tag, query = "") {
  await signInOtp(page, tag, "closer@example.com", query);
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).not.toHaveURL(/\/entrar/, { timeout: 20_000 });
}

export async function signInFreelance(page: Page, tag: Tag, query = "") {
  await signInOtp(page, tag, "freelance@example.com", query);
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/freelance/, { timeout: 20_000 });
}

export async function signInClient(page: Page, tag: Tag, query = "") {
  await signInOtp(page, tag, "client@example.com", query);
  await expect(page).toHaveURL(/\/es\/area/, { timeout: 20_000 });
}
