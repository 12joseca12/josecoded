import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

import AxeBuilder from "./support/axe";
import {
  mockOrigin,
  otpCode,
  signInCloser,
  signInOtp,
  submitCode,
  type Tag,
  totpCode,
  withTag,
} from "./support/staff";

interface Gone {
  title: string;
  text: string;
}

interface Messages {
  auth: {
    login: { emailLabel: string; send: string; codeTitle: string };
    totp: { enrollStart: string; codeLabel: string; verify: string };
  };
  invitation: {
    title: string;
    acceptTitle: string;
    enter: string;
    nameLabel: string;
    localeLabel: string;
    accept: string;
    errors: Record<string, string>;
    gone: Record<"unknown" | "revoked" | "expired" | "used", Gone>;
    goneAction: string;
    mismatch: { title: string; action: string };
  };
}

const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Messages;
const { login, totp } = es.auth;
const copy = es.invitation;

let tag: Tag = withTag();

test.beforeEach(() => {
  tag = withTag();
});

function path(kind: string): string {
  return `/es/invitacion/${tag.value}-${kind}`;
}

interface Calls {
  verify: unknown[];
  accept: { p_token: string; p_full_name: string; p_locale: string }[];
}

async function calls(page: Page): Promise<Calls> {
  const response = await page.request.get(`${mockOrigin}/__auth/calls?tag=${tag.value}`);
  return (await response.json()) as Calls;
}

async function expectClean(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

async function signInInvited(page: Page, kind: string) {
  await page.goto(path(kind));
  await page.getByRole("link", { name: copy.enter }).click();
  await expect(page.getByLabel(login.emailLabel)).toHaveValue(`invitee+${tag.value}@example.com`);
  await expect(page.locator("[data-fake-turnstile]")).toBeAttached();
  await page.getByRole("button", { name: login.send }).click();
  await expect(page.getByRole("heading", { level: 1, name: login.codeTitle })).toBeVisible();
  await submitCode(page, otpCode);
  await expect(page).toHaveURL(new RegExp(`/es/invitacion/${tag.value}-${kind}$`));
}

for (const reason of ["revoked", "expired", "used", "unknown"] as const) {
  test(`a ${reason} invitation shows its own screen and passes axe`, async ({ page }) => {
    const kind = reason === "unknown" ? "nothing" : reason;
    const response = await page.goto(path(kind));
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    const screen = copy.gone[reason];
    await expect(page.getByRole("heading", { level: 1, name: screen.title })).toBeVisible();
    await expect(page.getByText(screen.text)).toBeVisible();
    await expect(page.getByRole("link", { name: copy.goneAction })).toHaveAttribute(
      "href",
      "/es/contacto",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectClean(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await expectClean(page);
  });
}

test("a token with odd characters is treated as unknown", async ({ page }) => {
  await page.goto("/es/invitacion/not%20a%20token");
  await expect(
    page.getByRole("heading", { level: 1, name: copy.gone.unknown.title }),
  ).toBeVisible();
});

test("an anonymous visitor sees the summary and enters with the locked email", async ({ page }) => {
  await page.goto(path("pending"));
  await expect(page.getByRole("heading", { level: 1, name: copy.title })).toBeVisible();
  await expect(page.getByText(/Jose Enrolled te invita como closer\./)).toBeVisible();
  await expect(page.getByText(`invitee+${tag.value}@example.com`)).toBeVisible();
  await expectClean(page);

  await page.getByRole("link", { name: copy.enter }).click();
  await expect(page).toHaveURL(/\/es\/entrar\?email=.+&next=%2Fes%2Finvitacion%2F/);
  const email = page.getByLabel(login.emailLabel);
  await expect(email).toHaveValue(`invitee+${tag.value}@example.com`);
  await expect(email).toHaveAttribute("readonly", "");
});

test("the email in the login url is ignored without an invitation", async ({ page }) => {
  await page.goto("/es/entrar?email=someone%40example.com");
  const email = page.getByLabel(login.emailLabel);
  await expect(email).toHaveValue("");
  await expect(email).not.toHaveAttribute("readonly", "");
  await page.goto("/es/entrar?email=someone%40example.com&next=%2Fes%2Fadmin");
  await expect(page.getByLabel(login.emailLabel)).toHaveValue("");
});

test("the invited closer signs in, accepts and lands on the authenticator", async ({ page }) => {
  await signInInvited(page, "pending");
  await expect(page.getByRole("heading", { level: 1, name: copy.acceptTitle })).toBeVisible();
  await expectClean(page);

  await page.getByLabel(copy.nameLabel).fill("  Ivy Invitee  ");
  await page.getByLabel(copy.localeLabel).selectOption("en");
  await page.getByRole("button", { name: copy.accept }).click();
  await expect(page).toHaveURL(/\/es\/entrar\/totp/);
  expect((await calls(page)).accept).toEqual([
    { p_token: `${tag.value}-pending`, p_full_name: "Ivy Invitee", p_locale: "en" },
  ]);

  await page.getByRole("button", { name: totp.enrollStart }).click();
  await page.getByLabel(totp.codeLabel).fill(totpCode);
  await page.getByRole("button", { name: totp.verify }).click();
  await expect(page).toHaveURL(/\/es\/crm$/);

  await page.goto(path("pending"));
  await expect(page).toHaveURL(/\/es\/crm$/);
});

test("an invited client goes to the client area after accepting", async ({ page }) => {
  await signInInvited(page, "client");
  await page.getByLabel(copy.nameLabel).fill("Carla Cliente");
  await page.getByRole("button", { name: copy.accept }).click();
  await expect(page).toHaveURL(/\/es\/area$/);
});

test("the name is required and nothing is sent without it", async ({ page }) => {
  await signInInvited(page, "pending");
  await page.getByRole("button", { name: copy.accept }).click();
  await expect(page.getByText(copy.errors.name ?? "")).toBeVisible();
  await expect(page.getByLabel(copy.nameLabel)).toBeFocused();
  expect((await calls(page)).accept).toHaveLength(0);
});

test("a failure while accepting is explained and can be retried", async ({ page }) => {
  await signInInvited(page, "pending");
  await page.request.post(`${mockOrigin}/__auth/accept-failure?tag=${tag.value}`, {
    data: { message: "invitation_expired" },
  });
  await page.getByLabel(copy.nameLabel).fill("Ivy Invitee");
  await page.getByRole("button", { name: copy.accept }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(copy.errors.expired ?? "");
  await expect(page.getByRole("button", { name: copy.accept })).toBeEnabled();

  await page.request.post(`${mockOrigin}/__auth/accept-failure?tag=${tag.value}`, {
    data: { message: "boom" },
  });
  await page.getByRole("button", { name: copy.accept }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(copy.errors.error ?? "");
});

test("a session with another email is asked to sign out", async ({ page }) => {
  await signInOtp(page, tag, "invitee@example.com");
  await expect.poll(async () => (await calls(page)).verify.length).toBe(1);
  await expect
    .poll(async () =>
      (await page.context().cookies()).some((cookie) => cookie.name.endsWith("-auth-token")),
    )
    .toBe(true);
  await page.goto(path("other"));
  await expect(page.getByRole("heading", { level: 1, name: copy.mismatch.title })).toBeVisible();
  await expectClean(page);
  await page.getByRole("button", { name: copy.mismatch.action }).click();
  await expect(page).toHaveURL(new RegExp(`/es/invitacion/${tag.value}-other$`));
  await expect(page.getByRole("heading", { level: 1, name: copy.title })).toBeVisible();
});

test("someone who already has a profile is sent to their zone", async ({ page }) => {
  await signInCloser(page, tag);
  await page.goto(path("pending"));
  await expect(page).toHaveURL(/\/es\/crm$/);
});
